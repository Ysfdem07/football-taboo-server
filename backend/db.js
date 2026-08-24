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
  matches_played: { type: Number, default: 0 },
  matches_won: { type: Number, default: 0 },
  correct_guesses: { type: Number, default: 0 },
  taboos: { type: Number, default: 0 },
  coins: { type: Number, default: 100 },
  adCoinRewards: {
    date: { type: String, default: '' },   // 'YYYY-MM-DD' of the last granted reward
    count: { type: Number, default: 0 }    // rewards granted that day
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
  kpRewarded:         { type: Boolean, default: false }
}, { _id: false });

const weeklyTournamentSchema = new mongoose.Schema({
  weekId:       { type: String, required: true, unique: true }, // "2026-W31"
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },
  cards:        { type: Array, required: true },  // [{ word, forbidden }] x20
  scores:       { type: [tournamentScoreSchema], default: [] },
  rewardsGiven: { type: Boolean, default: false }
}, {
  // bufferCommands: default true - allows queuing until connected
});

const WeeklyTournament = mongoose.model('WeeklyTournament', weeklyTournamentSchema);

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

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const findPlayerById = async (playerId) => {
  if (mongoose.isValidObjectId(playerId)) {
    const p = await Player.findById(playerId);
    if (p) return p;
  }
  return await Player.findOne({ id: playerId });
};

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

  registerPlayer: async (username, password, avatar, email, marketingConsent) => {
    await connectDB();
    const trimmedEmail = email && email.trim() ? email.trim() : null;
    const dupConditions = [{ username: new RegExp(`^${escapeRegex(username.trim())}$`, 'i') }];
    if (trimmedEmail) dupConditions.push({ email: new RegExp(`^${escapeRegex(trimmedEmail)}$`, 'i') });
    const existing = await Player.findOne({ $or: dupConditions });
    if (existing) return { error: 'Kullanıcı adı veya e-posta zaten kullanımda!' };

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
    const DAILY_AD_COIN_LIMIT = 5;
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
    if (category && ['football', 'cinema', 'music'].includes(category)) {
      const sortField = `categoryKp.${category}`;
      const players = await Player.find({})
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
    const players = await Player.find({})
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
    
    // Auto-create tournament if it doesn't exist (handles race condition where
    // initTournament may have run before loadWords completed)
    if (!tournament) {
      console.log(`[Tournament] No tournament found for ${weekId}, auto-creating...`);
      if (!wordList || wordList.length === 0) {
        console.error(`[Tournament] Cannot auto-create: wordList is empty for ${category}`);
        return { error: 'Turnuva hazırlanıyor, lütfen birazdan tekrar deneyin.' };
      }
      const shuffled = [...wordList].sort(() => Math.random() - 0.5);
      const cards = shuffled.slice(0, 20);
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

    // Her denemede farklı 20 kart için rastgele seçiyoruz ve ipucu sırasını karıştırıyoruz
    const shuffleArray = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffled = shuffleArray(wordList);
    const randomCardsForAttempt = shuffled.slice(0, 20).map(c => ({
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
      canPlayToday:       attemptsToday < 3, // Günlük limit: 3 hak
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

    const idx = tournament.scores.findIndex(s => s.playerId === playerId);
    if (idx >= 0) {
      const entry = tournament.scores[idx];
      // attempts'i 1 azaltarak kullanıcıya yeni bir hak kazandırıyoruz
      if (entry.attempts > 0) {
        entry.attempts -= 1;
      }
      await tournament.save();
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
    const top = [...tournament.scores]
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

  giveWeeklyRewards: async () => {
    await connectDB();
    let totalRewarded = 0;
    for (const category of ['football', 'cinema', 'music']) {
      const weekId = getWeekId(category);
      const tournament = await WeeklyTournament.findOne({ weekId });
      if (!tournament || tournament.rewardsGiven) continue;

      const sorted = [...tournament.scores].sort((a, b) => b.bestScore - a.bestScore);
      const kpMap = { 0: 400, 1: 200, 2: 100 };
      const coinMap = { 0: 500, 1: 250, 2: 100 };

      for (let i = 0; i < sorted.length; i++) {
        const kp = kpMap[i] ?? 15; // participation KP for rest
        const coins = coinMap[i]; // coin reward only for top 3
        const inc = coins ? { kp, coins } : { kp };
        await Player.findOneAndUpdate({ id: sorted[i].playerId }, { $inc: inc });
        sorted[i].kpRewarded = true;
      }

      tournament.rewardsGiven = true;
      await tournament.save();
      totalRewarded += sorted.length;
    }
    return { success: true, rewarded: totalRewarded };
  },

  getIsConnected: () => {
    return isConnected;
  },

  getPlayersWithPushTokens: async () => {
    await connectDB();
    return await Player.find({ pushToken: { $ne: null } }, 'id username pushToken');
  },

  getGuestPushTokens: async () => {
    await connectDB();
    const guests = await GuestToken.find({}, 'token');
    return guests.map(g => g.token);
  },

  updatePushToken: async (playerId, token) => {
    await connectDB();
    await Player.findOneAndUpdate({ id: playerId }, { pushToken: token });
  },

  saveGuestPushToken: async (token) => {
    await connectDB();
    try {
      await GuestToken.findOneAndUpdate(
        { token },
        { token },
        { upsert: true }
      );
    } catch (e) {
      console.error('Error saving guest token:', e);
    }
  }
};

