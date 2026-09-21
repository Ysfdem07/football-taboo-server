// The app's AUTOMATIC push notifications: what triggers each one, who gets it
// and the (editable) texts. Built-in defaults live here; the admin panel
// (/admin/notify) stores edited copies in Mongo, which take precedence.
//
// Texts may contain {placeholders}; each rule lists the ones it supports and
// an example value (used for the panel preview and the test send).
const db = require('./db');
const { sendPushNotifications } = require('./notifications');

const RULES = {
  weekly_reminder: {
    name: 'Haftalık turnuva hatırlatması',
    trigger: 'Her Cuma 18:00 (İstanbul saati), sunucuda otomatik.',
    audience: 'Push token\'ı kayıtlı tüm oyuncular ve misafirler. Dili İngilizce olanlara EN, diğerlerine TR metin gider.',
    route: 'Tournament',
    placeholders: {},
    defaults: {
      enabled: true,
      tr: { title: '🏆 Haftalık Turnuva Zamanı!', body: 'Yeni haftalık turnuva başladı. Hemen katıl ve liderlik tablosunda yerini al!' },
      en: { title: '🏆 Weekly Tournament Time!', body: 'The weekly tournament is on. Jump in and claim your spot on the leaderboard!' }
    }
  },
  weekly_reward_podium: {
    name: 'Haftalık turnuva ödülü — ilk 3',
    trigger: 'Haftalık ödüller dağıtılınca (Pazar 23:00\'dan itibaren sunucu saatiyle, saatlik kontrol). Kategori dili belirler: Futbol/Sinema/Müzik → TR, İngilizce kategoriler → EN.',
    audience: 'Turnuvada ilk 3\'e giren ve bildirim izni açık oyuncular. Aynı dilde birden fazla kategoride derece yapan tek bildirim alır.',
    route: 'Tournament',
    placeholders: {
      places: { info: 'Dereceler', tr: 'Sinema turnuvasında 1.', en: '#1 in Cinema' },
      rewards: { info: 'Kazanılan KP ve coin (metin)', tr: '+400 KP ve +500 coin', en: '+400 KP and +500 coins' },
      kp: { info: 'Toplam KP (sayı)', tr: '400', en: '400' },
      coins: { info: 'Toplam coin (sayı)', tr: '500', en: '500' }
    },
    defaults: {
      enabled: true,
      tr: { title: '🏆 Haftalık Turnuva Ödülün!', body: '{places} oldun! {rewards} hesabına eklendi. 🎉' },
      en: { title: '🏆 Weekly Tournament Reward!', body: 'You finished {places} in the weekly tournament! {rewards} added to your account. 🎉' }
    }
  },
  weekly_reward_participation: {
    name: 'Haftalık turnuva katılım ödülü (15 KP)',
    trigger: 'Haftalık ödüller dağıtılınca, ilk 3 dışında skor yapanlara (ilk 3\'e girmemiş olması şart).',
    audience: 'Turnuvaya katılıp ilk 3 dışında kalan ve bildirim izni açık oyuncular. Kategori diline göre TR/EN.',
    route: 'Tournament',
    placeholders: {
      categories: { info: 'Katıldığı kategori(ler)', tr: 'Sinema', en: 'Cinema' },
      kp: { info: 'Toplam katılım KP\'si (sayı)', tr: '15', en: '15' }
    },
    defaults: {
      enabled: true,
      tr: { title: '🎯 Haftalık Turnuva', body: '{categories} turnuvasına katıldığın için +{kp} KP kazandın. Gelecek hafta ilk 3\'e girmeyi dene! 🎉' },
      en: { title: '🎯 Weekly Tournament', body: 'You earned +{kp} KP for playing the weekly {categories} tournament. Aim for the top 3 next week! 🎉' }
    }
  }
};

const MAX_TITLE = 100;
const MAX_BODY = 200;

function render(text, vars) {
  return String(text).replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

// Sample values (per language) for the preview / test send.
function sampleVars(ruleKey, lang) {
  const vars = {};
  for (const [name, p] of Object.entries(RULES[ruleKey].placeholders)) vars[name] = p[lang];
  return vars;
}

// Defaults merged with the admin's saved copy.
async function getRules() {
  const overrides = new Map((await db.getNotificationOverrides()).map(o => [o.key, o]));
  return Object.entries(RULES).map(([key, rule]) => {
    const o = overrides.get(key);
    return {
      key,
      name: rule.name, trigger: rule.trigger, audience: rule.audience, route: rule.route, placeholders: rule.placeholders,
      defaults: rule.defaults,
      customized: !!o,
      updatedAt: o?.updatedAt || null,
      enabled: o ? o.enabled !== false : rule.defaults.enabled,
      tr: o ? { title: o.tr?.title || rule.defaults.tr.title, body: o.tr?.body || rule.defaults.tr.body } : rule.defaults.tr,
      en: o ? { title: o.en?.title || rule.defaults.en.title, body: o.en?.body || rule.defaults.en.body } : rule.defaults.en
    };
  });
}

async function getRule(key) {
  return (await getRules()).find(r => r.key === key) || null;
}

// Returns an error string, or null when the texts are fine to save.
function validateTexts(ruleKey, { tr, en }) {
  const allowed = new Set(Object.keys(RULES[ruleKey].placeholders));
  for (const [lang, t] of [['TR', tr], ['EN', en]]) {
    if (!t.title.trim() || !t.body.trim()) return `${lang}: başlık ve mesaj boş olamaz.`;
    if (t.title.length > MAX_TITLE) return `${lang}: başlık en fazla ${MAX_TITLE} karakter olabilir.`;
    if (t.body.length > MAX_BODY) return `${lang}: mesaj en fazla ${MAX_BODY} karakter olabilir.`;
    for (const m of (t.title + ' ' + t.body).matchAll(/\{(\w+)\}/g)) {
      if (!allowed.has(m[1])) return `${lang}: {${m[1]}} bu bildirimde kullanılamaz. Kullanılabilir: ${[...allowed].map(a => `{${a}}`).join(', ') || 'yok'}.`;
    }
  }
  return null;
}

// Friday reminder: TR text to everyone not marked English, EN text to English
// users. Token lists are de-duplicated (a device can be a player and a guest).
async function sendWeeklyReminder() {
  const rule = await getRule('weekly_reminder');
  if (!rule.enabled) { console.log('[CRON] weekly_reminder is disabled, skipping.'); return 0; }

  const [allPlayers, enPlayers, allGuests, enGuests] = await Promise.all([
    db.getPlayersWithPushTokens(), db.getPlayersWithPushTokens('en'),
    db.getGuestPushTokens(), db.getGuestPushTokens('en')
  ]);
  const enTokens = new Set([...enPlayers.map(p => p.pushToken), ...enGuests].filter(Boolean));
  const trTokens = new Set([...allPlayers.map(p => p.pushToken), ...allGuests].filter(t => t && !enTokens.has(t)));

  const messages = [
    ...[...trTokens].map(pushToken => ({ pushToken, title: rule.tr.title, body: rule.tr.body, data: { route: rule.route } })),
    ...[...enTokens].map(pushToken => ({ pushToken, title: rule.en.title, body: rule.en.body, data: { route: rule.route } }))
  ];
  if (messages.length) await sendPushNotifications(messages);
  console.log(`[CRON] weekly_reminder sent to ${messages.length} devices (TR ${trTokens.size}, EN ${enTokens.size}).`);
  return messages.length;
}

module.exports = { RULES, render, sampleVars, getRules, getRule, validateTexts, sendWeeklyReminder, MAX_TITLE, MAX_BODY };
