const fs = require('fs');
const xlsx = require('xlsx');

const data = JSON.parse(fs.readFileSync('C:/Dev/FootballTaboo/assets/data/cards.json', 'utf8'));

const categoryMap = {
  'Futbolcu': 'Player',
  'Kulüp': 'Club',
  'Futbol Terimi': 'Football Term',
  'Turnuva / Lig': 'Tournament / League',
  'Stadyum': 'Stadium'
};

const exactClueMap = {
  'Stoper': 'Center Back',
  'Santrfor': 'Striker',
  'Merkez Orta Saha': 'Central Midfielder',
  'Ön Libero': 'Defensive Midfielder',
  'Ofansif Orta Saha': 'Attacking Midfielder',
  'Sol Kanat': 'Left Winger',
  'Sağ Kanat': 'Right Winger',
  'Sağ Bek': 'Right Back',
  'Sol Bek': 'Left Back',
  'Kaleci': 'Goalkeeper',
  'Taktik': 'Tactics',
  'Teknik': 'Technique',
  'Maç içi': 'In-game',
  'Futbol dili': 'Football Language',
  'Saha': 'Pitch',
  'Pozisyon': 'Position',
  'Oyun planı': 'Game Plan',
  'Eleme': 'Knockout',
  'Final': 'Final',
  'Kupa': 'Cup',
  'Futbol organizasyonu': 'Football Organization',
  'Şampiyon': 'Champion',
  'Takımlar': 'Teams',
  'Sezon': 'Season',
  'Taraftar': 'Fans',
  'Tribün': 'Stands',
  'Ev sahibi': 'Home Team',
  'Futbol sahası': 'Football Pitch',
  'Maç günü': 'Matchday',
  'Şehir': 'City',
  'Kapasite': 'Capacity',
  'Kulüp': 'Club',
  'Turnuva': 'Tournament',
  'Türkiye': 'Turkey',
  'Santrfor oyuncusu': 'Striker',
  'Sağ kanat oyuncusu': 'Right Winger',
  'Sol kanat oyuncusu': 'Left Winger'
};

function translateClue(clue) {
  if (exactClueMap[clue]) return exactClueMap[clue];
  let match = clue.match(/^(\d{4})\sdoğumlu$/);
  if (match) return `Born in ${match[1]}`;
  match = clue.match(/^(.+?)\skulübü\s(\d+)$/);
  if (match) return `Club from ${match[1]}`;
  return clue;
}

const rows = data.map(card => {
  const row = {
    EntityID: card.entityId,
    Answer: card.answer,
    Category: categoryMap[card.category] || card.category,
    Difficulty: card.difficulty,
    DifficultyScore: card.difficultyScore
  };

  card.wideCluePool.forEach((clue, idx) => {
    row[`Clue_${idx + 1}`] = translateClue(clue);
  });

  return row;
});

const worksheet = xlsx.utils.json_to_sheet(rows);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'English Database');

xlsx.writeFile(workbook, 'C:/Users/ysfde/.gemini/antigravity/brain/13653dc5-97b5-40f9-960f-c3523139db17/cards_en.xlsx');
console.log('XLSX created!');
