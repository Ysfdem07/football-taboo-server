// Push notifications for weekly-tournament winners (top 3 of each category).
// Turkish categories get a Turkish message, *_en categories an English one.
const db = require('./db');
const { sendPushNotifications } = require('./notifications');

const CATEGORY_NAMES = {
  tr: { football: 'Futbol', cinema: 'Sinema', music: 'Müzik' },
  en: { football: 'Football', cinema: 'Cinema', music: 'Music' }
};

const langOf = (category) => (category.endsWith('_en') ? 'en' : 'tr');
const baseCategory = (category) => category.replace(/_en$/, '');

function joinList(items, lang) {
  if (items.length <= 1) return items.join('');
  const and = lang === 'en' ? 'and' : 've';
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

function buildBody(lang, entries, alreadyPaid) {
  const kp = entries.reduce((n, e) => n + e.kp, 0);
  const coins = entries.reduce((n, e) => n + e.coins, 0);
  if (lang === 'en') {
    const places = entries.map(e => `#${e.rank} in ${CATEGORY_NAMES.en[baseCategory(e.category)]}`);
    return alreadyPaid
      ? `You finished ${joinList(places, 'en')} in the weekly tournament! Your +${kp} KP now counts in the league rankings. 🎉`
      : `You finished ${joinList(places, 'en')} in the weekly tournament! +${kp} KP${coins ? ` and +${coins} coins` : ''} added to your account. 🎉`;
  }
  const places = entries.map(e => `${CATEGORY_NAMES.tr[baseCategory(e.category)]} turnuvasında ${e.rank}.`);
  return alreadyPaid
    ? `${joinList(places, 'tr')} oldun! Kazandığın +${kp} KP artık lig sıralamalarında da görünüyor. 🎉`
    : `${joinList(places, 'tr')} oldun! +${kp} KP${coins ? ` ve +${coins} coin` : ''} hesabına eklendi. 🎉`;
}

// entries: [{ playerId, category, rank, kp, coins, alreadyPaid? }] — only rank 1-3 are notified.
// One message per player per language (a player who won in two categories
// of the same language gets a single combined notification).
function buildMessages(entries, players) {
  const tokenById = new Map(players.map(p => [p.id, p.pushToken]));
  const groups = new Map();
  for (const e of entries) {
    if (e.rank > 3 || !tokenById.get(e.playerId)) continue;
    const lang = langOf(e.category);
    const key = `${e.playerId}|${lang}|${e.alreadyPaid ? 1 : 0}`;
    if (!groups.has(key)) groups.set(key, { playerId: e.playerId, lang, alreadyPaid: !!e.alreadyPaid, entries: [] });
    groups.get(key).entries.push(e);
  }
  return [...groups.values()].map(g => ({
    playerId: g.playerId,
    pushToken: tokenById.get(g.playerId),
    title: g.lang === 'en' ? '🏆 Weekly Tournament Reward!' : '🏆 Haftalık Turnuva Ödülün!',
    body: buildBody(g.lang, g.entries, g.alreadyPaid),
    data: { route: 'Tournament' }
  }));
}

async function notifyWeeklyWinners(entries, { dryRun = false } = {}) {
  const ids = [...new Set(entries.filter(e => e.rank <= 3).map(e => e.playerId))];
  if (!ids.length) return [];
  const players = await db.getPushTokensByIds(ids);
  const messages = buildMessages(entries, players);
  if (!dryRun && messages.length) await sendPushNotifications(messages);
  return messages;
}

module.exports = { notifyWeeklyWinners, buildMessages };
