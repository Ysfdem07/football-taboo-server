const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcBase = 'C:/Users/ysfde/OneDrive/Desktop/Lig Logos';
const destDir = 'C:/Dev/FootballTaboo/assets/leagues';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Clean old files in destDir
fs.readdirSync(destDir).forEach(f => fs.unlinkSync(path.join(destDir, f)));

const LOGO_MAPPINGS = [
  // Futbol
  { folder: 'Futbol Logos', file: 'Amatör küme.jpg', dest: 'football_amateur.png' },
  { folder: 'Futbol Logos', file: '3. Lig.jpg', dest: 'football_league3.png' },
  { folder: 'Futbol Logos', file: '2. Lig.jpg', dest: 'football_league2.png' },
  { folder: 'Futbol Logos', file: '1. Lig.jpg', dest: 'football_league1.png' },
  { folder: 'Futbol Logos', file: 'Futbol Şampiyonlar ligi.jpg', dest: 'football_champions.png' },

  // Müzik
  { folder: 'Müzik Logos', file: 'Müzik Amatör Ligi.jpg', dest: 'music_amateur.png' },
  { folder: 'Müzik Logos', file: '3. Müzik Ligi.jpg', dest: 'music_league3.png' },
  { folder: 'Müzik Logos', file: '2. Müzik Ligi.jpg', dest: 'music_league2.png' },
  { folder: 'Müzik Logos', file: '1. Müzik ligi.jpg', dest: 'music_league1.png' },
  { folder: 'Müzik Logos', file: 'Müzik Şampiyonlar Ligi.jpg', dest: 'music_champions.png' },

  // Sinema
  { folder: 'Sinema Logos', file: 'Amatör Sinema Lig Logo.jpg', dest: 'cinema_amateur.png' },
  { folder: 'Sinema Logos', file: '3.Lig Sinema Logo.jpg', dest: 'cinema_league3.png' },
  { folder: 'Sinema Logos', file: '2.Lig Sinema Logo.jpg', dest: 'cinema_league2.png' },
  { folder: 'Sinema Logos', file: '1.Lig Sinema Logo.jpg', dest: 'cinema_league1.png' },
  { folder: 'Sinema Logos', file: 'Şampiyonlar Ligi Sinema.jpg', dest: 'cinema_champions.png' },
];

async function processLogos() {
  for (const item of LOGO_MAPPINGS) {
    const srcPath = path.join(srcBase, item.folder, item.file);
    const destPath = path.join(destDir, item.dest);
    
    if (fs.existsSync(srcPath)) {
      await sharp(srcPath)
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 95, compressionLevel: 7 })
        .toFile(destPath);
      console.log(`Processed ${item.folder}/${item.file} -> ${item.dest}`);
    } else {
      console.error(`File NOT found: ${srcPath}`);
    }
  }
}

processLogos().then(() => console.log('Successfully processed all 15 category league logos!'));
