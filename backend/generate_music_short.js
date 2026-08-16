const xlsx = require('xlsx');
const path = require('path');

const data = [
  ['Word', 'Hint 1 (Hard)', 'Hint 2', 'Hint 3', 'Hint 4', 'Hint 5 (Easy)', 'Category', 'Difficulty'],
  // Pop
  ["Michael Jackson", "Gary, Indiana", "Family Band", "White Glove", "Moonwalk", "King of Pop", "Pop", "Easy"],
  ["Madonna", "Michigan", "Reinvention", "Vogue", "Material Girl", "Queen of Pop", "Pop", "Easy"],
  ["Taylor Swift", "Pennsylvania", "Country to Pop", "1989", "Swifties", "The Eras Tour", "Pop", "Easy"],
  ["Beyoncé", "Houston, Texas", "Sasha Fierce", "Destiny's Child", "Single Ladies", "Queen Bey", "Pop/R&B", "Easy"],
  ["Lady Gaga", "Meat Dress", "Little Monsters", "A Star Is Born", "Poker Face", "Bad Romance", "Pop", "Easy"],
  ["Ariana Grande", "Nickelodeon", "Four-Octave", "High Ponytail", "7 Rings", "Thank U, Next", "Pop", "Easy"],
  ["Ed Sheeran", "Loop Pedal", "Mathematics Albums", "Red Hair", "Perfect", "Shape of You", "Pop", "Easy"],
  ["Justin Bieber", "YouTube Covers", "Scooter Braun", "Beliebers", "Sorry", "Baby", "Pop", "Easy"],
  ["Bruno Mars", "Hawaii", "The Hooligans", "24K Magic", "Locked Out of Heaven", "Uptown Funk", "Pop/R&B", "Easy"],
  ["Adele", "BRIT School", "Age Albums", "Skyfall", "Hello", "Rolling in the Deep", "Pop", "Easy"],
  // Rock & Bands
  ["The Beatles", "Hamburg Clubs", "Ringo", "Liverpool", "Let It Be", "Hey Jude", "Rock", "Easy"],
  ["Queen", "Smile (Band)", "Live Aid 1985", "We Will Rock You", "Freddie Mercury", "Bohemian Rhapsody", "Rock", "Easy"],
  ["Rolling Stones", "Red Tongue Logo", "Keith Richards", "Mick Jagger", "Paint It Black", "Satisfaction", "Rock", "Easy"],
  ["Pink Floyd", "Syd Barrett", "Prism Cover", "Psychedelic", "The Wall", "Comfortably Numb", "Rock", "Medium"],
  ["Led Zeppelin", "The Yardbirds", "Four Symbols", "Jimmy Page", "Kashmir", "Stairway to Heaven", "Rock", "Medium"],
  ["Nirvana", "Bleach", "Seattle", "Grunge", "Kurt Cobain", "Smells Like Teen Spirit", "Rock", "Medium"],
  ["AC/DC", "Angus Young", "Schoolboy Uniform", "Australian", "Highway to Hell", "Thunderstruck", "Rock", "Easy"],
  ["Guns N' Roses", "Top Hat", "Slash", "Axl Rose", "November Rain", "Welcome to the Jungle", "Rock", "Easy"],
  ["Coldplay", "Parachutes", "British", "Chris Martin", "Fix You", "Yellow", "Rock/Pop", "Easy"],
  ["Elvis Presley", "Sun Records", "Memphis", "Graceland", "Jailhouse Rock", "King of Rock and Roll", "Rock and Roll", "Easy"],
  ["David Bowie", "Labyrinth", "Heterochromia", "Ziggy Stardust", "Space Oddity", "Starman", "Rock", "Medium"],
  // Jazz
  ["Louis Armstrong", "New Orleans", "Scat Singing", "Trumpet", "Satchmo", "What a Wonderful World", "Jazz", "Easy"],
  ["Frank Sinatra", "Rat Pack", "Ol' Blue Eyes", "My Way", "Fly Me to the Moon", "New York, New York", "Jazz", "Easy"],
  ["Miles Davis", "Kind of Blue", "Cool Jazz", "Muted Trumpet", "Bitches Brew", "Jazz Pioneer", "Jazz", "Hard"],
  ["Ella Fitzgerald", "Apollo Theater", "Queen of Jazz", "Scat Singing", "Summertime", "First Lady of Song", "Jazz", "Medium"],
  ["Duke Ellington", "Harlem Renaissance", "Big Band", "Pianist", "Take the A Train", "Jazz Orchestra", "Jazz", "Medium"],
  // Classical Composers
  ["Wolfgang Amadeus Mozart", "Salzburg", "Child Prodigy", "Requiem", "The Magic Flute", "Eine kleine Nachtmusik", "Classical", "Easy"],
  ["Ludwig van Beethoven", "Bonn, Germany", "Romantic Era Transition", "Deafness", "Ode to Joy", "Fur Elise", "Classical", "Easy"],
  ["Johann Sebastian Bach", "Baroque Era", "20 Children", "Counterpoint", "Brandenburg Concertos", "Toccata and Fugue", "Classical", "Medium"],
  ["Frederic Chopin", "Poland", "George Sand", "Romantic Era", "Nocturnes", "Minute Waltz", "Classical", "Medium"],
  ["Pyotr Ilyich Tchaikovsky", "Russian", "Romantic Era", "1812 Overture", "The Nutcracker", "Swan Lake", "Classical", "Easy"],
  ["Antonio Vivaldi", "The Red Priest", "Venice", "Orphanage", "Baroque Violinist", "The Four Seasons", "Classical", "Medium"],
  // Hip Hop / Rap
  ["Eminem", "8 Mile", "Detroit", "Slim Shady", "Lose Yourself", "Rap God", "Hip Hop", "Easy"],
  ["Tupac Shakur", "Makaveli", "Poetic Justice", "West Coast", "Changes", "California Love", "Hip Hop", "Easy"],
  ["The Notorious B.I.G.", "East Coast", "Ready to Die", "Big Poppa", "Juicy", "Biggie Smalls", "Hip Hop", "Medium"],
  ["Jay-Z", "Roc Nation", "Brooklyn", "Def Jam", "99 Problems", "Empire State of Mind", "Hip Hop", "Easy"],
  ["Kanye West", "Chicago", "Yeezy", "The College Dropout", "Stronger", "Gold Digger", "Hip Hop", "Easy"],
  ["Drake", "Degrassi", "OVO Sound", "Canadian", "Hotline Bling", "God's Plan", "Hip Hop", "Easy"],
  ["Snoop Dogg", "Long Beach", "Doggystyle", "Dr. Dre", "Gin and Juice", "Drop It Like It's Hot", "Hip Hop", "Easy"],
  // R&B / Soul / Funk
  ["Stevie Wonder", "Child Prodigy", "Motown", "Blind", "Superstition", "Isn't She Lovely", "Soul/R&B", "Medium"],
  ["Aretha Franklin", "Detroit", "Gospel", "Think", "Natural Woman", "Queen of Soul", "Soul", "Easy"],
  ["Whitney Houston", "New Jersey", "5-Octave", "The Bodyguard", "I Wanna Dance with Somebody", "I Will Always Love You", "Pop/R&B", "Easy"],
  ["Prince", "Minneapolis Sound", "Unpronounceable Symbol", "When Doves Cry", "Kiss", "Purple Rain", "Pop/Funk", "Easy"],
  ["James Brown", "Dancing", "Sex Machine", "Papa's Got a Brand New Bag", "I Got You", "Godfather of Soul", "Soul/Funk", "Medium"],
  // Electronic / DJs
  ["Daft Punk", "French", "Electronic Duo", "Robot Helmets", "One More Time", "Get Lucky", "Electronic", "Easy"],
  ["Avicii", "Stockholm", "Levels", "Hey Brother", "Swedish DJ", "Wake Me Up", "Electronic", "Medium"],
  ["David Guetta", "Paris", "Without You", "Play Hard", "Titanium", "French DJ", "Electronic", "Medium"],
  // Reggae
  ["Bob Marley", "Nine Mile", "Rastafari", "Three Little Birds", "No Woman, No Cry", "Reggae Icon", "Reggae", "Easy"],
  // Additional Batch
  ["KISS", "Face Paint", "Gene Simmons", "Long Tongue", "Detroit Rock City", "Rock and Roll All Nite", "Rock", "Medium"],
  ["Def Leppard", "One-Armed Drummer", "British Heavy Metal", "Hysteria", "Photograph", "Pour Some Sugar on Me", "Rock", "Medium"],
  ["Journey", "San Francisco", "Steve Perry", "The Sopranos Finale", "Any Way You Want It", "Don't Stop Believin'", "Rock", "Easy"],
  ["The Who", "Guitar Smashing", "Tommy", "Pinball Wizard", "Baba O'Riley", "My Generation", "Rock", "Medium"],
  ["Oasis", "Manchester", "Gallagher Brothers", "Britpop", "Don't Look Back in Anger", "Wonderwall", "Rock", "Easy"],
  ["Blur", "London", "Britpop", "Damon Albarn", "Girls & Boys", "Song 2", "Rock", "Hard"],
  ["Green Day", "California", "Pop Punk", "Billie Joe Armstrong", "Basket Case", "Wake Me Up When September Ends", "Rock", "Easy"],
  ["Blink-182", "California", "Pop Punk", "Travis Barker", "I Miss You", "All the Small Things", "Rock", "Medium"],
  ["The Police", "Reggae Rock", "Stewart Copeland", "Synchronicity", "Roxanne", "Every Breath You Take", "Rock", "Medium"],
  ["Simon & Garfunkel", "Folk Duo", "The Graduate", "Mrs. Robinson", "Bridge over Troubled Water", "The Sound of Silence", "Folk/Rock", "Medium"],
  ["The Beach Boys", "Hawthorne", "Surf Rock", "Pet Sounds", "Good Vibrations", "Surfin' U.S.A.", "Rock/Pop", "Medium"],
  ["Bob Seger", "Michigan", "Heartland Rock", "Silver Bullet Band", "Night Moves", "Old Time Rock and Roll", "Rock", "Medium"],
  ["Tom Petty", "Florida", "Traveling Wilburys", "The Heartbreakers", "I Won't Back Down", "Free Fallin'", "Rock", "Medium"],
  ["John Lennon", "Yoko Ono", "New York City", "Give Peace a Chance", "The Beatles", "Imagine", "Rock/Pop", "Easy"],
  ["Paul McCartney", "Wings", "Knighted", "Live and Let Die", "The Beatles", "Hey Jude", "Rock/Pop", "Easy"],
  ["Cher", "Folk-Rock Duo", "Auto-Tune", "Moonstruck", "If I Could Turn Back Time", "Goddess of Pop", "Pop", "Easy"],
  ["Celine Dion", "Quebec", "Las Vegas Residency", "Eurovision", "It's All Coming Back to Me Now", "My Heart Will Go On", "Pop", "Easy"],
  ["Mariah Carey", "Whistle Register", "Lambs", "Hero", "Queen of Christmas", "All I Want for Christmas Is You", "Pop/R&B", "Easy"],
  ["Gwen Stefani", "No Doubt", "The Voice", "Blake Shelton", "Hollaback Girl", "Don't Speak", "Pop", "Medium"],
  ["Christina Aguilera", "Mickey Mouse Club", "The Voice", "Lady Marmalade", "Genie in a Bottle", "Beautiful", "Pop", "Easy"],
  ["Britney Spears", "Conservatorship", "Mickey Mouse Club", "Oops!... I Did It Again", "Toxic", "Princess of Pop", "Pop", "Easy"],
  ["Jennifer Lopez", "Bronx", "Selena Biopic", "J.Lo", "On the Floor", "Jenny from the Block", "Pop/Latin", "Easy"],
  ["Shania Twain", "Canadian", "Queen of Country Pop", "Come On Over", "That Don't Impress Me Much", "Man! I Feel Like a Woman!", "Country/Pop", "Easy"],
  ["Kelly Clarkson", "Texas", "Talk Show", "American Idol", "Breakaway", "Since U Been Gone", "Pop", "Medium"],
  ["P!nk", "Alecia Beth Moore", "Acrobatics", "Just Give Me a Reason", "Get the Party Started", "So What", "Pop/Rock", "Easy"],
  ["Avril Lavigne", "Canadian", "Pop Punk Queen", "Let Go", "Complicated", "Sk8er Boi", "Pop Punk", "Easy"],
  ["Sam Smith", "British", "Non-Binary", "Writing's on the Wall", "Unholy", "Stay with Me", "Pop", "Medium"],
  ["Lewis Capaldi", "Scottish", "Funny Social Media", "Peter Capaldi", "Before You Go", "Someone You Loved", "Pop", "Medium"],
  ["Charlie Puth", "YouTube", "Perfect Pitch", "Attention", "We Don't Talk Anymore", "See You Again", "Pop", "Medium"],
  ["John Mayer", "Connecticut", "Blues Guitar", "Waiting on the World to Change", "Gravity", "Your Body Is a Wonderland", "Pop/Blues", "Medium"],
  ["Johnny Cash", "Folsom Prison", "June Carter", "Man in Black", "I Walk the Line", "Ring of Fire", "Country", "Medium"],
  ["Dolly Parton", "Tennessee", "Dollywood", "9 to 5", "I Will Always Love You", "Jolene", "Country", "Easy"],
  ["Garth Brooks", "Oklahoma", "Chris Gaines", "Country Rock", "The Thunder Rolls", "Friends in Low Places", "Country", "Hard"],
  ["Carrie Underwood", "Oklahoma", "Vegan", "American Idol", "Jesus, Take the Wheel", "Before He Cheats", "Country", "Medium"],
  ["Luke Bryan", "Georgia", "American Idol Judge", "Crash My Party", "Play It Again", "Country Girl", "Country", "Medium"],
  ["Blake Shelton", "Oklahoma", "The Voice", "Gwen Stefani", "Austin", "God's Country", "Country", "Medium"],
  ["50 Cent", "New York", "Get Rich or Die Tryin'", "G-Unit", "Candy Shop", "In Da Club", "Hip Hop", "Easy"],
  ["Lil Wayne", "New Orleans", "Cash Money Records", "Tha Carter", "Lollipop", "Weezy", "Hip Hop", "Medium"],
  ["Doja Cat", "Los Angeles", "Mooo!", "Say So", "Kiss Me More", "Paint The Town Red", "Hip Hop/Pop", "Medium"],
  ["Megan Thee Stallion", "Houston", "Hot Girl Summer", "WAP", "Body", "Savage", "Hip Hop", "Medium"],
  ["John Coltrane", "North Carolina", "A Love Supreme", "Sheets of Sound", "Miles Davis Quintet", "Jazz Saxophonist", "Jazz", "Hard"],
  ["Charlie Parker", "Kansas City", "Bebop", "Ornithology", "Yardbird", "Jazz Saxophonist", "Jazz", "Hard"],
  ["Richard Wagner", "German", "Leitmotifs", "Ring Cycle", "Bridal Chorus", "Ride of the Valkyries", "Classical", "Hard"],
  ["Johann Strauss II", "Austrian", "Die Fledermaus", "The Blue Danube", "The Waltz King", "Classical Composer", "Classical", "Hard"]
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet(data);

const wscols = [
  {wch: 25}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 10}
];
ws['!cols'] = wscols;

xlsx.utils.book_append_sheet(wb, ws, "Music");

const filepath = path.join("C:\\\\Users\\\\ysfde\\\\OneDrive\\\\Desktop", 'music_en.xlsx');

try {
  xlsx.writeFile(wb, filepath);
  console.log('Successfully created file with short hints at: ' + filepath);
} catch (e) {
  console.error('Error saving file: ', e.message);
}
