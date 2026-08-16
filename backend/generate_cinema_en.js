const https = require('https');
const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const fs = require('fs');

async function generate() {
  console.log('Downloading dataset...');
  const csvData = await new Promise((resolve, reject) => {
    https.get('https://raw.githubusercontent.com/sundeepblue/movie_rating_prediction/master/movie_metadata.csv', (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });

  console.log('Parsing...');
  const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  
  // Sort by num_voted_users to get the most famous ones
  let movies = parsed.data
    .filter(m => m.language === 'English' && m.num_voted_users && m.movie_title)
    .sort((a, b) => parseInt(b.num_voted_users) - parseInt(a.num_voted_users));
    
  // Clean movie titles (they usually have a weird trailing character in this dataset)
  movies.forEach(m => {
    m.movie_title = m.movie_title.replace(/[\u00A0|\u200B|\u200C|\u200D|\uFEFF]/g, '').trim();
  });

  // Deduplicate movies
  const seenMovies = new Set();
  const uniqueMovies = [];
  for (const m of movies) {
    if (!seenMovies.has(m.movie_title)) {
      seenMovies.add(m.movie_title);
      uniqueMovies.push(m);
    }
  }
  
  const cards = [];
  let idCounter = 10001;

  // 1. Add top 350 Movies
  const topMovies = uniqueMovies.slice(0, 350);
  topMovies.forEach((m, idx) => {
    let diff = idx < 100 ? 'Easy' : idx < 250 ? 'Medium' : 'Hard';
    
    // Genre parsing
    let genre = m.genres ? m.genres.split('|')[0] : 'Film';
    
    // Build clues
    let clues = [
      m.director_name ? m.director_name : 'Director',
      m.actor_1_name ? m.actor_1_name : 'Actor',
      m.actor_2_name ? m.actor_2_name : 'Movie',
      m.title_year ? m.title_year.toString() : 'Hollywood',
      genre
    ].map(c => c.trim()).filter(c => c !== '');
    
    // Pad clues to 5 if necessary
    while(clues.length < 5) clues.push('Cinema');

    cards.push({
      id: 'E' + idCounter++,
      answer: m.movie_title,
      c1: clues[0], c2: clues[1], c3: clues[2], c4: clues[3], c5: clues[4],
      diff: diff
    });
  });

  // 2. Add top 150 Actors based on their appearances in top movies
  const actorMap = new Map();
  uniqueMovies.forEach(m => {
    [m.actor_1_name, m.actor_2_name, m.actor_3_name].forEach(actor => {
      if (actor && actor.trim() !== '') {
        const name = actor.trim();
        if (!actorMap.has(name)) actorMap.set(name, { count: 0, movies: [] });
        actorMap.get(name).count++;
        if (actorMap.get(name).movies.length < 4) {
          actorMap.get(name).movies.push(m.movie_title);
        }
      }
    });
  });

  const topActors = Array.from(actorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 150);

  topActors.forEach((actorEntry, idx) => {
    const name = actorEntry[0];
    const data = actorEntry[1];
    let diff = idx < 50 ? 'Easy' : idx < 100 ? 'Medium' : 'Hard';
    
    let clues = [...data.movies];
    clues.push('Actor');
    if (clues.length < 5) clues.push('Hollywood');
    if (clues.length < 5) clues.push('Movie');
    if (clues.length < 5) clues.push('Cinema');

    cards.push({
      id: 'E' + idCounter++,
      answer: name,
      c1: clues[0], c2: clues[1], c3: clues[2], c4: clues[3], c5: clues[4],
      diff: diff
    });
  });

  // Write to Excel
  console.log('Writing ' + cards.length + ' cards to Excel...');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cinema_EN');
  
  sheet.columns = [
    { header: 'EntityID', key: 'id', width: 10 },
    { header: 'Answer', key: 'answer', width: 25 },
    { header: 'Clue_1', key: 'c1', width: 20 },
    { header: 'Clue_2', key: 'c2', width: 20 },
    { header: 'Clue_3', key: 'c3', width: 20 },
    { header: 'Clue_4', key: 'c4', width: 20 },
    { header: 'Clue_5', key: 'c5', width: 20 },
    { header: 'Difficulty', key: 'diff', width: 15 }
  ];

  sheet.getRow(1).font = { bold: true };

  cards.forEach(c => sheet.addRow(c));

  const path = 'C:/Users/ysfde/OneDrive/Desktop/cinema_en_extended.xlsx';
  await workbook.xlsx.writeFile(path);
  console.log('Successfully wrote file to Desktop!');
}

generate().catch(console.error);
