const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processIcon(inputPath, outputPath) {
  console.log(`Processing ${inputPath} -> ${outputPath}...`);
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  
  // Create RGBA buffer
  const rgba = Buffer.alloc(info.width * info.height * 4);
  const channels = info.channels;

  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];

    // Compute brightness
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    
    // Alpha falloff for smooth anti-aliased edge blending on black
    let alpha = 255;
    if (brightness < 20) {
      alpha = 0;
    } else if (brightness < 65) {
      alpha = Math.round(((brightness - 20) / 45) * 255);
    }

    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = alpha;
  }

  await sharp(rgba, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png().toFile(outputPath);

  console.log(`Saved transparent PNG: ${outputPath}`);
}

async function main() {
  const brainDir = 'C:/Users/ysfde/.gemini/antigravity/brain/13653dc5-97b5-40f9-960f-c3523139db17';
  
  await processIcon(
    path.join(brainDir, 'football_icon_v2_1786714342968.jpg'),
    'C:/Dev/FootballTaboo/assets/icons/football_3d_icon.png'
  );

  await processIcon(
    path.join(brainDir, 'cinema_icon_v2_1786714389403.jpg'),
    'C:/Dev/FootballTaboo/assets/icons/cinema_3d_icon.png'
  );

  await processIcon(
    path.join(brainDir, 'music_sol_clef_3d_1786715436586.jpg'),
    'C:/Dev/FootballTaboo/assets/icons/music_3d_icon.png'
  );
}

main().catch(console.error);
