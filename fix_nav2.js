const fs = require('fs');

let nav = fs.readFileSync('src/navigation/AppNavigator.tsx', 'utf8');

if (!nav.includes('CategoryMenuScreen')) {
  nav = nav.replace(/import TournamentGameScreen/g, 'import CategoryMenuScreen from \'../screens/CategoryMenuScreen\';\nimport TournamentGameScreen');
  nav = nav.replace(/TournamentGame: /g, 'CategoryMenu: { categoryId: string };\n  TournamentGame: ');
  nav = nav.replace(/<Stack\.Screen name="Settings"/g, '<Stack.Screen name="CategoryMenu" component={CategoryMenuScreen} />\n          <Stack.Screen name="Settings"');
  fs.writeFileSync('src/navigation/AppNavigator.tsx', nav);
  console.log('Added CategoryMenu to AppNavigator');
} else {
  console.log('CategoryMenu already in AppNavigator');
}
