const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const data2 = [
  // Pop/Rock
  ["KISS", "Known for their face paint and stage outfits", "Their fans are called the KISS Army", "Bassist Gene Simmons is famous for his long tongue", "Hits include 'Detroit Rock City'", "Famous for 'Rock and Roll All Nite'", "Rock", "Medium"],
  ["Def Leppard", "Part of the New Wave of British Heavy Metal", "Their drummer Rick Allen lost his left arm in a car crash but continued to play", "Their album 'Hysteria' is a hard rock classic", "Hits include 'Photograph'", "Famous for 'Pour Some Sugar on Me'", "Rock", "Medium"],
  ["Journey", "Formed in San Francisco in 1973", "Former lead singer was Steve Perry", "Their song was famously used in the finale of The Sopranos", "Hits include 'Any Way You Want It'", "Famous for the anthem 'Don\\'t Stop Believin\\''", "Rock", "Easy"],
  ["Fleetwood Mac", "Their album 'Rumours' is one of the best-selling of all time", "Band members included Stevie Nicks and Lindsey Buckingham", "Known for internal romantic drama", "Hits include 'The Chain'", "Famous for the song 'Dreams'", "Rock", "Easy"],
  ["The Who", "Destroyed guitars and drums on stage", "Created the rock opera 'Tommy'", "Hits include 'Pinball Wizard'", "Hits include 'Baba O\\'Riley' and 'My Generation'", "Famous British rock band featuring Roger Daltrey and Pete Townshend", "Rock", "Medium"],
  ["Oasis", "Formed in Manchester, England", "Led by the famously feisty Gallagher brothers, Noel and Liam", "Their second album 'What\\'s the Story Morning Glory' was a massive hit", "Hits include 'Don\\'t Look Back in Anger'", "Famous for the song 'Wonderwall'", "Rock", "Easy"],
  ["Blur", "Formed in London", "Key band in the Britpop movement", "Fronted by Damon Albarn", "Hits include 'Girls & Boys'", "Famous for the 'woo-hoo' song 'Song 2'", "Rock", "Hard"],
  ["Green Day", "Punk rock band from California", "Created the rock opera 'American Idiot'", "Fronted by Billie Joe Armstrong", "Hits include 'Basket Case'", "Famous for 'Wake Me Up When September Ends'", "Rock", "Easy"],
  ["Blink-182", "Pop-punk band from California", "Known for their humorous and immature music videos", "Drummer is Travis Barker", "Hits include 'I Miss You'", "Famous for 'All the Small Things'", "Rock", "Medium"],
  ["The Police", "British rock band with reggae influences", "Their final album was 'Synchronicity'", "Drummer Stewart Copeland and guitarist Andy Summers", "Hits include 'Roxanne'", "Fronted by Sting, famous for 'Every Breath You Take'", "Rock", "Medium"],
  ["Simon & Garfunkel", "Folk-rock duo", "Recorded the soundtrack for the film 'The Graduate'", "Their final studio album was 'Bridge over Troubled Water'", "Hits include 'Mrs. Robinson'", "Famous for 'The Sound of Silence'", "Folk/Rock", "Medium"],
  ["The Beach Boys", "Formed in Hawthorne, California", "Their album 'Pet Sounds' is highly influential", "Known for their vocal harmonies and surf rock sound", "Hits include 'Good Vibrations'", "Famous for 'Surfin\\' U.S.A.' and 'California Girls'", "Rock/Pop", "Medium"],
  ["Bob Seger", "Heartland rock artist from Michigan", "Backed by the Silver Bullet Band", "His songs were often featured in Tom Cruise movies (Risky Business)", "Hits include 'Night Moves'", "Famous for 'Old Time Rock and Roll'", "Rock", "Medium"],
  ["Tom Petty", "Fronted the Heartbreakers", "Part of the supergroup Traveling Wilburys", "Fought against his record label over album pricing", "Hits include 'I Won\\'t Back Down'", "Famous for 'Free Fallin\\''", "Rock", "Medium"],
  ["John Lennon", "Assassinated in New York City in 1980", "Married to Yoko Ono", "Wrote 'Give Peace a Chance'", "Former member of The Beatles", "Famous for his solo song 'Imagine'", "Rock/Pop", "Easy"],
  ["Paul McCartney", "Knighted by Queen Elizabeth II", "Formed the band Wings after his previous band broke up", "Wrote the James Bond theme 'Live and Let Die'", "Former member of The Beatles", "Famous for writing 'Yesterday' and 'Hey Jude'", "Rock/Pop", "Easy"],
  // More Pop
  ["Cher", "Started as half of a folk-rock husband-and-wife duo", "Won an Oscar for her role in Moonstruck", "Known as the Goddess of Pop", "Pioneered the use of Auto-Tune on her hit 'Believe'", "Famous for her extravagant outfits and the song 'If I Could Turn Back Time'", "Pop", "Easy"],
  ["Celine Dion", "Born in Quebec, Canada", "Won the Eurovision Song Contest representing Switzerland", "Has a residency in Las Vegas", "Hits include 'It\\'s All Coming Back to Me Now'", "Famous for singing 'My Heart Will Go On' from Titanic", "Pop", "Easy"],
  ["Mariah Carey", "Known for her five-octave vocal range and whistle register", "Her fans are called 'Lambs'", "Hits include 'Hero' and 'We Belong Together'", "Known as the Queen of Christmas", "Famous for 'All I Want for Christmas Is You'", "Pop/R&B", "Easy"],
  ["Gwen Stefani", "Started as the lead singer of the ska-punk band No Doubt", "Served as a coach on The Voice", "Married to country singer Blake Shelton", "Hits include 'Don\\'t Speak' and 'Hollaback Girl'", "Famous for spelling 'B-A-N-A-N-A-S'", "Pop", "Medium"],
  ["Christina Aguilera", "Started on The Mickey Mouse Club with Britney Spears and Justin Timberlake", "Served as a coach on The Voice", "Hits include 'Genie in a Bottle' and 'Beautiful'", "Sang 'Lady Marmalade' for the Moulin Rouge soundtrack", "Famous for her powerful pop vocals", "Pop", "Easy"],
  ["Britney Spears", "Her debut single was '...Baby One More Time'", "Known as the Princess of Pop", "Had a highly publicized conservatorship battle", "Hits include 'Oops!... I Did It Again'", "Famous for 'Toxic'", "Pop", "Easy"],
  ["Jennifer Lopez", "Also known as J.Lo", "Starred in the biopic Selena", "Performed at the Super Bowl LIV halftime show with Shakira", "Hits include 'Love Don\\'t Cost a Thing'", "Famous for 'Jenny from the Block' and 'On the Floor'", "Pop/Latin", "Easy"],
  ["Shania Twain", "Canadian singer known as the Queen of Country Pop", "Her album 'Come On Over' is the best-selling country album of all time", "Hits include 'That Don\\'t Impress Me Much'", "Hits include 'You\\'re Still the One'", "Famous for 'Man! I Feel Like a Woman!'", "Country/Pop", "Easy"],
  ["Kelly Clarkson", "Won the first season of American Idol", "Hosts her own daytime talk show", "Hits include 'A Moment Like This' and 'Breakaway'", "Hits include 'Stronger (What Doesn\\'t Kill You)'", "Famous for the anthem 'Since U Been Gone'", "Pop", "Medium"],
  ["P!nk", "Her real name is Alecia Beth Moore", "Known for her acrobatic aerial performances during concerts", "Hits include 'Get the Party Started'", "Hits include 'Just Give Me a Reason'", "Famous for 'So What'", "Pop/Rock", "Easy"],
  ["Avril Lavigne", "Canadian singer known as the Pop Punk Queen", "Her debut album was 'Let Go'", "Hits include 'I\\'m with You'", "Famous for 'Sk8er Boi'", "Famous for 'Complicated'", "Pop Punk", "Easy"],
  ["Sam Smith", "British singer who identifies as non-binary", "Won an Oscar for the James Bond theme 'Writing\\'s on the Wall'", "Hits include 'I\\'m Not the Only One'", "Hits include 'Unholy'", "Famous for 'Stay with Me'", "Pop", "Medium"],
  ["Lewis Capaldi", "Scottish singer-songwriter", "Known for his humorous social media presence", "Related to Doctor Who actor Peter Capaldi", "Hits include 'Before You Go'", "Famous for 'Someone You Loved'", "Pop", "Medium"],
  ["Shawn Mendes", "Canadian singer who gained fame on Vine", "Dated Camila Cabello", "Hits include 'Stitches'", "Hits include 'Treat You Better'", "Famous for 'Senorita'", "Pop", "Easy"],
  ["Charlie Puth", "Gained initial fame on YouTube", "Has perfect pitch and can identify any musical note", "Hits include 'Attention' and 'We Don\\'t Talk Anymore'", "Co-wrote 'See You Again' for Furious 7", "Famous pop singer", "Pop", "Medium"],
  ["John Mayer", "Known for his blues guitar skills and pop hits", "Dated Taylor Swift and Katy Perry", "Hits include 'Gravity' and 'Waiting on the World to Change'", "Famous for 'Your Body Is a Wonderland'", "Famous singer-songwriter", "Pop/Blues", "Medium"],
  // Country
  ["Johnny Cash", "Known as 'The Man in Black'", "Performed famous concerts at Folsom and San Quentin prisons", "Married June Carter", "Hits include 'I Walk the Line' and 'Folsom Prison Blues'", "Famous for his deep voice and 'Ring of Fire'", "Country", "Medium"],
  ["Dolly Parton", "Grew up in a poor family with 11 siblings in Tennessee", "Founded a theme park called Dollywood", "Wrote 'I Will Always Love You'", "Hits include '9 to 5'", "Legendary country singer famous for 'Jolene'", "Country", "Easy"],
  ["Garth Brooks", "One of the best-selling artists in US history", "Known for bringing rock elements into country music", "His alter ego was Chris Gaines", "Hits include 'The Thunder Rolls'", "Famous for 'Friends in Low Places'", "Country", "Hard"],
  ["Carrie Underwood", "Won the fourth season of American Idol", "Vegetarian and animal rights activist", "Hits include 'Jesus, Take the Wheel'", "Famous for the revenge anthem 'Before He Cheats'", "Famous country singer", "Country", "Medium"],
  ["Luke Bryan", "Country singer from Georgia", "Has served as a judge on American Idol", "Hits include 'Crash My Party'", "Hits include 'Play It Again'", "Famous for 'Country Girl (Shake It for Me)'", "Country", "Medium"],
  ["Blake Shelton", "Country singer from Oklahoma", "Long-time coach on The Voice", "Married to Gwen Stefani", "Hits include 'Austin'", "Famous for 'God\\'s Country' and 'Boys \\'Round Here'", "Country", "Medium"],
  // Hip Hop
  ["50 Cent", "Discovered by Eminem", "Survived being shot nine times in 2000", "His debut album was 'Get Rich or Die Tryin\\''", "Hits include 'Candy Shop'", "Famous for the song 'In Da Club'", "Hip Hop", "Easy"],
  ["Lil Wayne", "Joined Cash Money Records at age 12", "His album series is called 'Tha Carter'", "Signed Drake and Nicki Minaj to his label", "Hits include 'Lollipop'", "Famous rapper known as 'Weezy'", "Hip Hop", "Medium"],
  ["J. Cole", "First artist signed to Jay-Z's Roc Nation", "Known for his album '2014 Forest Hills Drive' going double platinum with no features", "Hits include 'No Role Modelz'", "Hits include 'Middle Child'", "Famous rapper from North Carolina", "Hip Hop", "Medium"],
  ["Kendrick Lamar", "Won a Pulitzer Prize for his album 'DAMN.'", "Curated the soundtrack for Black Panther", "Hits include 'HUMBLE.'", "Hits include 'Alright'", "Famous rapper from Compton", "Hip Hop", "Easy"],
  ["Post Malone", "His stage name was generated from a rap name generator", "Known for his face tattoos", "Hits include 'Circles'", "Hits include 'Congratulations'", "Famous for 'Rockstar' and 'Sunflower'", "Hip Hop/Pop", "Easy"],
  ["Doja Cat", "Went viral with the novelty song 'Mooo!'", "Known for her eccentric fashion and social media presence", "Hits include 'Say So'", "Hits include 'Kiss Me More'", "Famous female rapper and singer", "Hip Hop/Pop", "Medium"],
  ["Megan Thee Stallion", "Coined the term 'Hot Girl Summer'", "Won the Grammy for Best New Artist in 2021", "Featured on Cardi B's 'WAP'", "Hits include 'Savage'", "Famous female rapper from Houston", "Hip Hop", "Medium"],
  // Jazz/Classical
  ["John Coltrane", "Legendary jazz saxophonist", "Played in Miles Davis's quintet", "His masterpiece album is 'A Love Supreme'", "Known for his 'sheets of sound' playing style", "Famous for his version of 'My Favorite Things'", "Jazz", "Hard"],
  ["Charlie Parker", "Legendary jazz saxophonist and composer", "Nicknamed 'Bird' or 'Yardbird'", "A leading figure in the development of bebop", "Hits include 'Ornithology'", "Famous jazz pioneer", "Jazz", "Hard"],
  ["Richard Wagner", "German composer of the Romantic period", "Known for his epic operas and 'leitmotifs'", "His masterpiece is the 'Ring Cycle' (Der Ring des Nibelungen)", "Composed the 'Bridal Chorus' (Here Comes the Bride)", "Famous for 'Ride of the Valkyries'", "Classical", "Hard"],
  ["Johann Strauss II", "Austrian composer of dance music and operettas", "Known as 'The Waltz King'", "Composed 'Die Fledermaus'", "Composed 'The Blue Danube'", "Famous for his waltzes", "Classical", "Hard"]
];

const existingFile = path.join("C:\\\\Users\\\\ysfde\\\\OneDrive\\\\Desktop", 'music_en.xlsx');
const wb = xlsx.readFile(existingFile);
const ws = wb.Sheets["Music"];

// Convert existing sheet to array
const existingData = xlsx.utils.sheet_to_json(ws, {header: 1});

// Append new data
const combinedData = existingData.concat(data2);

// Write back
const newWs = xlsx.utils.aoa_to_sheet(combinedData);
newWs['!cols'] = ws['!cols'];
wb.Sheets["Music"] = newWs;

try {
  xlsx.writeFile(wb, existingFile);
  console.log('Successfully appended! Total rows: ' + combinedData.length);
} catch (e) {
  console.error(e);
}
