const https = require('https');
const fs = require('fs');

function fetchUrl(url, redirectCount = 0) {
  if (redirectCount > 5) { console.error('Too many redirects'); process.exit(1); }
  https.get(url, (res) => {
    if ([301, 302, 307, 308].includes(res.statusCode)) {
      fetchUrl(res.headers.location, redirectCount + 1);
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const rows = data.split('\n').filter(r => r.trim());
      const words = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',');
        if (cols.length >= 6 && cols[0].trim()) {
          const word = cols[0].trim().replace(/^"|"$/g, '');
          const forbidden = [];
          for (let j = 1; j <= 5; j++) {
            const f = (cols[j] || '').trim().replace(/^"|"$/g, '');
            if (f) forbidden.push(f);
          }
          if (word) words.push({ word, forbidden });
        }
      }

      if (words.length === 0) {
        console.error('HATA: Google Sheet bos geldi, guncelleme yapilmadi.');
        process.exit(1);
      }

      // Compare full content (word + clues)
      const rawCurrent = fs.readFileSync('assets/data/words.json', 'utf8').replace(/^\uFEFF/, '');
      const current = JSON.parse(rawCurrent);
      const newStr = JSON.stringify(words);
      const oldStr = JSON.stringify(current);

      const newWords = words.length - current.length;
      const changed = newStr !== oldStr;

      console.log('Google Sheet : ' + words.length + ' kelime');
      console.log('Mevcut bundle: ' + current.length + ' kelime');
      console.log('Yeni kelime  : ' + (newWords > 0 ? '+' + newWords : newWords));
      console.log('Ipucu degisim: ' + (changed ? 'VAR' : 'YOK'));

      if (changed) {
        fs.writeFileSync('assets/data/words.json', JSON.stringify(words, null, 2), { encoding: 'utf8' });
        console.log('GUNCELLENDI ✓');
      } else {
        console.log('Degisiklik yok, guncelleme gerekmez.');
        process.exit(0);
      }
    });
  }).on('error', e => { console.error('HATA: ' + e.message); process.exit(1); });
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=0';
fetchUrl(SHEET_URL);
