const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/futtaboo';

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
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
  matches_played: { type: Number, default: 0 },
  matches_won: { type: Number, default: 0 },
  correct_guesses: { type: Number, default: 0 },
  taboos: { type: Number, default: 0 },
  resetCode: { type: String, default: null },
  resetExpires: { type: Date, default: null }
});

const Player = mongoose.model('Player', playerSchema);

const systemLogSchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
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
});

const WeeklyTournament = mongoose.model('WeeklyTournament', weeklyTournamentSchema);

// Get ISO week string e.g. "2026-W31"
function getWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
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
    const existing = await Player.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (existing) return { error: 'Bu kullanıcı adı zaten alınmış!' };

    if (!email || !email.trim()) return { error: 'E-posta adresi gereklidir!' };
    const existingEmail = await Player.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });
    if (existingEmail) return { error: 'Bu e-posta adresi zaten kullanımda!' };

    const newPlayer = {
      id: 'player_' + Math.random().toString(36).substr(2, 9),
      username: username.trim(),
      password: password,
      avatar: avatar || '⚽',
      email: email.trim(),
      marketingConsent: !!marketingConsent,
      kp: 0,
      matches_played: 0,
      matches_won: 0,
      correct_guesses: 0,
      taboos: 0
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

  updatePlayerStats: async (playerId, kpChange, isWin, correctGuesses = 0, taboos = 0) => {
    await connectDB();
    const player = await Player.findOne({ id: playerId });
    if (!player) return null;

    player.kp = Math.max(0, player.kp + kpChange);
    player.matches_played += 1;
    if (isWin) player.matches_won += 1;
    player.correct_guesses += correctGuesses;
    player.taboos += taboos;

    await player.save();
    return player.toObject();
  },

  getLeaderboard: async () => {
    await connectDB();
    const players = await Player.find({})
      .select('id username avatar kp matches_won matches_played -_id')
      .sort({ kp: -1 })
      .limit(50);
    return players.map(p => p.toObject());
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

  // ─── Weekly Tournament Functions ─────────────────────────────────────────

  ensureWeeklyTournament: async (wordList) => {
    await connectDB();
    const weekId = getWeekId();
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
  },

  getWeeklyTournament: async (playerId, wordList) => {
    await connectDB();
    const weekId = getWeekId();
    const tournament = await WeeklyTournament.findOne({ weekId });
    if (!tournament) return { error: 'Turnuva henüz başlamadı' };

    const today = getTodayString();
    const myEntry = tournament.scores.find(s => s.playerId === playerId);

    // Her denemede farklı 20 kart için rastgele seçiyoruz
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    const randomCardsForAttempt = shuffled.slice(0, 20);

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

  submitTournamentScore: async (playerId, username, avatar, score, correctCount) => {
    await connectDB();
    const weekId = getWeekId();
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

  grantAdAttempt: async (playerId) => {
    await connectDB();
    const weekId = getWeekId();
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
    const rawWords = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8'));
    return module.exports.getWeeklyTournament(playerId, rawWords);
  },

  getTournamentLeaderboard: async () => {
    await connectDB();
    const weekId = getWeekId();
    const tournament = await WeeklyTournament.findOne({ weekId });
    if (!tournament) return [];
    return [...tournament.scores]
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 20)
      .map((s, i) => ({ rank: i + 1, playerId: s.playerId, username: s.username, avatar: s.avatar, score: s.bestScore, correctCount: s.correctCount, completedPerfectly: s.completedPerfectly }));
  },

  giveWeeklyRewards: async () => {
    await connectDB();
    const weekId = getWeekId();
    const tournament = await WeeklyTournament.findOne({ weekId });
    if (!tournament || tournament.rewardsGiven) return { skipped: true };

    const sorted = [...tournament.scores].sort((a, b) => b.bestScore - a.bestScore);
    const kpMap = { 0: 500, 1: 300, 2: 150 };

    for (let i = 0; i < sorted.length; i++) {
      const kp = kpMap[i] ?? 50; // participation KP for rest
      await Player.findOneAndUpdate({ id: sorted[i].playerId }, { $inc: { kp } });
      sorted[i].kpRewarded = true;
    }

    tournament.rewardsGiven = true;
    await tournament.save();
    return { success: true, rewarded: sorted.length };
  }
};

