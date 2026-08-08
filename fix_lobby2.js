
const fs = require('fs');

let ol = fs.readFileSync('src/screens/OnlineLobbyScreen.tsx', 'utf8');
ol = ol.replace(/navigation\.navigate\('OnlineGame', \{ roomId: data\.roomId \}\);/g, 'navigation.navigate(\'OnlineGame\', { roomId: data.roomId, categoryId: route.params?.categoryId || \'football\' });');
fs.writeFileSync('src/screens/OnlineLobbyScreen.tsx', ol);

console.log('Fixed OnlineLobbyScreen');

