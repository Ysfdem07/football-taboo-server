// Push notifications after the weekly-tournament payout: ranks 1-3 get the
// "podium" message, everyone else who scored (15 KP) the "participation" one.
// Turkish categories get the Turkish text, *_en categories the English one.
// The texts are editable in the admin panel — see notificationRules.js.
const db = require('./db');
const { sendPushNotifications } = require('./notifications');
const { getRules, render } = require('./notificationRules');

const CATEGORY_NAMES = {
  tr: { football: 'Futbol', cinema: 'Sinema', music: 'Müzik' },
  en: { football: 'Football', cinema: 'Cinema', music: 'Music' }
};

const langOf = (category) => (category.endsWith('_en') ? 'en' : 'tr');
const catName = (lang, category) => CATEGORY_NAMES[lang][category.replace(/_en$/, '')];

function joinList(items, lang) {
  if (items.length <= 1) return items.join('');
  const and = lang === 'en' ? 'and' : 've';
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

// Values for the {placeholders} of one player's message.
function buildVars(lang, entries) {
  const podium = entries.filter(e => e.rank <= 3);
  const kp = entries.reduce((n, e) => n + e.kp, 0);
  const coins = entries.reduce((n, e) => n + e.coins, 0);
  const places = podium.map(e => (lang === 'en' ? `#${e.rank} in ${catName(lang, e.category)}` : `${catName(lang, e.category)} turnuvasında ${e.rank}.`));
  const rewards = lang === 'en'
    ? `+${kp} KP${coins ? ` and +${coins} coins` : ''}`
    : `+${kp} KP${coins ? ` ve +${coins} coin` : ''}`;
  return {
    places: joinList(places, lang),
    rewards,
    kp,
    coins,
    categories: joinList(entries.map(e => catName(lang, e.category)), lang)
  };
}

// entries: every paid entry [{ playerId, category, rank, kp, coins }].
// One message per player per language: a player who placed in two categories
// of the same language gets a single combined notification.
// rules: result of getRules(); a disabled rule sends nothing.
function buildMessages(entries, players, rules) {
  const tokenById = new Map(players.map(p => [p.id, p.pushToken]));
  const rule = Object.fromEntries(rules.map(r => [r.key, r]));
  const groups = new Map();
  for (const e of entries) {
    if (!tokenById.get(e.playerId)) continue;
    const key = `${e.playerId}|${langOf(e.category)}`;
    if (!groups.has(key)) groups.set(key, { playerId: e.playerId, lang: langOf(e.category), entries: [] });
    groups.get(key).entries.push(e);
  }
  const messages = [];
  for (const g of groups.values()) {
    const podium = g.entries.some(e => e.rank <= 3);
    const r = rule[podium ? 'weekly_reward_podium' : 'weekly_reward_participation'];
    if (!r || !r.enabled) continue;
    const vars = buildVars(g.lang, g.entries);
    messages.push({
      playerId: g.playerId,
      pushToken: tokenById.get(g.playerId),
      title: render(r[g.lang].title, vars),
      body: render(r[g.lang].body, vars),
      data: { route: r.route }
    });
  }
  return messages;
}

async function notifyWeeklyWinners(entries, { dryRun = false } = {}) {
  const ids = [...new Set(entries.map(e => e.playerId))];
  if (!ids.length) return [];
  const [players, rules] = await Promise.all([db.getPushTokensByIds(ids), getRules()]);
  const messages = buildMessages(entries, players, rules);
  if (!dryRun && messages.length) await sendPushNotifications(messages);
  return messages;
}

module.exports = { notifyWeeklyWinners, buildMessages };
