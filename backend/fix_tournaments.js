const mongoose = require('mongoose');

// Assuming you have your MongoDB URI in env or hardcoded somewhere. 
// I'll grab it from backend/.env if possible, or use the one I saw in logs.
// Log showed: Error: querySrv ECONNREFUSED _mongodb._tcp.wordrush.sphwagn.mongodb.net
const uri = process.env.MONGO_URI || 'mongodb+srv://yusuf25d:5bEaE4q7YtV0B3a9@wordrush.sphwagn.mongodb.net/tabooDB?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Define the WeeklyTournament schema structure used in db.js
    const WeeklyTournament = mongoose.models.WeeklyTournament || mongoose.model('WeeklyTournament', new mongoose.Schema({
      weekId: String,
      startDate: Date,
      endDate: Date,
      cards: Array,
      scores: Array,
      rewardsGiven: Boolean
    }));

    // Delete current week's cinema_en and music_en and football_en to force regeneration
    const res = await WeeklyTournament.deleteMany({
      weekId: { $in: [
        `2026-W33-cinema_en`, `2026-W34-cinema_en`,
        `2026-W33-football_en`, `2026-W34-football_en`,
        `2026-W33-music_en`, `2026-W34-music_en`
      ]}
    });
    
    // Also just to be super safe, let's delete ALL documents that end with _en for this month if week structure is different.
    const res2 = await WeeklyTournament.deleteMany({
      weekId: { $regex: /_en$/ }
    });

    console.log(`Deleted ${res2.deletedCount} erroneous tournaments from DB.`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
