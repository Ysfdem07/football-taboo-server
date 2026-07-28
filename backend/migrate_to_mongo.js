const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://wordrushtr_db_user:hsNIc3qKGwlYcz6T@ac-gnsx3ie-shard-00-00.sphwagn.mongodb.net:27017,ac-gnsx3ie-shard-00-01.sphwagn.mongodb.net:27017,ac-gnsx3ie-shard-00-02.sphwagn.mongodb.net:27017/futtaboo?ssl=true&replicaSet=atlas-l1s7pw-shard-0&authSource=admin&retryWrites=true&w=majority';

const playerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '⚽' },
  kp: { type: Number, default: 0 },
  matches_played: { type: Number, default: 0 },
  matches_won: { type: Number, default: 0 },
  correct_guesses: { type: Number, default: 0 },
  taboos: { type: Number, default: 0 }
});

const Player = mongoose.model('Player', playerSchema);

const existingPlayers = [
  {
    id: 'player_d2qebyx51',
    username: 'Lionel Yusuf',
    password: 'Ysfdem88',
    avatar: '🦅',
    kp: 0,
    matches_played: 9,
    matches_won: 2,
    correct_guesses: 0,
    taboos: 0
  },
  {
    id: 'player_7j9cehjaz',
    username: 'toledo7',
    password: 'Kaandikbasan1',
    avatar: '⚽',
    kp: 275,
    matches_played: 10,
    matches_won: 7,
    correct_guesses: 0,
    taboos: 0
  }
];

async function migrate() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, { family: 4 });
    console.log('Connected!');

    for (const p of existingPlayers) {
      const exists = await Player.findOne({ id: p.id });
      if (exists) {
        console.log(`Player "${p.username}" already exists, updating stats...`);
        await Player.updateOne({ id: p.id }, p);
      } else {
        await Player.create(p);
        console.log(`Player "${p.username}" migrated successfully.`);
      }
    }

    const all = await Player.find({}).select('-_id -__v');
    console.log('\n✅ Database contents:');
    console.log(JSON.stringify(all, null, 2));

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
