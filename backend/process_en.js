const fs = require('fs');

const csvPath = 'C:/Dev/FootballTaboo/assets/data/cards_en_new.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');

const lines = csvContent.split('\n').filter(l => l.trim() !== '');
const headers = lines[0].split(',').map(h => h.trim());

const difficultyMap = {
  'Rookie': 1,
  'Easy': 2,
  'Medium': 3,
  'Hard': 4,
  'Expert': 5
};

const cards = [];
const clues = [];
let clueIdCounter = 1;

for (let i = 1; i < lines.length; i++) {
  // Simple regex to split CSV line, handling quotes
  const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
  if (row.length < headers.length) continue;

  const entityId = row[0].replace(/^"|"$/g, '').trim();
  const answer = row[1].replace(/^"|"$/g, '').trim();
  
  const wideCluePool = [];
  for (let c = 2; c <= 6; c++) {
    if (row[c] && row[c].replace(/^"|"$/g, '').trim() !== '') {
      const clueText = row[c].replace(/^"|"$/g, '').trim();
      wideCluePool.push(clueText);
      
      clues.push({
        clueId: 'CE' + String(clueIdCounter++).padStart(6, '0'),
        entityId: entityId,
        text: clueText,
        type: "Feature",
        strength: Math.floor(Math.random() * 2) + 2,
        isTop5: true
      });
    }
  }

  const difficulty = row[7] ? row[7].replace(/^"|"$/g, '').trim() : 'Medium';
  const difficultyScore = difficultyMap[difficulty] || 3;

  cards.push({
    entityId,
    answer,
    category: "Football",
    difficulty,
    difficultyScore,
    wideCluePool
  });
}

fs.writeFileSync('C:/Dev/FootballTaboo/assets/data/cards_en.json', JSON.stringify(cards, null, 2), 'utf8');
fs.writeFileSync('C:/Dev/FootballTaboo/assets/data/clues_en.json', JSON.stringify(clues, null, 2), 'utf8');

console.log('Generated ' + cards.length + ' cards and ' + clues.length + ' clues!');
