// Script to ensure each entity in clues.json has exactly 5 clues with isTop5=true (first 5 occurrences)
const fs = require('fs');
const path = 'C:/Users/ysfde/OneDrive/Desktop/AntiGravity App/FootballTaboo/assets/data/clues.json';
let clues = JSON.parse(fs.readFileSync(path, 'utf8'));
// Group by entityId preserving order
const grouped = {};
clues.forEach((c, idx) => {
  if (!grouped[c.entityId]) grouped[c.entityId] = [];
  grouped[c.entityId].push({clue: c, index: idx});
});
// Reset all isTop5 to false first
clues.forEach(c => c.isTop5 = false);
// Set first 5 per entity to true
Object.values(grouped).forEach(arr => {
  for (let i = 0; i < Math.min(5, arr.length); i++) {
    arr[i].clue.isTop5 = true;
  }
});
// Write back
fs.writeFileSync(path, JSON.stringify(clues, null, 2), 'utf8');
console.log('Top5 flags updated for each entity.');
