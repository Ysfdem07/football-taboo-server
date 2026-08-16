const xlsx = require('xlsx');
const path = require('path');

const newItems = [
  // 19 more football entries to reach exactly 500 rows (499 entries + 1 header)
  ["Didier Deschamps", "France", "Manager", "World Cup Winner", "Water Carrier", "Juventus", "Legends", "Medium"],
  ["Carlo Ancelotti", "Italy", "Manager", "Eyebrow", "Don Carlo", "Real Madrid", "Legends", "Easy"],
  ["Marcello Lippi", "Italy", "Manager", "Cigar", "World Cup Winner", "Juventus", "Legends", "Hard"],
  ["Fabio Capello", "Italy", "Manager", "Strict", "AC Milan", "Real Madrid", "Legends", "Medium"],
  ["Giovanni Trapattoni", "Italy", "Manager", "Holy Water", "Juventus", "Bayern Munich", "Legends", "Hard"],
  ["Guus Hiddink", "Netherlands", "Manager", "South Korea", "Chelsea", "PSV", "Legends", "Medium"],
  ["Louis van Gaal", "Netherlands", "Manager", "Ajax", "Barcelona", "Manchester United", "Legends", "Medium"],
  ["Claudio Ranieri", "Italy", "Manager", "Tinkerman", "Leicester City", "Dilly Ding Dilly Dong", "Legends", "Medium"],
  ["Roberto Mancini", "Italy", "Manager", "Scarf", "Manchester City", "Euro 2020", "Legends", "Medium"],
  ["Manuel Pellegrini", "Chile", "Manager", "The Engineer", "Villarreal", "Manchester City", "Legends", "Hard"],
  ["Mauricio Pochettino", "Argentina", "Manager", "Tottenham", "PSG", "Chelsea", "Legends", "Medium"],
  ["Unai Emery", "Spain", "Manager", "Europa League", "Sevilla", "Aston Villa", "Legends", "Medium"],
  ["Massimiliano Allegri", "Italy", "Manager", "Corto Muso", "Juventus", "AC Milan", "Legends", "Medium"],
  ["Antonio Conte", "Italy", "Manager", "Hair Transplant", "Juventus", "Chelsea", "Legends", "Medium"],
  ["Simone Inzaghi", "Italy", "Manager", "3-5-2", "Lazio", "Inter Milan", "Legends", "Medium"],
  ["Gian Piero Gasperini", "Italy", "Manager", "Atalanta", "Genoa", "Man-to-Man", "Legends", "Hard"],
  ["Roberto De Zerbi", "Italy", "Manager", "Sassuolo", "Brighton", "Marseille", "Legends", "Medium"],
  ["Gareth Southgate", "England", "Manager", "Waistcoat", "Euro 2020", "Penalty Miss", "Legends", "Easy"],
  ["Marcelo Bielsa", "Argentina", "Manager", "El Loco", "Leeds", "Bucket", "Legends", "Hard"]
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
