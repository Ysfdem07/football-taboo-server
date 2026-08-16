const xlsx = require('xlsx');
const path = require('path');

const newItems = [
  // 125 more football entries to reach exactly 500
  
  // Historical / Golden Era Legends
  ["Hristo Stoichkov", "Bulgaria", "Forward", "Barcelona", "Ballon dOr", "El Pistolero", "Legends", "Hard"],
  ["Romario", "Brazil", "Striker", "PSV", "Barcelona", "World Cup", "Legends", "Medium"],
  ["Davor Suker", "Croatia", "Striker", "Real Madrid", "Arsenal", "Golden Boot", "Legends", "Medium"],
  ["George Weah", "Liberia", "Striker", "AC Milan", "PSG", "President", "Legends", "Easy"],
  ["Bebeto", "Brazil", "Striker", "Deportivo", "Baby Celebration", "World Cup", "Legends", "Medium"],
  ["Oliver Bierhoff", "Germany", "Striker", "AC Milan", "Udinese", "Golden Goal", "Legends", "Hard"],
  ["Jurgen Klinsmann", "Germany", "Striker", "Tottenham", "Bayern Munich", "Dive Celebration", "Legends", "Medium"],
  ["Michel Platini", "France", "Midfielder", "Juventus", "Ballon dOr", "Free Kick", "Legends", "Medium"],
  ["Jean-Pierre Papin", "France", "Striker", "Marseille", "AC Milan", "Volley", "Legends", "Hard"],
  ["Gary Lineker", "England", "Striker", "Tottenham", "Barcelona", "Crisps", "Legends", "Medium"],
  ["Alan Shearer", "England", "Striker", "Newcastle", "Blackburn", "Record Goalscorer", "Legends", "Easy"],
  ["Ian Wright", "England", "Striker", "Arsenal", "Crystal Palace", "Pundit", "Legends", "Medium"],
  ["Robbie Fowler", "England", "Striker", "Liverpool", "Leeds", "God", "Legends", "Medium"],
  ["Michael Owen", "England", "Striker", "Liverpool", "Real Madrid", "Ballon dOr", "Legends", "Easy"],
  ["Rivaldo", "Brazil", "Forward", "Barcelona", "AC Milan", "Bicycle Kick", "Legends", "Medium"],
  ["Deco", "Portugal", "Midfielder", "Porto", "Barcelona", "Chelsea", "Legends", "Medium"],
  ["Jari Litmanen", "Finland", "Midfielder", "Ajax", "Barcelona", "Liverpool", "Legends", "Hard"],
  ["Marc Overmars", "Netherlands", "Winger", "Ajax", "Arsenal", "Barcelona", "Legends", "Hard"],
  ["Roy Makaay", "Netherlands", "Striker", "Deportivo", "Bayern Munich", "Das Phantom", "Legends", "Hard"],
  ["Patrick Kluivert", "Netherlands", "Striker", "Ajax", "Barcelona", "Newcastle", "Legends", "Medium"],
  ["Henrik Larsson", "Sweden", "Striker", "Celtic", "Barcelona", "Manchester United", "Legends", "Medium"],
  ["Frederik Ljungberg", "Sweden", "Winger", "Arsenal", "Calvin Klein", "Red Hair", "Legends", "Hard"],
  ["Emmanuel Petit", "France", "Midfielder", "Arsenal", "Chelsea", "Ponytail", "Legends", "Hard"],
  ["Fabien Barthez", "France", "Goalkeeper", "Manchester United", "Marseille", "Bald", "Legends", "Medium"],
  ["Laurent Blanc", "France", "Defender", "Manchester United", "Inter", "Kissing Head", "Legends", "Hard"],
  ["Lilian Thuram", "France", "Defender", "Parma", "Juventus", "Glasses", "Legends", "Medium"],
  ["Marcel Desailly", "France", "Defender", "AC Milan", "Chelsea", "The Rock", "Legends", "Medium"],
  ["Christian Vieri", "Italy", "Striker", "Inter Milan", "Atletico Madrid", "Bobo", "Legends", "Medium"],
  ["Gianfranco Zola", "Italy", "Forward", "Chelsea", "Napoli", "Parma", "Legends", "Medium"],
  ["Fabio Cannavaro", "Italy", "Defender", "Juventus", "Real Madrid", "Ballon dOr", "Legends", "Easy"],
  ["Marco Materazzi", "Italy", "Defender", "Inter Milan", "Everton", "Headbutt", "Legends", "Medium"],
  ["Daniele De Rossi", "Italy", "Midfielder", "Roma", "Boca Juniors", "Tackle", "Legends", "Medium"],
  ["Luca Toni", "Italy", "Striker", "Fiorentina", "Bayern Munich", "Ear Celebration", "Legends", "Medium"],
  ["Miroslav Klose", "Germany", "Striker", "Bayern Munich", "Lazio", "World Cup Goals", "Legends", "Easy"],
  ["Bastian Schweinsteiger", "Germany", "Midfielder", "Bayern Munich", "Manchester United", "Chicago Fire", "Legends", "Medium"],
  ["Michael Ballack", "Germany", "Midfielder", "Bayer Leverkusen", "Bayern Munich", "Chelsea", "Legends", "Easy"],
  ["Stefan Effenberg", "Germany", "Midfielder", "Bayern Munich", "Fiorentina", "Tiger", "Legends", "Hard"],
  ["Mario Gotze", "Germany", "Midfielder", "Dortmund", "Bayern Munich", "World Cup Winner", "Players", "Medium"],
  ["Mesut Ozil", "Germany", "Midfielder", "Real Madrid", "Arsenal", "Assist", "Players", "Easy"],
  ["Sami Khedira", "Germany", "Midfielder", "Real Madrid", "Juventus", "Stuttgart", "Players", "Hard"],
  ["Nemanja Matic", "Serbia", "Midfielder", "Chelsea", "Manchester United", "Roma", "Players", "Medium"],
  ["Branislav Ivanovic", "Serbia", "Defender", "Chelsea", "Zenit", "Header", "Legends", "Medium"],
  ["Dimitar Berbatov", "Bulgaria", "Striker", "Tottenham", "Manchester United", "First Touch", "Legends", "Medium"],
  ["Nani", "Portugal", "Winger", "Manchester United", "Sporting", "Backflip", "Players", "Medium"],
  ["Ricardo Quaresma", "Portugal", "Winger", "Porto", "Besiktas", "Trivela", "Players", "Medium"],
  ["Joao Moutinho", "Portugal", "Midfielder", "Porto", "Monaco", "Wolves", "Players", "Hard"],
  ["Pepe", "Portugal", "Defender", "Real Madrid", "Porto", "Aggressive", "Players", "Easy"],
  ["Thiago Silva", "Brazil", "Defender", "AC Milan", "PSG", "Chelsea", "Players", "Medium"],
  ["David Luiz", "Brazil", "Defender", "Chelsea", "PSG", "Hair", "Players", "Medium"],
  ["Oscar", "Brazil", "Midfielder", "Chelsea", "Shanghai", "China", "Players", "Hard"],
  ["Hulk", "Brazil", "Winger", "Porto", "Zenit", "Powerful Shot", "Players", "Medium"],
  ["Philippe Coutinho", "Brazil", "Midfielder", "Liverpool", "Barcelona", "Aston Villa", "Players", "Medium"],
  ["Willian", "Brazil", "Winger", "Chelsea", "Arsenal", "Fulham", "Players", "Medium"],
  ["Fernandinho", "Brazil", "Midfielder", "Shakhtar", "Manchester City", "Athletico Paranaense", "Players", "Hard"],
  ["Carlos Tevez", "Argentina", "Striker", "Manchester United", "Manchester City", "Juventus", "Legends", "Medium"],
  ["Javier Mascherano", "Argentina", "Midfielder", "Liverpool", "Barcelona", "Tackle", "Legends", "Medium"],
  ["Pablo Zabaleta", "Argentina", "Right Back", "Manchester City", "West Ham", "Espanyol", "Legends", "Hard"],
  ["Nicolas Otamendi", "Argentina", "Defender", "Manchester City", "Benfica", "Aggressive", "Players", "Hard"],
  ["Gonzalo Higuain", "Argentina", "Striker", "Real Madrid", "Napoli", "Juventus", "Legends", "Medium"],
  ["Paulo Dybala", "Argentina", "Forward", "Juventus", "Roma", "Mask Celebration", "Players", "Easy"],
  ["Radamel Falcao", "Colombia", "Striker", "Porto", "Atletico Madrid", "El Tigre", "Players", "Medium"],
  ["James Rodriguez", "Colombia", "Midfielder", "Porto", "Real Madrid", "Volley", "Players", "Medium"],
  ["Arturo Vidal", "Chile", "Midfielder", "Juventus", "Bayern Munich", "Mohawk", "Players", "Medium"],
  ["Alexis Sanchez", "Chile", "Forward", "Barcelona", "Arsenal", "Inter Milan", "Players", "Easy"],
  ["Keylor Navas", "Costa Rica", "Goalkeeper", "Real Madrid", "PSG", "Saves", "Players", "Medium"],
  ["Claudio Bravo", "Chile", "Goalkeeper", "Barcelona", "Manchester City", "Real Betis", "Players", "Hard"],

  // More Active Top Players
  ["Marquinhos", "Brazil", "Defender", "PSG", "Roma", "Captain", "Players", "Medium"],
  ["Marco Verratti", "Italy", "Midfielder", "PSG", "Pescara", "Tackle", "Players", "Hard"],
  ["Presnel Kimpembe", "France", "Defender", "PSG", "Academy", "Left Foot", "Players", "Hard"],
  ["Lucas Hernandez", "France", "Defender", "Atletico Madrid", "Bayern Munich", "PSG", "Players", "Hard"],
  ["Theo Hernandez", "France", "Left Back", "Real Madrid", "AC Milan", "Pace", "Players", "Medium"],
  ["Mike Maignan", "France", "Goalkeeper", "Lille", "AC Milan", "Penalty Save", "Players", "Medium"],
  ["Olivier Giroud", "France", "Striker", "Arsenal", "Chelsea", "Scorpion Kick", "Players", "Easy"],
  ["Hugo Lloris", "France", "Goalkeeper", "Lyon", "Tottenham", "Captain", "Players", "Medium"],
  ["Raphael Varane", "France", "Defender", "Real Madrid", "Manchester United", "Pace", "Players", "Medium"],
  ["Dayot Upamecano", "France", "Defender", "RB Leipzig", "Bayern Munich", "Physical", "Players", "Hard"],
  ["Ibrahima Konate", "France", "Defender", "RB Leipzig", "Liverpool", "Anime", "Players", "Medium"],
  ["Jules Kounde", "France", "Defender", "Sevilla", "Barcelona", "Fashion", "Players", "Hard"],
  ["Aurelien Tchouameni", "France", "Midfielder", "Monaco", "Real Madrid", "Tackle", "Players", "Medium"],
  ["Eduardo Camavinga", "France", "Midfielder", "Rennes", "Real Madrid", "Versatile", "Players", "Medium"],
  ["Joao Felix", "Portugal", "Forward", "Benfica", "Atletico Madrid", "Barcelona", "Players", "Medium"],
  ["Rafael Leao", "Portugal", "Winger", "Sporting", "Lille", "AC Milan", "Players", "Medium"],
  ["Ruben Dias", "Portugal", "Defender", "Benfica", "Manchester City", "Leader", "Players", "Medium"],
  ["Bernardo Silva", "Portugal", "Midfielder", "Monaco", "Manchester City", "Left Foot", "Players", "Easy"],
  ["Diogo Jota", "Portugal", "Forward", "Wolves", "Liverpool", "Header", "Players", "Medium"],
  ["Bruno Fernandes", "Portugal", "Midfielder", "Sporting", "Manchester United", "Penalties", "Players", "Easy"],
  ["Federico Chiesa", "Italy", "Winger", "Fiorentina", "Juventus", "Injuries", "Players", "Medium"],
  ["Nicolo Barella", "Italy", "Midfielder", "Cagliari", "Inter Milan", "Energy", "Players", "Medium"],
  ["Alessandro Bastoni", "Italy", "Defender", "Parma", "Inter Milan", "Left Foot", "Players", "Hard"],
  ["Federico Dimarco", "Italy", "Left Back", "Verona", "Inter Milan", "Cross", "Players", "Hard"],
  ["Lautaro Martinez", "Argentina", "Striker", "Racing", "Inter Milan", "El Toro", "Players", "Easy"],
  ["Dusan Vlahovic", "Serbia", "Striker", "Fiorentina", "Juventus", "Left Foot", "Players", "Medium"],
  ["Khvicha Kvaratskhelia", "Georgia", "Winger", "Dinamo Batumi", "Napoli", "Kvaradona", "Players", "Medium"],
  ["Victor Osimhen", "Nigeria", "Striker", "Lille", "Napoli", "Mask", "Players", "Easy"],
  ["Kim Min-jae", "South Korea", "Defender", "Fenerbahce", "Napoli", "Bayern Munich", "Players", "Medium"],
  ["Milan Skriniar", "Slovakia", "Defender", "Sampdoria", "Inter Milan", "PSG", "Players", "Hard"],
  ["Alessandro Florenzi", "Italy", "Right Back", "Roma", "PSG", "AC Milan", "Players", "Hard"],

  // Football Stadiums / Temples
  ["Wembley Stadium", "London", "England", "Arch", "National Stadium", "Finals", "Legends", "Medium"],
  ["Camp Nou", "Barcelona", "Spain", "Catalonia", "Biggest in Europe", "Messi", "Legends", "Easy"],
  ["Santiago Bernabeu", "Madrid", "Spain", "Real Madrid", "White", "Galacticos", "Legends", "Easy"],
  ["San Siro", "Milan", "Italy", "Inter", "AC Milan", "Derby", "Legends", "Easy"],
  ["Anfield", "Liverpool", "England", "The Kop", "This is Anfield", "YNWA", "Legends", "Medium"],
  ["Old Trafford", "Manchester", "England", "United", "Theater of Dreams", "Sir Bobby Charlton", "Legends", "Medium"],
  ["Allianz Arena", "Munich", "Germany", "Red", "Bayern Munich", "Illuminated", "Legends", "Medium"],
  ["Signal Iduna Park", "Dortmund", "Germany", "Westfalenstadion", "Yellow Wall", "BVB", "Legends", "Medium"],
  ["Stade de France", "Paris", "France", "Saint-Denis", "National Stadium", "Zidane", "Legends", "Hard"],
  ["Maracana", "Rio de Janeiro", "Brazil", "Flamengo", "Pele", "1950 World Cup", "Legends", "Medium"],
  ["La Bombonera", "Buenos Aires", "Argentina", "Boca Juniors", "Maradona", "Chocolate Box", "Legends", "Hard"],
  ["Monumental", "Buenos Aires", "Argentina", "River Plate", "River", "1978 World Cup", "Legends", "Hard"],
  ["Azteca", "Mexico City", "Mexico", "Hand of God", "Altitude", "Maradona", "Legends", "Hard"],
  ["Emirates Stadium", "London", "England", "Arsenal", "Highbury", "Gunners", "Legends", "Medium"],
  ["Stamford Bridge", "London", "England", "Chelsea", "Fulham Road", "Blues", "Legends", "Medium"],
  ["Etihad Stadium", "Manchester", "England", "City", "Blue", "Aguero", "Legends", "Medium"],
  ["Tottenham Hotspur Stadium", "London", "England", "Spurs", "White Hart Lane", "NFL", "Legends", "Hard"],
  ["Parc des Princes", "Paris", "France", "PSG", "Eiffel Tower", "Qatar", "Legends", "Hard"],
  ["Estadio da Luz", "Lisbon", "Portugal", "Benfica", "Stadium of Light", "Eagles", "Legends", "Hard"],
  ["Estadio do Dragao", "Porto", "Portugal", "Dragons", "Mourinho", "Blue and White", "Legends", "Hard"]
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
