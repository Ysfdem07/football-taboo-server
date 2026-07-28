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
  }
};
