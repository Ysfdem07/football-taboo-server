
const fs = require('fs');
let hs = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');
hs = hs.replace(/'CategoryMenu'/g, '\'OnlineLobby\'');
fs.writeFileSync('src/screens/HomeScreen.tsx', hs);
console.log('Fixed HomeScreen navigation');

