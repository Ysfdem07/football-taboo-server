
const fs = require('fs');

let nav = fs.readFileSync('src/navigation/AppNavigator.tsx', 'utf8');
nav = nav.replace(/Settings: undefined;/g, 'Settings: { categoryId?: string };');
nav = nav.replace(/OnlineLobby: undefined;/g, 'OnlineLobby: { categoryId?: string };');
nav = nav.replace(/RoomLobby: \{ roomId: string, roomCode: string, isHost: boolean \};/g, 'RoomLobby: { roomId: string, roomCode: string, isHost: boolean, categoryId?: string };');
nav = nav.replace(/OnlineGame: \{ roomId: string \};/g, 'OnlineGame: { roomId: string, categoryId?: string };');
fs.writeFileSync('src/navigation/AppNavigator.tsx', nav);

console.log('Fixed AppNavigator');

