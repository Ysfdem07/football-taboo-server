const xlsx = require('xlsx');
const path = require('path');

const newArtists = [
  // 20 more artists to reach 500
  ["Gwen Stefani", "Hollaback Girl", "No Doubt", "Blake Shelton", "The Sweet Escape", "Pop Singer", "Pop", "Easy"],
  ["The Police", "Sting", "Every Breath You Take", "Roxanne", "Message in a Bottle", "Rock Band", "Rock", "Medium"],
  ["Sting", "The Police", "Englishman in New York", "Fields of Gold", "Desert Rose", "Rock Singer", "Rock", "Medium"],
  ["Sia", "Chandelier", "Cheap Thrills", "Face Wig", "Titanium", "Pop Singer", "Pop", "Easy"],
  ["Dua Lipa", "Levitating", "Don't Start Now", "New Rules", "Future Nostalgia", "Pop Singer", "Pop", "Easy"],
  ["Ava Max", "Sweet but Psycho", "Kings & Queens", "Asymmetrical Hair", "Pop Singer", "Pop", "Medium"],
  ["Bebe Rexha", "I'm a Mess", "Meant to Be", "In the Name of Love", "Pop Singer", "Pop", "Medium"],
  ["Anne-Marie", "2002", "FRIENDS", "Rockabye", "British", "Pop Singer", "Pop", "Medium"],
  ["Zara Larsson", "Lush Life", "Never Forget You", "Symphony", "Swedish", "Pop Singer", "Pop", "Medium"],
  ["Rita Ora", "Anywhere", "Let You Love Me", "Your Song", "British", "Pop Singer", "Pop", "Medium"],
  ["Jason Derulo", "Savage Love", "Talk Dirty", "Whatcha Say", "TikTok Dancer", "Pop Singer", "Pop", "Easy"],
  ["Pussycat Dolls", "Nicole Scherzinger", "Don't Cha", "Buttons", "Girl Group", "Pop", "Medium"],
  ["Fifth Harmony", "Camila Cabello", "Work from Home", "Worth It", "Girl Group", "Pop", "Medium"],
  ["Little Mix", "Shout Out to My Ex", "Black Magic", "British", "Girl Group", "Pop", "Medium"],
  ["One Direction", "Harry Styles", "What Makes You Beautiful", "Story of My Life", "Boy Band", "Pop", "Easy"],
  ["Zayn Malik", "Pillowtalk", "Dusk Till Dawn", "Gigi Hadid", "One Direction", "Pop Singer", "Pop", "Medium"],
  ["Niall Horan", "Slow Hands", "This Town", "Irish", "One Direction", "Pop Singer", "Pop", "Medium"],
  ["Liam Payne", "Strip That Down", "Familiar", "One Direction", "British", "Pop Singer", "Pop", "Hard"],
  ["Louis Tomlinson", "Back to You", "Miss You", "One Direction", "British", "Pop Singer", "Pop", "Hard"],
  ["Jonas Brothers", "Sucker", "Burnin' Up", "Nick Joe Kevin", "Disney Channel", "Boy Band", "Pop", "Easy"]
];

const existingFile = path.join("C:\\\\Users\\\\ysfde\\\\OneDrive\\\\Desktop", 'music_en.xlsx');
const wb = xlsx.readFile(existingFile);
const ws = wb.Sheets["Music"];

const existingData = xlsx.utils.sheet_to_json(ws, {header: 1});
const combinedData = existingData.concat(newArtists);

const newWs = xlsx.utils.aoa_to_sheet(combinedData);
newWs['!cols'] = ws['!cols'];
wb.Sheets["Music"] = newWs;

try {
  xlsx.writeFile(wb, existingFile);
  console.log('Successfully appended! Total rows: ' + combinedData.length);
} catch (e) {
  console.error(e);
}
