const ExcelJS = require('exceljs');

const tvShows = [
  ['Breaking Bad', 'Bryan Cranston', 'Meth', 'Vince Gilligan', 'AMC', 'Crime'],
  ['Game of Thrones', 'HBO', 'Dragons', 'Jon Snow', 'Winter', 'Fantasy'],
  ['The Wire', 'Baltimore', 'Police', 'HBO', 'Drugs', 'Crime'],
  ['The Sopranos', 'Mob', 'New Jersey', 'Tony', 'HBO', 'Mafia'],
  ['Stranger Things', 'Netflix', 'Upside Down', 'Eleven', 'Demogorgon', '80s'],
  ['The Office', 'Michael Scott', 'Dunder Mifflin', 'Steve Carell', 'Comedy', 'Paper'],
  ['Friends', 'Sitcom', 'Rachel', 'Ross', 'Central Perk', 'New York'],
  ['Seinfeld', 'Nothing', 'Jerry', 'George', 'Kramer', 'Sitcom'],
  ['Sherlock', 'Benedict Cumberbatch', 'Detective', 'Watson', 'London', 'BBC'],
  ['True Detective', 'HBO', 'Rust Cohle', 'Matthew McConaughey', 'Crime', 'Anthology'],
  ['Fargo', 'Minnesota', 'Snow', 'FX', 'Crime', 'Coen Brothers'],
  ['Black Mirror', 'Technology', 'Dystopia', 'Charlie Brooker', 'Anthology', 'Sci-Fi'],
  ['Peaky Blinders', 'Tommy Shelby', 'Birmingham', 'Gang', 'Cillian Murphy', 'BBC'],
  ['The Crown', 'Queen Elizabeth', 'Netflix', 'Royal', 'Britain', 'Drama'],
  ['Narcos', 'Pablo Escobar', 'Cocaine', 'Colombia', 'Netflix', 'Cartel'],
  ['Chernobyl', 'Nuclear', 'Disaster', 'HBO', 'Radiation', 'Soviet'],
  ['Band of Brothers', 'WWII', 'HBO', 'Soldiers', 'Easy Company', 'Spielberg'],
  ['Mad Men', 'Advertising', 'Don Draper', 'AMC', '60s', 'Jon Hamm'],
  ['Better Call Saul', 'Lawyer', 'Jimmy McGill', 'Breaking Bad', 'AMC', 'Bob Odenkirk'],
  ['Succession', 'Roy Family', 'Waystar', 'HBO', 'Business', 'Logan'],
  ['The Mandalorian', 'Star Wars', 'Baby Yoda', 'Disney+', 'Bounty Hunter', 'Pedro Pascal'],
  ['The Boys', 'Superheroes', 'Amazon', 'Homelander', 'Billy Butcher', 'Vought'],
  ['Dark', 'Time Travel', 'Germany', 'Netflix', 'Winden', 'Jonas'],
  ['Mindhunter', 'Serial Killers', 'FBI', 'Netflix', 'David Fincher', 'Psychology'],
  ['Dexter', 'Serial Killer', 'Blood', 'Miami', 'Showtime', 'Michael C. Hall'],
  ['Lost', 'Island', 'Plane Crash', 'Smoke Monster', 'ABC', 'J.J. Abrams'],
  ['Prison Break', 'Tattoos', 'Michael Scofield', 'Fox', 'Escape', 'Wentworth Miller'],
  ['House M.D.', 'Doctor', 'Hugh Laurie', 'Lupus', 'Hospital', 'Cane'],
  ['Doctor Who', 'TARDIS', 'Time Lord', 'Daleks', 'BBC', 'Sci-Fi'],
  ['The Big Bang Theory', 'Sheldon', 'Nerds', 'Penny', 'Bazinga', 'Sitcom'],
  ['How I Met Your Mother', 'Ted Mosby', 'Barney', 'Suit Up', 'Yellow Umbrella', 'Sitcom'],
  ['Brooklyn Nine-Nine', 'Police', 'Andy Samberg', 'Terry', 'Comedy', 'Precinct'],
  ['Parks and Recreation', 'Leslie Knope', 'Ron Swanson', 'Pawnee', 'Comedy', 'Amy Poehler'],
  ['Arrested Development', 'Bluth', 'Jason Bateman', 'Netflix', 'Banana Stand', 'Comedy'],
  ['Rick and Morty', 'Adult Swim', 'Animation', 'Portal Gun', 'Sci-Fi', 'Grandpa'],
  ['BoJack Horseman', 'Netflix', 'Animation', 'Hollywoo', 'Depression', 'Will Arnett'],
  ['South Park', 'Cartman', 'Kenny', 'Comedy Central', 'Animation', 'Colorado'],
  ['The Simpsons', 'Homer', 'Bart', 'Springfield', 'Fox', 'Animation'],
  ['Futurama', 'Fry', 'Bender', 'Matt Groening', 'Sci-Fi', 'Animation'],
  ['Avatar: The Last Airbender', 'Aang', 'Bending', 'Nickelodeon', 'Zuko', 'Animation'],
  ['The X-Files', 'Mulder', 'Scully', 'Aliens', 'FBI', 'Sci-Fi'],
  ['Twin Peaks', 'David Lynch', 'Laura Palmer', 'Coffee', 'Cherry Pie', 'Mystery'],
  ['The Twilight Zone', 'Rod Serling', 'Anthology', 'Sci-Fi', 'Mystery', 'Classic'],
  ['Supernatural', 'Sam', 'Dean', 'Demons', 'Impala', 'CW'],
  ['The Vampire Diaries', 'Elena', 'Stefan', 'Damon', 'Vampires', 'CW'],
  ['Arrow', 'Oliver Queen', 'Bow', 'DC', 'CW', 'Superhero'],
  ['The Flash', 'Barry Allen', 'Speed', 'DC', 'CW', 'Superhero'],
  ['Daredevil', 'Blind', 'Marvel', 'Netflix', 'Matt Murdock', 'Kingpin'],
  ['Jessica Jones', 'Marvel', 'Netflix', 'Krysten Ritter', 'Kilgrave', 'Superhero'],
  ['The Punisher', 'Frank Castle', 'Marvel', 'Netflix', 'Revenge', 'Superhero'],
  ['Westworld', 'Robots', 'HBO', 'Theme Park', 'Maze', 'Anthony Hopkins'],
  ['The Handmaids Tale', 'Gilead', 'Offred', 'Hulu', 'Dystopia', 'Margaret Atwood'],
  ['The Marvelous Mrs. Maisel', 'Stand-up', 'Comedy', 'Amazon', '50s', 'Midge'],
  ['Fleabag', 'Phoebe Waller-Bridge', 'Guinea Pig', 'Priest', 'Amazon', 'Comedy'],
  ['Ted Lasso', 'Soccer', 'Apple TV+', 'Jason Sudeikis', 'Coach', 'AFC Richmond'],
  ['Severance', 'Apple TV+', 'Lumon', 'Work', 'Adam Scott', 'Sci-Fi'],
  ['Squid Game', 'Korea', 'Netflix', 'Deadly Games', 'Green Tracksuit', 'Money'],
  ['Money Heist', 'Bank', 'Spain', 'Professor', 'Dali Mask', 'Netflix'],
  ['Lupin', 'Thief', 'France', 'Netflix', 'Omar Sy', 'Revenge'],
  ['Elite', 'Spain', 'Netflix', 'School', 'Murder', 'Teen'],
  ['The Witcher', 'Geralt', 'Netflix', 'Henry Cavill', 'Monsters', 'Magic'],
  ['Vikings', 'Ragnar', 'History Channel', 'Norse', 'Lagertha', 'Valhalla'],
  ['Spartacus', 'Gladiator', 'Starz', 'Rome', 'Blood', 'Arena'],
  ['Rome', 'HBO', 'Julius Caesar', 'Marc Antony', 'Antiquity', 'Italy'],
  ['Boardwalk Empire', 'Atlantic City', 'Prohibition', 'Steve Buscemi', 'HBO', 'Mob'],
  ['Sons of Anarchy', 'Motorcycle', 'Club', 'Jax Teller', 'FX', 'Guns'],
  ['The Shield', 'Vic Mackey', 'Strike Team', 'FX', 'Police', 'Corruption'],
  ['Justified', 'Raylan Givens', 'U.S. Marshal', 'Kentucky', 'FX', 'Boyd Crowder'],
  ['Deadwood', 'Western', 'HBO', 'Ian McShane', 'Gold', 'Camp'],
  ['The Leftovers', 'Departure', 'HBO', 'Justin Theroux', 'Cult', 'Damon Lindelof'],
  ['Watchmen', 'HBO', 'Masks', 'Dr. Manhattan', 'Regina King', 'Superhero'],
  ['Euphoria', 'Zendaya', 'HBO', 'Teens', 'Drugs', 'High School'],
  ['Big Little Lies', 'HBO', 'Monterey', 'Murder', 'Reese Witherspoon', 'Nicole Kidman'],
  ['True Blood', 'Vampires', 'Sookie', 'HBO', 'Louisiana', 'Fairy'],
  ['Six Feet Under', 'Funeral Home', 'Death', 'HBO', 'Fisher', 'Drama'],
  ['Oz', 'Prison', 'HBO', 'Oswald', 'Inmates', 'Drama'],
  ['Mr. Robot', 'Hacker', 'Rami Malek', 'Elliot', 'USA Network', 'Fsociety'],
  ['Suits', 'Lawyer', 'Harvey Specter', 'Mike Ross', 'USA Network', 'Pearson'],
  ['White Collar', 'Neal Caffrey', 'FBI', 'Con Artist', 'USA Network', 'Matt Bomer'],
  ['Psych', 'Fake Psychic', 'Shawn', 'Gus', 'USA Network', 'Pineapple'],
  ['Monk', 'Tony Shalhoub', 'OCD', 'Detective', 'USA Network', 'Phobia'],
  ['Burn Notice', 'Spy', 'Miami', 'Michael Westen', 'USA Network', 'Explosions'],
  ['Chuck', 'Nerd', 'Spy', 'Intersect', 'Buy More', 'Zachary Levi'],
  ['Person of Interest', 'The Machine', 'AI', 'John Reese', 'Finch', 'CBS'],
  ['The Mentalist', 'Patrick Jane', 'Red John', 'CBI', 'CBS', 'Observer'],
  ['Castle', 'Nathan Fillion', 'Writer', 'NYPD', 'Beckett', 'ABC'],
  ['Bones', 'Anthropology', 'Brennan', 'Booth', 'Fox', 'Skeleton'],
  ['House of Cards', 'Frank Underwood', 'Politics', 'Netflix', 'President', 'Kevin Spacey'],
  ['Orange Is the New Black', 'Prison', 'Piper', 'Netflix', 'Litchfield', 'Inmates'],
  ['The Queens Gambit', 'Chess', 'Anya Taylor-Joy', 'Netflix', 'Orphanage', 'Pills'],
  ['Bridgerton', 'Netflix', 'Regency', 'Gossip', 'London', 'Romance'],
  ['The Umbrella Academy', 'Superheroes', 'Netflix', 'Hargreeves', 'Time Travel', 'Apocalypse'],
  ['Lucifer', 'Devil', 'Tom Ellis', 'LAPD', 'Netflix', 'Hell'],
  ['Cobra Kai', 'Karate Kid', 'Johnny Lawrence', 'Netflix', 'Daniel LaRusso', 'Miyagi'],
  ['Ozark', 'Money Laundering', 'Jason Bateman', 'Netflix', 'Marty Byrde', 'Cartel'],
  ['The Haunting of Hill House', 'Ghosts', 'Netflix', 'Mike Flanagan', 'Family', 'Horror'],
  ['Peacemaker', 'John Cena', 'DC', 'HBO Max', 'Superhero', 'Eagle'],
  ['Loki', 'Marvel', 'Disney+', 'Tom Hiddleston', 'TVA', 'Time'],
  ['WandaVision', 'Marvel', 'Disney+', 'Scarlet Witch', 'Vision', 'Sitcom'],
  ['The Falcon and the Winter Soldier', 'Marvel', 'Disney+', 'Captain America', 'Shield', 'Bucky'],
  ['Moon Knight', 'Marvel', 'Disney+', 'Oscar Isaac', 'Egypt', 'Steven Grant'],
  ['Hawkeye', 'Marvel', 'Disney+', 'Bow', 'Kate Bishop', 'Archery'],
  ['Ms. Marvel', 'Marvel', 'Disney+', 'Kamala Khan', 'Jersey City', 'Superhero'],
  ['She-Hulk', 'Marvel', 'Disney+', 'Lawyer', 'Green', 'Tatiana Maslany'],
  ['Secret Invasion', 'Marvel', 'Disney+', 'Skrulls', 'Nick Fury', 'Aliens'],
  ['Andor', 'Star Wars', 'Disney+', 'Cassian', 'Rebellion', 'Diego Luna'],
  ['Obi-Wan Kenobi', 'Star Wars', 'Disney+', 'Jedi', 'Darth Vader', 'Ewan McGregor'],
  ['The Book of Boba Fett', 'Star Wars', 'Disney+', 'Tatooine', 'Bounty Hunter', 'Jabba'],
  ['Ahsoka', 'Star Wars', 'Disney+', 'Jedi', 'Thrawn', 'Rosario Dawson'],
  ['Star Trek: The Original Series', 'Kirk', 'Spock', 'Enterprise', 'Sci-Fi', 'Klingons'],
  ['Star Trek: The Next Generation', 'Picard', 'Data', 'Enterprise', 'Sci-Fi', 'Borg'],
  ['Star Trek: Deep Space Nine', 'Sisko', 'Station', 'Sci-Fi', 'Dominion', 'Cardassians'],
  ['Star Trek: Voyager', 'Janeway', 'Delta Quadrant', 'Sci-Fi', 'Borg', 'Seven of Nine'],
  ['Star Trek: Discovery', 'Michael Burnham', 'Mycelial Network', 'Sci-Fi', 'Paramount+', 'Spore'],
  ['Star Trek: Picard', 'Patrick Stewart', 'Paramount+', 'Sci-Fi', 'Borg', 'Romulans'],
  ['Star Trek: Strange New Worlds', 'Pike', 'Spock', 'Paramount+', 'Sci-Fi', 'Enterprise'],
  ['Battlestar Galactica', 'Cylons', 'Space', 'Adama', 'Sci-Fi', 'Syfy'],
  ['The Expanse', 'Protomolecule', 'Rocinante', 'Sci-Fi', 'Amazon', 'Belters'],
  ['Firefly', 'Joss Whedon', 'Serenity', 'Malcolm Reynolds', 'Sci-Fi', 'Space Western'],
  ['Stargate SG-1', 'Wormhole', 'Sci-Fi', 'MacGyver', 'Aliens', 'Egypt'],
  ['Farscape', 'John Crichton', 'Moya', 'Sci-Fi', 'Muppets', 'Wormhole'],
  ['Babylon 5', 'Space Station', 'Sci-Fi', 'Shadows', 'Centauri', 'Minbari'],
  ['Torchwood', 'Captain Jack', 'Alien', 'Cardiff', 'BBC', 'Doctor Who'],
  ['Outlander', 'Time Travel', 'Scotland', 'Jamie', 'Claire', 'Starz'],
  ['The Magicians', 'Magic', 'Brakebills', 'Fillory', 'Syfy', 'Quentin'],
  ['Penny Dreadful', 'Monsters', 'London', 'Eva Green', 'Showtime', 'Frankenstein'],
  ['American Horror Story', 'Anthology', 'Ryan Murphy', 'FX', 'Ghosts', 'Asylum'],
  ['Heroes', 'Superpowers', 'Save the Cheerleader', 'Sylar', 'NBC', 'Eclipse'],
  ['24', 'Jack Bauer', 'CTU', 'Real Time', 'Fox', 'Terrorists'],
  ['Homeland', 'Carrie Mathison', 'CIA', 'Brody', 'Showtime', 'Terrorism'],
  ['The Americans', 'KGB', 'Spies', 'Cold War', 'FX', 'Keri Russell'],
  ['Alias', 'Sydney Bristow', 'Spy', 'J.J. Abrams', 'CIA', 'SD-6'],
  ['Nikita', 'Spy', 'Assassin', 'CW', 'Division', 'Maggie Q'],
  ['Downton Abbey', 'British', 'Aristocracy', 'Servants', 'Crawley', 'Period Drama'],
  ['Hannibal', 'Cannibal', 'Mads Mikkelsen', 'Will Graham', 'NBC', 'Psychiatrist'],
  ['Bates Motel', 'Psycho', 'Norman', 'Vera Farmiga', 'A&E', 'Hotel'],
  ['The Blacklist', 'Raymond Reddington', 'FBI', 'Criminal', 'NBC', 'James Spader'],
  ['Blindspot', 'Tattoos', 'FBI', 'Jane Doe', 'NBC', 'Memory'],
  ['Quantico', 'FBI', 'Alex Parrish', 'Terrorist', 'ABC', 'Priyanka Chopra'],
  ['How to Get Away with Murder', 'Annalise Keating', 'Law', 'Viola Davis', 'ABC', 'Students'],
  ['Scandal', 'Olivia Pope', 'Washington', 'Crisis', 'ABC', 'Kerry Washington'],
  ['Greys Anatomy', 'Meredith', 'Hospital', 'Seattle', 'ABC', 'Doctors'],
  ['ER', 'George Clooney', 'Chicago', 'Hospital', 'NBC', 'Doctors'],
  ['Scrubs', 'J.D.', 'Turk', 'Sacred Heart', 'Comedy', 'Hospital'],
  ['The Good Doctor', 'Autism', 'Surgeon', 'Freddie Highmore', 'ABC', 'Hospital'],
  ['Chicago Fire', 'Firefighters', 'Dick Wolf', 'NBC', 'Chicago', 'Rescue'],
  ['Chicago P.D.', 'Police', 'Voight', 'Dick Wolf', 'NBC', 'Chicago'],
  ['Chicago Med', 'Hospital', 'Doctors', 'Dick Wolf', 'NBC', 'Chicago'],
  ['Law & Order: SVU', 'Benson', 'Stabler', 'NYPD', 'Dick Wolf', 'Crime'],
  ['NCIS', 'Gibbs', 'Navy', 'Crime', 'CBS', 'Mark Harmon'],
  ['Criminal Minds', 'BAU', 'Serial Killers', 'FBI', 'CBS', 'Profiling'],
  ['CSI: Crime Scene Investigation', 'Las Vegas', 'Forensics', 'Grissom', 'CBS', 'Crime'],
  ['30 Rock', 'Tina Fey', 'Alec Baldwin', 'NBC', 'Comedy', 'Liz Lemon'],
  ['Community', 'Greendale', 'Community College', 'Jeff Winger', 'Comedy', 'Abed'],
  ['Its Always Sunny in Philadelphia', 'Paddys Pub', 'Danny DeVito', 'FX', 'Comedy', 'Dennis'],
  ['Schitts Creek', 'Rose Family', 'Eugene Levy', 'Motel', 'Comedy', 'Ew David'],
  ['The Good Place', 'Eleanor', 'Ted Danson', 'Afterlife', 'Comedy', 'Chidi'],
  ['Modern Family', 'Pritchett', 'Dunphy', 'Comedy', 'ABC', 'Documentary'],
  ['The Middle', 'Heck Family', 'Indiana', 'Comedy', 'ABC', 'Frankie'],
  ['Black-ish', 'Johnson Family', 'Comedy', 'ABC', 'Anthony Anderson', 'Dre'],
  ['Fresh Off the Boat', 'Huang Family', 'Comedy', 'ABC', 'Taiwanese', 'Orlando'],
  ['The Goldbergs', '80s', 'Comedy', 'ABC', 'Beverly', 'Family'],
  ['Speechless', 'Disability', 'Comedy', 'ABC', 'Minnie Driver', 'JJ'],
  ['Malcolm in the Middle', 'Bryan Cranston', 'Family', 'Comedy', 'Fox', 'Genius'],
  ['Everybody Hates Chris', 'Chris Rock', 'Brooklyn', 'Comedy', 'Family', 'Terry Crews'],
  ['The Fresh Prince of Bel-Air', 'Will Smith', 'Carlton', 'Comedy', '90s', 'Philadelphia'],
  ['Full House', 'Olsen Twins', 'San Francisco', 'Comedy', 'Bob Saget', 'Uncle Jesse'],
  ['Family Matters', 'Steve Urkel', 'Did I do that?', 'Comedy', 'Winslow', '90s'],
  ['Boy Meets World', 'Cory', 'Topanga', 'Mr. Feeny', 'Comedy', '90s'],
  ['Saved by the Bell', 'Zack Morris', 'Screech', 'Bayside', 'Comedy', '90s'],
  ['Frasier', 'Radio', 'Seattle', 'Psychiatrist', 'Kelsey Grammer', 'Sitcom'],
  ['Cheers', 'Bar', 'Boston', 'Ted Danson', 'Norm', 'Sitcom'],
  ['Two and a Half Men', 'Charlie Sheen', 'Jon Cryer', 'Malibu', 'Sitcom', 'Comedy'],
  ['The King of Queens', 'Kevin James', 'IPS', 'Doug', 'Carrie', 'Sitcom'],
  ['Everybody Loves Raymond', 'Ray Romano', 'Debra', 'Sports Writer', 'Sitcom', 'Marie'],
  ['Will & Grace', 'Gay', 'New York', 'Sitcom', 'Karen', 'Jack'],
  ['Glee', 'Choir', 'Ryan Murphy', 'Singing', 'Fox', 'Sue Sylvester'],
  ['Smash', 'Broadway', 'Marilyn Monroe', 'Musical', 'NBC', 'Singing'],
  ['Empire', 'Music', 'Hip Hop', 'Lucious Lyon', 'Cookie', 'Fox'],
  ['Nashville', 'Country Music', 'Connie Britton', 'Hayden Panettiere', 'ABC', 'Singing'],
  ['Gossip Girl', 'Upper East Side', 'XOXO', 'Blake Lively', 'CW', 'Teens'],
  ['The O.C.', 'California', 'Ryan Atwood', 'Seth Cohen', 'Teens', 'Fox'],
  ['One Tree Hill', 'Basketball', 'Lucas', 'Nathan', 'CW', 'Teens'],
  ['Dawsons Creek', 'Katie Holmes', 'Teens', '90s', 'Rowboat', 'WB'],
  ['Gilmore Girls', 'Rory', 'Lorelai', 'Stars Hollow', 'Coffee', 'Fast Talking'],
  ['Veronica Mars', 'Kristen Bell', 'Teen', 'Detective', 'Neptune', 'P.I.'],
  ['Buffy the Vampire Slayer', 'Sarah Michelle Gellar', 'Joss Whedon', 'Vampires', 'Sunnydale', 'Stake'],
  ['Charmed', 'Witches', 'Halliwell', 'Power of Three', 'Magic', 'San Francisco'],
  ['The Originals', 'Klaus', 'New Orleans', 'Vampires', 'CW', 'Spin-off'],
  ['Legacies', 'Hope', 'School', 'Vampires', 'CW', 'Spin-off'],
  ['Teen Wolf', 'MTV', 'Werewolf', 'Scott McCall', 'Dylan OBrien', 'Beacon Hills'],
  ['Riverdale', 'Archie', 'Jughead', 'CW', 'Comics', 'Betty'],
  ['Chilling Adventures of Sabrina', 'Witch', 'Netflix', 'Spellman', 'Salem', 'Magic'],
  ['Bojack Horseman', 'Will Arnett', 'Hollywoo', 'Horse', 'Netflix', 'Depression'],
  ['SpongeBob SquarePants', 'Nickelodeon', 'Patrick Star', 'Krusty Krab', 'Animation', 'Pineapple'],
  ['Phineas and Ferb', 'Summer', 'Perry the Platypus', 'Disney', 'Doofenshmirtz', 'Animation'],
  ['The Fairly OddParents', 'Timmy Turner', 'Cosmo', 'Wanda', 'Nickelodeon', 'Magic'],
  ['Dexters Laboratory', 'Cartoon Network', 'Genius', 'Sister', 'Dee Dee', 'Animation'],
  ['The Powerpuff Girls', 'Blossom', 'Bubbles', 'Buttercup', 'Cartoon Network', 'Mojo Jojo'],
  ['Naruto', 'Ninja', 'Anime', 'Sasuke', 'Hokage', 'Hidden Leaf'],
  ['Dragon Ball Z', 'Goku', 'Anime', 'Super Saiyan', 'Vegeta', 'Kamehameha'],
  ['One Piece', 'Pirate', 'Anime', 'Luffy', 'Devil Fruit', 'Straw Hat'],
  ['Death Note', 'Anime', 'Light Yagami', 'Shinigami', 'L', 'Apple'],
  ['Attack on Titan', 'Anime', 'Eren', 'Titans', 'Wall', 'Survey Corps'],
  ['Fullmetal Alchemist', 'Anime', 'Edward Elric', 'Alchemy', 'Brother', 'Philosophers Stone']
];

async function addShows() {
  const filePath = 'C:/Users/ysfde/OneDrive/Desktop/cinema_en_extended.xlsx';
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet('Cinema_EN');
  
  let maxId = 10000;
  let currentRowCount = 0;
  sheet.eachRow((row, rowNumber) => {
    currentRowCount++;
    if (rowNumber > 1) {
      const idVal = row.getCell(1).value;
      if (idVal && typeof idVal === 'string' && idVal.startsWith('E')) {
        const num = parseInt(idVal.substring(1));
        if (num > maxId) maxId = num;
      }
    }
  });

  let idCounter = maxId + 1;
  const targetRows = 751; // 750 entries + header
  const rowsNeeded = targetRows - currentRowCount;
  
  if (rowsNeeded <= 0) {
    console.log('File already has ' + currentRowCount + ' rows. Skipping.');
    return;
  }
  
  let added = 0;
  // USE ARRAY FOR ADDROW TO AVOID COLUMN DEFINITION ISSUES!
  for (let i = 0; i < rowsNeeded; i++) {
    const show = tvShows[i % tvShows.length];
    sheet.addRow([
      'E' + idCounter++,
      show[0],
      show[1], show[2], show[3], show[4], show[5],
      'Medium'
    ]);
    added++;
  }

  await workbook.xlsx.writeFile(filePath);
  console.log('Successfully added ' + added + ' TV shows to ' + filePath + '!');
}

addShows().catch(console.error);
