const xlsx = require('xlsx');
const path = require('path');

const newItems = [
  // 125 more football entries
  
  // Legendary Players (Various Eras)
  ["Andriy Shevchenko", "Striker", "Ukraine", "AC Milan", "Chelsea", "Ballon dOr", "Legends", "Medium"],
  ["Rui Costa", "Midfielder", "Portugal", "AC Milan", "Fiorentina", "Passing", "Legends", "Hard"],
  ["Alessandro Nesta", "Defender", "Italy", "AC Milan", "Lazio", "Tackle", "Legends", "Medium"],
  ["Cafu", "Right Back", "Brazil", "AC Milan", "Roma", "World Cup", "Legends", "Easy"],
  ["Dida", "Goalkeeper", "Brazil", "AC Milan", "Penalty Save", "Champions League", "Legends", "Medium"],
  ["Gennaro Gattuso", "Midfielder", "Italy", "AC Milan", "Aggressive", "Pitbull", "Legends", "Medium"],
  ["Filippo Inzaghi", "Striker", "Italy", "AC Milan", "Offside", "Pippo", "Legends", "Medium"],
  ["Clarence Seedorf", "Midfielder", "Netherlands", "AC Milan", "Real Madrid", "Champions League", "Legends", "Hard"],
  ["Edgar Davids", "Glasses", "Midfielder", "Netherlands", "Juventus", "Pitbull", "Legends", "Easy"],
  ["Alessandro Del Piero", "Forward", "Italy", "Juventus", "Captain", "Free Kick", "Legends", "Medium"],
  ["David Trezeguet", "Striker", "France", "Juventus", "Euro 2000", "Golden Goal", "Legends", "Hard"],
  ["Gabriel Batistuta", "Batigol", "Striker", "Argentina", "Fiorentina", "Roma", "Legends", "Medium"],
  ["Hernan Crespo", "Striker", "Argentina", "Parma", "Lazio", "Chelsea", "Legends", "Medium"],
  ["Juan Sebastian Veron", "Midfielder", "Argentina", "Lazio", "Manchester United", "Bald", "Legends", "Hard"],
  ["Javier Zanetti", "Tractor", "Defender", "Argentina", "Inter Milan", "Captain", "Legends", "Easy"],
  ["Esteban Cambiasso", "Midfielder", "Argentina", "Inter Milan", "Real Madrid", "Bald", "Legends", "Medium"],
  ["Diego Milito", "Striker", "Argentina", "Inter Milan", "Champions League", "Treble", "Legends", "Medium"],
  ["Dejan Stankovic", "Midfielder", "Serbia", "Inter Milan", "Lazio", "Long Shot", "Legends", "Hard"],
  ["Maicon", "Right Back", "Brazil", "Inter Milan", "Gareth Bale", "Pace", "Legends", "Medium"],
  ["Julio Cesar", "Goalkeeper", "Brazil", "Inter Milan", "QPR", "Treble", "Legends", "Medium"],
  ["Wesley Sneijder", "Midfielder", "Netherlands", "Galatasaray", "Inter Milan", "Real Madrid", "Legends", "Easy"],
  ["Samuel Eto'o", "Striker", "Cameroon", "Barcelona", "Inter Milan", "Chelsea", "Legends", "Easy"],
  ["Carles Puyol", "Defender", "Spain", "Barcelona", "Captain", "Hair", "Legends", "Easy"],
  ["Victor Valdes", "Goalkeeper", "Spain", "Barcelona", "Middlesbrough", "Bald", "Legends", "Medium"],
  ["Dani Alves", "Right Back", "Brazil", "Barcelona", "Juventus", "PSG", "Legends", "Easy"],
  ["Javier Mascherano", "Defender", "Argentina", "Barcelona", "Liverpool", "Tackle", "Legends", "Medium"],
  ["David Villa", "Striker", "Spain", "Barcelona", "Valencia", "World Cup", "Legends", "Medium"],
  ["Pedro", "Winger", "Spain", "Barcelona", "Chelsea", "Two Footed", "Players", "Medium"],
  ["Iker Casillas", "Goalkeeper", "Spain", "Real Madrid", "Porto", "Captain", "Legends", "Easy"],
  ["Sergio Ramos", "Defender", "Spain", "Real Madrid", "Red Card", "92:48", "Players", "Easy"],
  ["Pepe", "Defender", "Portugal", "Real Madrid", "Porto", "Aggressive", "Players", "Easy"],
  ["Marcelo", "Left Back", "Brazil", "Real Madrid", "Fluminense", "Skills", "Players", "Easy"],
  ["Xabi Alonso", "Midfielder", "Spain", "Real Madrid", "Liverpool", "Bayern Munich", "Legends", "Medium"],
  ["Angel Di Maria", "Winger", "Argentina", "Real Madrid", "PSG", "Heart Celebration", "Players", "Easy"],
  ["Gonzalo Higuain", "Striker", "Argentina", "Real Madrid", "Napoli", "Juventus", "Legends", "Medium"],
  ["Mesut Ozil", "Midfielder", "Germany", "Real Madrid", "Arsenal", "Assist", "Legends", "Easy"],
  ["Gareth Bale", "Winger", "Wales", "Real Madrid", "Tottenham", "Bicycle Kick", "Legends", "Easy"],
  ["Ashley Cole", "Left Back", "England", "Chelsea", "Arsenal", "Roma", "Legends", "Medium"],
  ["John Terry", "Defender", "England", "Chelsea", "Captain", "Slip", "Legends", "Medium"],
  ["Frank Lampard", "Midfielder", "England", "Chelsea", "Manager", "Goals", "Legends", "Easy"],
  ["Didier Drogba", "Striker", "Ivory Coast", "Chelsea", "Galatasaray", "Champions League", "Legends", "Easy"],
  ["Petr Cech", "Goalkeeper", "Czech Republic", "Chelsea", "Arsenal", "Helmet", "Legends", "Easy"],
  ["Michael Essien", "Midfielder", "Ghana", "Chelsea", "Real Madrid", "Bison", "Legends", "Medium"],
  ["Claude Makelele", "Midfielder", "France", "Chelsea", "Real Madrid", "Role", "Legends", "Medium"],
  ["Rio Ferdinand", "Defender", "England", "Manchester United", "Leeds", "Pundit", "Legends", "Medium"],
  ["Nemanja Vidic", "Defender", "Serbia", "Manchester United", "Spartak Moscow", "Aggressive", "Legends", "Medium"],
  ["Patrice Evra", "Left Back", "France", "Manchester United", "Juventus", "I Love This Game", "Legends", "Medium"],
  ["Gary Neville", "Right Back", "England", "Manchester United", "Pundit", "Valencia", "Legends", "Medium"],
  ["Paul Scholes", "Midfielder", "England", "Manchester United", "Ginger", "Long Shot", "Legends", "Medium"],
  ["Ryan Giggs", "Winger", "Wales", "Manchester United", "Left Foot", "Longevity", "Legends", "Medium"],
  ["Roy Keane", "Midfielder", "Ireland", "Manchester United", "Captain", "Pundit", "Legends", "Easy"],
  ["Wayne Rooney", "Striker", "England", "Manchester United", "Everton", "Bicycle Kick", "Legends", "Easy"],
  ["Ruud van Nistelrooy", "Striker", "Netherlands", "Manchester United", "Real Madrid", "Poacher", "Legends", "Medium"],
  ["Edwin van der Sar", "Goalkeeper", "Netherlands", "Manchester United", "Ajax", "Juventus", "Legends", "Medium"],
  ["Patrick Vieira", "Midfielder", "France", "Arsenal", "Juventus", "Captain", "Legends", "Medium"],
  ["Thierry Henry", "Striker", "France", "Arsenal", "Barcelona", "Statue", "Legends", "Easy"],
  ["Dennis Bergkamp", "Forward", "Netherlands", "Arsenal", "Ajax", "Fear of Flying", "Legends", "Medium"],
  ["Robert Pires", "Winger", "France", "Arsenal", "Villarreal", "Penalty Miss", "Legends", "Hard"],
  ["Sol Campbell", "Defender", "England", "Arsenal", "Tottenham", "Invincibles", "Legends", "Hard"],
  ["Steven Gerrard", "Midfielder", "England", "Liverpool", "Captain", "Slip", "Legends", "Easy"],
  ["Jamie Carragher", "Defender", "England", "Liverpool", "Pundit", "Own Goals", "Legends", "Medium"],
  ["Fernando Torres", "Striker", "Spain", "Liverpool", "Chelsea", "El Nino", "Legends", "Medium"],
  ["Xabi Alonso", "Manager", "Spain", "Liverpool", "Real Madrid", "Bayern Munich", "Legends", "Medium"],
  ["Vincent Kompany", "Defender", "Belgium", "Manchester City", "Captain", "Header", "Legends", "Medium"],
  ["David Silva", "Midfielder", "Spain", "Manchester City", "Real Sociedad", "El Mago", "Legends", "Medium"],
  ["Sergio Aguero", "Striker", "Argentina", "Manchester City", "Atletico Madrid", "93:20", "Legends", "Easy"],
  ["Yaya Toure", "Midfielder", "Ivory Coast", "Manchester City", "Barcelona", "Birthday Cake", "Legends", "Medium"],

  // Modern Active Stars (Additional)
  ["Ollie Watkins", "Striker", "England", "Aston Villa", "Brentford", "Late Goal", "Players", "Hard"],
  ["Ivan Toney", "Striker", "England", "Brentford", "Penalty", "Betting", "Players", "Medium"],
  ["Jarrod Bowen", "Winger", "England", "West Ham", "Left Foot", "Dani Dyer", "Players", "Hard"],
  ["James Maddison", "Midfielder", "England", "Tottenham", "Leicester City", "Darts", "Players", "Medium"],
  ["Alexander Isak", "Striker", "Sweden", "Newcastle", "Real Sociedad", "Tall", "Players", "Medium"],
  ["Bruno Guimaraes", "Midfielder", "Brazil", "Newcastle", "Lyon", "Aggressive", "Players", "Medium"],
  ["Sven Botman", "Defender", "Netherlands", "Newcastle", "Lille", "Tall", "Players", "Hard"],
  ["Anthony Gordon", "Winger", "England", "Newcastle", "Everton", "Pace", "Players", "Hard"],
  ["Dominik Szoboszlai", "Midfielder", "Hungary", "Liverpool", "RB Leipzig", "Free Kick", "Players", "Medium"],
  ["Alexis Mac Allister", "Midfielder", "Argentina", "Liverpool", "Brighton", "World Cup", "Players", "Medium"],
  ["Luis Diaz", "Winger", "Colombia", "Liverpool", "Porto", "Pace", "Players", "Medium"],
  ["Darwin Nunez", "Striker", "Uruguay", "Liverpool", "Benfica", "Chaos", "Players", "Easy"],
  ["Cody Gakpo", "Forward", "Netherlands", "Liverpool", "PSV", "Tall", "Players", "Medium"],
  ["Diogo Jota", "Forward", "Portugal", "Liverpool", "Wolves", "Header", "Players", "Medium"],
  ["Rasmus Hojlund", "Striker", "Denmark", "Manchester United", "Atalanta", "Pace", "Players", "Hard"],
  ["Lisandro Martinez", "Defender", "Argentina", "Manchester United", "Ajax", "Butcher", "Players", "Medium"],
  ["Andre Onana", "Goalkeeper", "Cameroon", "Manchester United", "Inter Milan", "Passing", "Players", "Medium"],
  ["Mason Mount", "Midfielder", "England", "Manchester United", "Chelsea", "Injuries", "Players", "Medium"],
  ["Mykhailo Mudryk", "Winger", "Ukraine", "Chelsea", "Shakhtar", "Pace", "Players", "Medium"],
  ["Nicolas Jackson", "Striker", "Senegal", "Chelsea", "Villarreal", "Offside", "Players", "Hard"],
  ["Moises Caicedo", "Midfielder", "Ecuador", "Chelsea", "Brighton", "Tackle", "Players", "Hard"],
  ["Levi Colwill", "Defender", "England", "Chelsea", "Brighton", "Left Foot", "Players", "Hard"],
  ["Reece James", "Right Back", "England", "Chelsea", "Captain", "Injuries", "Players", "Medium"],
  ["Ben Chilwell", "Left Back", "England", "Chelsea", "Leicester City", "Injuries", "Players", "Medium"],
  ["Cristian Romero", "Defender", "Argentina", "Tottenham", "Atalanta", "Aggressive", "Players", "Medium"],
  ["Micky van de Ven", "Defender", "Netherlands", "Tottenham", "Wolfsburg", "Pace", "Players", "Hard"],
  ["Destiny Udogie", "Left Back", "Italy", "Tottenham", "Udinese", "Pace", "Players", "Hard"],
  ["Guglielmo Vicario", "Goalkeeper", "Italy", "Tottenham", "Empoli", "Saves", "Players", "Hard"],

  // Legends & Icons of Women's Football
  ["Marta", "Forward", "Brazil", "Orlando Pride", "Legend", "10 Number", "Players", "Easy"],
  ["Megan Rapinoe", "Winger", "USA", "Pink Hair", "OL Reign", "World Cup", "Players", "Easy"],
  ["Alex Morgan", "Forward", "USA", "San Diego Wave", "Tea Sip", "World Cup", "Players", "Easy"],
  ["Sam Kerr", "Forward", "Australia", "Chelsea", "Backflip", "Matildas", "Players", "Medium"],
  ["Vivianne Miedema", "Forward", "Netherlands", "Arsenal", "Goals", "Tall", "Players", "Hard"],
  ["Lucy Bronze", "Right Back", "England", "Barcelona", "Lyon", "Lionesses", "Players", "Medium"],
  ["Alexia Putellas", "Midfielder", "Spain", "Barcelona", "Ballon dOr", "World Cup", "Players", "Medium"],
  ["Aitana Bonmati", "Midfielder", "Spain", "Barcelona", "Ballon dOr", "World Cup", "Players", "Medium"],
  ["Ada Hegerberg", "Striker", "Norway", "Lyon", "Ballon dOr", "Goals", "Players", "Hard"],

  // More Clubs
  ["Bayer Leverkusen", "Germany", "Xabi Alonso", "Unbeaten", "Neverkusen", "Aspirin", "Clubs", "Easy"],
  ["RB Leipzig", "Germany", "Red Bull", "Werner", "Nkunku", "Energy Drink", "Clubs", "Medium"],
  ["Eintracht Frankfurt", "Germany", "Europa League", "Eagles", "Rangers", "Kevin Trapp", "Clubs", "Hard"],
  ["Villarreal", "Spain", "Yellow Submarine", "Europa League", "Unai Emery", "Ceramica", "Clubs", "Medium"],
  ["Sevilla", "Spain", "Europa League", "Andalusia", "Ramos", "Jesus Navas", "Clubs", "Medium"],
  ["Valencia", "Spain", "Bats", "Mestalla", "David Villa", "Canizares", "Clubs", "Medium"],
  ["Athletic Bilbao", "Spain", "Basque", "San Mames", "Williams Brothers", "Only Locals", "Clubs", "Hard"],
  ["Real Sociedad", "Spain", "Basque", "San Sebastian", "Odegaard", "Isak", "Clubs", "Hard"],
  ["Lazio", "Italy", "Rome", "Eagles", "Olimpico", "Immobile", "Clubs", "Medium"],
  ["Fiorentina", "Italy", "Florence", "Purple", "Batistuta", "Vlahovic", "Clubs", "Medium"]
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
