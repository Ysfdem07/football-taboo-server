// AdMob rewarded-ad Server-Side Verification (SSV).
//
// Google calls a callback URL we register per ad unit directly from its own
// servers — not through the player's device — the moment someone finishes
// watching a rewarded ad. The request is signed with an EC (P-256) key that
// rotates on Google's own schedule; we verify that signature here so a
// reward can only ever be granted for an ad Google itself confirms was
// watched, never from a client claiming "I watched it."
//
// Spec: https://developers.google.com/admob/android/ssv
//   - Query params are alphabetical, always ending in ...&signature=X&key_id=Y
//   - "content to verify" = the raw query string up through the value right
//     before "&signature=" (signature and key_id themselves are excluded)
//   - signature is a DER-encoded ECDSA-SHA256 signature, base64url-encoded
//   - public keys: https://www.gstatic.com/admob/reward/verifier-keys.json

const KEY_SERVER_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
const KEY_CACHE_MAX_AGE_MS = 60 * 60 * 1000; // Google rotates keys; never cache > 24h

let cachedKeys = null; // Map<keyId, pemString>
let cachedAt = 0;

async function getPublicKeys() {
  const now = Date.now();
  if (cachedKeys && (now - cachedAt) < KEY_CACHE_MAX_AGE_MS) return cachedKeys;

  const res = await fetch(KEY_SERVER_URL);
  if (!res.ok) throw new Error(`AdMob key server returned ${res.status}`);
  const data = await res.json();

  const map = new Map();
  for (const k of data.keys || []) {
    map.set(String(k.keyId), k.pem);
  }
  cachedKeys = map;
  cachedAt = now;
  return map;
}

function base64UrlToBuffer(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

// Verifies a raw AdMob SSV callback query string (no leading "?") and, if
// valid, returns the parsed params. Returns null if the signature doesn't
// check out (missing signature/key_id, unknown key, bad signature, etc.) —
// callers should treat null as "reject, do not grant anything."
async function verify(rawQueryString) {
  if (!rawQueryString) return null;

  const params = new URLSearchParams(rawQueryString);
  const signature = params.get('signature');
  const keyId = params.get('key_id');
  if (!signature || !keyId) return null;

  // Google signs the DECODED param values, not the URL-encoded wire string —
  // confirmed against a real callback where reward_item was "2x Jeton": the
  // signature only verified against "reward_item=2x Jeton", not
  // "...=2x%20Jeton". URLSearchParams decodes on iteration, so rebuilding
  // from that (rather than slicing the raw string up to "&signature=") gets
  // this right for any value containing spaces or other encodable chars.
  const parts = [];
  for (const [key, value] of params) {
    if (key === 'signature' || key === 'key_id') continue;
    parts.push(`${key}=${value}`);
  }
  const contentToVerify = parts.join('&');

  let keys;
  try {
    keys = await getPublicKeys();
  } catch (e) {
    console.error('[admobSsv] Failed to fetch public keys:', e.message);
    return null;
  }

  const pem = keys.get(keyId);
  if (!pem) {
    // Key rotated since our last fetch — force a refresh once and retry
    // before giving up, rather than rejecting a legitimate callback.
    cachedAt = 0;
    try {
      keys = await getPublicKeys();
    } catch (e) {
      return null;
    }
    const retried = keys.get(keyId);
    if (!retried) return null;
    return verifyWithKey(contentToVerify, signature, retried, params);
  }

  return verifyWithKey(contentToVerify, signature, pem, params);
}

function verifyWithKey(contentToVerify, signatureB64Url, pem, params) {
  const crypto = require('crypto');
  try {
    const signatureBuf = base64UrlToBuffer(signatureB64Url);
    const verifier = crypto.createVerify('SHA256');
    verifier.update(contentToVerify);
    verifier.end();
    const isValid = verifier.verify(pem, signatureBuf);
    if (!isValid) return null;
  } catch (e) {
    console.error('[admobSsv] Signature verification error:', e.message);
    return null;
  }

  return {
    adNetwork: params.get('ad_network'),
    adUnit: params.get('ad_unit'),
    customData: params.get('custom_data') || null,
    rewardAmount: params.get('reward_amount'),
    rewardItem: params.get('reward_item'),
    timestamp: params.get('timestamp'),
    transactionId: params.get('transaction_id'),
    userId: params.get('user_id'),
  };
}

module.exports = { verify };
