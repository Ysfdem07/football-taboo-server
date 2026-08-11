const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/ysfde/OneDrive/Desktop/Avatar';
const destDir = 'C:/Dev/FootballTaboo/assets/avatars';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Clean old files in destDir
fs.readdirSync(destDir).forEach(f => fs.unlinkSync(path.join(destDir, f)));

const files = fs.readdirSync(srcDir);
const sorted = files.filter(f => f.match(/^Avatar_\d+/i)).sort((a, b) => {
  const numA = parseInt(a.match(/\d+/)[0], 10);
  const numB = parseInt(b.match(/\d+/)[0], 10);
  return numA - numB;
});

async function processImages() {
  for (let i = 0; i < sorted.length; i++) {
    const file = sorted[i];
    const srcPath = path.join(srcDir, file);
    const destName = `avatar_${i + 1}.png`;
    const destPath = path.join(destDir, destName);
    
    await sharp(srcPath)
      .resize(512, 512, { fit: 'cover' })
      .png({ quality: 90, compressionLevel: 8 })
      .toFile(destPath);
      
    console.log(`Processed ${file} -> ${destName}`);
  }
}

processImages().then(() => console.log('Successfully processed all 15 avatars!'));
