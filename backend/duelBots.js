// Practice opponents for the duel mode: 15 server-side bots (5 easy, 5 medium,
// 5 hard) that a player can invite to a FRIENDLY match at any time. They are
// clearly labelled as bots in the app (🤖 + difficulty), never appear in the
// online-player counter, never play ranked, and never touch KP or the
// leaderboard.
//
// A bot is just a room participant with no socket: its moves are driven by
// timers that call the same functions the socket handlers use
// (beginGuessTurn / submitGuess / castPassVote — see server.js).

const BOTS = [
  // easy
  { id: 'bot:mira',   name: 'Mira',   avatar: 'avatar_3',  level: 'easy' },
  { id: 'bot:ege',    name: 'Ege',    avatar: 'avatar_7',  level: 'easy' },
  { id: 'bot:luna',   name: 'Luna',   avatar: 'avatar_11', level: 'easy' },
  { id: 'bot:poyraz', name: 'Poyraz', avatar: 'avatar_15', level: 'easy' },
  { id: 'bot:nehir',  name: 'Nehir',  avatar: 'avatar_19', level: 'easy' },
  // medium
  { id: 'bot:atlas',  name: 'Atlas',  avatar: 'avatar_2',  level: 'medium' },
  { id: 'bot:defne',  name: 'Defne',  avatar: 'avatar_6',  level: 'medium' },
  { id: 'bot:arda',   name: 'Arda',   avatar: 'avatar_10', level: 'medium' },
  { id: 'bot:sena',   name: 'Sena',   avatar: 'avatar_14', level: 'medium' },
  { id: 'bot:kuzey',  name: 'Kuzey',  avatar: 'avatar_18', level: 'medium' },
  // hard
  { id: 'bot:sahin',  name: 'Şahin',  avatar: 'avatar_1',  level: 'hard' },
  { id: 'bot:nova',   name: 'Nova',   avatar: 'avatar_5',  level: 'hard' },
  { id: 'bot:zafer',  name: 'Zafer',  avatar: 'avatar_9',  level: 'hard' },
  { id: 'bot:asli',   name: 'Aslı',   avatar: 'avatar_13', level: 'hard' },
  { id: 'bot:titan',  name: 'Titan',  avatar: 'avatar_17', level: 'hard' },
];

// pKnow: chance the bot "knows" the word this round. pWrongBuzz: if it doesn't,
// chance it still buzzes and guesses wrong. buzz: seconds after the round starts
// (hints unlock every 5s). typing: seconds between buzzing in and answering.
const LEVELS = {
  easy:   { pKnow: 0.35, pWrongBuzz: 0.25, buzz: [12, 24], typing: [3, 6] },
  medium: { pKnow: 0.60, pWrongBuzz: 0.20, buzz: [7, 19],  typing: [2, 4.5] },
  hard:   { pKnow: 0.85, pWrongBuzz: 0.10, buzz: [3, 13],  typing: [1.5, 3] },
};

const LEVEL_LABEL = {
  tr: { easy: 'Kolay', medium: 'Orta', hard: 'Zor' },
  en: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
};

const rand = (min, max) => min + Math.random() * (max - min);
const later = (ms, fn) => setTimeout(fn, Math.round(ms));

const isBotId = (id) => typeof id === 'string' && id.startsWith('bot:');
const findBot = (id) => BOTS.find(b => b.id === id) || null;

// What the app lists (name/avatar/level only — no internals).
const publicRoster = () => BOTS.map(b => ({ botId: b.id, name: b.name, avatar: b.avatar, level: b.level }));

// The room participant for one match. The 🤖 + difficulty are part of the
// display name so every screen that shows names labels the bot as a bot.
function createBotPlayer(bot, lang) {
  const label = (LEVEL_LABEL[lang] || LEVEL_LABEL.tr)[bot.level];
  return {
    id: `${bot.id}:${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
    name: `🤖 ${bot.name} · ${label}`,
    avatar: bot.avatar,
    dbPlayerId: null,
    isBot: true,
    botLevel: bot.level,
  };
}

const roundAlive = (room, roomId, roundNo, activeRooms) =>
  activeRooms[roomId] === room && room.roundActive && room.currentRound === roundNo;

// Called right after a round starts: decides what each bot will do this round.
function scheduleRound(room, roomId, hooks) {
  const roundNo = room.currentRound;
  for (const bot of room.players.filter(p => p.isBot)) {
    const cfg = LEVELS[bot.botLevel] || LEVELS.medium;
    const knows = Math.random() < cfg.pKnow;
    const wrongBuzz = !knows && Math.random() < cfg.pWrongBuzz;
    if (!knows && !wrongBuzz) continue; // sits this round out (someone else or the clock ends it)

    const typingMs = rand(cfg.typing[0], cfg.typing[1]) * 1000;
    const tryBuzz = (attempt) => {
      if (!roundAlive(room, roomId, roundNo, hooks.activeRooms)) return;
      // someone else is mid-guess / the round is paused: try again shortly
      if (room.isPaused || room.guessingPlayerId) {
        if (attempt < 8) later(1200, () => tryBuzz(attempt + 1));
        return;
      }
      hooks.beginGuessTurn(roomId, bot.id);
      later(typingMs, () => {
        if (!roundAlive(room, roomId, roundNo, hooks.activeRooms) || room.guessingPlayerId !== bot.id) return;
        const correct = room.card && room.card.word;
        hooks.submitGuess(roomId, bot.id, knows ? correct : wrongGuess(correct, hooks.wordPool(room.category)));
      });
    };
    later(rand(cfg.buzz[0], cfg.buzz[1]) * 1000, () => tryBuzz(0));
  }
}

function wrongGuess(correct, pool) {
  const options = (pool || []).filter(w => w && w.word && w.word !== correct);
  return options.length ? options[Math.floor(Math.random() * options.length)].word : '???';
}

// A human voted to pass the round: bots agree a moment later, otherwise a pass
// (which needs every player's vote) could never go through against a bot.
function onPassVote(room, roomId, voterId, hooks) {
  if (voterId && voterId.startsWith('bot:')) return;
  const roundNo = room.currentRound;
  for (const bot of room.players.filter(p => p.isBot)) {
    later(rand(1200, 2400), () => {
      if (!roundAlive(room, roomId, roundNo, hooks.activeRooms)) return;
      hooks.castPassVote(roomId, bot.id);
    });
  }
}

module.exports = { BOTS, isBotId, findBot, publicRoster, createBotPlayer, scheduleRound, onPassVote };
