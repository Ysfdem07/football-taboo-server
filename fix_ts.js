
const fs = require('fs');

// 1. TournamentScreen
let ts = fs.readFileSync('src/screens/TournamentScreen.tsx', 'utf8');
if (!ts.includes('const route = useRoute')) {
  ts = ts.replace('const navigation = useNavigation<Nav>();', 'const navigation = useNavigation<Nav>();\n  const route = require(\'@react-navigation/native\').useRoute<any>();');
}
fs.writeFileSync('src/screens/TournamentScreen.tsx', ts);

// 2. RoomLobbyScreen
let rl = fs.readFileSync('src/screens/RoomLobbyScreen.tsx', 'utf8');
rl = rl.replace(/navigation\.navigate\('OnlineGame', \{ roomId \}\);/g, 'navigation.navigate(\'OnlineGame\', { roomId, categoryId: route.params?.categoryId || \'football\' });');
fs.writeFileSync('src/screens/RoomLobbyScreen.tsx', rl);

console.log('Done TS fixes!');

