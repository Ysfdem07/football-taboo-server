const xlsx = require('xlsx');
const path = require('path');

const newArtists = [
  // Dance / Electronic
  ["Tiësto", "Dutch", "Trance", "Adagio For Strings", "Red Lights", "DJ", "Electronic", "Medium"],
  ["Martin Garrix", "Dutch", "In the Name of Love", "Scared to Be Lonely", "Animals", "DJ", "Electronic", "Medium"],
  ["Armin van Buuren", "Dutch", "A State of Trance", "Blah Blah Blah", "This Is What It Feels Like", "DJ", "Electronic", "Medium"],
  ["Zedd", "Russian-German", "Clarity", "Stay", "The Middle", "DJ", "Electronic", "Medium"],
  ["The Prodigy", "British", "Big Beat", "Firestarter", "Breathe", "Smack My Bitch Up", "Electronic", "Hard"],
  ["Fatboy Slim", "British", "Praise You", "Right Here Right Now", "Weapon of Choice", "DJ", "Electronic", "Medium"],
  ["The Chemical Brothers", "British", "Galvanize", "Hey Boy Hey Girl", "Block Rockin' Beats", "Electronic Duo", "Electronic", "Medium"],
  ["Deadmau5", "Canadian", "Mouse Helmet", "Ghosts 'n' Stuff", "Strobe", "DJ", "Electronic", "Easy"],
  ["Moby", "Vegan", "Play (Album)", "Porcelain", "Natural Blues", "Electronic Artist", "Electronic", "Medium"],
  ["Swedish House Mafia", "Supergroup", "Don't You Worry Child", "Save the World", "One (Your Name)", "DJ Trio", "Electronic", "Easy"],
  // Classic Country
  ["Willie Nelson", "Texas", "Braids", "On the Road Again", "Always on My Mind", "Country Legend", "Country", "Medium"],
  ["Kenny Rogers", "Texan", "The Gambler", "Islands in the Stream", "Lucille", "Country Singer", "Country", "Medium"],
  ["George Strait", "Texas", "Amarillo by Morning", "Check Yes or No", "King of Country", "Country Singer", "Country", "Medium"],
  ["Reba McEntire", "Oklahoma", "Fancy", "I'm a Survivor", "Sitcom Star", "Queen of Country", "Country", "Medium"],
  ["Keith Urban", "New Zealand", "Nicole Kidman", "Blue Ain't Your Color", "The Fighter", "Country Singer", "Country", "Easy"],
  ["Tim McGraw", "Louisiana", "Faith Hill", "Live Like You Were Dying", "Don't Take the Girl", "Country Singer", "Country", "Medium"],
  ["Faith Hill", "Mississippi", "Tim McGraw", "This Kiss", "Breathe", "Country Singer", "Country", "Medium"],
  ["Brad Paisley", "West Virginia", "Whiskey Lullaby", "Mud on the Tires", "Ticks", "Country Singer", "Country", "Medium"],
  // Classic R&B/Soul/Disco
  ["Diana Ross", "Detroit", "The Supremes", "Ain't No Mountain High Enough", "I'm Coming Out", "Motown Queen", "R&B/Soul", "Easy"],
  ["The Supremes", "Detroit", "Diana Ross", "Stop! In the Name of Love", "Baby Love", "Motown Girl Group", "R&B/Soul", "Easy"],
  ["The Temptations", "Detroit", "My Girl", "Papa Was a Rollin' Stone", "Just My Imagination", "Motown Group", "R&B/Soul", "Easy"],
  ["Earth, Wind & Fire", "Chicago", "Maurice White", "September", "Let's Groove", "Boogie Wonderland", "R&B/Soul", "Easy"],
  ["Kool & The Gang", "New Jersey", "Jungle Boogie", "Ladies' Night", "Celebration", "Funk Band", "R&B/Soul", "Easy"],
  ["Barry White", "Texas", "Deep Voice", "Can't Get Enough of Your Love, Babe", "You're the First, the Last, My Everything", "Soul Singer", "R&B/Soul", "Medium"],
  ["Chaka Khan", "Chicago", "Rufus", "I'm Every Woman", "Ain't Nobody", "Queen of Funk", "R&B/Soul", "Medium"],
  ["Luther Vandross", "New York", "Never Too Much", "Dance with My Father", "Here and Now", "Soul Singer", "R&B/Soul", "Medium"],
  // Rock / Punk
  ["The Clash", "London", "Punk Rock", "London Calling", "Should I Stay or Should I Go", "Rock the Casbah", "Rock", "Medium"],
  ["Ramones", "New York", "Leather Jackets", "Blitzkrieg Bop", "I Wanna Be Sedated", "Hey Ho Let's Go", "Rock", "Easy"],
  ["Sex Pistols", "London", "Sid Vicious", "Punk Rock", "Anarchy in the U.K.", "God Save the Queen", "Rock", "Medium"],
  ["Blondie", "New York", "Debbie Harry", "Call Me", "Heart of Glass", "One Way or Another", "Rock", "Easy"],
  ["Joan Jett", "Pennsylvania", "The Runaways", "Bad Reputation", "I Love Rock 'n' Roll", "Rock Singer", "Rock", "Easy"],
  ["Pat Benatar", "New York", "Love Is a Battlefield", "Hit Me with Your Best Shot", "Heartbreaker", "Rock Singer", "Rock", "Medium"],
  ["Heart", "Seattle", "Ann & Nancy Wilson", "Crazy on You", "Barracuda", "Rock Band", "Rock", "Medium"],
  ["The Pretenders", "British-American", "Chrissie Hynde", "Brass in Pocket", "I'll Stand by You", "Rock Band", "Rock", "Hard"],
  ["Steely Dan", "New York", "Donald Fagen", "Walter Becker", "Reelin' In the Years", "Do It Again", "Rock", "Hard"],
  ["The Doobie Brothers", "California", "Michael McDonald", "Listen to the Music", "Long Train Runnin'", "Rock Band", "Rock", "Hard"],
  // Alt Pop / Misc
  ["Meghan Trainor", "Massachusetts", "All About That Bass", "Lips Are Movin", "No", "Pop Singer", "Pop", "Easy"],
  ["Macklemore", "Seattle", "Ryan Lewis", "Thrift Shop", "Can't Hold Us", "Same Love", "Hip Hop", "Easy"],
  ["Iggy Azalea", "Australian", "Fancy", "Black Widow", "Work", "Female Rapper", "Hip Hop", "Medium"],
  ["G-Eazy", "California", "Me, Myself & I", "No Limit", "Him & I", "Rapper", "Hip Hop", "Medium"],
  ["Machine Gun Kelly", "Cleveland", "Eminem Feud", "Megan Fox", "Tickets to My Downfall", "Rap Devil", "Rock/Hip Hop", "Easy"]
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
