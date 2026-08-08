
const fs = require('fs');

let content = fs.readFileSync('src/screens/OnlineLobbyScreen.tsx', 'utf8');
content = content.replace(/\{ navigation, route \}: Props/, '{ navigation, route }: any');
fs.writeFileSync('src/screens/OnlineLobbyScreen.tsx', content);

console.log('Fixed Props error');

