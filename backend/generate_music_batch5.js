const xlsx = require('xlsx');
const path = require('path');

const newArtists = [
  // Classical Composers
  ["Ludwig van Beethoven", "German", "Deaf", "Symphony No. 9", "Ode to Joy", "Classical Composer", "Classical", "Easy"],
  ["Wolfgang Amadeus Mozart", "Austrian", "Child Prodigy", "The Magic Flute", "Requiem", "Classical Composer", "Classical", "Easy"],
  ["Johann Sebastian Bach", "German", "Baroque", "Cello Suites", "Brandenburg Concertos", "Classical Composer", "Classical", "Medium"],
  ["Pyotr Ilyich Tchaikovsky", "Russian", "The Nutcracker", "Swan Lake", "1812 Overture", "Classical Composer", "Classical", "Medium"],
  ["Frédéric Chopin", "Polish", "Piano", "Nocturnes", "Preludes", "Classical Composer", "Classical", "Hard"],
  ["Antonio Vivaldi", "Italian", "The Four Seasons", "Violin", "Baroque", "Classical Composer", "Classical", "Medium"],
  ["Johannes Brahms", "German", "Lullaby", "Symphonies", "Romantic", "Classical Composer", "Classical", "Hard"],
  ["Claude Debussy", "French", "Clair de Lune", "Impressionism", "Piano", "Classical Composer", "Classical", "Hard"],
  ["Richard Wagner", "German", "Ride of the Valkyries", "Opera", "The Ring Cycle", "Classical Composer", "Classical", "Hard"],
  ["George Frideric Handel", "German-British", "Messiah", "Water Music", "Hallelujah Chorus", "Classical Composer", "Classical", "Medium"],
  // Jazz Legends
  ["Louis Armstrong", "Trumpet", "What a Wonderful World", "Satchmo", "Hello, Dolly!", "Jazz Legend", "Jazz", "Easy"],
  ["Miles Davis", "Trumpet", "Kind of Blue", "Bebop", "Cool Jazz", "Jazz Legend", "Jazz", "Medium"],
  ["Duke Ellington", "Piano", "Take the 'A' Train", "It Don't Mean a Thing", "Big Band", "Jazz Legend", "Jazz", "Medium"],
  ["John Coltrane", "Saxophone", "A Love Supreme", "Giant Steps", "Bebop", "Jazz Legend", "Jazz", "Hard"],
  ["Ella Fitzgerald", "Singer", "Scat", "First Lady of Song", "Summertime", "Jazz Legend", "Jazz", "Medium"],
  ["Billie Holiday", "Singer", "Lady Day", "Strange Fruit", "God Bless the Child", "Jazz Legend", "Jazz", "Medium"],
  ["Charlie Parker", "Saxophone", "Bird", "Bebop", "Yardbird", "Jazz Legend", "Jazz", "Hard"],
  ["Nina Simone", "Singer", "Feeling Good", "I Put a Spell on You", "Civil Rights", "Jazz Legend", "Jazz", "Easy"],
  ["Thelonious Monk", "Piano", "Round Midnight", "Bebop", "Blue Monk", "Jazz Legend", "Jazz", "Hard"],
  ["Dave Brubeck", "Piano", "Take Five", "Time Out", "Cool Jazz", "Jazz Legend", "Jazz", "Hard"],
  // K-Pop
  ["BTS", "Korean", "Army", "Dynamite", "Butter", "Boy Band", "K-Pop", "Easy"],
  ["BLACKPINK", "Korean", "Blinks", "How You Like That", "Kill This Love", "Girl Group", "K-Pop", "Easy"],
  ["EXO", "Korean", "Growl", "Monster", "Love Shot", "Boy Band", "K-Pop", "Medium"],
  ["TWICE", "Korean", "Cheer Up", "TT", "Fancy", "Girl Group", "K-Pop", "Medium"],
  ["Red Velvet", "Korean", "Psycho", "Bad Boy", "Peek-A-Boo", "Girl Group", "K-Pop", "Medium"],
  ["Seventeen", "Korean", "Don't Wanna Cry", "Very Nice", "Hot", "Boy Band", "K-Pop", "Medium"],
  ["Stray Kids", "Korean", "God's Menu", "Maniac", "Thunderous", "Boy Band", "K-Pop", "Hard"],
  ["ITZY", "Korean", "Wannabe", "Dalla Dalla", "Not Shy", "Girl Group", "K-Pop", "Hard"],
  ["NCT", "Korean", "Kick It", "Make A Wish", "Cherry Bomb", "Boy Band", "K-Pop", "Hard"],
  ["Girls' Generation", "Korean", "Gee", "Into The New World", "I Got A Boy", "Girl Group", "K-Pop", "Medium"],
  // Alternative / Indie
  ["Arctic Monkeys", "British", "Do I Wanna Know?", "Alex Turner", "505", "Rock Band", "Alternative", "Medium"],
  ["The Killers", "Las Vegas", "Mr. Brightside", "Somebody Told Me", "Brandon Flowers", "Rock Band", "Alternative", "Easy"],
  ["Radiohead", "British", "Creep", "Karma Police", "Thom Yorke", "Rock Band", "Alternative", "Medium"],
  ["The Strokes", "New York", "Last Nite", "Reptilia", "Julian Casablancas", "Rock Band", "Alternative", "Medium"],
  ["Vampire Weekend", "New York", "A-Punk", "Diane Young", "Ezra Koenig", "Rock Band", "Alternative", "Hard"],
  ["Tame Impala", "Australian", "The Less I Know The Better", "Kevin Parker", "Let It Happen", "Psychedelic Rock", "Alternative", "Medium"],
  ["Florence + The Machine", "British", "Dog Days Are Over", "Florence Welch", "Shake It Out", "Indie Rock", "Alternative", "Medium"],
  ["The Smiths", "British", "There Is a Light That Never Goes Out", "Morrissey", "This Charming Man", "Rock Band", "Alternative", "Hard"],
  ["The Cure", "British", "Boys Don't Cry", "Just Like Heaven", "Robert Smith", "Rock Band", "Alternative", "Medium"],
  ["Arcade Fire", "Canadian", "Wake Up", "Rebellion (Lies)", "The Suburbs", "Indie Rock", "Alternative", "Hard"],
  // Modern Rap / Hip-Hop
  ["Kendrick Lamar", "Compton", "HUMBLE.", "DNA.", "Pulitzer Prize", "Rapper", "Hip Hop", "Easy"],
  ["J. Cole", "North Carolina", "No Role Modelz", "Middle Child", "Dreamville", "Rapper", "Hip Hop", "Medium"],
  ["Drake", "Canadian", "God's Plan", "Hotline Bling", "OVO", "Rapper", "Hip Hop", "Easy"],
  ["Travis Scott", "Texas", "SICKO MODE", "Goosebumps", "Astroworld", "Rapper", "Hip Hop", "Medium"],
  ["Post Malone", "Texas", "Circles", "rockstar", "Sunflower", "Rapper/Singer", "Hip Hop", "Easy"],
  ["Tyler, The Creator", "California", "IGOR", "See You Again", "Odd Future", "Rapper", "Hip Hop", "Medium"],
  ["A$AP Rocky", "New York", "Praise The Lord", "Rihanna", "Fashion Killa", "Rapper", "Hip Hop", "Medium"],
  ["Lil Uzi Vert", "Philadelphia", "XO Tour Llif3", "Just Wanna Rock", "20 Min", "Rapper", "Hip Hop", "Medium"],
  ["Playboi Carti", "Atlanta", "Magnolia", "Whole Lotta Red", "Shoota", "Rapper", "Hip Hop", "Hard"],
  ["Future", "Atlanta", "Mask Off", "Life Is Good", "Toxic", "Rapper", "Hip Hop", "Medium"],
  // Pop Legends / Divas
  ["Mariah Carey", "Christmas", "All I Want for Christmas Is You", "Whistle Register", "Hero", "Pop Singer", "Pop", "Easy"],
  ["Celine Dion", "Canadian", "My Heart Will Go On", "Titanic", "The Power of Love", "Pop Singer", "Pop", "Easy"],
  ["Whitney Houston", "I Will Always Love You", "The Bodyguard", "I Wanna Dance with Somebody", "Pop Singer", "Pop", "Easy"],
  ["Aretha Franklin", "Respect", "Queen of Soul", "(You Make Me Feel Like) A Natural Woman", "Think", "Soul Singer", "R&B/Soul", "Medium"],
  ["Tina Turner", "Proud Mary", "What's Love Got to Do with It", "Simply the Best", "Queen of Rock 'n' Roll", "Rock/Soul", "Medium"],
  ["Cher", "Believe", "Auto-Tune", "If I Could Turn Back Time", "Sonny & Cher", "Pop Icon", "Pop", "Medium"],
  ["Barbra Streisand", "The Way We Were", "Funny Girl", "A Star Is Born", "EGOT", "Pop Singer", "Pop", "Hard"],
  ["Donna Summer", "Disco Queen", "Hot Stuff", "I Feel Love", "Bad Girls", "Disco Singer", "Disco", "Medium"],
  ["Gloria Gaynor", "I Will Survive", "Disco", "Never Can Say Goodbye", "Empowerment Anthem", "Disco Singer", "Disco", "Medium"],
  ["Diana Ross", "The Supremes", "Ain't No Mountain High Enough", "I'm Coming Out", "Motown", "Pop Icon", "Pop", "Medium"],
  // Modern Pop
  ["Ariana Grande", "High Ponytail", "Thank U, Next", "7 Rings", "Positions", "Pop Singer", "Pop", "Easy"],
  ["Selena Gomez", "Disney Channel", "Lose You To Love Me", "Wizards of Waverly Place", "Rare Beauty", "Pop Singer", "Pop", "Easy"],
  ["Miley Cyrus", "Hannah Montana", "Wrecking Ball", "Flowers", "Party in the U.S.A.", "Pop Singer", "Pop", "Easy"],
  ["Demi Lovato", "Disney Channel", "Camp Rock", "Sorry Not Sorry", "Heart Attack", "Pop Singer", "Pop", "Medium"],
  ["Camila Cabello", "Havana", "Fifth Harmony", "Shawn Mendes", "Senorita", "Pop Singer", "Pop", "Medium"],
  ["Shawn Mendes", "Canadian", "Stitches", "Treat You Better", "Camila Cabello", "Pop Singer", "Pop", "Medium"],
  ["Charlie Puth", "Perfect Pitch", "See You Again", "Attention", "We Don't Talk Anymore", "Pop Singer", "Pop", "Medium"],
  ["Halsey", "Without Me", "Closer", "Bad At Love", "New Americana", "Pop Singer", "Pop", "Medium"],
  ["Lorde", "New Zealand", "Royals", "Green Light", "Solar Power", "Pop Singer", "Alternative Pop", "Medium"],
  ["Olivia Rodrigo", "Drivers License", "Good 4 U", "High School Musical", "Sour", "Pop Singer", "Pop", "Easy"],
  // Old School Rock / Hard Rock
  ["Guns N' Roses", "Slash", "Axl Rose", "Sweet Child O' Mine", "Welcome to the Jungle", "Rock Band", "Rock", "Easy"],
  ["AC/DC", "Australian", "Back in Black", "Highway to Hell", "Thunderstruck", "Rock Band", "Rock", "Easy"],
  ["Metallica", "Enter Sandman", "Nothing Else Matters", "Master of Puppets", "Heavy Metal", "Metal Band", "Metal", "Easy"],
  ["Iron Maiden", "British", "The Trooper", "Run to the Hills", "Heavy Metal", "Metal Band", "Metal", "Medium"],
  ["Black Sabbath", "Ozzy Osbourne", "Paranoid", "Iron Man", "Heavy Metal", "Metal Band", "Metal", "Medium"],
  ["Aerosmith", "Steven Tyler", "Dream On", "Walk This Way", "I Don't Want to Miss a Thing", "Rock Band", "Rock", "Medium"],
  ["KISS", "Face Paint", "Gene Simmons", "Rock and Roll All Nite", "I Was Made for Lovin' You", "Rock Band", "Rock", "Medium"],
  ["Def Leppard", "British", "Pour Some Sugar on Me", "Photograph", "One-Armed Drummer", "Rock Band", "Rock", "Hard"],
  ["Motörhead", "Lemmy", "Ace of Spades", "Heavy Metal", "British", "Metal Band", "Metal", "Hard"],
  ["Judas Priest", "British", "Breaking the Law", "Painkiller", "Rob Halford", "Metal Band", "Metal", "Hard"],
  // Modern Metal / Nu Metal
  ["Slipknot", "Masks", "Duality", "Before I Forget", "Corey Taylor", "Metal Band", "Metal", "Medium"],
  ["System of a Down", "Armenian-American", "Chop Suey!", "Toxicity", "Serj Tankian", "Metal Band", "Metal", "Medium"],
  ["Korn", "Jonathan Davis", "Freak on a Leash", "Blind", "Nu Metal", "Metal Band", "Metal", "Hard"],
  ["Deftones", "Chino Moreno", "My Own Summer", "Change", "Nu Metal", "Metal Band", "Metal", "Hard"],
  ["Avenged Sevenfold", "M. Shadows", "Hail to the King", "Nightmare", "Metalcore", "Metal Band", "Metal", "Hard"],
  ["Bring Me The Horizon", "British", "Oliver Sykes", "Can You Feel My Heart", "Throne", "Metal Band", "Metal", "Medium"],
  ["Disturbed", "David Draiman", "Down with the Sickness", "The Sound of Silence", "Nu Metal", "Metal Band", "Metal", "Medium"],
  ["Five Finger Death Punch", "Ivan Moody", "Wrong Side of Heaven", "Bad Company", "Groove Metal", "Metal Band", "Metal", "Hard"],
  ["Ghost", "Swedish", "Tobias Forge", "Mary On A Cross", "Square Hammer", "Rock/Metal", "Metal", "Medium"],
  ["Megadeth", "Dave Mustaine", "Symphony of Destruction", "Holy Wars", "Thrash Metal", "Metal Band", "Metal", "Hard"],
  // Country Modern & Classic
  ["Johnny Cash", "The Man in Black", "Ring of Fire", "Folsom Prison Blues", "Walk the Line", "Country Legend", "Country", "Easy"],
  ["Dolly Parton", "Jolene", "9 to 5", "I Will Always Love You", "Country Legend", "Country", "Easy"],
  ["Shania Twain", "Canadian", "Man! I Feel Like A Woman!", "You're Still The One", "That Don't Impress Me Much", "Country Singer", "Country", "Easy"],
  ["Garth Brooks", "Friends in Low Places", "The Thunder Rolls", "If Tomorrow Never Comes", "Country Singer", "Country", "Medium"],
  ["Carrie Underwood", "American Idol", "Before He Cheats", "Jesus, Take the Wheel", "Country Singer", "Country", "Medium"],
  ["Miranda Lambert", "The House That Built Me", "Gunpowder & Lead", "Blake Shelton", "Country Singer", "Country", "Medium"],
  ["Blake Shelton", "The Voice", "God's Country", "Gwen Stefani", "Boys 'Round Here", "Country Singer", "Country", "Medium"],
  ["Luke Bryan", "Country Girl (Shake It for Me)", "Play It Again", "Crash My Party", "Country Singer", "Country", "Medium"],
  ["Morgan Wallen", "Mullet", "Whiskey Glasses", "Last Night", "Country Singer", "Country", "Easy"],
  ["Luke Combs", "Fast Car (Cover)", "Beautiful Crazy", "Hurricane", "Country Singer", "Country", "Medium"],
  // Spanish / Latin
  ["Shakira", "Colombian", "Hips Don't Lie", "Waka Waka", "Piqué", "Latin Pop", "Latin", "Easy"],
  ["Bad Bunny", "Puerto Rican", "Tití Me Preguntó", "Me Porto Bonito", "Un Verano Sin Ti", "Reggaeton", "Latin", "Easy"],
  ["J Balvin", "Colombian", "Mi Gente", "Ginza", "Colores", "Reggaeton", "Latin", "Medium"],
  ["Maluma", "Colombian", "Hawái", "Felices los 4", "Sobrio", "Reggaeton", "Latin", "Medium"],
  ["Rosalía", "Spanish", "Motomami", "Despechá", "Flamenco", "Latin Pop", "Latin", "Medium"],
  ["Daddy Yankee", "Puerto Rican", "Gasolina", "Despacito", "Con Calma", "Reggaeton Legend", "Latin", "Easy"],
  ["Luis Fonsi", "Puerto Rican", "Despacito", "Échame La Culpa", "Justin Bieber", "Latin Pop", "Latin", "Easy"],
  ["Enrique Iglesias", "Spanish", "Bailando", "Hero", "Julio Iglesias", "Latin Pop", "Latin", "Easy"],
  ["Marc Anthony", "Salsa", "Vivir Mi Vida", "Jennifer Lopez", "Flor Pálida", "Latin Singer", "Latin", "Medium"],
  ["Ricky Martin", "Puerto Rican", "Livin' la Vida Loca", "La Copa de la Vida", "Vente Pa' Ca", "Latin Pop", "Latin", "Easy"]
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
