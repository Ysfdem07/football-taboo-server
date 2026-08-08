
const fs = require('fs');

let rl = fs.readFileSync('src/screens/RoomLobbyScreen.tsx', 'utf8');
rl = rl.replace(/navigation\.replace\('OnlineGame', \{ roomId \}\);/g, 'navigation.replace(\'OnlineGame\', { roomId, categoryId: route.params?.categoryId || \'football\' });');
fs.writeFileSync('src/screens/RoomLobbyScreen.tsx', rl);

let ol = fs.readFileSync('src/screens/OnlineLobbyScreen.tsx', 'utf8');
ol = ol.replace(/navigation\.navigate\('OnlineGame', \{ roomId: data\.roomId \}\);/g, 'navigation.navigate(\'OnlineGame\', { roomId: data.roomId, categoryId: route.params?.categoryId || \'football\' });');
fs.writeFileSync('src/screens/OnlineLobbyScreen.tsx', ol);

console.log('Fixed OnlineGame navigation args');

