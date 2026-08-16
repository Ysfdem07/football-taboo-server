const xlsx = require('xlsx');
const path = require('path');

const newArtists = [
  // 1990s Pop & R&B
  ["Spice Girls", "British", "Wannabe", "Girl Power", "Posh Spice", "Girl Group", "Pop", "Easy"],
  ["Backstreet Boys", "Boy Band", "I Want It That Way", "Everybody", "Nick Carter", "Boy Band", "Pop", "Easy"],
  ["NSYNC", "Justin Timberlake", "Bye Bye Bye", "Tearin' Up My Heart", "Boy Band", "Pop", "Easy"],
  ["Britney Spears", "Toxic", "Oops!... I Did It Again", "Free Britney", "Pop Princess", "Pop", "Easy"],
  ["Christina Aguilera", "Genie in a Bottle", "Beautiful", "Dirrty", "The Voice", "Pop Singer", "Pop", "Medium"],
  ["Destiny's Child", "Beyoncé", "Survivor", "Say My Name", "Kelly Rowland", "Girl Group", "R&B", "Easy"],
  ["TLC", "Waterfalls", "No Scrubs", "CrazySexyCool", "Left Eye", "Girl Group", "R&B", "Medium"],
  ["Boyz II Men", "End of the Road", "I'll Make Love to You", "Motownphilly", "R&B Group", "R&B", "Medium"],
  ["Janet Jackson", "Rhythm Nation", "Michael's Sister", "That's the Way Love Goes", "Super Bowl", "Pop/R&B Singer", "Pop", "Medium"],
  ["Ricky Martin", "Livin' la Vida Loca", "She Bangs", "Menudo", "Puerto Rican", "Latin Pop", "Pop", "Easy"],

  // Reggae & Ska & World
  ["Bob Marley", "Jamaican", "Reggae", "No Woman, No Cry", "One Love", "Reggae Legend", "Reggae", "Easy"],
  ["Sean Paul", "Jamaican", "Temperature", "Get Busy", "Dancehall", "Reggae Artist", "Reggae/Dancehall", "Medium"],
  ["Shaggy", "It Wasn't Me", "Boombastic", "Jamaican", "Angel", "Reggae Artist", "Reggae", "Easy"],
  ["UB40", "British Reggae", "Red Red Wine", "Can't Help Falling In Love", "Kingston Town", "Reggae Band", "Reggae", "Hard"],
  ["Inner Circle", "Bad Boys", "Sweat (A La La La La Long)", "Jamaican", "Reggae", "Reggae Band", "Reggae", "Hard"],
  ["Peter Tosh", "The Wailers", "Legalize It", "Jamaican", "Reggae", "Reggae Legend", "Reggae", "Hard"],
  ["Jimmy Cliff", "I Can See Clearly Now", "The Harder They Come", "Jamaican", "Reggae", "Reggae Legend", "Reggae", "Hard"],
  ["Damian Marley", "Welcome to Jamrock", "Bob's Son", "Reggae", "Jamaican", "Reggae Artist", "Reggae", "Medium"],
  ["No Doubt", "Gwen Stefani", "Don't Speak", "Just a Girl", "Ska Punk", "Rock Band", "Ska/Rock", "Medium"],
  ["Sublime", "Santeria", "What I Got", "Bradley Nowell", "Ska Punk", "Rock Band", "Ska/Rock", "Medium"],

  // 1980s New Wave / Synth Pop / Pop
  ["Madonna", "Queen of Pop", "Like a Virgin", "Material Girl", "Vogue", "Pop Icon", "Pop", "Easy"],
  ["Michael Jackson", "King of Pop", "Thriller", "Moonwalk", "Billie Jean", "Pop Icon", "Pop", "Easy"],
  ["Prince", "Purple Rain", "Kiss", "When Doves Cry", "Minneapolis", "Pop Icon", "Pop/Rock", "Easy"],
  ["George Michael", "Wham!", "Careless Whisper", "Faith", "Last Christmas", "Pop Singer", "Pop", "Medium"],
  ["Duran Duran", "British", "Hungry Like the Wolf", "Rio", "New Wave", "Rock Band", "New Wave", "Medium"],
  ["Depeche Mode", "British", "Enjoy the Silence", "Personal Jesus", "Synth Pop", "Electronic Band", "Synth Pop", "Medium"],
  ["Eurythmics", "Annie Lennox", "Sweet Dreams", "Here Comes the Rain Again", "Synth Pop", "Pop Duo", "Synth Pop", "Medium"],
  ["Tears for Fears", "Everybody Wants to Rule the World", "Shout", "British", "New Wave", "Pop Duo", "New Wave", "Medium"],
  ["A-ha", "Norwegian", "Take On Me", "The Sun Always Shines on T.V.", "Synth Pop", "Pop Band", "Synth Pop", "Medium"],
  ["Cyndi Lauper", "Girls Just Want to Have Fun", "Time After Time", "True Colors", "80s Pop", "Pop Singer", "Pop", "Medium"],

  // 1970s Classic Rock / Prog Rock / Punk
  ["The Rolling Stones", "Mick Jagger", "Keith Richards", "Paint It Black", "(I Can't Get No) Satisfaction", "Rock Band", "Rock", "Easy"],
  ["The Who", "British", "Baba O'Riley", "My Generation", "Pete Townshend", "Rock Band", "Rock", "Medium"],
  ["Pink Floyd", "The Wall", "Dark Side of the Moon", "Wish You Were Here", "Roger Waters", "Rock Band", "Prog Rock", "Easy"],
  ["Genesis", "Phil Collins", "Peter Gabriel", "Invisible Touch", "Prog Rock", "Rock Band", "Prog Rock", "Hard"],
  ["Yes", "Owner of a Lonely Heart", "Roundabout", "Prog Rock", "British", "Rock Band", "Prog Rock", "Hard"],
  ["Rush", "Canadian", "Tom Sawyer", "Geddy Lee", "Neil Peart", "Rock Band", "Prog Rock", "Hard"],
  ["Jethro Tull", "Flute", "Aqualung", "Ian Anderson", "Thick as a Brick", "Rock Band", "Prog Rock", "Hard"],
  ["The Doors", "Jim Morrison", "Light My Fire", "Riders on the Storm", "Lizard King", "Rock Band", "Rock", "Medium"],
  ["Creedence Clearwater Revival", "CCR", "Fortunate Son", "Have You Ever Seen the Rain", "John Fogerty", "Rock Band", "Rock", "Medium"],
  ["Lynyrd Skynyrd", "Sweet Home Alabama", "Free Bird", "Southern Rock", "Plane Crash", "Rock Band", "Rock", "Medium"],
  
  // 2000s Pop Punk / Emo
  ["Green Day", "American Idiot", "Boulevard of Broken Dreams", "Billie Joe Armstrong", "Pop Punk", "Rock Band", "Rock", "Easy"],
  ["Blink-182", "All the Small Things", "I Miss You", "Travis Barker", "Pop Punk", "Rock Band", "Rock", "Easy"],
  ["My Chemical Romance", "Welcome to the Black Parade", "Gerard Way", "Teenagers", "Emo", "Rock Band", "Rock", "Medium"],
  ["Fall Out Boy", "Sugar, We're Goin Down", "Dance, Dance", "Pete Wentz", "Pop Punk", "Rock Band", "Rock", "Medium"],
  ["Paramore", "Hayley Williams", "Misery Business", "Ain't It Fun", "Still Into You", "Rock Band", "Rock", "Medium"],
  ["Panic! At The Disco", "Brendon Urie", "I Write Sins Not Tragedies", "High Hopes", "Las Vegas", "Pop Rock Band", "Rock", "Medium"],
  ["Avril Lavigne", "Canadian", "Sk8er Boi", "Complicated", "Pop Punk Queen", "Pop Singer", "Pop Rock", "Easy"],
  ["Good Charlotte", "The Anthem", "Lifestyles of the Rich and Famous", "Madden Twins", "Pop Punk", "Rock Band", "Rock", "Hard"],
  ["Sum 41", "Canadian", "Fat Lip", "In Too Deep", "Pop Punk", "Rock Band", "Rock", "Hard"],
  ["Simple Plan", "Canadian", "Perfect", "I'm Just a Kid", "Welcome to My Life", "Pop Punk", "Rock Band", "Hard"],

  // Old School Rap / Hip Hop Legends
  ["Tupac Shakur", "2Pac", "California Love", "Dear Mama", "West Coast", "Rap Legend", "Hip Hop", "Easy"],
  ["The Notorious B.I.G.", "Biggie Smalls", "Juicy", "Hypnotize", "East Coast", "Rap Legend", "Hip Hop", "Easy"],
  ["Eminem", "Slim Shady", "Lose Yourself", "8 Mile", "Detroit", "Rap Legend", "Hip Hop", "Easy"],
  ["Snoop Dogg", "Drop It Like It's Hot", "Gin and Juice", "West Coast", "Dr. Dre", "Rap Legend", "Hip Hop", "Easy"],
  ["Dr. Dre", "Beats", "N.W.A", "The Chronic", "Still D.R.E.", "Rap Producer", "Hip Hop", "Medium"],
  ["Ice Cube", "N.W.A", "It Was a Good Day", "Friday (Movie)", "West Coast", "Rapper/Actor", "Hip Hop", "Medium"],
  ["Jay-Z", "Beyoncé", "Empire State of Mind", "99 Problems", "Roc-A-Fella", "Rap Legend", "Hip Hop", "Easy"],
  ["Nas", "Illmatic", "N.Y. State of Mind", "If I Ruled the World", "Queensbridge", "Rap Legend", "Hip Hop", "Medium"],
  ["Wu-Tang Clan", "C.R.E.A.M.", "Protect Ya Neck", "Staten Island", "RZA", "Rap Group", "Hip Hop", "Medium"],
  ["Outkast", "Hey Ya!", "Ms. Jackson", "Andre 3000", "Big Boi", "Rap Duo", "Hip Hop", "Medium"],

  // R&B / Neo Soul
  ["Alicia Keys", "Piano", "Fallin'", "No One", "If I Ain't Got You", "R&B Singer", "R&B", "Easy"],
  ["John Legend", "Piano", "All of Me", "Ordinary People", "Chrissy Teigen", "R&B Singer", "R&B", "Easy"],
  ["Usher", "Yeah!", "Confessions", "U Got It Bad", "Burn", "R&B Singer", "R&B", "Easy"],
  ["Chris Brown", "Run It!", "Kiss Kiss", "With You", "Dancer", "R&B Singer", "R&B", "Medium"],
  ["The Weeknd", "Canadian", "Blinding Lights", "Starboy", "Can't Feel My Face", "Pop/R&B Singer", "Pop/R&B", "Easy"],
  ["Frank Ocean", "Blonde", "Channel Orange", "Thinkin Bout You", "Odd Future", "R&B Singer", "R&B", "Medium"],
  ["Erykah Badu", "On & On", "Tyrone", "Neo Soul", "Headwraps", "R&B Singer", "R&B", "Hard"],
  ["Lauryn Hill", "The Fugees", "Doo Wop (That Thing)", "Killing Me Softly", "Miseducation", "R&B/Rap Legend", "R&B", "Medium"],
  ["Mary J. Blige", "Family Affair", "Real Love", "Queen of Hip-Hop Soul", "No More Drama", "R&B Singer", "R&B", "Medium"],
  ["Sade", "Smooth Operator", "British", "No Ordinary Love", "Soul", "R&B Band/Singer", "R&B", "Medium"],

  // Electronic / Dance / House
  ["Daft Punk", "Helmets", "Get Lucky", "Harder Better Faster Stronger", "French Duo", "Electronic", "Electronic", "Easy"],
  ["David Guetta", "French", "Titanium", "Without You", "DJ", "Electronic", "Electronic", "Easy"],
  ["Calvin Harris", "Scottish", "Summer", "Feel So Close", "This Is What You Came For", "DJ", "Electronic", "Easy"],
  ["Skrillex", "Dubstep", "Bangarang", "Scary Monsters and Nice Sprites", "Jack Ü", "DJ", "Electronic", "Medium"],
  ["Diplo", "Major Lazer", "Lean On", "Jack Ü", "DJ", "Electronic", "Electronic", "Medium"],
  ["Avicii", "Swedish", "Wake Me Up", "Levels", "Hey Brother", "DJ", "Electronic", "Easy"],
  ["Kygo", "Norwegian", "Tropical House", "Firestone", "It Ain't Me", "DJ", "Electronic", "Medium"],
  ["DJ Snake", "French", "Turn Down for What", "Taki Taki", "Lean On", "DJ", "Electronic", "Medium"],
  ["Marshmello", "Helmet", "Happier", "Alone", "Silence", "DJ", "Electronic", "Easy"],
  ["The Chainsmokers", "Closer", "Don't Let Me Down", "Something Just Like This", "DJ Duo", "Electronic", "Easy"],

  // Female Pop / Alt Icons
  ["Lana Del Rey", "Summertime Sadness", "Born to Die", "Video Games", "Cinematic", "Pop Singer", "Alternative", "Medium"],
  ["Billie Eilish", "Bad Guy", "Ocean Eyes", "Finneas", "Green Hair", "Pop Singer", "Alternative", "Easy"],
  ["SZA", "Kill Bill", "Ctrl", "Good Days", "TDE", "R&B Singer", "R&B", "Medium"],
  ["Doja Cat", "Say So", "Kiss Me More", "Paint The Town Red", "Rapper/Singer", "Pop/Rap", "Easy"],
  ["Megan Thee Stallion", "Savage", "WAP", "Houston", "Hot Girl Summer", "Rapper", "Hip Hop", "Medium"],
  ["Cardi B", "Bodak Yellow", "WAP", "I Like It", "Offset", "Rapper", "Hip Hop", "Easy"],
  ["Nicki Minaj", "Super Bass", "Anaconda", "Starships", "Barbz", "Rapper", "Hip Hop", "Easy"],
  ["Kesha", "Tik Tok", "We R Who We R", "Glitter", "Die Young", "Pop Singer", "Pop", "Medium"],
  ["Katy Perry", "Firework", "Roar", "Teenage Dream", "California Gurls", "Pop Singer", "Pop", "Easy"],
  ["Lady Gaga", "Poker Face", "Bad Romance", "Meat Dress", "Born This Way", "Pop Icon", "Pop", "Easy"],

  // UK Indie / Britpop
  ["Oasis", "Wonderwall", "Don't Look Back in Anger", "Gallagher Brothers", "Britpop", "Rock Band", "Rock", "Easy"],
  ["Blur", "Song 2", "Parklife", "Damon Albarn", "Britpop", "Rock Band", "Rock", "Medium"],
  ["Gorillaz", "Virtual Band", "Feel Good Inc.", "Clint Eastwood", "Damon Albarn", "Alternative", "Alternative", "Medium"],
  ["Coldplay", "Yellow", "Viva La Vida", "Chris Martin", "Fix You", "Rock Band", "Rock", "Easy"],
  ["Muse", "Supermassive Black Hole", "Uprising", "Matt Bellamy", "Starlight", "Rock Band", "Rock", "Medium"],
  ["Kasabian", "British", "Club Foot", "Fire", "Indie Rock", "Rock Band", "Rock", "Hard"],
  ["The Stone Roses", "British", "Fools Gold", "I Wanna Be Adored", "Madchester", "Rock Band", "Rock", "Hard"],
  ["Pulp", "Common People", "Jarvis Cocker", "Britpop", "Disco 2000", "Rock Band", "Rock", "Hard"],
  ["Snow Patrol", "Chasing Cars", "Run", "Scottish/Irish", "Alternative", "Rock Band", "Rock", "Hard"],
  ["Keane", "Somewhere Only We Know", "Everybody's Changing", "Piano Rock", "British", "Rock Band", "Rock", "Hard"],

  // Acoustic / Folk / Singer-Songwriter
  ["Ed Sheeran", "Shape of You", "Perfect", "Thinking Out Loud", "Ginger Hair", "Pop Singer", "Pop", "Easy"],
  ["Jason Mraz", "I'm Yours", "Lucky", "Fedora", "Acoustic", "Pop Singer", "Pop", "Medium"],
  ["Jack Johnson", "Banana Pancakes", "Better Together", "Surfer", "Acoustic", "Singer-Songwriter", "Acoustic", "Medium"],
  ["John Mayer", "Your Body Is a Wonderland", "Gravity", "Waiting on the World to Change", "Guitarist", "Singer-Songwriter", "Pop/Blues", "Medium"],
  ["Tracy Chapman", "Fast Car", "Give Me One Reason", "Talkin' 'bout a Revolution", "Folk", "Singer-Songwriter", "Folk", "Medium"],
  ["Joni Mitchell", "Big Yellow Taxi", "A Case of You", "Canadian", "Folk", "Singer-Songwriter", "Folk", "Hard"],
  ["Bob Dylan", "Like a Rolling Stone", "Blowin' in the Wind", "Harmonica", "Nobel Prize", "Folk Legend", "Folk", "Medium"],
  ["Simon & Garfunkel", "The Sound of Silence", "Mrs. Robinson", "Bridge Over Troubled Water", "Folk Duo", "Folk", "Medium"],
  ["James Taylor", "Fire and Rain", "You've Got a Friend", "Carolina in My Mind", "Acoustic", "Singer-Songwriter", "Folk", "Hard"],
  ["Cat Stevens", "Wild World", "Father and Son", "Peace Train", "Yusuf Islam", "Singer-Songwriter", "Folk", "Hard"],
  
  // Latin / Spanish / Global Additions
  ["Romeo Santos", "Bachata", "Propuesta Indecente", "Aventura", "King of Bachata", "Latin Singer", "Latin", "Medium"],
  ["Aventura", "Obsesión", "Bachata", "Romeo Santos", "Dominican", "Latin Band", "Latin", "Hard"],
  ["Julio Iglesias", "Spanish", "Enrique's Father", "To All the Girls I've Loved Before", "Latin Legend", "Latin Singer", "Latin", "Hard"],
  ["Juanes", "Colombian", "La Camisa Negra", "A Dios le Pido", "Rock en Español", "Latin Singer", "Latin", "Hard"],
  ["Camila", "Mexican", "Mientes", "Todo Cambió", "Pop Rock", "Latin Band", "Latin", "Hard"],
  ["Thalía", "Mexican", "Piel Morena", "Amor a la Mexicana", "Telenovela", "Latin Singer", "Latin", "Hard"],
  ["Luis Miguel", "Mexican", "La Incondicional", "El Sol de México", "Bolero", "Latin Singer", "Latin", "Hard"]
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
