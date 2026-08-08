
const fs = require('fs');

let rl = fs.readFileSync('src/screens/RoomLobbyScreen.tsx', 'utf8');
rl = rl.replace(/navigation\.navigate\('OnlineGame', \{ roomId \}\);/g, 'navigation.navigate(\'OnlineGame\', { roomId, categoryId: route.params?.categoryId || \'football\' });');
fs.writeFileSync('src/screens/RoomLobbyScreen.tsx', rl);

let tg = fs.readFileSync('src/screens/TournamentGameScreen.tsx', 'utf8');
tg = tg.replace(/navigation\.navigate\('Home'\);/g, 'navigation.navigate(\'Home\' as any);');
fs.writeFileSync('src/screens/TournamentGameScreen.tsx', tg);

let ts = fs.readFileSync('src/screens/TournamentScreen.tsx', 'utf8');
ts = ts.replace(/const route = require\('@react-navigation\/native'\)\.useRoute<any>\(\);/g, 'const route = require(\'@react-navigation/native\').useRoute();');
fs.writeFileSync('src/screens/TournamentScreen.tsx', ts);

console.log('Fixed lobby');

