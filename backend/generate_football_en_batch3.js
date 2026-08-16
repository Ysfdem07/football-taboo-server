const xlsx = require('xlsx');
const path = require('path');

const newItems = [
  // 47 more top players/legends/clubs to reach 250
  ["Luis Suarez", "Bite", "Uruguay", "Striker", "Barcelona", "Liverpool", "Players", "Easy"],
  ["Gareth Southgate", "England", "Manager", "Waistcoat", "Penalty Miss", "Euro 2020", "Legends", "Medium"],
  ["Thibaut Courtois", "Goalkeeper", "Belgium", "Real Madrid", "Chelsea", "Tall", "Players", "Medium"],
  ["N'Golo Kante", "Smile", "Midfielder", "France", "Chelsea", "Leicester City", "Players", "Easy"],
  ["Paul Pogba", "Haircut", "Juventus", "Manchester United", "France", "Midfielder", "Players", "Medium"],
  ["Romelu Lukaku", "Striker", "Belgium", "Inter", "Chelsea", "Everton", "Players", "Medium"],
  ["Jan Oblak", "Goalkeeper", "Slovenia", "Atletico Madrid", "Saves", "Clean Sheet", "Players", "Hard"],
  ["Son Heung-min", "Tottenham", "South Korea", "Winger", "Puskas", "Bayer Leverkusen", "Players", "Easy"],
  ["Heung-min Son", "Tottenham", "South Korea", "Winger", "Harry Kane", "Captain", "Players", "Medium"],
  ["Ciro Immobile", "Striker", "Italy", "Lazio", "Golden Shoe", "Dortmund", "Players", "Hard"],
  ["Zlatan Ibrahimovic", "Lion", "Bicycle Kick", "Sweden", "AC Milan", "PSG", "Players", "Easy"],
  ["Gianluigi Donnarumma", "Goalkeeper", "Italy", "PSG", "AC Milan", "Euro 2020", "Players", "Medium"],
  ["Giorgio Chiellini", "Defender", "Italy", "Juventus", "Bite", "Captain", "Players", "Medium"],
  ["Leonardo Bonucci", "Defender", "Italy", "Juventus", "AC Milan", "Passing", "Players", "Medium"],
  ["Marco Verratti", "Midfielder", "Italy", "PSG", "Pescara", "Tackle", "Players", "Hard"],
  ["Riyad Mahrez", "Winger", "Algeria", "Leicester City", "Manchester City", "Left Foot", "Players", "Medium"],
  ["Raheem Sterling", "Winger", "England", "Manchester City", "Chelsea", "Liverpool", "Players", "Medium"],
  ["Jack Grealish", "Calves", "Aston Villa", "Manchester City", "England", "Midfielder", "Players", "Medium"],
  ["Trent Alexander-Arnold", "Right Back", "Liverpool", "Cross", "England", "Corner Taken Quickly", "Players", "Medium"],
  ["Andy Robertson", "Left Back", "Scotland", "Liverpool", "Hull City", "Cross", "Players", "Medium"],
  ["Alisson", "Goalkeeper", "Brazil", "Liverpool", "Roma", "Header Goal", "Players", "Medium"],
  ["Ederson", "Goalkeeper", "Brazil", "Manchester City", "Benfica", "Tattoos", "Players", "Medium"],
  ["Roberto Firmino", "No Look", "Teeth", "Striker", "Brazil", "Liverpool", "Players", "Medium"],
  ["Fabinho", "Midfielder", "Brazil", "Liverpool", "Monaco", "Bald", "Players", "Hard"],
  ["Casemiro", "Midfielder", "Brazil", "Real Madrid", "Manchester United", "Tackle", "Players", "Medium"],
  ["Eder Militao", "Defender", "Brazil", "Real Madrid", "Porto", "Pace", "Players", "Hard"],
  ["Rodrygo", "Winger", "Brazil", "Real Madrid", "Santos", "Champions League", "Players", "Medium"],
  ["Vinicius Junior", "Winger", "Brazil", "Real Madrid", "Flamengo", "Pace", "Players", "Easy"],
  ["Fede Valverde", "Midfielder", "Uruguay", "Real Madrid", "Pace", "Energy", "Players", "Medium"],
  ["Eduardo Camavinga", "Midfielder", "France", "Real Madrid", "Rennes", "Versatile", "Players", "Hard"],
  ["Aurelien Tchouameni", "Midfielder", "France", "Real Madrid", "Monaco", "Tackle", "Players", "Hard"],
  ["Pedri", "Midfielder", "Spain", "Barcelona", "Las Palmas", "Golden Boy", "Players", "Medium"],
  ["Gavi", "Midfielder", "Spain", "Barcelona", "La Masia", "Aggressive", "Players", "Medium"],
  ["Frenkie de Jong", "Midfielder", "Netherlands", "Barcelona", "Ajax", "Dribbling", "Players", "Medium"],
  ["Ronald Araujo", "Defender", "Uruguay", "Barcelona", "Pace", "Header", "Players", "Hard"],
  ["Marc-Andre ter Stegen", "Goalkeeper", "Germany", "Barcelona", "Gladbach", "Hair Transplant", "Players", "Medium"],
  ["Jamal Musiala", "Midfielder", "Germany", "Bayern Munich", "Bambi", "Dribbling", "Players", "Medium"],
  ["Florian Wirtz", "Midfielder", "Germany", "Bayer Leverkusen", "Assist", "Champion", "Players", "Medium"],
  ["Leroy Sane", "Winger", "Germany", "Bayern Munich", "Manchester City", "Left Foot", "Players", "Medium"],
  ["Serge Gnabry", "Winger", "Germany", "Bayern Munich", "Arsenal", "Chef Celebration", "Players", "Medium"],
  ["Leon Goretzka", "Midfielder", "Germany", "Bayern Munich", "Schalke", "Muscles", "Players", "Hard"],
  ["Joshua Kimmich", "Midfielder", "Germany", "Bayern Munich", "Right Back", "Cross", "Players", "Medium"],
  ["Alphonso Davies", "Left Back", "Canada", "Bayern Munich", "Pace", "Vancouver", "Players", "Medium"],
  ["Thomas Muller", "Forward", "Germany", "Bayern Munich", "Raumdeuter", "Assist", "Players", "Medium"],
  ["Manuel Neuer", "Goalkeeper", "Germany", "Bayern Munich", "Sweeper Keeper", "Schalke", "Players", "Easy"],
  ["Erling Haaland", "Robot", "Striker", "Norway", "Manchester City", "Dortmund", "Players", "Easy"],
  ["Martin Odegaard", "Captain", "Midfielder", "Norway", "Arsenal", "Real Madrid", "Players", "Medium"]
];

const existingFile = path.join("C:\\\\Users\\\\ysfde\\\\OneDrive\\\\Desktop", 'football_en.xlsx');
const wb = xlsx.readFile(existingFile);
const ws = wb.Sheets["Football"];

const existingData = xlsx.utils.sheet_to_json(ws, {header: 1});
const combinedData = existingData.concat(newItems);

const newWs = xlsx.utils.aoa_to_sheet(combinedData);
newWs['!cols'] = ws['!cols'];
wb.Sheets["Football"] = newWs;

try {
  xlsx.writeFile(wb, existingFile);
  console.log('Successfully appended! Total rows: ' + combinedData.length);
} catch (e) {
  console.error(e);
}
