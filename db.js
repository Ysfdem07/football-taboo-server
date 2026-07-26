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
  taboos: { type: Number, default: 0 }
});

const Player = mongoose.model('Player', playerSchema);

module.exports = {
  connectDB,

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
      username: new RegExp(`^${username.trim()}$`, 'i'),
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
  }
};
