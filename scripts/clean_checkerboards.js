const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dirs = [
  'C:/Dev/FootballTaboo/assets/leagues',
  'C:/Dev/FootballTaboo/assets/avatars'
];

async function applyCircularMask(inputPath, outputPath) {
  const metadata = await sharp(inputPath).metadata();
  const width = metadata.width || 512;
  const height = metadata.height || 512;
  const size = Math.min(width, height);
  const radius = (size / 2) * 0.95; // Slightly tight circle to cut off outer checkerboard borders

  // Create SVG circle mask
  const svgMask = Buffer.from(
    `<svg width="${width}" height="${height}">
      <circle cx="${width / 2}" cy="${height / 2}" r="${radius}" fill="#fff" />
    </svg>`
  );

  // Resize and mask
  const maskedImage = await sharp(inputPath)
    .resize(width, height, { fit: 'cover' })
    .composite([{ input: svgMask, blend: 'dest-in' }])
    .png({ quality: 100, compressionLevel: 8 })
    .toBuffer();

  await fs.promises.writeFile(outputPath, maskedImage);
}

async function processAll() {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        await applyCircularMask(filePath, filePath);
        console.log(`Cleaned mask for ${dir}/${file}`);
      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
      }
    }
  }
}

processAll().then(() => console.log('All league logos and avatars cleaned of background checkerboard squares!'));
