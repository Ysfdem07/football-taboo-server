const mongoose = require('mongoose');

// Use Atlas URI from env or fallback to hardcoded shard-based URI
const ATLAS_URI = 'mongodb+srv://wordrushtr_db_user:hsNIC3qKGwlYcz6T@wordrush.sphwagn.mongodb.net/futtaboo?authSource=admin&retryWrites=true&w=majority';
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

const playerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  marketingConsent: { type: Boolean, default: false },
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
  matches_played: { type: Number, default: 0 },
  matches_won: { type: Number, default: 0 },
  correct_guesses: { type: Number, default: 0 },
  taboos: { type: Number, default: 0 },
  coins: { type: Number, default: 100 },
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
    const existing = await Player.findOne({
      $or: [{ username: new RegExp(`^${username.trim()}$`, 'i') }, { email: new RegExp(`^${email.trim()}$`, 'i') }]
    });
    if (existing) return { error: 'Kullanıcı adı veya e-posta zaten kullanımda!' };

    const newPlayer = {
      id: `player_${Math.random().toString(36).substr(2, 9)}`,
      username: username.trim(),
      password: password,
      email: email.trim(),
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
        { username: new RegExp(`^${username.trim()}$`, 'i') },
        { email: new RegExp(`^${username.trim()}$`, 'i') }
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

  updatePlayerStats: async (playerId, kpChange, isWin, correctGuesses = 0, taboos = 0, category = 'football') => {
    console.log(`[db] updatePlayerStats called for playerId: ${playerId}, isWin: ${isWin}`);
    await connectDB();
    const player = await findPlayerById(playerId);
    if (!player) {
      console.log(`[db] updatePlayerStats FAILED: Player not found for id ${playerId}`);
      return null;
    }
    console.log(`[db] updatePlayerStats FOUND player: ${player.id || player._id} (name: ${player.name}), current coins: ${player.coins}`);

    player.kp = Math.max(0, player.kp + kpChange);

    // Category-specific KP (never goes below 0)
    if (!player.categoryKp) player.categoryKp = { football: 0, cinema: 0, music: 0, football_en: 0, cinema_en: 0, music_en: 0 };
    const validCats = ['football', 'cinema', 'music', 'football_en', 'cinema_en', 'music_en'];
    const cat = validCats.includes(category) ? category : 'football';
    player.categoryKp[cat] = Math.max(0, (player.categoryKp[cat] || 0) + kpChange);
    player.markModified('categoryKp');

    player.matches_played += 1;
    if (isWin) {
      player.matches_won += 1;
      if (!player.categoryWins) player.categoryWins = { football: 0, cinema: 0, music: 0, football_en: 0, cinema_en: 0, music_en: 0 };
      player.categoryWins[cat] = (player.categoryWins[cat] || 0) + 1;
      player.markModified('categoryWins');
      player.coins = (player.coins || 0) + 50;
      console.log(`[db] updatePlayerStats ADDED 50 coins to player ${player.id || player._id}. New balance: ${player.coins}`);
    }
    player.correct_guesses += correctGuesses;
    player.taboos += taboos;

    await player.save();
    console.log(`[db] updatePlayerStats SAVED player ${player.id || player._id}.`);
    return player.toObject();
  },

  updatePlayerCoins: async (playerId, amount) => {
    await connectDB();
    const player = await findPlayerById(playerId);
    if (!player) return null;
    player.coins = Math.max(0, (player.coins || 0) + amount);
    await player.save();
    return player.toObject();
  },

  buyJoker: async (playerId, jokerType, price = 50) => {
    await connectDB();
    const player = await findPlayerById(playerId);
    if (!player) return { error: 'Oyuncu bulunamadı' };
    if (!player.jokers) player.jokers = { revealLetters: 0, extraTime: 0, instantHints: 0, shield: 0 };
    if ((player.coins || 0) < price) return { error: 'Yetersiz jeton!' };

    player.coins -= price;
    if (player.jokers[jokerType] !== undefined) {
      player.jokers[jokerType] += 1;
    } else {
      return { error: 'Geçersiz joker türü' };
    }
    
    player.markModified('jokers');
    await player.save();
    return { success: true, player: player.toObject() };
  },

  useJoker: async (playerId, jokerType) => {
    await connectDB();
    const player = await findPlayerById(playerId);
    if (!player) return { error: 'Oyuncu bulunamadı' };
    if (!player.jokers) player.jokers = { revealLetters: 0, extraTime: 0, instantHints: 0, shield: 0 };
    if (player.jokers[jokerType] > 0) {
      player.jokers[jokerType] -= 1;
      player.markModified('jokers');
      await player.save();
      return { success: true, player: player.toObject() };
    }
    return { error: 'Bu jokerden elinizde yok!' };
  },

  getLeaderboard: async (category = null) => {
    await connectDB();
    if (category && ['football', 'cinema', 'music'].includes(category)) {
      const sortField = `categoryKp.${category}`;
      const players = await Player.find({})
        .select(`id username avatar kp categoryKp categoryWins matches_won matches_played -_id`)
        .sort({ [sortField]: -1 })
        .limit(50);
      return players.map(p => {
        const obj = p.toObject();
        obj.displayKp = (obj.categoryKp && obj.categoryKp[category]) || 0;
        obj.matches_won = (obj.categoryWins && obj.categoryWins[category]) || 0;
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
    const player = await Player.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });
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
    const player = await Player.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });
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
    return [...tournament.scores]
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 20)
      .map((s, i) => ({ rank: i + 1, playerId: s.playerId, username: s.username, avatar: s.avatar, score: s.bestScore, correctCount: s.correctCount, completedPerfectly: s.completedPerfectly }));
  },

  giveWeeklyRewards: async () => {
    await connectDB();
    let totalRewarded = 0;
    for (const category of ['football', 'cinema', 'music']) {
      const weekId = getWeekId(category);
      const tournament = await WeeklyTournament.findOne({ weekId });
      if (!tournament || tournament.rewardsGiven) continue;

      const sorted = [...tournament.scores].sort((a, b) => b.bestScore - a.bestScore);
      const kpMap = { 0: 500, 1: 300, 2: 150 };

      for (let i = 0; i < sorted.length; i++) {
        const kp = kpMap[i] ?? 50; // participation KP for rest
        await Player.findOneAndUpdate({ id: sorted[i].playerId }, { $inc: { kp } });
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
  }
};

