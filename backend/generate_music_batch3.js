const xlsx = require('xlsx');
const path = require('path');

const newArtists = [
  // K-Pop
  ["BTS", "ARMY", "Seoul", "Boy Band", "Dynamite", "K-Pop", "Pop", "Easy"],
  ["BLACKPINK", "Blinks", "Jisoo", "Girl Group", "How You Like That", "K-Pop", "Pop", "Easy"],
  ["PSY", "South Korea", "Horse Dance", "YouTube Record", "K-Pop", "Gangnam Style", "Pop", "Easy"],
  ["EXO", "SM Entertainment", "Growl", "K-Pop", "Boy Band", "South Korea", "Pop", "Medium"],
  ["TWICE", "JYP", "Cheer Up", "Girl Group", "K-Pop", "South Korea", "Pop", "Medium"],
  // Modern Pop / Indie
  ["Lana Del Rey", "Summertime Sadness", "Video Games", "Melancholy", "Born to Die", "Indie Pop", "Pop", "Medium"],
  ["Lorde", "New Zealand", "Royals", "Green Light", "Melodrama", "Pure Heroine", "Pop", "Medium"],
  ["Olivia Rodrigo", "Disney Channel", "Drivers License", "Good 4 U", "Sour", "Vampire", "Pop", "Easy"],
  ["Sabrina Carpenter", "Disney Channel", "Girl Meets World", "Espresso", "Nonsense", "Feather", "Pop", "Medium"],
  ["Halsey", "Ashley Frangipane", "Without Me", "Closer", "Badlands", "Pop Singer", "Pop", "Medium"],
  ["Florence + The Machine", "Florence Welch", "Dog Days Are Over", "Shake It Out", "Indie Rock", "British", "Rock/Pop", "Medium"],
  ["Hozier", "Irish", "Take Me to Church", "Wasteland, Baby!", "Blues Rock", "Indie", "Rock", "Medium"],
  ["Troye Sivan", "Australian", "YouTube", "Youth", "Rush", "Bloom", "Pop", "Hard"],
  ["Charli XCX", "British", "Boom Clap", "Vroom Vroom", "Hyperpop", "Brat", "Pop", "Medium"],
  ["Carly Rae Jepsen", "Canadian", "Canadian Idol", "Call Me Maybe", "Emotion", "Pop Singer", "Pop", "Medium"],
  // Alternative / Indie Rock
  ["The Strokes", "New York", "Is This It", "Julian Casablancas", "Reptilia", "Last Nite", "Rock", "Medium"],
  ["Arctic Monkeys", "Sheffield", "Alex Turner", "Britpop", "505", "Do I Wanna Know?", "Rock", "Medium"],
  ["The Killers", "Las Vegas", "Brandon Flowers", "Hot Fuss", "Somebody Told Me", "Mr. Brightside", "Rock", "Easy"],
  ["Imagine Dragons", "Las Vegas", "Dan Reynolds", "Radioactive", "Demons", "Believer", "Rock/Pop", "Easy"],
  ["Muse", "Matt Bellamy", "British", "Supermassive Black Hole", "Uprising", "Space Rock", "Rock", "Medium"],
  ["Radiohead", "Thom Yorke", "OK Computer", "Creep", "Karma Police", "Alternative Rock", "Rock", "Hard"],
  ["The Cure", "Robert Smith", "Goth Rock", "Boys Don't Cry", "Friday I'm in Love", "Just Like Heaven", "Rock", "Hard"],
  ["Red Hot Chili Peppers", "Flea", "Anthony Kiedis", "California", "Under the Bridge", "Californication", "Rock", "Easy"],
  ["Linkin Park", "Chester Bennington", "Mike Shinoda", "Nu-Metal", "In the End", "Numb", "Rock", "Easy"],
  ["Foo Fighters", "Dave Grohl", "Everlong", "Learn to Fly", "Best of You", "The Pretender", "Rock", "Easy"],
  ["Pearl Jam", "Eddie Vedder", "Seattle", "Grunge", "Ten", "Alive", "Rock", "Medium"],
  ["Soundgarden", "Chris Cornell", "Seattle", "Grunge", "Superunknown", "Black Hole Sun", "Rock", "Medium"],
  ["Alice in Chains", "Layne Staley", "Seattle", "Grunge", "Rooster", "Man in the Box", "Rock", "Hard"],
  ["Smashing Pumpkins", "Billy Corgan", "Chicago", "Mellon Collie", "1979", "Bullet with Butterfly Wings", "Rock", "Medium"],
  ["The White Stripes", "Jack White", "Meg White", "Detroit", "Garage Rock", "Seven Nation Army", "Rock", "Medium"],
  ["The Black Keys", "Dan Auerbach", "Patrick Carney", "Akron, Ohio", "Blues Rock", "Lonely Boy", "Rock", "Medium"],
  // Emo / Pop Punk
  ["My Chemical Romance", "Gerard Way", "New Jersey", "Welcome to the Black Parade", "Helena", "Teenagers", "Rock", "Medium"],
  ["Fall Out Boy", "Pete Wentz", "Patrick Stump", "Chicago", "Sugar, We're Goin Down", "Dance, Dance", "Rock", "Medium"],
  ["Paramore", "Hayley Williams", "Tennessee", "Riot!", "Misery Business", "Ain't It Fun", "Rock", "Medium"],
  ["Panic! At The Disco", "Brendon Urie", "Las Vegas", "I Write Sins Not Tragedies", "High Hopes", "Pop Punk", "Rock/Pop", "Medium"],
  ["Twenty One Pilots", "Tyler Joseph", "Josh Dun", "Ohio", "Blurryface", "Stressed Out", "Pop/Rock", "Easy"],
  // Classic Rock / Metal
  ["Jimi Hendrix", "Guitarist", "Left-Handed", "Purple Haze", "Woodstock", "Voodoo Child", "Rock", "Easy"],
  ["The Doors", "Jim Morrison", "Los Angeles", "Ray Manzarek", "Light My Fire", "Riders on the Storm", "Rock", "Medium"],
  ["Janis Joplin", "Texas", "Gravelly Voice", "Woodstock", "Piece of My Heart", "Me and Bobby McGee", "Rock", "Hard"],
  ["Black Sabbath", "Tony Iommi", "Birmingham", "Heavy Metal", "Paranoid", "Ozzy Osbourne", "Metal", "Medium"],
  ["Ozzy Osbourne", "Prince of Darkness", "Bat Head", "Black Sabbath", "Crazy Train", "Reality TV Show", "Metal", "Medium"],
  ["Iron Maiden", "Eddie", "British Heavy Metal", "Bruce Dickinson", "The Trooper", "Run to the Hills", "Metal", "Hard"],
  ["Judas Priest", "Rob Halford", "Leather and Studs", "British Heavy Metal", "Breaking the Law", "Painkiller", "Metal", "Hard"],
  ["Megadeth", "Dave Mustaine", "Thrash Metal", "Symphony of Destruction", "Peace Sells", "Holy Wars", "Metal", "Hard"],
  ["Slayer", "Thrash Metal", "Kerry King", "Tom Araya", "Raining Blood", "Angel of Death", "Metal", "Hard"],
  ["Pantera", "Dimebag Darrell", "Phil Anselmo", "Groove Metal", "Cowboys from Hell", "Walk", "Metal", "Hard"],
  ["Slipknot", "Masks", "Corey Taylor", "Iowa", "Nu-Metal", "Duality", "Metal", "Medium"],
  ["System of a Down", "Serj Tankian", "Armenian-American", "Toxicity", "Chop Suey!", "B.Y.O.B.", "Metal", "Medium"],
  ["Korn", "Jonathan Davis", "Nu-Metal", "Bakersfield", "Freak on a Leash", "Blind", "Metal", "Medium"],
  ["Deftones", "Chino Moreno", "Sacramento", "Alternative Metal", "White Pony", "Change (In the House of Flies)", "Metal", "Hard"],
  // R&B / Soul
  ["Justin Timberlake", "Mickey Mouse Club", "NSYNC", "Cry Me a River", "SexyBack", "Mirrors", "Pop/R&B", "Easy"],
  ["Chris Brown", "Virginia", "Dancer", "Run It!", "Kiss Kiss", "Loyal", "R&B", "Medium"],
  ["Frank Ocean", "Odd Future", "Blonde", "Channel Orange", "Thinkin Bout You", "Novacane", "R&B", "Medium"],
  ["SZA", "TDE", "Ctrl", "SOS", "Kill Bill", "Good Days", "R&B", "Medium"],
  ["Alicia Keys", "New York", "Pianist", "Fallin'", "No One", "Girl on Fire", "R&B", "Easy"],
  ["John Legend", "EGOT Winner", "Chrissy Teigen", "Pianist", "Ordinary People", "All of Me", "R&B", "Easy"],
  ["Usher", "Atlanta", "Confessions", "Yeah!", "Burn", "Super Bowl LVIII", "R&B", "Easy"],
  ["TLC", "Tionne, Lisa, Crystal", "Atlanta", "Girl Group", "No Scrubs", "Waterfalls", "R&B", "Medium"],
  ["Destiny's Child", "Houston", "Girl Group", "Kelly Rowland", "Say My Name", "Survivor", "R&B", "Easy"],
  // Rap / Hip Hop additions
  ["Dr. Dre", "Compton", "N.W.A", "Beats Headphones", "The Chronic", "Still D.R.E.", "Hip Hop", "Easy"],
  ["Ice Cube", "Compton", "N.W.A", "Actor", "Friday", "It Was a Good Day", "Hip Hop", "Medium"],
  ["Eazy-E", "Compton", "N.W.A", "Ruthless Records", "Godfather of Gangsta Rap", "Boyz-n-the-Hood", "Hip Hop", "Hard"],
  ["Wu-Tang Clan", "Staten Island", "RZA", "Method Man", "C.R.E.A.M.", "Protect Ya Neck", "Hip Hop", "Medium"],
  ["Outkast", "Atlanta", "Andre 3000", "Big Boi", "Ms. Jackson", "Hey Ya!", "Hip Hop", "Easy"],
  ["Lil Nas X", "Georgia", "Internet Personality", "Country Rap", "Montero", "Old Town Road", "Hip Hop", "Easy"],
  ["Future", "Atlanta", "Mumble Rap", "Trap Music", "Mask Off", "Life Is Good", "Hip Hop", "Medium"],
  ["Migos", "Quavo", "Offset", "Takeoff", "Bad and Boujee", "Versace", "Hip Hop", "Medium"],
  ["21 Savage", "London Born", "Atlanta Raised", "Slaughter Gang", "Bank Account", "A Lot", "Hip Hop", "Medium"],
  ["Tyler, The Creator", "Odd Future", "California", "Igor", "Yonkers", "See You Again", "Hip Hop", "Medium"],
  ["ASAP Rocky", "Harlem", "Rihanna", "Testing", "Praise The Lord", "F**kin' Problems", "Hip Hop", "Medium"],
  // Latin / Reggaeton
  ["J Balvin", "Colombia", "Reggaeton", "Colores", "Mi Gente", "Ginza", "Latin", "Easy"],
  ["Maluma", "Colombia", "Reggaeton", "Pretty Boy", "Hawái", "Felices los 4", "Latin", "Medium"],
  ["Rosalía", "Spain", "Flamenco", "Motomami", "Malamente", "Despechá", "Latin", "Medium"],
  ["Luis Fonsi", "Puerto Rico", "Latin Pop", "Echame La Culpa", "Daddy Yankee", "Despacito", "Latin", "Easy"],
  ["Daddy Yankee", "Puerto Rico", "King of Reggaeton", "Barrio Fino", "Gasolina", "Con Calma", "Latin", "Easy"],
  ["Pitbull", "Miami", "Mr. 305", "Mr. Worldwide", "Timber", "Give Me Everything", "Pop/Latin", "Easy"],
  ["Marc Anthony", "New York", "Salsa", "Jennifer Lopez", "Vivir Mi Vida", "You Sang to Me", "Latin", "Medium"],
  ["Romeo Santos", "Bronx", "Aventura", "Bachata", "Propuesta Indecente", "Obsesión", "Latin", "Medium"],
  ["Gloria Estefan", "Cuba", "Miami Sound Machine", "Conga", "Rhythm Is Gonna Get You", "Let It Loose", "Latin", "Medium"],
  // Reggae / Ska
  ["Sean Paul", "Jamaica", "Dancehall", "Dutty Rock", "Temperature", "Get Busy", "Reggae", "Easy"],
  ["Shaggy", "Jamaica", "Reggae Fusion", "Mr. Boombastic", "It Wasn't Me", "Angel", "Reggae", "Medium"],
  ["UB40", "Birmingham", "Reggae Pop", "Labour of Love", "Red Red Wine", "Can't Help Falling in Love", "Reggae", "Medium"],
  // Blues
  ["B.B. King", "Mississippi", "Lucille", "Blues Guitarist", "The Thrill Is Gone", "King of the Blues", "Blues", "Medium"],
  ["Muddy Waters", "Mississippi", "Chicago Blues", "Hoochie Coochie Man", "Rollin' Stone", "Father of Modern Chicago Blues", "Blues", "Hard"],
  ["John Lee Hooker", "Mississippi", "Delta Blues", "Boom Boom", "One Bourbon", "Boogie Chillen'", "Blues", "Hard"],
  ["Etta James", "Los Angeles", "Chess Records", "At Last", "I'd Rather Go Blind", "Blues Singer", "Blues", "Medium"],
  ["Stevie Ray Vaughan", "Texas", "Fender Stratocaster", "Double Trouble", "Texas Flood", "Pride and Joy", "Blues", "Medium"],
  ["Eric Clapton", "British", "The Yardbirds", "Cream", "Layla", "Tears in Heaven", "Rock/Blues", "Medium"],
  // Pop additions
  ["One Direction", "X Factor", "Simon Cowell", "Harry Styles", "What Makes You Beautiful", "Story of My Life", "Pop", "Easy"],
  ["Zayn Malik", "British", "One Direction", "Gigi Hadid", "Pillowtalk", "Dusk Till Dawn", "Pop", "Medium"],
  ["Niall Horan", "Irish", "One Direction", "Guitarist", "Slow Hands", "This Town", "Pop", "Medium"],
  ["Liam Payne", "British", "One Direction", "Cheryl", "Strip That Down", "Familiar", "Pop", "Medium"],
  ["Louis Tomlinson", "British", "One Direction", "Walls", "Back to You", "Just Hold On", "Pop", "Medium"],
  ["Camila Cabello", "Cuba", "Fifth Harmony", "Shawn Mendes", "Havana", "Senorita", "Pop", "Easy"],
  ["Fifth Harmony", "X Factor", "Girl Group", "Normani", "Worth It", "Work from Home", "Pop", "Medium"],
  ["Little Mix", "X Factor", "British", "Girl Group", "Black Magic", "Shout Out to My Ex", "Pop", "Medium"],
  ["Jonas Brothers", "Nick, Joe, Kevin", "Disney Channel", "Camp Rock", "Sucker", "Burnin' Up", "Pop", "Easy"],
  ["Backstreet Boys", "Orlando", "Boy Band", "Nick Carter", "Everybody", "I Want It That Way", "Pop", "Easy"],
  ["NSYNC", "Orlando", "Boy Band", "Justin Timberlake", "Bye Bye Bye", "It's Gonna Be Me", "Pop", "Easy"],
  ["Spice Girls", "British", "Girl Group", "Victoria Beckham", "Scary, Sporty, Baby, Ginger, Posh", "Wannabe", "Pop", "Easy"],
  ["Destiny's Child", "Houston", "Girl Group", "Kelly Rowland", "Say My Name", "Survivor", "R&B", "Easy"],
  ["The Pussycat Dolls", "Los Angeles", "Nicole Scherzinger", "Burlesque", "Buttons", "Don't Cha", "Pop", "Medium"],
  ["Maroon 5", "Los Angeles", "Adam Levine", "Songs About Jane", "Moves Like Jagger", "Sugar", "Pop", "Easy"],
  ["OneRepublic", "Colorado", "Ryan Tedder", "Apologize", "Counting Stars", "Secrets", "Pop/Rock", "Medium"],
  ["The Script", "Irish", "Danny O'Donoghue", "The Man Who Can't Be Moved", "Breakeven", "Hall of Fame", "Pop/Rock", "Medium"],
  ["Train", "San Francisco", "Pat Monahan", "Drops of Jupiter", "Drive By", "Hey, Soul Sister", "Pop/Rock", "Medium"],
  ["Jason Mraz", "Virginia", "Fedora", "Acoustic Pop", "I'm Yours", "I Won't Give Up", "Pop", "Medium"],
  ["Jack Johnson", "Hawaii", "Surfer", "Acoustic", "Banana Pancakes", "Better Together", "Pop", "Medium"],
  ["John Denver", "Acoustic Guitar", "Country Folk", "Take Me Home, Country Roads", "Annie's Song", "Rocky Mountain High", "Folk", "Medium"],
  ["Simon & Garfunkel", "Folk Duo", "The Graduate", "Mrs. Robinson", "Bridge over Troubled Water", "The Sound of Silence", "Folk", "Medium"],
  ["ABBA", "Swedish", "Eurovision", "Mamma Mia", "Waterloo", "Dancing Queen", "Pop", "Easy"],
  ["Elton John", "British", "Pianist", "Rocket Man", "Tiny Dancer", "Your Song", "Pop", "Easy"],
  ["Billy Joel", "New York", "Pianist", "Uptown Girl", "We Didn't Start the Fire", "Piano Man", "Pop", "Easy"],
  ["Lionel Richie", "The Commodores", "American Idol", "All Night Long", "Hello", "Endless Love", "Pop", "Medium"],
  ["Phil Collins", "Genesis", "Drummer", "Tarzan", "Against All Odds", "In the Air Tonight", "Pop", "Medium"],
  ["George Michael", "Wham!", "British", "Faith", "Careless Whisper", "Last Christmas", "Pop", "Easy"],
  ["Cyndi Lauper", "New York", "Colorful Hair", "Time After Time", "True Colors", "Girls Just Want to Have Fun", "Pop", "Medium"],
  ["Kylie Minogue", "Australian", "Soap Opera", "Spinning Around", "Love at First Sight", "Can't Get You Out of My Head", "Pop", "Medium"],
  ["Ricky Martin", "Puerto Rico", "Menudo", "Livin' la Vida Loca", "She Bangs", "The Cup of Life", "Latin/Pop", "Medium"],
  ["Enrique Iglesias", "Spanish", "Julio Iglesias", "Hero", "Bailando", "I Like It", "Latin/Pop", "Medium"],
  ["Shakira", "Colombia", "Belly Dancing", "Waka Waka", "Whenever, Wherever", "Hips Don't Lie", "Latin/Pop", "Easy"]
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
