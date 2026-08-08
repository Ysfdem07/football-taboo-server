
const fs = require('fs');

let content = fs.readFileSync('src/screens/OnlineLobbyScreen.tsx', 'utf8');
content = content.replace(/export default function \w+\(\{ navigation \}: Props\) \{/, match => match.replace('{ navigation }', '{ navigation, route }'));
fs.writeFileSync('src/screens/OnlineLobbyScreen.tsx', content);

console.log('Added route to props correctly');

