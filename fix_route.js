
const fs = require('fs');

function addRoute(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/export default function \w+\(\{ navigation \}: any\) \{/, match => match.replace('{ navigation }', '{ navigation, route }'));
  fs.writeFileSync(file, content);
}

addRoute('src/screens/OnlineLobbyScreen.tsx');
addRoute('src/screens/RoomLobbyScreen.tsx');
addRoute('src/screens/OnlineGameScreen.tsx');
console.log('Added route to props');

