
const fs = require('fs');
let tg = fs.readFileSync('src/screens/TournamentGameScreen.tsx', 'utf8');
tg = tg.replace(/navigation\.navigate\('Tournament'\)/g, 'navigation.navigate(\'Tournament\', { categoryId: \'football\' })');
fs.writeFileSync('src/screens/TournamentGameScreen.tsx', tg);
console.log('Fixed TournamentGameScreen');

