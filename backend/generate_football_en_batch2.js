const xlsx = require('xlsx');
const path = require('path');

const newItems = [
  // Clubs
  ["Real Madrid", "Los Blancos", "Santiago Bernabeu", "15 Champions League", "Spain", "Galacticos", "Clubs", "Easy"],
  ["Barcelona", "Camp Nou", "La Masia", "Catalonia", "Tiki Taka", "Spain", "Clubs", "Easy"],
  ["Manchester United", "Red Devils", "Old Trafford", "Sir Alex Ferguson", "England", "Munich Air Disaster", "Clubs", "Easy"],
  ["Manchester City", "Etihad", "Pep Guardiola", "Blue", "England", "Oasis", "Clubs", "Easy"],
  ["Liverpool", "Anfield", "You'll Never Walk Alone", "Jurgen Klopp", "England", "The Reds", "Clubs", "Easy"],
  ["Arsenal", "Emirates", "Invincibles", "Arsene Wenger", "England", "Gunners", "Clubs", "Medium"],
  ["Chelsea", "Stamford Bridge", "Roman Abramovich", "Blue", "England", "London", "Clubs", "Medium"],
  ["Tottenham Hotspur", "White Hart Lane", "London", "Trophyless", "England", "Spurs", "Clubs", "Medium"],
  ["Bayern Munich", "Allianz Arena", "Bavaria", "Der Klassiker", "Germany", "FC Hollywood", "Clubs", "Easy"],
  ["Borussia Dortmund", "Signal Iduna Park", "Yellow Wall", "Der Klassiker", "Germany", "BVB", "Clubs", "Medium"],
  ["Juventus", "Old Lady", "Allianz Stadium", "Turin", "Italy", "Bianconeri", "Clubs", "Easy"],
  ["AC Milan", "San Siro", "7 Champions League", "Rossoneri", "Italy", "Derby della Madonnina", "Clubs", "Easy"],
  ["Inter Milan", "San Siro", "Nerazzurri", "Derby della Madonnina", "Italy", "Treble", "Clubs", "Medium"],
  ["Napoli", "Diego Maradona", "Serie A", "South", "Italy", "Vesuvius", "Clubs", "Medium"],
  ["Roma", "Stadio Olimpico", "Giallorossi", "Wolf", "Italy", "Francesco Totti", "Clubs", "Medium"],
  ["PSG", "Parc des Princes", "Qatar", "Eiffel Tower", "France", "Ligue 1", "Clubs", "Easy"],
  ["Marseille", "Stade Velodrome", "South", "Champions League", "France", "OM", "Clubs", "Hard"],
  ["Ajax", "Johan Cruyff Arena", "Academy", "Eredivisie", "Netherlands", "Amsterdam", "Clubs", "Medium"],
  ["PSV Eindhoven", "Philips", "Eredivisie", "Netherlands", "Boeren", "Red and White", "Clubs", "Hard"],
  ["Feyenoord", "De Kuip", "Rotterdam", "Eredivisie", "Netherlands", "Legioen", "Clubs", "Hard"],
  ["Porto", "Estadio do Dragao", "Dragons", "Jose Mourinho", "Portugal", "Primeira Liga", "Clubs", "Medium"],
  ["Benfica", "Estadio da Luz", "Eagles", "Bela Guttmann", "Portugal", "Primeira Liga", "Clubs", "Medium"],
  ["Sporting CP", "Jose Alvalade", "Lions", "Cristiano Ronaldo", "Portugal", "Green and White", "Clubs", "Hard"],
  ["Galatasaray", "Ali Sami Yen", "Lions", "UEFA Cup", "Turkey", "Istanbul", "Clubs", "Easy"],
  ["Fenerbahce", "Sukru Saracoglu", "Yellow Canaries", "Asia", "Turkey", "Istanbul", "Clubs", "Easy"],
  ["Besiktas", "Vodafone Park", "Black Eagles", "Bosphorus", "Turkey", "Istanbul", "Clubs", "Easy"],
  ["Trabzonspor", "Black Sea", "Storm", "Akyazi", "Turkey", "Bordo Mavi", "Clubs", "Medium"],
  ["Boca Juniors", "La Bombonera", "Diego Maradona", "Buenos Aires", "Argentina", "Superclasico", "Clubs", "Hard"],
  ["River Plate", "El Monumental", "Millionaires", "Buenos Aires", "Argentina", "Superclasico", "Clubs", "Hard"],
  ["Flamengo", "Maracana", "Rio de Janeiro", "Red and Black", "Brazil", "Zico", "Clubs", "Hard"],
  ["Santos", "Pele", "Neymar", "Vila Belmiro", "Brazil", "Sao Paulo", "Clubs", "Hard"],

  // More Players & Turkish Stars
  ["Arda Guler", "Real Madrid", "Fenerbahce", "Left Foot", "Turkey", "Wonderkid", "Players", "Easy"],
  ["Hakan Calhanoglu", "Inter", "Free Kick", "AC Milan", "Turkey", "Midfielder", "Players", "Medium"],
  ["Cengiz Under", "Fenerbahce", "Roma", "Left Foot", "Turkey", "Marseille", "Players", "Medium"],
  ["Caglar Soyuncu", "Fenerbahce", "Leicester City", "Atletico Madrid", "Turkey", "Defender", "Players", "Medium"],
  ["Merih Demiral", "Al Ahli", "Juventus", "Atalanta", "Turkey", "Defender", "Players", "Medium"],
  ["Ferdi Kadioglu", "Brighton", "Fenerbahce", "Left Back", "Turkey", "Joker", "Players", "Medium"],
  ["Kerem Akturkoglu", "Galatasaray", "Benfica", "Harry Potter", "Turkey", "Winger", "Players", "Medium"],
  ["Baris Alper Yilmaz", "Galatasaray", "Physical", "Pace", "Turkey", "Winger", "Players", "Medium"],
  ["Ismail Yuksek", "Fenerbahce", "Midfielder", "Tackle", "Turkey", "Number 6", "Players", "Medium"],
  ["Orkun Kokcu", "Benfica", "Feyenoord", "Captain", "Turkey", "Midfielder", "Players", "Hard"],
  ["Enes Unal", "Bournemouth", "Getafe", "Villarreal", "Turkey", "Striker", "Players", "Hard"],
  ["Ugurcan Cakir", "Trabzonspor", "Captain", "Turkey", "Goalkeeper", "Saves", "Players", "Medium"],
  ["Mert Gunok", "Besiktas", "Fenerbahce", "Turkey", "Goalkeeper", "Octopus", "Players", "Medium"],
  ["Yusuf Yazici", "Lille", "Trabzonspor", "CSKA Moscow", "Turkey", "Left Foot", "Players", "Hard"],

  // Managers
  ["Pep Guardiola", "Bald", "Tiki Taka", "Manchester City", "Barcelona", "Manager", "Legends", "Easy"],
  ["Jose Mourinho", "The Special One", "Porto", "Inter", "Chelsea", "Manager", "Legends", "Easy"],
  ["Carlo Ancelotti", "Eyebrow", "Real Madrid", "AC Milan", "Champions League", "Manager", "Legends", "Easy"],
  ["Jurgen Klopp", "Gegenpressing", "Liverpool", "Dortmund", "Glasses", "Manager", "Legends", "Easy"],
  ["Sir Alex Ferguson", "Hairdryer", "Manchester United", "Aberdeen", "Scottish", "Manager", "Legends", "Easy"],
  ["Arsene Wenger", "Invincibles", "Arsenal", "French", "Coat", "Manager", "Legends", "Medium"],
  ["Zinedine Zidane", "Headbutt", "Real Madrid", "Three Peat", "France", "Manager", "Legends", "Medium"],
  ["Antonio Conte", "Hair Transplant", "Juventus", "Chelsea", "3-5-2", "Manager", "Legends", "Hard"],
  ["Diego Simeone", "Atletico Madrid", "Black Suit", "Cholo", "Argentina", "Manager", "Legends", "Medium"],
  ["Thomas Tuchel", "Chelsea", "Bayern Munich", "PSG", "German", "Manager", "Legends", "Hard"],
  ["Xabi Alonso", "Bayer Leverkusen", "Unbeaten", "Spain", "Midfielder", "Manager", "Legends", "Medium"],
  ["Mikel Arteta", "Arsenal", "Pep's Assistant", "Hair", "Spain", "Manager", "Legends", "Medium"],

  // Stadiums
  ["Santiago Bernabeu", "Real Madrid", "Spain", "Stadium", "White", "Madrid", "Legends", "Medium"],
  ["Camp Nou", "Barcelona", "Spain", "Stadium", "Catalonia", "Biggest in Europe", "Legends", "Medium"],
  ["Old Trafford", "Manchester United", "Theater of Dreams", "England", "Stadium", "Bobby Charlton", "Legends", "Medium"],
  ["Anfield", "Liverpool", "You'll Never Walk Alone", "England", "Stadium", "The Kop", "Legends", "Medium"],
  ["San Siro", "Milan", "Inter", "Italy", "Stadium", "Giuseppe Meazza", "Legends", "Medium"],
  ["Allianz Arena", "Bayern Munich", "Germany", "Stadium", "Red", "Munich", "Legends", "Medium"],
  ["Wembley", "England", "London", "Arch", "Stadium", "National Team", "Legends", "Medium"],
  ["Maracana", "Brazil", "Rio de Janeiro", "Stadium", "Flamengo", "Pele", "Legends", "Hard"],
  ["Signal Iduna Park", "Dortmund", "Yellow Wall", "Germany", "Stadium", "Westfalenstadion", "Legends", "Hard"],
  ["Estadio Azteca", "Mexico", "Stadium", "Diego Maradona", "Hand of God", "High Altitude", "Legends", "Hard"]
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
