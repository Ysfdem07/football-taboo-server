const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const nodemailer = require('nodemailer');

// Global crash logging helper to debug cloud environment startup issues
process.on('uncaughtException', (err) => {
  const logMsg = `\n[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.stack || err.message || err}\n`;
  console.error(logMsg);
  try { fs.appendFileSync('crash_log.txt', logMsg); } catch(e) {}
});

process.on('unhandledRejection', (reason, promise) => {
  const logMsg = `\n[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason?.stack || reason?.message || reason}\n`;
  console.error(logMsg);
  try { fs.appendFileSync('crash_log.txt', logMsg); } catch(e) {}
});

// Resolve SMTP environment variables case-insensitively with synonyms
// Hardcoded fallback ensures mail works even if Railway env vars are missing
const smtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.smtp_user || process.env.smtp_username || 'wordrushtr@gmail.com';
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.smtp_pass || process.env.smtp_password || 'gtxsemnokpizucmx';

// Diagnostic variables to trace mail sending status remotely
let mailErrorLog = 'None';
let mailSuccessLog = 'None';

const transporter = nodemailer.createTransport({
  host: '74.125.130.108', // smtp.gmail.com IPv4 - Railway IPv6 engeli asildi
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: { servername: 'smtp.gmail.com' },
  connectionTimeout: 15000,
  socketTimeout: 15000
});

// Send mail using Resend API over HTTPS (Bypasses Render SMTP port blocking)
function sendResendEmail(email, username, code) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      from: 'Wordico Destek <noreply@wordico.net>',
      to: [email],
      subject: 'FutTaboo - Şifre Sıfırlama Kodu',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4CAF50;">Merhaba ${username},</h2>
          <p>FutTaboo hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
          <p style="font-size: 16px; margin: 20px 0;">Şifre sıfırlama kodunuz:</p>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-radius: 4px; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4CAF50; border: 1px dashed #4CAF50;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">Bu kod 15 dakika süreyle geçerlidir.</p>
          <p style="color: #999; font-size: 12px;">Eğer bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayın.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; font-weight: bold; color: #4CAF50;">FutTaboo Ekibi</p>
        </div>
      `
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY || ''}`
      },
      timeout: 10000 // 10s timeout
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Resend API returned status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Resend API request timed out after 10s'));
    });

    req.write(data);
    req.end();
  });
}

async function sendResetEmail(email, username, code) {
  // 1) SMTP - Gmail port 587 TLS IPv4
  try {
    await transporter.sendMail({
      from: `Wordico Destek <${smtpUser}>`,
      to: email,
      subject: 'FutTaboo - Şifre Sıfırlama Kodu',
      text: `Merhaba ${username},\n\nŞifre sıfırlama kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir.`
    });
    const msg = `SMTP OK: Reset email sent to ${email}`;
    console.log(msg);
    mailSuccessLog = msg;
    mailErrorLog = 'None';
    return { success: true };
  } catch (smtpErr) {
    console.error(`[SMTP ERR] ${smtpErr.message}`);
    mailErrorLog = `SMTP failed: ${smtpErr.message}`;
  }

  // 2) Resend HTTP API fallback
  const resendKey = process.env.RESEND_API_KEY || '';
  if (resendKey) {
    try {
      await sendResendEmail(email, username, code);
      const msg = `Resend OK: Reset email sent to ${email}`;
      console.log(msg);
      mailSuccessLog = msg;
      mailErrorLog = 'None';
      return { success: true };
    } catch (resendErr) {
      console.error(`[Resend ERR] ${resendErr.message}`);
      mailErrorLog = `Resend failed: ${resendErr.message}`;
    }
  }

  // 3) Her ikisi de başarısız — devMode
  const devMsg = `[Mail DevMode] No active mail config. Code for ${email}: ${code}`;
  console.warn(devMsg);
  mailErrorLog = devMsg;
  return { success: true, devMode: true };
}

function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const app = express();

// Gate for internal/debug endpoints that expose PII, secrets, or destructive
// operations. Requires an `x-admin-key` header (or `?key=` query param)
// matching ADMIN_SECRET. Fails closed: if ADMIN_SECRET isn't configured,
// these routes refuse everyone rather than staying open by default — set
// ADMIN_SECRET in the environment (e.g. Railway variables) to use them.
function requireAdmin(req, res, next) {
  const configuredSecret = process.env.ADMIN_SECRET;
  if (!configuredSecret) {
    return res.status(503).json({ error: 'Admin endpoint not configured (ADMIN_SECRET missing).' });
  }
  const providedKey = req.get('x-admin-key') || req.query.key;
  if (providedKey !== configuredSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

const memLogs = [];
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  originalLog.apply(console, args);
  memLogs.push({ time: new Date().toISOString(), type: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
  if (memLogs.length > 500) memLogs.shift();
};
console.error = function(...args) {
  originalError.apply(console, args);
  memLogs.push({ time: new Date().toISOString(), type: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
  if (memLogs.length > 500) memLogs.shift();
};

app.get('/api/logs', requireAdmin, (req, res) => {
  res.json(memLogs);
});


// Load privacy policy HTML string directly into memory
const getPrivacyHtmlContent = () => {
  const p1 = path.resolve(__dirname, 'backend', 'public', 'gizlilik.html');
  if (fs.existsSync(p1)) return fs.readFileSync(p1, 'utf-8');
  const p2 = path.resolve(__dirname, 'public', 'gizlilik.html');
  if (fs.existsSync(p2)) return fs.readFileSync(p2, 'utf-8');
  const p3 = path.resolve(process.cwd(), 'backend', 'public', 'gizlilik.html');
  if (fs.existsSync(p3)) return fs.readFileSync(p3, 'utf-8');
  return `<!DOCTYPE html><html><head><title>Wordico Privacy Policy</title></head><body><h1>Wordico Privacy Policy</h1></body></html>`;
};

const sendPrivacyHtml = (req, res) => {
  res.type('html').send(getPrivacyHtmlContent());
};

// Web page route aliases (Guaranteed 200 OK without file path issues)
app.get('/privacy', sendPrivacyHtml);
app.get('/privacy.html', sendPrivacyHtml);
app.get('/privacy-policy', sendPrivacyHtml);
app.get('/privacy-policy.html', sendPrivacyHtml);
app.get('/gizlilik', sendPrivacyHtml);
app.get('/gizlilik.html', sendPrivacyHtml);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'backend', 'public')));

app.use(cors());

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/version', (req, res) => {
  res.json({ version: '2026-08-14-v3-tournament-fix', wordsLoaded: { football: wordsDb.football.length, cinema: wordsDb.cinema.length, music: wordsDb.music.length } });
});

app.get('/debug-tournament', requireAdmin, async (req, res) => {
  try {
    const category = req.query.category || 'football';
    const playerId = req.query.playerId || 'guest';
    let wordSource = wordsDb[category]?.length > 0 ? wordsDb[category] : wordsDb.football;
    if (!wordSource || wordSource.length === 0) {
      try { wordSource = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')); } catch(e) { wordSource = []; }
    }
    const result = await db.getWeeklyTournament(playerId, wordSource, category);
    res.json({ category, playerId, wordSourceLength: wordSource.length, result });
  } catch (e) {
    res.json({ error: e.message, stack: e.stack });
  }
});

app.get('/debug-db', requireAdmin, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) return res.json({ error: 'Not connected' });
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const players = await mongoose.connection.collection('players').find({}).toArray();
    
    res.json({
      databaseName: db.databaseName,
      collections: collections.map(c => c.name),
      playersCount: players.length,
      playerEmails: players.map(p => p.email),
      playerUsernames: players.map(p => p.username)
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get('/health-legacy', requireAdmin, async (req, res) => {
  const uri = process.env.MONGODB_URI || 'not-set';
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  
  let dbSuccessLogs = [];
  let dbErrorLogs = [];
  try {
    dbSuccessLogs = await db.getLogs('smtp_success', 3);
    dbErrorLogs = await db.getLogs('smtp_error', 3);
  } catch(e) {}

  res.json({ 
    status: 'ok', 
    mongodb_uri: maskedUri, 
    time: new Date(),
    resend_api_active: !!process.env.RESEND_API_KEY,
    smtp_user_exists: !!smtpUser,
    smtp_pass_exists: !!smtpPass,
    mail_success_log: mailSuccessLog,
    mail_error_log: mailErrorLog,
    db_success_logs: dbSuccessLogs.map(l => l.message),
    db_error_logs: dbErrorLogs.map(l => l.message)
  });
});

const server = http.createServer(app);
const io = require('socket.io')(server, {
  pingTimeout: 120000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const Papa = require('papaparse');
const CSV_URLS = {
  football: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=0",
  football_en: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=2110439967",
  cinema: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=927039923",
  cinema_en: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=1200646404",
  music: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=648666227",
  music_en: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=1685819327"
};
const WORDS_PATH = path.join(__dirname, '..', 'assets', 'data', 'words.json');
let wordsDb = { football: [], football_en: [], cinema: [], cinema_en: [], music: [], music_en: [] };

async function loadWords() {
  const promises = Object.keys(CSV_URLS).map(category => new Promise(async (resolve) => {
    try {
      const response = await fetch(CSV_URLS[category]);
      const csvText = await response.text();
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const newWords = [];
          const rows = results.data;
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            let word = '';
            let forbidden = [];

            if (category === 'cinema_en') {
              // Format: EntityID, Answer, Clue_1, Clue_2, Clue_3, Clue_4, Clue_5, Difficulty
              if (!row[1] || row[1].trim() === '') continue;
              word = row[1].trim();
              for (let col = 2; col <= 6; col++) {
                if (row[col] && row[col].trim() !== '') forbidden.push(row[col].trim());
              }
            } else {
              // Standard format: Word, Forbidden1, Forbidden2, Forbidden3, Forbidden4, Forbidden5
              if (!row[0] || row[0].trim() === '') continue;
              word = row[0].trim();
              for (let col = 1; col <= 5; col++) {
                if (row[col] && row[col].trim() !== '') forbidden.push(row[col].trim());
              }
            }
            
            newWords.push({ word, forbidden });
          }
          if (newWords.length > 0) {
            wordsDb[category] = newWords;
            console.log(`Loaded ${wordsDb[category].length} words from Cloud Database for ${category}.`);
          }
          resolve(wordsDb[category].length);
        },
        error: (err) => {
          console.error(`Papa.parse error for ${category}:`, err);
          resolve(0);
        }
      });
    } catch (e) {
      console.error(`Cloud fetch failed for ${category}, falling back to local words.json if football`, e);
      if (category === 'football') {
         try { wordsDb.football = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')); } catch(fe) {}
      }
      resolve(wordsDb[category]?.length || 0);
    }
  }));
  await Promise.all(promises);
  console.log(`[Words] Load complete: football=${wordsDb.football.length}, football_en=${wordsDb.football_en.length}, cinema=${wordsDb.cinema.length}, music=${wordsDb.music.length}, music_en=${wordsDb.music_en.length}`);
  return wordsDb;
}

// Load initially and refresh every 1 hour
loadWords().then(() => {
  // initTournament AFTER words are loaded
  initTournament();
});
// Refresh every 10 minutes (600,000 ms)
setInterval(loadWords, 600000);

// API endpoint to manually trigger a word refresh without restarting the server
app.get('/api/refresh-words', requireAdmin, async (req, res) => {
  try {
    await loadWords();
    res.json({ success: true, message: 'Kelimeler Google Sheetten başarıyla güncellendi.', stats: {
      football: wordsDb.football.length,
      football_en: wordsDb.football_en.length,
      cinema: wordsDb.cinema.length,
      cinema_en: wordsDb.cinema_en.length,
      music: wordsDb.music.length,
      music_en: wordsDb.music_en.length
    }});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Temporary endpoint to fix tournaments
app.get('/api/fix-tournaments', requireAdmin, async (req, res) => {
  try {
    const WeeklyTournament = require('mongoose').model('WeeklyTournament');
    const result = await WeeklyTournament.deleteMany({ weekId: { $regex: /_en$/ } });
    res.json({ success: true, message: `Deleted ${result.deletedCount} EN tournaments. They will be regenerated.` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Manual push-notification panel — same requireAdmin gate as the other
// admin routes above (x-admin-key header or ?key= query param matching
// ADMIN_SECRET). For a real-time opportunity that doesn't fit the Friday
// 18:00 weekly-tournament cron (see below): open this URL with ?key=...,
// fill in the form, it sends immediately to every currently-registered
// push token via the same sendPushNotifications() the cron uses.
app.get('/admin/notify', requireAdmin, (req, res) => {
  const key = escapeHtml(req.query.key);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wordico — Bildirim Gönder</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #0b1220; color: #eee; max-width: 480px; margin: 40px auto; padding: 0 16px; }
  h1 { font-size: 20px; }
  label { display: block; margin-top: 16px; font-size: 14px; color: #aaa; }
  input[type=text], textarea { width: 100%; box-sizing: border-box; padding: 10px; border-radius: 8px; border: 1px solid #333; background: #161f33; color: #fff; font-size: 15px; margin-top: 4px; }
  textarea { min-height: 80px; resize: vertical; }
  .checks { display: flex; gap: 20px; margin-top: 16px; }
  .checks label { display: flex; align-items: center; gap: 6px; margin-top: 0; color: #ddd; }
  button { margin-top: 24px; width: 100%; padding: 14px; border-radius: 10px; border: none; background: #00c853; color: #05130a; font-weight: 700; font-size: 15px; }
</style></head>
<body>
  <h1>🔔 Manuel Bildirim Gönder</h1>
  <p style="color:#888;font-size:13px">Şu an kayıtlı olan tüm push token'lara anında gönderilir. Geri alınamaz.</p>
  <form method="GET" action="/admin/notify/send">
    <input type="hidden" name="key" value="${key}">
    <label>Başlık<input type="text" name="title" required maxlength="100"></label>
    <label>Mesaj<textarea name="body" required maxlength="200"></textarea></label>
    <label>Dokununca gidilecek ekran (opsiyonel, örn. Tournament, Market)<input type="text" name="route" maxlength="40"></label>
    <div class="checks">
      <label><input type="checkbox" name="targetPlayers" value="1" checked> Kayıtlı oyunculara</label>
      <label><input type="checkbox" name="targetGuests" value="1" checked> Misafirlere</label>
    </div>
    <button type="submit">Gönder</button>
  </form>
</body></html>`);
});

app.get('/admin/notify/send', requireAdmin, async (req, res) => {
  const key = escapeHtml(req.query.key);
  const title = (req.query.title || '').toString().trim();
  const body = (req.query.body || '').toString().trim();
  const route = (req.query.route || '').toString().trim();
  const wantPlayers = !!req.query.targetPlayers;
  const wantGuests = !!req.query.targetGuests;

  if (!title || !body) {
    return res.status(400).send('Başlık ve mesaj gerekli. <a href="javascript:history.back()">Geri</a>');
  }

  try {
    let tokens = [];
    if (wantPlayers) {
      const players = await db.getPlayersWithPushTokens();
      tokens.push(...players.map(p => p.pushToken));
    }
    if (wantGuests) {
      tokens.push(...(await db.getGuestPushTokens()));
    }
    tokens = [...new Set(tokens)].filter(Boolean);

    if (tokens.length === 0) {
      return res.send('Gönderilecek kayıtlı token bulunamadı. <a href="javascript:history.back()">Geri</a>');
    }

    const messages = tokens.map(token => ({
      pushToken: token,
      title,
      body,
      data: route ? { route } : {}
    }));
    const tickets = await sendPushNotifications(messages);
    console.log(`[AdminNotify] Sent "${title}" to ${tokens.length} tokens (players=${wantPlayers}, guests=${wantGuests}, route=${route || 'none'})`);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><html><body style="font-family:sans-serif;background:#0b1220;color:#eee;max-width:480px;margin:40px auto;padding:0 16px">
      <h2>✅ Gönderildi</h2>
      <p>${escapeHtml(title)} — ${tokens.length} cihaza, ${tickets.length} bilet oluşturuldu.</p>
      <p><a href="/admin/notify?key=${key}" style="color:#00c853">← Yeni bildirim gönder</a></p>
    </body></html>`);
  } catch (e) {
    console.error('[AdminNotify] error:', e);
    res.status(500).send('Sunucu hatası: ' + escapeHtml(e.message));
  }
});

// ─── Tournament Init ─────────────────────────────────────────────────────────
async function initTournament() {
  try {
    for (const category of Object.keys(wordsDb)) {
      const wordSource = wordsDb[category].length > 0 ? wordsDb[category] : (category === 'football' ? JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')) : []);
      if (wordSource.length > 0) {
         await db.ensureWeeklyTournament(wordSource, category);
         console.log(`[Tournament] Weekly tournament ensured for ${category}.`);
      } else {
        console.warn(`[Tournament] No words available for ${category}, skipping ensureWeeklyTournament.`);
      }
    }
  } catch (e) {
    console.error('[Tournament] Init error:', e);
  }
}

// Check every hour: if it's Sunday night, give rewards
setInterval(async () => {
  const now = new Date();
  // Sunday = 0, after 23:00
  if (now.getDay() === 0 && now.getHours() >= 23) {
    const result = await db.giveWeeklyRewards();
    if (result?.success) console.log(`[Tournament] Weekly rewards given to ${result.rewarded} players.`);
  }
  // Monday = 1, after 00:01 — ensure new tournament exists
  if (now.getDay() === 1 && now.getHours() === 0) {
    for (const category of Object.keys(wordsDb)) {
      const wordSource = wordsDb[category].length > 0 ? wordsDb[category] : (category === 'football' ? JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')) : []);
      if (wordSource.length > 0) {
         await db.ensureWeeklyTournament(wordSource, category);
      }
    }
  }
}, 3600000);

let queue = [];
let friendlyQueue = []; // Coin-only, no KP, guests allowed
const activeRooms = {}; // roomId -> room details
const disconnectTimeouts = {};

// Lightweight anti-spam gate for client-claimed "I watched an ad" reward events.
// This does NOT verify the ad was actually shown (that requires AdMob
// Server-Side Verification) — it only stops a modified/scripted client from
// firing reward_free_coins/reward_double_coins in a tight loop.
const rewardCooldowns = {}; // "playerId:rewardKind" -> timestamp of last granted reward
const REWARD_COOLDOWN_MS = 20000;
function checkRewardCooldown(playerId, rewardKind) {
  const key = `${playerId}:${rewardKind}`;
  const now = Date.now();
  const last = rewardCooldowns[key] || 0;
  if (now - last < REWARD_COOLDOWN_MS) return false;
  rewardCooldowns[key] = now;
  return true;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ─── Tournament Events ──────────────────────────────────────────────────
  socket.on('get_weekly_tournament', async (data) => {
    // Prefer the server-trusted session id so a logged-in player always sees
    // their own progress; fall back to the client-supplied value only for
    // anonymous browsing (guests can preview but not play — enforced below).
    const playerId = socket.data.playerId || data?.playerId || 'guest';
    const category = data?.category || 'football';
    let wordSource = wordsDb[category]?.length > 0 ? wordsDb[category] : wordsDb.football;
    if (!wordSource || wordSource.length === 0) {
      try { wordSource = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')); } catch(e) { wordSource = []; }
    }
    console.log(`[Tournament] get_weekly_tournament: playerId=${playerId}, category=${category}, wordSource=${wordSource.length}`);
    try {
      const result = await db.getWeeklyTournament(playerId || 'guest', wordSource, category);
      if (result && result.error) {
        // Soft error (tournament not ready) - send it to client so it can show a friendlier message
        console.warn(`[Tournament] Soft error for ${playerId}: ${result.error}`);
        socket.emit('weekly_tournament_data', result);
      } else {
        socket.emit('weekly_tournament_data', result);
      }
    } catch (e) {
      console.error('[Tournament] get_weekly_tournament error:', e);
      socket.emit('weekly_tournament_data', { error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  socket.on('grant_tournament_ad_attempt', async (data) => {
    const playerId = socket.data.playerId;
    const category = data?.category || 'football';
    if (!playerId) return socket.emit('weekly_tournament_data', { error: 'Ekstra hak almak için giriş yapmalısın.' });
    if (!checkRewardCooldown(playerId, 'tournament_attempt')) {
      return socket.emit('weekly_tournament_data', { error: 'Çok sık ödül talep ediyorsunuz, lütfen biraz bekleyin.' });
    }
    try {
      const result = await db.grantAdAttempt(playerId, category);
      socket.emit('weekly_tournament_data', result);
    } catch (e) {
      console.error('[grant_tournament_ad_attempt] error:', e);
      socket.emit('weekly_tournament_data', { error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  // Must match the client's scoring formula (TournamentGameScreen.tsx):
  // 100 pts max per card, 20 cards per tournament attempt.
  const MAX_CARDS_PER_ATTEMPT = 20;
  const MAX_SCORE_PER_CARD = 100;

  socket.on('submit_tournament_score', async (data) => {
    const playerId = socket.data.playerId;
    const { username, avatar, score, correctCount, category } = data || {};
    if (!playerId || !username) {
      return socket.emit('tournament_score_result', { error: 'Skoru kaydetmek için giriş yapmalısın.' });
    }
    if (
      !Number.isInteger(correctCount) || correctCount < 0 || correctCount > MAX_CARDS_PER_ATTEMPT ||
      !Number.isInteger(score) || score < 0 || score > MAX_CARDS_PER_ATTEMPT * MAX_SCORE_PER_CARD
    ) {
      return socket.emit('tournament_score_result', { error: 'Geçersiz skor.' });
    }
    try {
      const result = await db.submitTournamentScore(playerId, username, avatar, score, correctCount, category || 'football');
      socket.emit('tournament_score_result', result);
    } catch (e) {
      console.error('[submit_tournament_score] error:', e);
      socket.emit('tournament_score_result', { error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  socket.on('get_tournament_leaderboard', async (data) => {
    const category = data?.category || 'football';
    const board = await db.getTournamentLeaderboard(category);
    socket.emit('tournament_leaderboard', board);
  });
  // ────────────────────────────────────────────────────────────────────────

  if (socket.recovered) {
    if (disconnectTimeouts[socket.id]) {
      clearTimeout(disconnectTimeouts[socket.id]);
      delete disconnectTimeouts[socket.id];
    }
  }

  // Profile Registration
  socket.on('register_profile', async (data) => {
    const { username, password, avatar, email, marketingConsent } = data || {};
    // email is optional — only needed for password recovery, not to
    // register or to unlock ranked/tournament play.
    if (typeof username !== 'string' || typeof password !== 'string' || (email !== undefined && email !== null && typeof email !== 'string')) {
      return socket.emit('register_response', { success: false, error: 'Eksik veya geçersiz bilgi.' });
    }
    try {
      const result = await db.registerPlayer(username, password, avatar, email, marketingConsent);
      if (result.error) {
        socket.emit('register_response', { success: false, error: result.error });
      } else {
        // Bind this socket to the newly created player so subsequent coin/joker
        // events on this connection are authorized against a server-trusted id
        // instead of whatever playerId the client claims in its payload.
        socket.data.playerId = result.player.id;
        socket.emit('register_response', { success: true, player: result.player });
      }
    } catch (e) {
      console.error('[register_profile] error:', e);
      socket.emit('register_response', { success: false, error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  // Profile Login
  socket.on('login_profile', async (data) => {
    const { username, password } = data || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return socket.emit('login_response', { success: false, error: 'Eksik bilgi.' });
    }
    try {
      const result = await db.loginPlayer(username, password);
      if (result.error) {
        socket.emit('login_response', { success: false, error: result.error });
      } else {
        socket.data.playerId = result.player.id;
        socket.emit('login_response', { success: true, player: result.player });
      }
    } catch (e) {
      console.error('[login_profile] error:', e);
      socket.emit('login_response', { success: false, error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  // Update Avatar Request
  socket.on('update_avatar', async (data) => {
    const playerId = socket.data.playerId;
    const avatar = data?.avatar;
    if (!playerId) return socket.emit('update_avatar_response', { success: false, error: 'Oturum bulunamadı, lütfen tekrar giriş yapın.' });
    if (typeof avatar !== 'string' || !avatar) return socket.emit('update_avatar_response', { success: false, error: 'Eksik bilgi!' });
    try {
      const updated = await db.updateAvatar(playerId, avatar);
      if (updated) {
        socket.emit('update_avatar_response', { success: true, player: updated });
      } else {
        socket.emit('update_avatar_response', { success: false, error: 'Güncellenemedi' });
      }
    } catch (e) {
      console.error('[update_avatar] error:', e);
      socket.emit('update_avatar_response', { success: false, error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  // Add/change email on an already-authenticated account (e.g. a
  // username-only signup deciding later they want recovery to work).
  // Trusts socket.data.playerId (session-bound), never a client-supplied
  // id — otherwise anyone could attach an email to someone else's account.
  socket.on('update_email', async (data) => {
    const playerId = socket.data.playerId;
    const email = data?.email;
    if (!playerId) return socket.emit('update_email_response', { success: false, error: 'Oturum bulunamadı, lütfen tekrar giriş yapın.' });
    if (typeof email !== 'string' || !email.trim()) return socket.emit('update_email_response', { success: false, error: 'Eksik bilgi!' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return socket.emit('update_email_response', { success: false, error: 'Geçerli bir e-posta adresi girin.' });
    try {
      const result = await db.updatePlayerEmail(playerId, email);
      if (result.error) {
        socket.emit('update_email_response', { success: false, error: result.error });
      } else {
        socket.emit('update_email_response', { success: true, player: result.player });
      }
    } catch (e) {
      console.error('[update_email] error:', e);
      socket.emit('update_email_response', { success: false, error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  // Change username on an already-authenticated account. Same trust model
  // as update_email — always socket.data.playerId, never client-supplied.
  socket.on('update_username', async (data) => {
    const playerId = socket.data.playerId;
    const username = data?.username;
    if (!playerId) return socket.emit('update_username_response', { success: false, error: 'Oturum bulunamadı, lütfen tekrar giriş yapın.' });
    if (typeof username !== 'string' || !username.trim()) return socket.emit('update_username_response', { success: false, error: 'Eksik bilgi!' });
    try {
      const result = await db.updatePlayerUsername(playerId, username);
      if (result.error) {
        socket.emit('update_username_response', { success: false, error: result.error });
      } else {
        socket.emit('update_username_response', { success: true, player: result.player });
      }
    } catch (e) {
      console.error('[update_username] error:', e);
      socket.emit('update_username_response', { success: false, error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  // Forgot Password Code Request
  socket.on('forgot_password', async (data) => {
    const { email } = data;
    console.log(`[ForgotPwd Request] Received forgot_password event for email: "${email}"`);
    
    // generateResetCode internally calls connectDB() - no need to pre-check
    let result;
    try {
      result = await db.generateResetCode(email);
    } catch (dbErr) {
      console.error(`[ForgotPwd Error] generateResetCode exception:`, dbErr.message);
      return socket.emit('forgot_password_response', { success: false, error: 'Sunucu hatası. Lütfen tekrar deneyin.' });
    }

    if (result.error && !result.devMode) {
      console.warn(`[ForgotPwd Warning] generateResetCode failed: ${result.error}`);
      return socket.emit('forgot_password_response', { success: false, error: result.error });
    }

    const resetCode = result.code || '777777';
    const username = result.username || 'TestOyuncusu';

    // Don't log the actual code — even with /api/logs now gated, this is one
    // fewer place a valid reset code could leak from.
    console.log(`[ForgotPwd Info] Generated reset code for ${email}. Triggering sendResetEmail...`);
    
    // Run mailer in background (Non-blocking)
    sendResetEmail(email, username, resetCode)
      .then(mailRes => {
        if (mailRes) {
          console.log(`[ForgotPwd Mailer] Background sendResetEmail finished. Success: ${mailRes.success}, devMode: ${!!mailRes.devMode}`);
        } else {
          console.warn(`[ForgotPwd Mailer] Background sendResetEmail returned no response`);
        }
      })
      .catch(mailErr => {
        console.error(`[ForgotPwd Mailer Error] Background sendResetEmail crashed:`, mailErr);
      });

    console.log(`[ForgotPwd Success] Emitting immediate forgot_password_response to client`);
    
    // Emit immediate success to client so spinner disappears instantly
    socket.emit('forgot_password_response', { 
      success: true, 
      message: result.devMode ? 'Geliştirici Modu: Kod sunucu tarafından üretildi.' : 'Doğrulama kodu e-posta adresinize gönderildi.',
      code: result.devMode ? resetCode : null,
      devMode: !!result.devMode
    });
  });

  // Push Token
  socket.on('save_push_token', async (data) => {
    const playerId = socket.data.playerId;
    const token = data?.token;
    if (!playerId || typeof token !== 'string' || !token) return;
    try {
      await db.updatePushToken(playerId, token);
      console.log(`[PushToken] Saved for player ${playerId}`);
    } catch (e) {
      console.error('[PushToken] Error saving token:', e);
    }
  });

  // Reset Password Verification
  socket.on('reset_password', async (data) => {
    const { email, code, newPassword } = data || {};
    if (typeof email !== 'string' || typeof code !== 'string' || typeof newPassword !== 'string') {
      return socket.emit('reset_password_response', { success: false, error: 'Eksik bilgi.' });
    }
    try {
      const result = await db.resetPasswordWithCode(email, code, newPassword);
      if (result.error) {
        socket.emit('reset_password_response', { success: false, error: result.error });
      } else {
        socket.emit('reset_password_response', { success: true, player: result.player, message: 'Şifreniz başarıyla sıfırlandı!' });
      }
    } catch (e) {
      console.error('[reset_password] error:', e);
      socket.emit('reset_password_response', { success: false, error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  // Global Leaderboard Fetch
  socket.on('get_leaderboard', async (data) => {
    const { category } = data;
    const leaderboard = await db.getLeaderboard(category);
    socket.emit('leaderboard_data', { leaderboard });
  });

  socket.on('buy_joker', async (data) => {
    const playerId = socket.data.playerId;
    const jokerType = data?.jokerType;
    if (!playerId) return socket.emit('joker_error', { message: 'Oturum bulunamadı, lütfen tekrar giriş yapın.' });
    if (typeof jokerType !== 'string') return socket.emit('joker_error', { message: 'Eksik bilgi!' });
    try {
      const result = await db.buyJoker(playerId, jokerType, 50);
      if (result.error) {
        socket.emit('joker_error', { message: result.error });
      } else {
        socket.emit('joker_bought', { player: result.player, jokerType });
      }
    } catch (e) {
      console.error('[buy_joker] error:', e);
      socket.emit('joker_error', { message: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  socket.on('reward_free_coins', async (data) => {
    const playerId = socket.data.playerId;
    if (!playerId) return socket.emit('joker_error', { message: 'Oturum bulunamadı, lütfen tekrar giriş yapın.' });
    if (!checkRewardCooldown(playerId, 'coins')) {
      return socket.emit('joker_error', { message: 'Çok sık ödül talep ediyorsunuz, lütfen biraz bekleyin.' });
    }
    try {
      const updatedUser = await db.updatePlayerCoins(playerId, 50);
      if (updatedUser) {
        socket.emit('joker_bought', { player: updatedUser, jokerType: 'freeCoins' });
      } else {
        socket.emit('joker_error', { message: 'Ödül eklenemedi, lütfen tekrar deneyin.' });
      }
    } catch (e) {
      console.error('Error rewarding free coins:', e);
      socket.emit('joker_error', { message: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  socket.on('reward_double_coins', async (data) => {
    const playerId = socket.data.playerId;
    if (!playerId) return socket.emit('joker_error', { message: 'Oturum bulunamadı, lütfen tekrar giriş yapın.' });
    if (!checkRewardCooldown(playerId, 'coins')) {
      return socket.emit('joker_error', { message: 'Çok sık ödül talep ediyorsunuz, lütfen biraz bekleyin.' });
    }
    try {
      const result = await db.updatePlayerCoins(playerId, 50);
      if (result) {
        socket.emit('coins_updated', { player: result });
      } else {
        socket.emit('joker_error', { message: 'Ödül eklenemedi, lütfen tekrar deneyin.' });
      }
    } catch (e) {
      console.error('Error rewarding double coins:', e);
      socket.emit('joker_error', { message: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
  });

  // Debug: client can call this to get real-time coin balance from DB
  socket.on('check_my_coins', async (data) => {
    const playerId = socket.data.playerId;
    if (!playerId) { socket.emit('my_coins_result', { error: 'Oturum bulunamadı' }); return; }
    try {
      await db.connectDB();
      const player = await require('mongoose').model('Player').findOne({ id: playerId });
      if (!player) { socket.emit('my_coins_result', { error: 'player not found', playerId }); return; }
      socket.emit('my_coins_result', { coins: player.coins, playerId, username: player.username });
    } catch (e) {
      socket.emit('my_coins_result', { error: e.message });
    }
  });

  socket.on('use_joker', async (data) => {
    const { roomId, jokerType } = data || {};
    // Room-scoped participant id (matches the id used for scores/guessingPlayerId,
    // which is always socket.id-based — see request_guess_turn/guess_word).
    // This is NOT an account identity, so it's fine to take it from the payload.
    const roomPlayerId = data?.playerId || socket.id;
    const validJokers = ['revealLetters', 'extraTime', 'instantHints', 'shield'];

    const room = activeRooms[roomId];
    if (!room) return socket.emit('joker_error', { message: 'Oda bulunamadı!' });
    if (!validJokers.includes(jokerType)) return socket.emit('joker_error', { message: 'Geçersiz joker türü' });

    // PRE-VALIDATION for game logic
    if (jokerType === 'extraTime' || jokerType === 'shield') {
      if (!room.isPaused || (room.guessingPlayerId !== roomPlayerId && room.guessingPlayerId !== socket.id)) {
        return socket.emit('joker_error', { message: 'Bu joker sadece tahmin sırasıyken kullanılabilir!' });
      }
    }

    // Validate the player actually owns the joker, using the server-trusted
    // account id bound at login (NOT the client-supplied roomPlayerId above —
    // that would let anyone drain another account's joker inventory just by
    // knowing their dbPlayerId, which room broadcasts expose). Guests have no
    // account/session, so they skip DB validation entirely.
    let result = { success: true, player: null };
    const accountPlayerId = socket.data.playerId;
    if (accountPlayerId) {
      try {
        const dbResult = await db.useJoker(accountPlayerId, jokerType);
        if (dbResult.error) {
          return socket.emit('joker_error', { message: dbResult.error });
        }
        result = dbResult;
      } catch (e) {
        console.error('[use_joker] error:', e);
        return socket.emit('joker_error', { message: 'Sunucu hatası, lütfen tekrar deneyin.' });
      }
    }

    // Room-state effects are always keyed by the room-scoped id (guessingPlayerId),
    // never the account id — keeps this consistent with how scores/activeShields
    // are read elsewhere (e.g. guess_word), otherwise effects like Shield silently
    // no-op because the lookup key never matches.
    const effectKey = room.guessingPlayerId || roomPlayerId;

    // Apply joker effect PRIVATELY (socket.emit instead of io.to(roomId).emit)
    if (jokerType === 'extraTime') {
      room.guessTimeLeft += 5;
      socket.emit('joker_used', { jokerType, playerId: roomPlayerId }); // no message = no popup
    } else if (jokerType === 'revealLetters') {
      const w = room.card.word;
      let privateHint = "";
      if (w.length > 2) {
        // Persist so this player's first/last letters stay visible across
        // later word_hint_update ticks (random-letter reveals during the
        // round) instead of being wiped by the next shared-array broadcast.
        if (!room.privateLetterReveals) room.privateLetterReveals = {};
        room.privateLetterReveals[roomPlayerId] = { first: true, last: true };
        privateHint = getWordHintForPlayer(room, roomPlayerId);
      } else {
        privateHint = w;
      }
      socket.emit('joker_used', { jokerType, playerId: roomPlayerId, hint: privateHint }); // no message = no popup
    } else if (jokerType === 'instantHints') {
      const card = room.card;
      if (card && card.forbidden) {
        // Find up to 2 hints that haven't been shown yet
        const hintsToReveal = [];
        for (let i = 0; i < 2; i++) {
          const targetIndex = room.hintsShown + i;
          if (targetIndex < card.forbidden.length) {
            hintsToReveal.push(card.forbidden[targetIndex]);
          }
        }
        hintsToReveal.forEach(hint => {
          socket.emit('hint_revealed', { hint, potentialScore: getPotentialScore(room) });
        });
        socket.emit('joker_used', { jokerType, playerId: roomPlayerId }); // no message = no popup
      }
    } else if (jokerType === 'shield') {
      if (!room.activeShields) room.activeShields = {};
      room.activeShields[effectKey] = true;
      socket.emit('joker_used', { jokerType, playerId: roomPlayerId });
    }

    // Update player data on client side so joker count drops
    socket.emit('joker_used_success', { player: result.player, jokerType });
  });

  socket.on('join_queue', (data) => {
    // Make sure user isn't already in queue
    if (queue.find(u => u.id === socket.id)) return;
    
    const category = data.category || 'football';
    console.log(socket.id, 'joined queue. Name:', data.name, 'DB Player ID:', data.dbPlayerId, 'Category:', category);
    queue.push({ 
      id: socket.id, 
      name: data.name || 'Misafir',
      dbPlayerId: data.dbPlayerId || null,
      category 
    });

    // Drop any queued entries whose socket has since disconnected/reconnected
    // (gets a new socket.id) — matching against a dead id would leave the
    // other player's client stuck waiting forever, since the dead socket
    // can never actually join the matched room.
    queue = queue.filter(u => io.sockets.sockets.get(u.id)?.connected);

    const categoryQueue = queue.filter(u => u.category === category);
    if (categoryQueue.length >= 2) {
      const p1 = queue.splice(queue.findIndex(u => u.id === categoryQueue[0].id), 1)[0];
      const p2 = queue.splice(queue.findIndex(u => u.id === categoryQueue[1].id), 1)[0];

      const roomId = `room_${Date.now()}_${Math.random()}`;
      
      // Make them join socket room
      io.sockets.sockets.get(p1.id)?.join(roomId);
      io.sockets.sockets.get(p2.id)?.join(roomId);

      activeRooms[roomId] = {
        category,
        isPrivate: false,
        isRanked1v1: true,
        status: 'playing',
        players: [p1, p2],
        scores: { [p1.id]: 0, [p2.id]: 0 },
        currentRound: 0,
        maxRounds: 10,
        usedWords: [], // Track words used in this session
        timer: null,
        roundActive: false,
        isPaused: false,
        guessingPlayerId: null,
        guessTimer: null
      };

      io.to(roomId).emit('match_found', {
        players: [p1, p2],
        roomId,
        category
      });

      // Give 3 seconds before starting the game
      setTimeout(() => {
        startRound(roomId);
      }, 3000);
    }
  });

  // Friendly Quick Match queue — coins only, no KP, guests OK
  socket.on('join_friendly_queue', (data) => {
    if (friendlyQueue.find(u => u.id === socket.id)) return;
    const category = data.category || 'football';
    console.log(socket.id, 'joined friendly queue. Name:', data.name, 'Category:', category);
    friendlyQueue.push({
      id: socket.id,
      name: data.name || 'Misafir',
      dbPlayerId: data.dbPlayerId || null,
      category
    });
    friendlyQueue = friendlyQueue.filter(u => io.sockets.sockets.get(u.id)?.connected);

    const catQueue = friendlyQueue.filter(u => u.category === category);
    if (catQueue.length >= 2) {
      const p1 = friendlyQueue.splice(friendlyQueue.findIndex(u => u.id === catQueue[0].id), 1)[0];
      const p2 = friendlyQueue.splice(friendlyQueue.findIndex(u => u.id === catQueue[1].id), 1)[0];
      const roomId = `friendly_${Date.now()}_${Math.random()}`;
      io.sockets.sockets.get(p1.id)?.join(roomId);
      io.sockets.sockets.get(p2.id)?.join(roomId);
      activeRooms[roomId] = {
        category,
        isPrivate: false,
        isRanked1v1: false,
        isFriendly1v1: true,  // coins only, no KP/category XP
        status: 'playing',
        players: [p1, p2],
        scores: { [p1.id]: 0, [p2.id]: 0 },
        currentRound: 0,
        maxRounds: 10,
        usedWords: [],
        timer: null,
        roundActive: false,
        isPaused: false,
        guessingPlayerId: null,
        guessTimer: null
      };
      io.to(roomId).emit('match_found', { players: [p1, p2], roomId, category, isFriendly: true });
      setTimeout(() => { startRound(roomId); }, 3000);
    }
  });

  socket.on('create_room', (data) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i=0; i<5; i++) code += characters.charAt(Math.floor(Math.random() * characters.length));
    
    const roomId = 'private_' + code;
    socket.join(roomId);
    
    activeRooms[roomId] = {
      category: data.category || 'football',
      isPrivate: true,
      isGroupRanked: data.isRanked || false,
      roomCode: code,
      hostId: socket.id,
      status: 'waiting', 
      players: [{ id: socket.id, name: data.name || 'Oyuncu', dbPlayerId: data.dbPlayerId || null }],
      scores: { [socket.id]: 0 },
      currentRound: 0,
      maxRounds: data.maxRounds || 10,
      usedWords: [],
      timer: null,
      roundActive: false,
      isPaused: false,
      guessingPlayerId: null,
      guessTimer: null
    };
    
    socket.emit('room_created', { roomCode: code, roomId, category: activeRooms[roomId].category });
    io.to(roomId).emit('room_update', { players: activeRooms[roomId].players, hostId: socket.id, category: activeRooms[roomId].category });
  });

  socket.on('join_room', (data) => {
    const { roomCode, name, dbPlayerId } = data;
    const roomId = Object.keys(activeRooms).find(id => activeRooms[id].roomCode === roomCode.toUpperCase());
    
    if (!roomId) {
      socket.emit('join_error', { message: 'Oda bulunamadı veya kapalı!' });
      return;
    }
    
    const room = activeRooms[roomId];
    if (room.status !== 'waiting') {
      socket.emit('join_error', { message: 'Oyun zaten başlamış!' });
      return;
    }
    
    if (room.players.find(p => p.id === socket.id)) return;
    
    socket.join(roomId);
    room.players.push({ id: socket.id, name: name || 'Oyuncu', dbPlayerId: dbPlayerId || null });
    room.scores[socket.id] = 0;
    
    socket.emit('room_joined', { roomId, roomCode: room.roomCode, category: room.category });
    io.to(roomId).emit('room_update', { players: room.players, hostId: room.hostId, category: room.category });
  });

  socket.on('start_room_game', (data) => {
    const { roomId } = data;
    const room = activeRooms[roomId];
    if (!room || room.hostId !== socket.id || room.status !== 'waiting') return;
    
    room.status = 'playing';
    io.to(roomId).emit('game_starting_soon');
    setTimeout(() => {
      startRound(roomId);
    }, 3000);
  });

  socket.on('request_guess_turn', (data) => {
    const { roomId, playerId } = data;
    const id = playerId || socket.id;
    const room = activeRooms[roomId];
    if (!room || !room.roundActive || room.isPaused || room.guessingPlayerId) return; // someone is already guessing or round ended

    room.guessingPlayerId = id;
    room.isPaused = true;
    room.guessTimeLeft = 15; // Increased to 15 seconds as requested!

    io.to(roomId).emit('guess_turn_started', { playerId: id, time: room.guessTimeLeft });

    room.guessTimer = setInterval(() => {
      room.guessTimeLeft--;
      if (room.guessTimeLeft <= 0) {
        clearInterval(room.guessTimer);
        room.guessTimer = null;
        room.guessingPlayerId = null;
        room.isPaused = false;
        
        // Timeout penalty
        const penalty = 10;
        room.scores[id] = (room.scores[id] || 0) - penalty;
        io.to(roomId).emit('wrong_guess', { scores: room.scores, reason: 'timeout', playerId: id });
        io.to(roomId).emit('guess_turn_ended');
      } else {
        io.to(roomId).emit('guess_time_tick', { time: room.guessTimeLeft });
      }
    }, 1000);
  });

  socket.on('pass_round', (data) => {
    const { roomId, playerId } = data;
    const id = playerId || socket.id;
    const room = activeRooms[roomId];
    if (!room || !room.roundActive) {
      console.log(`[PassRound] Rejected - room exists: ${!!room}, roundActive: ${room?.roundActive}`);
      return;
    }

    if (!room.passVotes) {
      room.passVotes = new Set();
    }

    // Add this socket's vote
    room.passVotes.add(id);

    // Count votes by checking which room players have voted
    // room.players[i].id === socket.id always (set at join time)
    const activePlayers = room.players || [];
    const totalPlayers = activePlayers.length;
    const validVotesCount = activePlayers.filter(p => room.passVotes.has(p.id)).length;

    // Fallback: if player list seems wrong, use passVotes.size directly
    const effectiveVotes = validVotesCount > 0 ? validVotesCount : room.passVotes.size;
    const requiredVotes = Math.max(1, totalPlayers || room.passVotes.size);

    console.log(`[PassRound] Room ${roomId}: socket=${socket.id}, passVotes=[${[...room.passVotes].join(',')}], players=[${activePlayers.map(p=>p.id).join(',')}], validVotes=${validVotesCount}, effectiveVotes=${effectiveVotes}, required=${requiredVotes}`);

    io.to(roomId).emit('pass_update', {
      votesCount: effectiveVotes,
      totalPlayers: requiredVotes,
      voterId: id
    });

    if (effectiveVotes >= requiredVotes) {
      room.roundActive = false;
      room.isPaused = false;
      room.guessingPlayerId = null;
      if (room.timer) clearInterval(room.timer);
      if (room.guessTimer) clearInterval(room.guessTimer);

      io.to(roomId).emit('round_ended', {
        winnerId: null,
        winnerName: null,
        word: room.card ? room.card.word : 'PAS',
        reason: 'pass',
        scores: room.scores
      });

      setTimeout(() => {
        startRound(roomId);
      }, 3000);
    }
  });

  socket.on('guess_word', (data) => {
    const { roomId, guess, playerId } = data;
    const id = playerId || socket.id;
    const room = activeRooms[roomId];
    if (!room || !room.roundActive) return;
    
    if (room.guessingPlayerId !== id) return;

    if (room.guessTimer) {
      clearInterval(room.guessTimer);
      room.guessTimer = null;
    }

    if (normalizeText(guess) === normalizeText(room.card.word)) {
      // Correct!
      room.roundActive = false;
      room.isPaused = false;
      room.guessingPlayerId = null;
      clearInterval(room.timer);
      
      const pointsEarned = getPotentialScore(room);
      room.scores[id] = (room.scores[id] || 0) + pointsEarned;
      
      const winnerPlayer = room.players.find(p => p.id === id);
      
      io.to(roomId).emit('round_ended', {
        winnerId: id,
        winnerName: winnerPlayer ? winnerPlayer.name : 'Oyuncu',
        word: room.card.word,
        reason: 'correct_guess',
        pointsEarned: pointsEarned,
        scores: room.scores
      });
      
      setTimeout(() => {
        startRound(roomId);
      }, 4000);
    } else {
      // Incorrect guess
      let penalty = 10;
      let reason = 'incorrect';
      
      if (room.activeShields && room.activeShields[id]) {
        room.activeShields[id] = false; // consume shield
        penalty = 0;
        reason = 'shielded';
      } else {
        room.scores[id] = (room.scores[id] || 0) - penalty;
      }
      
      room.guessingPlayerId = null;
      room.isPaused = false;

      io.to(roomId).emit('wrong_guess', { scores: room.scores, penalty: penalty, reason: reason, playerId: id });
      io.to(roomId).emit('guess_turn_ended');
    }
  });

  // Called by the client right after its socket reconnects mid-match (see
  // the disconnect handler's 20s grace window below). The new socket was
  // never joined to the room, so without this it would just sit connected
  // but never receive another round/turn/score event for the rest of the
  // match. Deliberately does NOT rewrite any of the player's ids in
  // room.players/scores/guessingPlayerId/activeShields/privateLetterReveals
  // — those all stay keyed by the original room-scoped id forever (the
  // same id the client calls myOriginalId and already sends as playerId on
  // every guess_word/pass_round/request_guess_turn/use_joker), so nothing
  // else needs to change. We just need this socket to (re)join the rooms
  // that make it reachable under that id again.
  socket.on('rejoin_room', (data) => {
    const { roomId, oldPlayerId } = data || {};
    const room = activeRooms[roomId];
    if (!room || !oldPlayerId) return;
    if (!room.players.some(p => p.id === oldPlayerId)) return; // already timed out / removed

    socket.join(roomId);      // room-wide broadcasts (round_ended, game_over, hint_revealed...)
    socket.join(oldPlayerId); // targeted per-player sends keyed by the stable id (word_hint_update, joker_used)

    // Remember this socket's stable identity for its NEXT disconnect — after
    // this point socket.id no longer equals room.players[].id (we never
    // remap that), so a later leave_room/disconnect can't just use socket.id
    // to find this player in the room anymore.
    socket.data.stablePlayerId = oldPlayerId;

    if (disconnectTimeouts[oldPlayerId]) {
      clearTimeout(disconnectTimeouts[oldPlayerId]);
      delete disconnectTimeouts[oldPlayerId];
    }

    socket.emit('room_synced', {
      roomId,
      players: room.players,
      scores: room.scores,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      timeLeft: room.timeLeft,
      wordHint: room.card ? getWordHintForPlayer(room, oldPlayerId) : undefined,
      hints: (room.card && room.card.forbidden) ? room.card.forbidden.slice(0, room.hintsShown || 0) : [],
      potentialScore: getPotentialScore(room),
      guessingPlayerId: room.guessingPlayerId || null,
      guessTimeLeft: room.guessTimeLeft,
      passVotesCount: room.passVotes ? room.passVotes.size : 0,
      hasPassed: room.passVotes ? room.passVotes.has(oldPlayerId) : false,
    });
  });

  socket.on('leave_room', async (data) => {
    const { roomId } = data;
    if (!roomId) return;

    socket.leave(roomId);

    const room = activeRooms[roomId];
    if (!room) return;

    const stableId = socket.data.stablePlayerId || socket.id;
    const playerIndex = room.players.findIndex(p => p.id === stableId);
    if (playerIndex !== -1) {
      if (room.status === 'waiting') {
        room.players.splice(playerIndex, 1);
        delete room.scores[stableId];
        if (room.players.length === 0) {
          delete activeRooms[roomId];
        } else {
          if (room.hostId === stableId) {
            room.hostId = room.players[0].id;
          }
          io.to(roomId).emit('room_update', { players: room.players, hostId: room.hostId });
        }
      } else {
        const [quitter] = room.players.splice(playerIndex, 1);
        io.to(roomId).emit('player_disconnected', { playerId: stableId, players: room.players });

        if (room.players.length <= 1) {
          await resolveMatchForfeit(room, roomId, quitter);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    queue = queue.filter(u => u.id !== socket.id);
    
    // If they were in an active room
    const stableId = socket.data.stablePlayerId || socket.id;
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === stableId);

      if (playerIndex !== -1) {
        if (room.status === 'waiting') {
           // Remove from lobby immediately
           room.players.splice(playerIndex, 1);
           delete room.scores[stableId];
           if (room.players.length === 0) {
             delete activeRooms[roomId];
           } else {
             if (room.hostId === stableId) {
               room.hostId = room.players[0].id;
             }
             io.to(roomId).emit('room_update', { players: room.players, hostId: room.hostId });
           }
        } else {
           // Playing state: Delay removal to allow Socket.io auto-reconnect
           io.to(roomId).emit('player_disconnected_warning', { playerId: stableId });

           disconnectTimeouts[stableId] = setTimeout(async () => {
             if (!activeRooms[roomId]) return;

             const pIndex = room.players.findIndex(p => p.id === stableId);
             if (pIndex !== -1) {
               const [quitter] = room.players.splice(pIndex, 1);
               io.to(roomId).emit('player_disconnected', { playerId: stableId, players: room.players });

               if (room.players.length <= 1) {
                 await resolveMatchForfeit(room, roomId, quitter);
               }
             }
           }, 20000); // Wait 20 seconds for reconnect before kicking
        }
      }
    }
  });
});

// The "Harf Aç" (revealLetters) joker reveals the first/last letter only to
// the player who used it — everyone else's word_hint_update must not show
// it. Since that update is otherwise identical for every player in the
// room, we can't just mutate the shared room.wordHintArray (that would leak
// the letters to the opponent too). Instead we track each player's private
// reveal separately and merge it back in whenever we send THEM a hint.
function getWordHintForPlayer(room, playerId) {
  const arr = room.wordHintArray.slice();
  const reveal = room.privateLetterReveals && room.privateLetterReveals[playerId];
  if (reveal) {
    const w = room.card.word;
    if (reveal.first) arr[0] = w[0];
    if (reveal.last) arr[w.length - 1] = w[w.length - 1];
  }
  return arr.join('');
}

// Broadcast an event to every player in the room, but with a wordHint that's
// merged per-recipient via getWordHintForPlayer instead of the raw shared
// array — use this instead of io.to(roomId).emit(...) for any event whose
// payload includes wordHint.
//
// Targets io.to(p.id) rather than looking up a live socket by p.id directly:
// p.id is the player's STABLE room-scoped id, which never changes even
// after a reconnect (see rejoin_room), while a raw socket lookup by that id
// would return nothing once the original socket died. Every socket already
// sits in a room named after its own id by default; rejoin_room additionally
// joins a reconnected socket into a room named after its old id, so io.to
// keeps resolving to whichever socket currently represents that player.
function emitWordHintUpdate(room, eventName, extraPayload) {
  room.players.forEach(p => {
    io.to(p.id).emit(eventName, { ...extraPayload, wordHint: getWordHintForPlayer(room, p.id) });
  });
}

// Whether a player's stable room-scoped id currently has a live socket
// behind it — either their original (never-reconnected) socket, still
// sitting in the auto-room Socket.IO names after its own id, or a
// reconnected socket that rejoin_room explicitly joined into a room named
// after that stable id. Empty/missing room = nobody is currently connected
// under that id.
function isPlayerConnected(playerId) {
  const r = io.sockets.adapter.rooms.get(playerId);
  return !!(r && r.size > 0);
}

// Ends a match early because one player is gone for good (explicit leave,
// or the 20s reconnect grace period expired) — used by both leave_room and
// the disconnect handler's timeout, plus a safety net at the natural
// round-conclusion check in startRound (see there) for the rare case where
// all 10 rounds finish before a pending disconnect's grace period expires,
// which previously let a genuinely-forfeited match resolve as a tie/win off
// stale frozen scores instead. Ranked keeps its existing KP penalty; the
// coin forfeit here is new (Friendly/private matches had no penalty/reward
// at all for a forfeit-quit before this).
// `quitter` must already be spliced out of room.players by the caller —
// room.players is treated as "everyone who remains".
async function resolveMatchForfeit(room, roomId, quitter) {
  if (room.timer) clearInterval(room.timer);
  if (room.guessTimer) clearInterval(room.guessTimer);

  const remaining = room.players;
  const roomCat = room.category || 'football';
  const kpChanges = {};
  const coinChanges = {};
  const playerUpdates = {};
  const record = (updated) => { if (updated) playerUpdates[updated.id || updated._id] = updated; };

  if (room.isRanked1v1) {
    kpChanges[quitter.id] = -35;
    if (quitter.dbPlayerId) record(await db.updatePlayerStats(quitter.dbPlayerId, -35, false, 0, 0, roomCat));
    for (const p of remaining) {
      kpChanges[p.id] = 50;
      if (p.dbPlayerId) record(await db.updatePlayerStats(p.dbPlayerId, 50, true, 0, 0, roomCat));
    }
  } else {
    // Friendly / private: coins only, no KP — quitter loses 25 (only if
    // they actually have 25+; updatePlayerCoins' own $gte guard makes this
    // a no-op rather than going negative), remaining player(s) earn 25 each,
    // same amount as a normal win.
    kpChanges[quitter.id] = 0;
    coinChanges[quitter.id] = -25;
    if (quitter.dbPlayerId) record(await db.updatePlayerCoins(quitter.dbPlayerId, -25));
    for (const p of remaining) {
      kpChanges[p.id] = 0;
      coinChanges[p.id] = 25;
      if (p.dbPlayerId) record(await db.updatePlayerCoins(p.dbPlayerId, 25));
    }
  }

  io.to(roomId).emit('opponent_disconnected', { scores: room.scores, kpChanges, coinChanges, playerUpdates, quitterId: quitter.id });
  delete activeRooms[roomId];
}

function getPotentialScore(room) {
  if (!room) return 10;
  const hintsPenalty = Math.max(0, (room.hintsShown || 1) - 1);
  const lettersPenalty = (room.revealedIndices ? room.revealedIndices.length : 0);
  
  // Standardize scoring across all modes (Ranked and Friendly start at 100)
  return Math.max(10, 100 - (hintsPenalty * 10) - (lettersPenalty * 10));
}

async function startRound(roomId) {
  const room = activeRooms[roomId];
  if (!room) return;

  // Clear any existing timer just in case
  if (room.timer) clearInterval(room.timer);
  if (room.guessTimer) clearInterval(room.guessTimer);
  room.roundActive = true;
  room.isPaused = false;
  room.guessingPlayerId = null;
  room.guessTimer = null;

  room.currentRound++;
  if (room.currentRound > room.maxRounds) {
    // Safety net: the round timer keeps running through a pending 20s
    // reconnect grace window (a brief drop shouldn't itself pause the
    // match), so it's possible for the match to reach its natural end while
    // one player is mid-disconnect and hasn't been formally removed yet.
    // Without this, that resolved as a normal win/tie off their stale
    // frozen score instead of the forfeit it actually is.
    const goneIndex = room.players.findIndex(p => !isPlayerConnected(p.id));
    if (goneIndex !== -1 && room.players.length > 1) {
      const [quitter] = room.players.splice(goneIndex, 1);
      io.to(roomId).emit('player_disconnected', { playerId: quitter.id, players: room.players });
      await resolveMatchForfeit(room, roomId, quitter);
      return;
    }

    const kpChanges = {};
    const coinChanges = {};
    const playerUpdates = {};  // socketId → updatedPlayerObj (included in game_over)
    const roomCat = room.category || 'football';

    // Helper: emit updated profile to a specific player socket AND record in playerUpdates
    const applyReward = (socketId, updatedPlayer) => {
      if (!updatedPlayer) return;
      const key = updatedPlayer.id || updatedPlayer._id;
      playerUpdates[key] = updatedPlayer;          // key by dbPlayerId
      const playerSocket = io.sockets.sockets.get(socketId);
      if (playerSocket) playerSocket.emit('coins_updated', { player: updatedPlayer }); // early notification
    };

    if (room.isRanked1v1 && room.players.length === 2) {
      // ── Ranked 1v1: KP + coins ───────────────────────────────────────────
      const p1 = room.players[0];
      const p2 = room.players[1];
      const s1 = room.scores[p1.id] || 0;
      const s2 = room.scores[p2.id] || 0;
      console.log(`[Ranked1v1] Room ${roomId} ended. s1=${s1} s2=${s2} | p1=${p1.name}(${p1.dbPlayerId}) p2=${p2.name}(${p2.dbPlayerId})`);
      if (s1 > s2) {
        const [r1, r2] = await Promise.all([
          p1.dbPlayerId ? db.updatePlayerStats(p1.dbPlayerId, 50, true, 0, 0, roomCat)  : Promise.resolve(null),
          p2.dbPlayerId ? db.updatePlayerStats(p2.dbPlayerId, -25, false, 0, 0, roomCat) : Promise.resolve(null),
        ]);
        applyReward(p1.id, r1); applyReward(p2.id, r2);
        kpChanges[p1.id] = 50;  coinChanges[p1.id] = 50;
        kpChanges[p2.id] = -25; coinChanges[p2.id] = 0;
      } else if (s2 > s1) {
        const [r1, r2] = await Promise.all([
          p1.dbPlayerId ? db.updatePlayerStats(p1.dbPlayerId, -25, false, 0, 0, roomCat) : Promise.resolve(null),
          p2.dbPlayerId ? db.updatePlayerStats(p2.dbPlayerId, 50, true, 0, 0, roomCat)   : Promise.resolve(null),
        ]);
        applyReward(p1.id, r1); applyReward(p2.id, r2);
        kpChanges[p1.id] = -25; coinChanges[p1.id] = 0;
        kpChanges[p2.id] = 50;  coinChanges[p2.id] = 50;
      } else {
        const [r1, r2] = await Promise.all([
          p1.dbPlayerId ? db.updatePlayerStats(p1.dbPlayerId, 10, false, 0, 0, roomCat) : Promise.resolve(null),
          p2.dbPlayerId ? db.updatePlayerStats(p2.dbPlayerId, 10, false, 0, 0, roomCat) : Promise.resolve(null),
        ]);
        applyReward(p1.id, r1); applyReward(p2.id, r2);
        kpChanges[p1.id] = 10; coinChanges[p1.id] = 0;
        kpChanges[p2.id] = 10; coinChanges[p2.id] = 0;
      }

    } else if (room.isGroupRanked && room.players.length >= 3) {
      // ── Group Ranked: KP rewards ─────────────────────────────────────────
      const sorted = [...room.players].sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0));
      const r0 = sorted[0].dbPlayerId ? await db.updatePlayerStats(sorted[0].dbPlayerId, 125, true, 0, 0, roomCat)  : null;
      const r1 = sorted[1].dbPlayerId ? await db.updatePlayerStats(sorted[1].dbPlayerId, 50, false, 0, 0, roomCat)  : null;
      applyReward(sorted[0].id, r0);
      applyReward(sorted[1].id, r1);
      kpChanges[sorted[0].id] = 125; coinChanges[sorted[0].id] = 50;
      kpChanges[sorted[1].id] = 50;  coinChanges[sorted[1].id] = 0;
      for (let i = 2; i < sorted.length; i++) {
        const ri = sorted[i].dbPlayerId ? await db.updatePlayerStats(sorted[i].dbPlayerId, -25, false, 0, 0, roomCat) : null;
        applyReward(sorted[i].id, ri);
        kpChanges[sorted[i].id] = -25; coinChanges[sorted[i].id] = 0;
      }

    } else {
      // ── Friendly / Private match: coins only, no KP ──────────────────────
      let highScore = -Infinity;
      room.players.forEach(p => { if ((room.scores[p.id] || 0) > highScore) highScore = room.scores[p.id] || 0; });
      const isTie = room.players.filter(p => (room.scores[p.id] || 0) === highScore).length > 1;
      console.log(`[FriendlyGame] Room ${roomId} ending. players=${room.players.length} highScore=${highScore} isTie=${isTie}`);
      for (const p of room.players) {
        const score = room.scores[p.id] || 0;
        const isWinner = !isTie && score === highScore;
        const coinsEarned = isWinner ? 25 : 5;
        // Always set, guest or not — coinChanges is what the client uses to
        // credit the reward, whether that's a DB write (below) or a
        // local-only guest balance (client has no DB record to look up).
        coinChanges[p.id] = coinsEarned;
        kpChanges[p.id] = 0;
        console.log(`  → player "${p.name}" dbPlayerId=${p.dbPlayerId} score=${score} winner=${isWinner} coins=+${coinsEarned}`);

        if (!p.dbPlayerId) {
          console.log(`    GUEST: no DB record — client will credit ${coinsEarned} coins locally`);
          continue;
        }
        const updatedPlayer = await db.updatePlayerCoins(p.dbPlayerId, coinsEarned);
        if (updatedPlayer) {
          console.log(`    OK: +${coinsEarned} coins → newBalance=${updatedPlayer.coins}`);
          applyReward(p.id, updatedPlayer);
        } else {
          console.log(`    ERROR: Player not found in DB for dbPlayerId=${p.dbPlayerId}`);
        }
      }
    }

    // playerUpdates is embedded in game_over so client always gets updated profile
    io.to(roomId).emit('game_over', { scores: room.scores, kpChanges, coinChanges, playerUpdates });
    delete activeRooms[roomId];
    return;
  }

  // Pick a random card that hasn't been used yet
  const roomCategory = room.category || 'football';
  const availableWords = (wordsDb[roomCategory] || []).filter(w => !room.usedWords.includes(w.word));
  const cardList = availableWords.length > 0 ? availableWords : (wordsDb[roomCategory] || []); // fallback if we somehow exhaust all words
  
  if (cardList.length === 0) {
    // Failsafe in case words haven't loaded for this category
    console.error(`No words found for category ${roomCategory}`);
    return;
  }
  
  const card = cardList[Math.floor(Math.random() * cardList.length)];
  
  // Dynamic Fisher-Yates Clue Rotation: Ensure forbidden clues never appear in fixed order
  const shuffledForbidden = [...(card.forbidden || [])];
  for (let i = shuffledForbidden.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledForbidden[i], shuffledForbidden[j]] = [shuffledForbidden[j], shuffledForbidden[i]];
  }
  const rotatedCard = { ...card, forbidden: shuffledForbidden };


  room.usedWords.push(card.word);
  room.card = rotatedCard;
  room.timeLeft = 30;
  room.hintsShown = 1; // First hint immediately
  room.passVotes = new Set();

  // Create word hint replacing only non-space chars with underscore
  room.wordHintArray = card.word.split('').map(c => c === ' ' ? ' ' : '_');
  room.revealedIndices = [];
  room.privateLetterReveals = {};
  room.finalCountdownStarted = false;

  // Initial emit
  io.to(roomId).emit('game_start', {
    wordLength: card.word.length,
    wordHint: room.wordHintArray.join(''),
    firstHint: rotatedCard.forbidden[0],
    potentialScore: getPotentialScore(room),
    timeLeft: room.timeLeft,
    currentRound: room.currentRound,
    maxRounds: room.maxRounds,
    scores: room.scores,
    players: room.players
  });

  room.timer = setInterval(() => {
    if (room.isPaused) return; // PAUSE logic

    room.timeLeft--;

    // Every 5 seconds (25, 20, 15, 10), we show another hint
    // Hints at: t=25 (2nd), t=20 (3rd), t=15 (4th), t=10 (5th)
    if (room.timeLeft % 5 === 0 && room.timeLeft < 30 && room.timeLeft > 0 && room.hintsShown < room.card.forbidden.length && room.hintsShown < 5) {
      const hintWord = room.card.forbidden[room.hintsShown]; // use room.card (always current)
      room.hintsShown++;
      io.to(roomId).emit('hint_revealed', { hint: hintWord, potentialScore: getPotentialScore(room) });
    }

    // After ALL hints are shown (hintsShown >= 5 OR no more hints) AND timeLeft < 10,
    // reveal one letter every 2 seconds, max 3 letters
    const allHintsShown = room.hintsShown >= Math.min(5, room.card.forbidden.length);
    if (allHintsShown && room.timeLeft < 10 && room.timeLeft % 2 === 0 && room.revealedIndices.length < 3) {
      const availableIndices = [];
      for (let i = 0; i < card.word.length; i++) {
        if (card.word[i] !== ' ' && !room.revealedIndices.includes(i)) {
          availableIndices.push(i);
        }
      }
      if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        room.revealedIndices.push(randomIndex);
        room.wordHintArray[randomIndex] = card.word[randomIndex];
        emitWordHintUpdate(room, 'word_hint_update', { potentialScore: getPotentialScore(room) });
      }
      
      // If we just revealed the 3rd letter, or no more letters can be revealed, give bonus time
      if (!room.finalCountdownStarted && (room.revealedIndices.length === 3 || availableIndices.length <= 1)) {
        room.finalCountdownStarted = true;
        room.timeLeft = 12; // FIX: was 15, reduced to prevent huge time jumps
      }
    }

    if (room.timeLeft <= 0 && room.roundActive) {
      room.roundActive = false;
      clearInterval(room.timer);
      io.to(roomId).emit('round_ended', {
        winnerId: null,
        word: card.word,
        reason: 'timeout',
        scores: room.scores
      });
      
      setTimeout(() => {
        startRound(roomId);
      }, 4000);
    } else if (room.timeLeft > 0 && room.roundActive) {
      io.to(roomId).emit('time_tick', { timeLeft: room.timeLeft });
    }
  }, 1000);
}

const cron = require('node-cron');
const { sendPushNotifications } = require('./notifications');

// Cron Job: Her Cuma saat 18:00'da haftalık turnuva hatırlatıcısı
cron.schedule('0 18 * * 5', async () => {
  console.log('[CRON] Starting weekly tournament push notification job...');
  try {
    const players = await db.getPlayersWithPushTokens();
    const guestTokens = await db.getGuestPushTokens();
    
    // Merge tokens and remove duplicates (if any)
    const allTokens = [...new Set([...players.map(p => p.pushToken), ...guestTokens])];

    const messages = allTokens.map(token => ({
      pushToken: token,
      title: '🏆 Haftalık Turnuva Zamanı!',
      body: 'Yeni haftalık turnuva başladı. Hemen katıl ve liderlik tablosunda yerini al!',
      data: { route: 'Tournament' }
    }));

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`[CRON] Sent notifications to ${messages.length} players.`);
    }
  } catch (err) {
    console.error('[CRON] Error sending notifications:', err);
  }
}, {
  timezone: "Europe/Istanbul"
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  if (!process.env.ADMIN_SECRET) {
    console.warn('[Startup] ADMIN_SECRET is not set — /seed-players, /debug-db, /api/logs, /api/fix-tournaments, /api/refresh-words, /health-legacy and /debug-tournament will refuse all requests until it is configured.');
  }
});

