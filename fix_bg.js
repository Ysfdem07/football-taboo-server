
const fs = require('fs');

let ol = fs.readFileSync('src/screens/OnlineLobbyScreen.tsx', 'utf8');
ol = ol.replace(/BG\.football/g, 'BG[(route.params?.categoryId || \'football\') as keyof typeof BG] || BG.football');
fs.writeFileSync('src/screens/OnlineLobbyScreen.tsx', ol);

let rl = fs.readFileSync('src/screens/RoomLobbyScreen.tsx', 'utf8');
rl = rl.replace(/BG\.football/g, 'BG[(route.params?.categoryId || \'football\') as keyof typeof BG] || BG.football');
fs.writeFileSync('src/screens/RoomLobbyScreen.tsx', rl);

let og = fs.readFileSync('src/screens/OnlineGameScreen.tsx', 'utf8');
og = og.replace(/BG\.football/g, 'BG[(route.params?.categoryId || \'football\') as keyof typeof BG] || BG.football');
fs.writeFileSync('src/screens/OnlineGameScreen.tsx', og);

console.log('Fixed BGs based on 3:57 layout');

