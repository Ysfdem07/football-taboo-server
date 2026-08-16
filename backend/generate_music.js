const xlsx = require('xlsx');

const data = [
  ['Word', 'Hint 1', 'Hint 2', 'Hint 3', 'Hint 4', 'Hint 5', 'Category'],
  // Pop
  ['Michael Jackson', 'King of Pop', 'Moonwalk', 'Thriller', 'Billie Jean', 'White glove', 'Pop'],
  ['Madonna', 'Queen of Pop', 'Like a Virgin', 'Vogue', 'Material Girl', '80s Icon', 'Pop'],
  ['Taylor Swift', 'The Eras Tour', '1989', 'Blank Space', 'Shake It Off', 'Country to Pop', 'Pop'],
  ['Beyoncé', 'Queen Bey', "Destiny's Child", 'Single Ladies', 'Crazy in Love', 'Halo', 'Pop / R&B'],
  ['Lady Gaga', 'Born This Way', 'Poker Face', 'Bad Romance', 'Meat dress', 'A Star Is Born', 'Pop'],
  ['Ariana Grande', 'High ponytail', 'Thank U, Next', '7 Rings', 'Dangerous Woman', 'Whistle register', 'Pop'],
  ['Ed Sheeran', 'Shape of You', 'Thinking Out Loud', 'Perfect', 'British singer with red hair', 'Loop pedal', 'Pop'],
  ['Justin Bieber', 'Baby', 'Sorry', 'Canadian pop star', 'Discovered on YouTube', 'Beliebers', 'Pop'],
  ['Bruno Mars', 'Uptown Funk', '24K Magic', 'Just the Way You Are', 'Locked Out of Heaven', 'Super Bowl Halftime Show', 'Pop / R&B'],
  ['Adele', 'Rolling in the Deep', 'Someone Like You', 'Hello', 'British powerhouse vocalist', 'Albums named after her age', 'Pop'],
  // Rock & Bands
  ['The Beatles', 'John, Paul, George, Ringo', 'Hey Jude', 'Let It Be', 'Yellow Submarine', 'British Invasion', 'Rock'],
  ['Queen', 'Freddie Mercury', 'Bohemian Rhapsody', 'We Will Rock You', "Don't Stop Me Now", 'Live Aid 1985', 'Rock'],
  ['Rolling Stones', 'Mick Jagger', 'Paint It Black', 'Satisfaction', 'Start Me Up', 'British rock band', 'Rock'],
  ['Pink Floyd', 'The Dark Side of the Moon', 'The Wall', 'Wish You Were Here', 'Comfortably Numb', 'Psychedelic rock', 'Rock'],
  ['Led Zeppelin', 'Stairway to Heaven', 'Robert Plant', 'Jimmy Page', 'Immigrant Song', 'Kashmir', 'Rock'],
  ['Nirvana', 'Kurt Cobain', 'Smells Like Teen Spirit', 'Come As You Are', 'Grunge', 'Nevermind', 'Rock / Grunge'],
  ['AC/DC', 'Back in Black', 'Highway to Hell', 'Thunderstruck', 'Australian rock band', 'Schoolboy uniform', 'Rock'],
  ["Guns N' Roses", 'Axl Rose', 'Slash', "Sweet Child O' Mine", 'November Rain', 'Welcome to the Jungle', 'Rock'],
  ['Coldplay', 'Chris Martin', 'Yellow', 'Viva La Vida', 'Fix You', 'British alternative rock', 'Rock / Pop'],
  ['Elvis Presley', 'King of Rock and Roll', 'Jailhouse Rock', 'Hound Dog', "Can't Help Falling in Love", 'Graceland', 'Rock and Roll'],
  ['David Bowie', 'Ziggy Stardust', 'Space Oddity', 'Starman', 'Heroes', 'Changes', 'Rock'],
  // Jazz
  ['Louis Armstrong', 'What a Wonderful World', 'Trumpet player', 'Satchmo', 'Hello, Dolly!', 'Jazz pioneer', 'Jazz'],
  ['Frank Sinatra', 'My Way', 'Fly Me to the Moon', 'New York, New York', "Ol' Blue Eyes", 'The Rat Pack', 'Jazz / Traditional Pop'],
  ['Miles Davis', 'Kind of Blue', 'Trumpet player', 'So What', 'Jazz icon', 'Bebop', 'Jazz'],
  ['Ella Fitzgerald', 'First Lady of Song', 'Dream a Little Dream of Me', 'Summertime', 'Scat singing', 'Queen of Jazz', 'Jazz'],
  ['Duke Ellington', 'Take the A Train', "It Don't Mean a Thing", 'Jazz pianist', 'Big band leader', 'Harlem Renaissance', 'Jazz'],
  // Classical Composers
  ['Wolfgang Amadeus Mozart', 'Austrian composer', 'Eine kleine Nachtmusik', 'The Magic Flute', 'Child prodigy', 'Classical era', 'Classical'],
  ['Ludwig van Beethoven', 'German composer', 'Symphony No. 9', 'Ode to Joy', 'Fur Elise', 'Became deaf', 'Classical'],
  ['Johann Sebastian Bach', 'Baroque composer', 'Brandenburg Concertos', 'Toccata and Fugue', 'German composer', 'Cello Suites', 'Classical'],
  ['Frederic Chopin', 'Polish composer', 'Piano virtuoso', 'Nocturnes', 'Romantic era', 'Minute Waltz', 'Classical'],
  ['Pyotr Ilyich Tchaikovsky', 'Russian composer', 'Swan Lake', 'The Nutcracker', '1812 Overture', 'Romantic era', 'Classical'],
  ['Antonio Vivaldi', 'The Four Seasons', 'Italian Baroque composer', 'Violinist', 'Red Priest', 'Venice', 'Classical'],
  // Hip Hop / Rap
  ['Eminem', 'Rap God', 'Lose Yourself', 'The Real Slim Shady', 'Stan', 'Detroit rapper', 'Hip Hop'],
  ['Tupac Shakur', '2Pac', 'California Love', 'Dear Mama', 'Changes', 'West Coast hip hop', 'Hip Hop'],
  ['The Notorious B.I.G.', 'Biggie Smalls', 'Juicy', 'Hypnotize', 'Big Poppa', 'East Coast hip hop', 'Hip Hop'],
  ['Jay-Z', 'Empire State of Mind', '99 Problems', "Beyonce's husband", 'Roc Nation', 'Brooklyn rapper', 'Hip Hop'],
  ['Kanye West', 'Gold Digger', 'Stronger', 'Yeezy', 'My Beautiful Dark Twisted Fantasy', 'Chicago rapper', 'Hip Hop'],
  ['Drake', "God's Plan", 'Hotline Bling', 'Canadian rapper', 'OVO', 'In My Feelings', 'Hip Hop'],
  ['Snoop Dogg', "Drop It Like It's Hot", 'Gin and Juice', 'West Coast rapper', 'Long Beach', 'Dr. Dre collaborator', 'Hip Hop'],
  // R&B / Soul / Funk
  ['Stevie Wonder', 'Superstition', 'I Just Called to Say I Love You', "Isn't She Lovely", 'Blind singer/keyboardist', 'Motown', 'Soul / R&B'],
  ['Aretha Franklin', 'Queen of Soul', 'Respect', 'Natural Woman', 'Think', 'Gospel and R&B', 'Soul'],
  ['Whitney Houston', 'I Will Always Love You', 'I Wanna Dance with Somebody', 'The Bodyguard', 'Incredible vocal range', 'Pop / R&B'],
  ['Prince', 'Purple Rain', 'Kiss', 'When Doves Cry', 'Symbol instead of a name', 'Minneapolis sound', 'Pop / Funk'],
  ['James Brown', 'Godfather of Soul', 'I Got You (I Feel Good)', "Papa's Got a Brand New Bag", 'Get Up (I Feel Like Being a) Sex Machine', 'Funk pioneer', 'Soul / Funk'],
  // Electronic / DJs
  ['Daft Punk', 'French electronic duo', 'Robot helmets', 'Get Lucky', 'Harder, Better, Faster, Stronger', 'One More Time', 'Electronic'],
  ['Avicii', 'Wake Me Up', 'Levels', 'Swedish DJ', 'Hey Brother', 'Electronic dance music', 'Electronic'],
  ['David Guetta', 'Titanium', 'French DJ', 'Without You', 'Play Hard', 'Hey Mama', 'Electronic'],
  // Reggae
  ['Bob Marley', 'No Woman, No Cry', 'Jamaican singer', 'Reggae icon', 'Three Little Birds', 'One Love', 'Reggae']
];

const ws = xlsx.utils.aoa_to_sheet(data);

// Adjust column widths
const wscols = [
  {wch: 25},
  {wch: 35},
  {wch: 35},
  {wch: 35},
  {wch: 35},
  {wch: 35},
  {wch: 15}
];
ws['!cols'] = wscols;

const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Music");

// Save to desktop
const path = require('path');
const os = require('os');
const desktopDir = "C:\\\\Users\\\\ysfde\\\\OneDrive\\\\Desktop";
const filepath = path.join(desktopDir, 'music_en.xlsx');

try {
  xlsx.writeFile(wb, filepath);
  console.log('Successfully created file at: ' + filepath);
} catch (e) {
  console.error('Error saving file: ', e.message);
}
