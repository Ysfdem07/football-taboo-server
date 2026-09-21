const mongoose = require('mongoose');

// Bypass SRV due to Windows Node.js DNS bug with Linksys router
const ATLAS_URI = 'mongodb://wordrushtr_db_user:hsNIC3qKGwlYcz6T@ac-gnsx3ie-shard-00-00.sphwagn.mongodb.net:27017,ac-gnsx3ie-shard-00-01.sphwagn.mongodb.net:27017,ac-gnsx3ie-shard-00-02.sphwagn.mongodb.net:27017/futtaboo?ssl=true&replicaSet=atlas-r6zfqu-shard-0&authSource=admin&retryWrites=true&w=majority';
// Never use internal Railway MongoDB - always use Atlas
const MONGO_URI = ATLAS_URI;

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  // If already connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    await new Promise(resolve => mongoose.connection.once('connected', resolve));
    isConnected = true;
    return;
  }
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: false, family: 4, serverSelectionTimeoutMS: 10000, socketTimeoutMS: 10000
    });
    isConnected = true;
    console.log('MongoDB connected successfully to Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isConnected = false;
    throw err;
  }
}

const guestTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  language: { type: String, default: null }, // 'tr' | 'en'
  createdAt: { type: Date, default: Date.now }
});
const GuestToken = mongoose.model('GuestToken', guestTokenSchema);

const playerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Optional: username+password is enough to register and play ranked/
  // tournament — email is only needed for password recovery. sparse so the
  // unique index doesn't collide across the many accounts that omit it.
  email: { type: String, required: false, unique: true, sparse: true },
  marketingConsent: { type: Boolean, default: false },
  pushToken: { type: String, default: null },
  pushLanguage: { type: String, default: null }, // 'tr' | 'en', as of the last save_push_token call
  avatar: { type: String, default: '⚽' },
  kp: { type: Number, default: 0 },
  categoryKp: {
    football: { type: Number, default: 0 },
    cinema:   { type: Number, default: 0 },
    music:    { type: Number, default: 0 },
    football_en: { type: Number, default: 0 },
    cinema_en:   { type: Number, default: 0 },
    music_en:    { type: Number, default: 0 }
  },
  categoryWins: {
    football: { type: Number, default: 0 },
    cinema:   { type: Number, default: 0 },
    music:    { type: Number, default: 0 },
    football_en: { type: Number, default: 0 },
    cinema_en:   { type: Number, default: 0 },
    music_en:    { type: Number, default: 0 }
  },
  // Per-category match count, separate from categoryWins — needed so the
  // per-category leaderboard can compute a real win rate (categoryWins /
  // categoryMatchesPlayed) instead of dividing a category-specific win count
  // by the player's ALL-categories matches_played, which understates it.
  categoryMatchesPlayed: {
    football: { type: Number, default: 0 },
    cinema:   { type: Number, default: 0 },
    music:    { type: Number, default: 0 },
    football_en: { type: Number, default: 0 },
    cinema_en:   { type: Number, default: 0 },
    music_en:    { type: Number, default: 0 }
  },
  // KP earned through weekly-tournament rewards, per category. Already
  // included in kp/categoryKp; tracked separately so the category leaderboard
  // can show a tournament winner who has never played a ranked match (they
  // have no categoryMatchesPlayed, which the leaderboard otherwise requires).
  tournamentKp: {
    football: { type: Number, default: 0 },
    cinema:   { type: Number, default: 0 },
    music:    { type: Number, default: 0 },
    football_en: { type: Number, default: 0 },
    cinema_en:   { type: Number, default: 0 },
    music_en:    { type: Number, default: 0 }
  },
  matches_played: { type: Number, default: 0 },
  matches_won: { type: Number, default: 0 },
  correct_guesses: { type: Number, default: 0 },
  taboos: { type: Number, default: 0 },
  coins: { type: Number, default: 100 },
  adCoinRewards: {
    date: { type: String, default: '' },   // 'YYYY-MM-DD' of the last granted reward
    count: { type: Number, default: 0 }    // rewards granted that day
  },
  // Persisted (not just socket.data) so the AdMob SSV callback — a stateless
  // HTTP request from Google, not tied to any live socket — can still find
  // and grant it after the match that earned it has ended.
  pendingDoubleReward: {
    amount: { type: Number, default: 0 },
    grantedAt: { type: Date, default: null }
  },
  jokers: {
    revealLetters: { type: Number, default: 0 },
    extraTime: { type: Number, default: 0 },
    instantHints: { type: Number, default: 0 },
    shield: { type: Number, default: 0 }
  },
  resetCode: { type: String, default: null },
  resetExpires: { type: Date, default: null }
}, {
  // bufferCommands: default true - allows queuing until connected
});

// autoIndex is off (see connectDB) — these are documentation of the actual
// unique indexes already created directly on the collection (one-time
// migration, not run through Mongoose), not something that gets applied
// automatically. Collation makes username/email uniqueness case-insensitive,
// matching the case-insensitive regex checks used elsewhere (registerPlayer,
// loginPlayer, generateResetCode).
const CASE_INSENSITIVE_COLLATION = { locale: 'en', strength: 2 };
playerSchema.index({ id: 1 }, { unique: true, name: 'id_unique' });
playerSchema.index({ username: 1 }, { unique: true, collation: CASE_INSENSITIVE_COLLATION, name: 'username_unique_ci' });
playerSchema.index({ email: 1 }, { unique: true, sparse: true, collation: CASE_INSENSITIVE_COLLATION, name: 'email_unique_ci_sparse' });

const Player = mongoose.model('Player', playerSchema);

// Usernames of real, working accounts (app-store review testers, internal QA)
// that should stay fully functional but never show up on the public KP
// leaderboard — see getLeaderboard below.
// (Dusan Dusan / Lionel Yusuf: the owner's own old test accounts, hidden until
// they're deleted for good.)
const LEADERBOARD_HIDDEN_USERNAMES_RE = /^(applereviewer|Dusan Dusan|Lionel Yusuf)$/i;

// Weekly tournament payout: KP for ranks 1-3, coins for ranks 1-3, and a small
// participation KP for everyone else who scored.
const WEEKLY_REWARD_CATEGORIES = ['football', 'cinema', 'music', 'football_en', 'cinema_en', 'music_en'];
const WEEKLY_REWARD_KP = [400, 200, 100];
const WEEKLY_REWARD_COINS = [500, 250, 100];
const WEEKLY_PARTICIPATION_KP = 15;
const REWARD_CATCHUP_MS = 3 * 24 * 60 * 60 * 1000;

const systemLogSchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, {
  // bufferCommands: default true - allows queuing until connected
});

const SystemLog = mongoose.model('SystemLog', systemLogSchema);

// ─── Weekly Tournament ────────────────────────────────────────────────────────

const tournamentScoreSchema = new mongoose.Schema({
  playerId:           { type: String, required: true },
  username:           { type: String, required: true },
  avatar:             { type: String, default: '⚽' },
  bestScore:          { type: Number, default: 0 },
  correctCount:       { type: Number, default: 0 },
  completedPerfectly: { type: Boolean, default: false },
  lastPlayedDate:     { type: String, default: '' },   // "YYYY-MM-DD"
  attempts:           { type: Number, default: 0 },
  kpRewarded:         { type: Boolean, default: false },
  // Ad-earned bonus attempts, tracked separately from the 3 free daily
  // attempts above so they can be capped on their own (+3/day via ads).
  adBonusDate:        { type: String, default: '' },   // "YYYY-MM-DD"
  adBonusCount:       { type: Number, default: 0 }
}, { _id: false });

const weeklyTournamentSchema = new mongoose.Schema({
  weekId:       { type: String, required: true, unique: true }, // "2026-W31"
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },
  cards:        { type: Array, required: true },  // [{ word, forbidden }] x20
  scores:       { type: [tournamentScoreSchema], default: [] },
  rewardsGiven: { type: Boolean, default: false },
  // True once the reward also went into categoryKp/tournamentKp. Weeks paid
  // before that fix only bumped the global kp, and were backfilled once.
  categoryKpCredited: { type: Boolean, default: false }
}, {
  // bufferCommands: default true - allows queuing until connected
});

const WeeklyTournament = mongoose.model('WeeklyTournament', weeklyTournamentSchema);

// ─── AdMob SSV idempotency ──────────────────────────────────────────────────
// Google retries an SSV callback up to 5 times if our server doesn't answer
// fast enough with a 200 — recording transaction_id here (unique index) lets
// the handler recognize and safely no-op a retry instead of granting twice.
// TTL index auto-expires old rows; Google's transaction_ids don't repeat
// within any realistic replay window.
const adSsvTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  playerId:      { type: String, required: true },
  rewardType:    { type: String, required: true },
  createdAt:     { type: Date, default: Date.now, expires: '30d' }
});
const AdSsvTransaction = mongoose.model('AdSsvTransaction', adSsvTransactionSchema);

// Get ISO week string e.g. "2026-W31_football"
// Escape regex metacharacters so user-supplied username/email values used in
// case-insensitive lookups are matched literally, not as regex patterns
// (e.g. a username of ".*" could otherwise match any single-char username).
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getWeekId(category = 'football', date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}_${category}`;
}

function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { startDate: monday, endDate: sunday };
}

// UTC, to match grantAdCoinReward's day boundary (new Date().toISOString())
// — these used to disagree (this one was server-local time), which meant a
// player near midnight could straddle two different "days" between the two
// reward systems.
function getTodayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

const findPlayerById = async (playerId) => {
  if (mongoose.isValidObjectId(playerId)) {
    const p = await Player.findById(playerId);
    if (p) return p;
  }
  return await Player.findOne({ id: playerId });
};

// Picking a tournament attempt's 20 cards purely at random could — and, per
// player feedback, did — hand someone a suspiciously lopsided attempt
// (several Juventus players in a row, a run of obscure Classic Era names
// back to back, or an unusually hard/easy cinema set). Each entry names
// which card field to group by and the target share per group value;
// categories not listed here are untouched and keep using plain random
// selection.
const CARD_WEIGHTING = {
  football: {
    field: 'subcategory',
    weights: {
      "Klasik Dönem": 0.05,
      "1980'ler Efsaneleri": 0.10,
      "1990'lar Efsaneleri": 0.40,
      "2000'ler Yıldızları": 0.45,
    },
  },
  football_en: {
    field: 'subcategory',
    weights: {
      "Classic Era": 0.05,
      "1980s Legends": 0.10,
      "1990s Legends": 0.40,
      "2000s Stars": 0.45,
    },
  },
  cinema: {
    field: 'difficulty',
    weights: { "Kolay": 0.50, "Orta": 0.25, "Zor": 0.25 },
  },
  cinema_en: {
    field: 'difficulty',
    weights: { "Easy": 0.50, "Medium": 0.25, "Hard": 0.25 },
  },
};

// Picks `count` cards from wordList following CARD_WEIGHTING's target
// proportions for this category's grouping field (falls back to plain
// `shuffleArray(wordList).slice(0, count)` if the category has no
// configured weighting, or none of its cards carry a matching value yet).
function pickWeightedCards(wordList, category, count, shuffleArray) {
  const config = CARD_WEIGHTING[category];
  if (!config) return shuffleArray(wordList).slice(0, count);
  const { field, weights } = config;

  const byGroup = {};
  for (const card of wordList) {
    if (!weights[card[field]]) continue;
    (byGroup[card[field]] = byGroup[card[field]] || []).push(card);
  }
  const pooled = Object.values(byGroup).flat();
  if (pooled.length === 0) return shuffleArray(wordList).slice(0, count);

  // Largest-remainder rounding: each group's exact share (weight * count)
  // is rarely a whole number, so hand out the leftover slots to whichever
  // groups rounded down the most, keeping the total at exactly `count`
  // instead of merely close to it.
  const targets = Object.entries(weights).map(([key, w]) => {
    const exact = w * count;
    return { key, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let shortfall = count - targets.reduce((n, t) => n + t.count, 0);
  targets.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; shortfall > 0; i = (i + 1) % targets.length, shortfall--) {
    targets[i].count++;
  }

  const picked = [];
  for (const t of targets) {
    picked.push(...shuffleArray(byGroup[t.key] || []).slice(0, t.count));
  }

  // A group running short of its target (shouldn't happen at current
  // volumes, but stay safe) just leaves picked shorter than `count` — top it
  // back up from whatever weighted cards are left over.
  if (picked.length < count) {
    const used = new Set(picked);
    const leftover = shuffleArray(pooled.filter(c => !used.has(c)));
    picked.push(...leftover.slice(0, count - picked.length));
  }

  return shuffleArray(picked);
}

module.exports = {
  connectDB,
  saveLog: async (type, message) => {
    await connectDB();
    await SystemLog.create({ type, message });
  },
  getLogs: async (type, limit = 5) => {
    await connectDB();
    return await SystemLog.find({ type }).sort({ timestamp: -1 }).limit(limit);
  },

  registerPlayer: async (username, password, avatar, email, marketingConsent, language = 'tr') => {
    await connectDB();
    const trimmedEmail = email && email.trim() ? email.trim() : null;
    const dupConditions = [{ username: new RegExp(`^${escapeRegex(username.trim())}$`, 'i') }];
    if (trimmedEmail) dupConditions.push({ email: new RegExp(`^${escapeRegex(trimmedEmail)}$`, 'i') });
    const existing = await Player.findOne({ $or: dupConditions });
    if (existing) {
      return { error: language === 'en' ? 'Username or email already in use!' : 'Kullanıcı adı veya e-posta zaten kullanımda!' };
    }

    const newPlayer = {
      id: `player_${Math.random().toString(36).substr(2, 9)}`,
      username: username.trim(),
      password: password,
      // Omit the field entirely (not '') when no email was given, so the
      // schema's sparse unique index doesn't collide across guest-style
      // username-only accounts.
      ...(trimmedEmail ? { email: trimmedEmail } : {}),
      marketingConsent: marketingConsent,
      avatar: avatar || '⚽',
      kp: 0,
      matches_played: 0,
      matches_won: 0,
      correct_guesses: 0,
      taboos: 0,
      coins: 100,
      jokers: { revealLetters: 0, extraTime: 0, instantHints: 0, shield: 0 }
    };
    const player = new Player(newPlayer);
    await player.save();
    return { player: newPlayer };
  },

  loginPlayer: async (username, password) => {
    await connectDB();
    const player = await Player.findOne({
      $or: [
        { username: new RegExp(`^${escapeRegex(username.trim())}$`, 'i') },
        { email: new RegExp(`^${escapeRegex(username.trim())}$`, 'i') }
      ],
      password: password
    });
    if (!player) return { error: 'Hatalı kullanıcı adı veya şifre!' };
    return { player: player.toObject() };
  },

  updateAvatar: async (playerId, avatar) => {
    await connectDB();
    const player = await Player.findOneAndUpdate(
      { id: playerId },
      { $set: { avatar } },
      { new: true }
    );
    if (!player) return null;
    return player.toObject();
  },

  // Lets an already-authenticated player add/change the email on their
  // account (e.g. a guest-style username-only signup deciding later they
  // want recovery to work). Only reachable while logged in — this is NOT
  // the account-recovery path, so it must never be usable to claim
  // someone else's username by attaching an email to it after the fact.
  updatePlayerEmail: async (playerId, email) => {
    await connectDB();
    const trimmedEmail = email.trim();
    const existing = await Player.findOne({
      email: new RegExp(`^${escapeRegex(trimmedEmail)}$`, 'i'),
      id: { $ne: playerId }
    });
    if (existing) return { error: 'Bu e-posta adresi başka bir hesapta kullanımda!' };

    const player = await Player.findOneAndUpdate(
      { id: playerId },
      { $set: { email: trimmedEmail } },
      { new: true }
    );
    if (!player) return { error: 'Oyuncu bulunamadı.' };
    return { player: player.toObject() };
  },

  // Same authenticated-session-only pattern as updatePlayerEmail. This just
  // updates the live Player record — getTournamentLeaderboard and
  // getLeaderboard both read the current username from here at request
  // time, so a rename shows up immediately everywhere without needing to
  // touch WeeklyTournament's own stored snapshot.
  updatePlayerUsername: async (playerId, newUsername) => {
    await connectDB();
    const trimmed = newUsername.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      return { error: 'Kullanıcı adı 3-30 karakter arasında olmalıdır.' };
    }
    const existing = await Player.findOne({
      username: new RegExp(`^${escapeRegex(trimmed)}$`, 'i'),
      id: { $ne: playerId }
    });
    if (existing) return { error: 'Bu kullanıcı adı zaten kullanımda!' };

    const player = await Player.findOneAndUpdate(
      { id: playerId },
      { $set: { username: trimmed } },
      { new: true }
    );
    if (!player) return { error: 'Oyuncu bulunamadı.' };
    return { player: player.toObject() };
  },

  // Apple (Guideline 5.1.1(v)) and Google both require any app that lets
  // users create an account to also let them delete it, in-app, not just
  // log out. Removes the account outright plus their name/avatar from this
  // week's tournament leaderboards (each category's own current week only —
  // getTournamentLeaderboard already keys off getWeekId, so there's no
  // "past weeks" view to worry about here either).
  deletePlayer: async (playerId) => {
    await connectDB();
    const result = await Player.deleteOne({ id: playerId });
    if (result.deletedCount === 0) return { error: 'Oyuncu bulunamadı.' };

    for (const category of ['football', 'cinema', 'music', 'football_en', 'cinema_en', 'music_en']) {
      const weekId = getWeekId(category);
      await WeeklyTournament.updateOne(
        { weekId },
        { $pull: { scores: { playerId } } }
      );
    }

    return { success: true };
  },

  // Atomic, race-safe stat/coin update. Uses a MongoDB aggregation-pipeline
  // update so the kp/categoryKp floor-at-0 clamp is computed by the DB in the
  // same operation as the increment — no read-modify-write gap for concurrent
  // game-end / reward calls on the same player to race each other in.
  updatePlayerStats: async (playerId, kpChange, isWin, correctGuesses = 0, taboos = 0, category = 'football') => {
    await connectDB();
    const validCats = ['football', 'cinema', 'music', 'football_en', 'cinema_en', 'music_en'];
    const cat = validCats.includes(category) ? category : 'football';
    const catKpField = `categoryKp.${cat}`;
    const catWinsField = `categoryWins.${cat}`;
    const catPlayedField = `categoryMatchesPlayed.${cat}`;

    const player = await findPlayerById(playerId);
    if (!player) {
      console.log(`[db] updatePlayerStats FAILED: Player not found for id ${playerId}`);
      return null;
    }

    const setStage = {
      kp: { $max: [0, { $add: [{ $ifNull: ['$kp', 0] }, kpChange] }] },
      [catKpField]: { $max: [0, { $add: [{ $ifNull: [`$${catKpField}`, 0] }, kpChange] }] },
      matches_played: { $add: [{ $ifNull: ['$matches_played', 0] }, 1] },
      [catPlayedField]: { $add: [{ $ifNull: [`$${catPlayedField}`, 0] }, 1] },
      correct_guesses: { $add: [{ $ifNull: ['$correct_guesses', 0] }, correctGuesses] },
      taboos: { $add: [{ $ifNull: ['$taboos', 0] }, taboos] },
    };
    if (isWin) {
      setStage.matches_won = { $add: [{ $ifNull: ['$matches_won', 0] }, 1] };
      setStage[catWinsField] = { $add: [{ $ifNull: [`$${catWinsField}`, 0] }, 1] };
      setStage.coins = { $add: [{ $ifNull: ['$coins', 0] }, 50] };
    }

    const updated = await Player.findOneAndUpdate(
      { _id: player._id },
      [{ $set: setStage }],
      { new: true }
    );
    console.log(`[db] updatePlayerStats SAVED player ${updated?.id || playerId}. isWin=${isWin} kpChange=${kpChange} newCoins=${updated?.coins}`);
    return updated ? updated.toObject() : null;
  },

  // Atomic coin adjustment. For a deduction (amount < 0), the $gte filter
  // makes MongoDB check-and-decrement in a single operation, so two concurrent
  // spends can never both succeed against a balance that only covers one.
  updatePlayerCoins: async (playerId, amount) => {
    await connectDB();
    const player = await findPlayerById(playerId);
    if (!player) return null;
    const filter = amount < 0
      ? { _id: player._id, coins: { $gte: -amount } }
      : { _id: player._id };
    const updated = await Player.findOneAndUpdate(filter, { $inc: { coins: amount } }, { new: true });
    return updated ? updated.toObject() : null;
  },

  // Daily-capped "watch an ad for coins" reward (Market screen). The rollover
  // write is a separate, idempotent step (only matches when the stored date
  // isn't today, so a concurrent duplicate is a harmless no-op); the actual
  // grant is a single atomic findOneAndUpdate gated on today's count still
  // being under the limit, so concurrent requests can't grant more than
  // DAILY_AD_COIN_LIMIT rewards even if they race.
  grantAdCoinReward: async (playerId) => {
    await connectDB();
    const player = await findPlayerById(playerId);
    if (!player) return { error: 'Oyuncu bulunamadı' };

    const today = new Date().toISOString().slice(0, 10);
    const DAILY_AD_COIN_LIMIT = 10;
    const AD_COIN_REWARD = 50;

    if (player.adCoinRewards?.date !== today) {
      await Player.updateOne(
        { _id: player._id, 'adCoinRewards.date': { $ne: today } },
        { $set: { adCoinRewards: { date: today, count: 0 } } }
      );
    }

    const updated = await Player.findOneAndUpdate(
      { _id: player._id, 'adCoinRewards.date': today, 'adCoinRewards.count': { $lt: DAILY_AD_COIN_LIMIT } },
      { $inc: { coins: AD_COIN_REWARD, 'adCoinRewards.count': 1 } },
      { new: true }
    );

    if (!updated) {
      return { error: 'Günlük reklam ödülü limitine ulaştınız, yarın tekrar deneyin.', limitReached: true };
    }
    return { player: updated.toObject(), remaining: DAILY_AD_COIN_LIMIT - updated.adCoinRewards.count };
  },

  buyJoker: async (playerId, jokerType, price = 50) => {
    await connectDB();
    const validJokers = ['revealLetters', 'extraTime', 'instantHints', 'shield'];
    if (!validJokers.includes(jokerType)) return { error: 'Geçersiz joker türü' };

    const player = await findPlayerById(playerId);
    if (!player) return { error: 'Oyuncu bulunamadı' };

    // Single atomic findOneAndUpdate: the coins >= price check and the
    // deduction happen together, so a double-click / double-emit can't both
    // pass the balance check before either write lands (no lost update).
    const updated = await Player.findOneAndUpdate(
      { _id: player._id, coins: { $gte: price } },
      { $inc: { coins: -price, [`jokers.${jokerType}`]: 1 } },
      { new: true }
    );
    if (!updated) return { error: 'Yetersiz jeton!' };
    return { success: true, player: updated.toObject() };
  },

  useJoker: async (playerId, jokerType) => {
    await connectDB();
    const validJokers = ['revealLetters', 'extraTime', 'instantHints', 'shield'];
    if (!validJokers.includes(jokerType)) return { error: 'Geçersiz joker türü' };

    const player = await findPlayerById(playerId);
    if (!player) return { error: 'Oyuncu bulunamadı' };

    const field = `jokers.${jokerType}`;
    const updated = await Player.findOneAndUpdate(
      { _id: player._id, [field]: { $gt: 0 } },
      { $inc: { [field]: -1 } },
      { new: true }
    );
    if (!updated) return { error: 'Bu jokerden elinizde yok!' };
    return { success: true, player: updated.toObject() };
  },

  getLeaderboard: async (category = null) => {
    await connectDB();
    // Kept as real, working accounts (e.g. for Apple/Google review
    // re-verification) but hidden from the public leaderboard — with a
    // small player base they'd otherwise clutter the top 50 even at 0 KP,
    // since this query has no minimum-KP cutoff of its own.
    const usernameFilter = { username: { $not: LEADERBOARD_HIDDEN_USERNAMES_RE } };
    const validCategories = ['football', 'cinema', 'music', 'football_en', 'cinema_en', 'music_en'];
    if (category && validCategories.includes(category)) {
      const sortField = `categoryKp.${category}`;
      const playedField = `categoryMatchesPlayed.${category}`;
      // kp is floor-clamped at 0 (see updatePlayerStats), so "0 KP" and
      // "never played this category" are the same condition here — one
      // check excludes both kinds of leaderboard clutter. Also require a
      // tracked game count: categoryMatchesPlayed was added after
      // categoryKp/categoryWins, so an account whose category KP is entirely
      // pre-dated has no real win-rate to show — hide it from the ranked
      // list until it has an actual tracked match (playing again fixes this
      // automatically, no manual re-listing needed).
      // A weekly-tournament winner has real, tracked KP too even without a
      // ranked match (their win-rate shows a dash, see LeaderboardScreen).
      const leaderboardFilter = {
        ...usernameFilter,
        [sortField]: { $gt: 0 },
        $or: [{ [playedField]: { $gt: 0 } }, { [`tournamentKp.${category}`]: { $gt: 0 } }]
      };
      const players = await Player.find(leaderboardFilter)
        .select(`id username avatar kp categoryKp categoryWins categoryMatchesPlayed matches_won matches_played -_id`)
        .sort({ [sortField]: -1 })
        .limit(50);
      return players.map(p => {
        const obj = p.toObject();
        obj.displayKp = (obj.categoryKp && obj.categoryKp[category]) || 0;
        obj.matches_won = (obj.categoryWins && obj.categoryWins[category]) || 0;
        obj.matches_played = (obj.categoryMatchesPlayed && obj.categoryMatchesPlayed[category]) || 0;
        return obj;
      });
    }
    // Global leaderboard (fallback)
    const players = await Player.find({ ...usernameFilter, kp: { $gt: 0 } })
      .select('id username avatar kp categoryKp categoryWins matches_won matches_played -_id')
      .sort({ kp: -1 })
      .limit(50);
    return players.map(p => {
      const obj = p.toObject();
      obj.displayKp = obj.kp;
      return obj;
    });
  },

  generateResetCode: async (email) => {
    await connectDB();
    const player = await Player.findOne({ email: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') });
    if (!player) return { error: 'Bu e-posta adresine kayıtlı bir kullanıcı bulunamadı!' };

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    player.resetCode = code;
    player.resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity
    await player.save();

    return { success: true, code, username: player.username };
  },

  resetPasswordWithCode: async (email, code, newPassword) => {
    await connectDB();
    const player = await Player.findOne({ email: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') });
    if (!player) return { error: 'Bu e-posta adresine kayıtlı bir kullanıcı bulunamadı!' };

    if (!player.resetCode || player.resetCode !== code.trim()) {
      return { error: 'Geçersiz sıfırlama kodu!' };
    }

    if (!player.resetExpires || player.resetExpires < new Date()) {
      return { error: 'Sıfırlama kodunun süresi dolmuş!' };
    }

    // Update password and clear reset code fields
    player.password = newPassword;
    player.resetCode = null;
    player.resetExpires = null;
    await player.save();

    return { success: true, player: player.toObject() };
  },

  // ─── Weekly Tournament Functions ──────────────────────────────────────────

  ensureWeeklyTournament: async (wordList, category = 'football') => {
    try {
      await connectDB();
      if (!isConnected) {
        console.warn(`[Tournament Warning] Database not connected. Skipping tournament check.`);
        return null;
      }
      const weekId = getWeekId(category);
      const existing = await WeeklyTournament.findOne({ weekId });
      if (existing) return existing;

      // Pick 20 random cards
      const shuffled = [...wordList].sort(() => Math.random() - 0.5);
      const cards = shuffled.slice(0, 20);
      const { startDate, endDate } = getWeekBounds();
      const tournament = new WeeklyTournament({ weekId, startDate, endDate, cards, scores: [], rewardsGiven: false });
      await tournament.save();
      console.log(`[Tournament] Created new tournament for ${weekId} with ${cards.length} cards`);
      return tournament;
    } catch (err) {
      console.error(`[Tournament Error] Failed to ensure weekly tournament:`, err);
      return null;
    }
  },

  getWeeklyTournament: async (playerId, wordList, category = 'football') => {
    await connectDB();
    const weekId = getWeekId(category);
    let tournament = await WeeklyTournament.findOne({ weekId });

    const shuffleArray = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // Auto-create tournament if it doesn't exist (handles race condition where
    // initTournament may have run before loadWords completed)
    if (!tournament) {
      console.log(`[Tournament] No tournament found for ${weekId}, auto-creating...`);
      if (!wordList || wordList.length === 0) {
        console.error(`[Tournament] Cannot auto-create: wordList is empty for ${category}`);
        return { error: 'Turnuva hazırlanıyor, lütfen birazdan tekrar deneyin.' };
      }
      const cards = pickWeightedCards(wordList, category, 20, shuffleArray);
      const { startDate, endDate } = getWeekBounds();
      try {
        tournament = new WeeklyTournament({ weekId, startDate, endDate, cards, scores: [], rewardsGiven: false });
        await tournament.save();
        console.log(`[Tournament] Auto-created tournament for ${weekId} with ${cards.length} cards`);
      } catch (saveErr) {
        // Might be duplicate key if another request created it concurrently
        tournament = await WeeklyTournament.findOne({ weekId });
        if (!tournament) {
          console.error(`[Tournament] Failed to create or find tournament for ${weekId}:`, saveErr);
          return { error: 'Turnuva oluşturulamadı, lütfen tekrar deneyin.' };
        }
      }
    }

    const today = getTodayString();
    const myEntry = tournament.scores.find(s => s.playerId === playerId);

    // Her denemede farklı 20 kart için rastgele seçiyoruz (ağırlıklı alt
    // kategori dağılımıyla, bkz. pickWeightedCards) ve ipucu sırasını karıştırıyoruz
    const randomCardsForAttempt = pickWeightedCards(wordList, category, 20, shuffleArray).map(c => ({
      ...c,
      forbidden: shuffleArray(c.forbidden || [])
    }));

    const attemptsToday = myEntry && myEntry.lastPlayedDate === today ? myEntry.attempts : 0;

    return {
      weekId:             tournament.weekId,
      startDate:          tournament.startDate,
      endDate:            tournament.endDate,
      cards:              randomCardsForAttempt, // Her seferinde yeni random 20 kart
      myBestScore:        myEntry?.bestScore || 0,
      myCorrectCount:     myEntry?.correctCount || 0,
      myRank:             tournament.scores.filter(s => s.bestScore > (myEntry?.bestScore || 0)).length + 1,
      canPlayToday:       attemptsToday < 5, // Günlük limit: 5 hak
      blockedForWeek:     false, // Sınırsız deneme (en iyi skor)
      attempts:           attemptsToday,
      totalAttempts:      myEntry?.attempts || 0
    };
  },

  submitTournamentScore: async (playerId, username, avatar, score, correctCount, category = 'football') => {
    await connectDB();
    const weekId = getWeekId(category);
    const tournament = await WeeklyTournament.findOne({ weekId });
    if (!tournament) return { error: 'Aktif turnuva bulunamadı' };

    const today = getTodayString();
    const completedPerfectly = correctCount === 20;

    const idx = tournament.scores.findIndex(s => s.playerId === playerId);
    if (idx >= 0) {
      const entry = tournament.scores[idx];
      
      // Günlük hak kontrolünü sıfırlama veya artırma
      if (entry.lastPlayedDate !== today) {
        entry.attempts = 1;
        entry.lastPlayedDate = today;
      } else {
        entry.attempts += 1;
      }

      if (score > entry.bestScore) {
        entry.bestScore = score;
        entry.correctCount = correctCount;
      }
      entry.completedPerfectly = completedPerfectly;
    } else {
      tournament.scores.push({ 
        playerId, 
        username, 
        avatar: avatar || '⚽', 
        bestScore: score, 
        correctCount, 
        completedPerfectly, 
        lastPlayedDate: today, 
        attempts: 1, 
        kpRewarded: false 
      });
    }

    await tournament.save();
    const rank = tournament.scores.filter(s => s.bestScore > score).length + 1;
    return { success: true, rank, totalPlayers: tournament.scores.length, completedPerfectly };
  },

  grantAdAttempt: async (playerId, category = 'football') => {
    await connectDB();
    const weekId = getWeekId(category);
    const tournament = await WeeklyTournament.findOne({ weekId });
    if (!tournament) return { error: 'Aktif turnuva bulunamadı' };

    const today = getTodayString();
    const DAILY_AD_BONUS_LIMIT = 3; // +3 ekstra hak/gün, temel 5 hakkın üstüne

    const idx = tournament.scores.findIndex(s => s.playerId === playerId);
    if (idx >= 0) {
      const entry = tournament.scores[idx];
      if (entry.adBonusDate !== today) {
        entry.adBonusDate = today;
        entry.adBonusCount = 0;
      }
      if (entry.adBonusCount < DAILY_AD_BONUS_LIMIT) {
        entry.adBonusCount += 1;
        // attempts'i 1 azaltarak kullanıcıya yeni bir hak kazandırıyoruz
        if (entry.attempts > 0) {
          entry.attempts -= 1;
        }
        await tournament.save();
      }
      // Günlük reklam hakkı limitine zaten ulaşılmışsa sessizce hiçbir şey
      // yapmadan aşağıdaki güncel turnuva verisini döndürüyoruz.
    }
    // Return updated tournament data
    // WordSource is not passed to grantAdAttempt easily, so we fallback or fetch empty array if missing
    // In production we could pass wordList to grantAdAttempt, but returning null cards for UI refresh is fine.
    // However, getWeeklyTournament will generate randomCardsForAttempt. We don't have wordList here easily.
    // Instead of fs.readFileSync(WORDS_PATH), we just pass an empty array to getWeeklyTournament and the UI will handle it or keep old cards.
    return module.exports.getWeeklyTournament(playerId, [], category);
  },

  getTournamentLeaderboard: async (category = 'football') => {
    await connectDB();
    const weekId = getWeekId(category);
    const tournament = await WeeklyTournament.findOne({ weekId });
    if (!tournament) return [];
    const top = tournament.scores
      .filter(s => !LEADERBOARD_HIDDEN_USERNAMES_RE.test(s.username || ''))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 20);

    // tournament.scores.username/avatar are snapshotted the moment a player
    // first submits a score that week, so a rename/avatar change afterward
    // wouldn't otherwise show up until next week. Overlay each entry with
    // the player's CURRENT username/avatar so a rename reflects immediately;
    // falls back to the stored snapshot only if the account is gone.
    const players = await Player.find({ id: { $in: top.map(s => s.playerId) } }).select('id username avatar -_id');
    const byId = new Map(players.map(p => [p.id, p]));

    return top.map((s, i) => {
      const live = byId.get(s.playerId);
      return {
        rank: i + 1,
        playerId: s.playerId,
        username: live?.username || s.username,
        avatar: live?.avatar || s.avatar,
        score: s.bestScore,
        correctCount: s.correctCount,
        completedPerfectly: s.completedPerfectly
      };
    });
  },

  // Pays out finished weekly tournaments, every category (TR and _en).
  //   includeCurrentWeek: also pay this week's tournaments (used from Sunday
  //     23:00, before the week formally ends).
  //   weekIds: pay exactly these tournaments (manual/backfill runs), any age.
//   dryRun: compute the payout list only — no claim, no writes.
  // Without weekIds, tournaments that ended within the last 3 days and are
  // still unpaid are also picked up, so a restart during the payout hour
  // can't silently skip a week. Each tournament is claimed with an atomic
  // rewardsGiven flip first, so overlapping server instances can't pay twice.
  // Returns every paid entry in `winners` (rank 1-3 carry coins).
  giveWeeklyRewards: async ({ includeCurrentWeek = false, weekIds = null, dryRun = false } = {}) => {
    await connectDB();
    const now = new Date();
    let query;
    if (weekIds) {
      query = { rewardsGiven: false, weekId: { $in: weekIds } };
    } else {
      const or = [{ endDate: { $lt: now, $gte: new Date(now.getTime() - REWARD_CATCHUP_MS) } }];
      if (includeCurrentWeek) or.push({ weekId: { $in: WEEKLY_REWARD_CATEGORIES.map(c => getWeekId(c)) } });
      query = { rewardsGiven: false, $or: or };
    }

    const tournaments = await WeeklyTournament.find(query, { cards: 0 });
    const winners = [];
    for (const t of tournaments) {
      const category = t.weekId.replace(/^\d{4}-W\d{2}_/, '');
      if (!WEEKLY_REWARD_CATEGORIES.includes(category)) continue;

      const claimed = dryRun ? t : await WeeklyTournament.findOneAndUpdate(
        { _id: t._id, rewardsGiven: false },
        { $set: { rewardsGiven: true, categoryKpCredited: true } },
        { new: true, projection: { cards: 0 } }
      );
      if (!claimed) continue;

      // Score 0 (never answered anything) and hidden review accounts don't
      // count as participants, so they neither take a podium spot nor KP.
      const ranked = [...claimed.scores]
        .filter(s => s.bestScore > 0 && !LEADERBOARD_HIDDEN_USERNAMES_RE.test(s.username || ''))
        .sort((a, b) => b.bestScore - a.bestScore);

      const paidIds = [];
      for (let i = 0; i < ranked.length; i++) {
        const kp = WEEKLY_REWARD_KP[i] ?? WEEKLY_PARTICIPATION_KP;
        const coins = WEEKLY_REWARD_COINS[i] || 0; // coins only for top 3
        const inc = { kp, [`categoryKp.${category}`]: kp, [`tournamentKp.${category}`]: kp };
        if (coins) inc.coins = coins;
        try {
          const res = dryRun ? true : await Player.findOneAndUpdate({ id: ranked[i].playerId }, { $inc: inc });
          if (!res) { console.warn(`[Rewards] ${claimed.weekId}: player ${ranked[i].playerId} not found, skipped`); continue; }
          paidIds.push(ranked[i].playerId);
          winners.push({ weekId: claimed.weekId, category, playerId: ranked[i].playerId, username: ranked[i].username, rank: i + 1, score: ranked[i].bestScore, kp, coins });
        } catch (err) {
          console.error(`[Rewards] ${claimed.weekId}: failed to pay ${ranked[i].playerId}:`, err);
        }
      }

      if (paidIds.length && !dryRun) {
        await WeeklyTournament.updateOne(
          { _id: claimed._id },
          { $set: { 'scores.$[e].kpRewarded': true } },
          { arrayFilters: [{ 'e.playerId': { $in: paidIds } }] }
        );
      }
      console.log(`[Rewards] ${claimed.weekId}: paid ${paidIds.length} of ${claimed.scores.length} entries`);
    }
    return { success: true, rewarded: winners.length, winners };
  },

  // Push tokens for a set of player ids (weekly-reward notifications).
  getPushTokensByIds: async (ids) => {
    await connectDB();
    return await Player.find({ id: { $in: ids }, pushToken: { $ne: null } }, 'id username pushToken pushLanguage');
  },

  getIsConnected: () => {
    return isConnected;
  },

  // language: null/undefined/'all' = no filter (everyone with a token).
  // Accounts saved before pushLanguage existed have it as null and are only
  // included in the unfiltered case, not in either TR/EN-specific send.
  getPlayersWithPushTokens: async (language) => {
    await connectDB();
    const filter = { pushToken: { $ne: null } };
    if (language && language !== 'all') filter.pushLanguage = language;
    return await Player.find(filter, 'id username pushToken');
  },

  // Single-player lookup for the admin notify panel's "test send to just me"
  // option — same case-insensitive username match used at registration/login.
  getPlayerPushTokenByUsername: async (username) => {
    await connectDB();
    const player = await Player.findOne(
      { username: new RegExp(`^${escapeRegex(username.trim())}$`, 'i') },
      'id username pushToken'
    );
    return player || null;
  },

  getGuestPushTokens: async (language) => {
    await connectDB();
    const filter = (language && language !== 'all') ? { language } : {};
    const guests = await GuestToken.find(filter, 'token');
    return guests.map(g => g.token);
  },

  updatePushToken: async (playerId, token, language) => {
    await connectDB();
    const update = { pushToken: token };
    if (language) update.pushLanguage = language;
    await Player.findOneAndUpdate({ id: playerId }, update);
  },

  saveGuestPushToken: async (token, language) => {
    await connectDB();
    try {
      await GuestToken.findOneAndUpdate(
        { token },
        { token, ...(language ? { language } : {}) },
        { upsert: true }
      );
    } catch (e) {
      console.error('Error saving guest token:', e);
    }
  },

  // ─── AdMob Server-Side Verification (SSV) ──────────────────────────────
  // Stashes the exact coin amount a "watch ad to double it" reward is worth
  // for THIS player, keyed by playerId (not socket.data) so the SSV callback
  // — a stateless HTTP request from Google, unrelated to any live socket —
  // can still find and grant it after the match has ended.
  setPendingDoubleReward: async (playerId, amount) => {
    await connectDB();
    await Player.findOneAndUpdate(
      { id: playerId },
      { $set: { pendingDoubleReward: { amount, grantedAt: null } } }
    );
  },

  // Records an SSV transaction_id before granting anything. The unique index
  // on transactionId makes this atomically "claim or detect duplicate" — a
  // retried callback (Google retries up to 5x on non-200) hits the duplicate
  // key error and is safely treated as already-processed rather than
  // granting the reward twice.
  claimAdSsvTransaction: async (transactionId, playerId, rewardType) => {
    await connectDB();
    try {
      await AdSsvTransaction.create({ transactionId, playerId, rewardType });
      return true; // first time seeing this transaction — go ahead and grant
    } catch (e) {
      if (e && e.code === 11000) return false; // duplicate — already processed
      throw e;
    }
  },

  // Dispatches a verified SSV callback to the right grant function. Returns
  // a small result object for logging; never throws for "expected" failure
  // cases (player not found, nothing pending) since the HTTP handler must
  // still answer 200 to Google either way.
  grantSsvReward: async (playerId, rewardType, category = 'football') => {
    await connectDB();
    if (rewardType === 'market_coins') {
      return module.exports.grantAdCoinReward(playerId);
    }
    if (rewardType === 'tourney_attempt') {
      return module.exports.grantAdAttempt(playerId, category);
    }
    if (rewardType === 'double_coins') {
      const player = await findPlayerById(playerId);
      const amount = player?.pendingDoubleReward?.amount || 0;
      if (!player || !amount || player.pendingDoubleReward.grantedAt) {
        return { error: 'Katlanacak bekleyen bir ödül bulunamadı.' };
      }
      const updated = await Player.findOneAndUpdate(
        { _id: player._id, 'pendingDoubleReward.amount': amount, 'pendingDoubleReward.grantedAt': null },
        { $inc: { coins: amount }, $set: { 'pendingDoubleReward.grantedAt': new Date() } },
        { new: true }
      );
      if (!updated) return { error: 'Ödül zaten verilmiş.' };
      return { player: updated.toObject(), amount };
    }
    return { error: `Bilinmeyen ödül türü: ${rewardType}` };
  }
};

