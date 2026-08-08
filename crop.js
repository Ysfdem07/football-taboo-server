const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const UI_DIR = path.join(__dirname, 'assets', 'images');
const OUT_DIR = path.join(UI_DIR, 'boxes');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function processImage(filename, boxes, prefix) {
  const filepath = path.join(UI_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`Skipping ${filename}, not found.`);
    return;
  }
  
  const image = await Jimp.read(filepath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  for (const box of boxes) {
    const cropX = Math.floor(w * box.x);
    const cropY = Math.floor(h * box.y);
    const cropW = Math.floor(w * box.w);
    const cropH = Math.floor(h * box.h);

    const clone = image.clone();
    clone.crop({ x: cropX, y: cropY, w: cropW, h: cropH });

    // Apply blur to text regions if specified
    if (box.blurRegions) {
      for (const br of box.blurRegions) {
        const brX = Math.floor(cropW * br.x);
        const brY = Math.floor(cropH * br.y);
        const brW = Math.floor(cropW * br.w);
        const brH = Math.floor(cropH * br.h);
        
        // Extract the region to blur
        const region = clone.clone().crop({ x: brX, y: brY, w: brW, h: brH });
        region.blur(15); // Heavy blur to hide text
        
        // Composite back
        clone.composite(region, brX, brY);
      }
    }

    const outPath = path.join(OUT_DIR, `${prefix}_${box.name}.png`);
    await clone.write(outPath);
    console.log(`Saved ${outPath}`);
  }
}

async function main() {
  console.log('Starting image extraction...');
  
  // Home Screen (ui_2.png)
  // Football: top 12%, height 26%, left 5%, width 90%
  // Cinema: top 40%, height 26%
  // Music: top 68%, height 26%
  const homeBoxes = [
    { name: 'football', x: 0.05, y: 0.12, w: 0.90, h: 0.26 },
    { name: 'cinema', x: 0.05, y: 0.40, w: 0.90, h: 0.26 },
    { name: 'music', x: 0.05, y: 0.68, w: 0.90, h: 0.26 }
  ];
  await processImage('ui_2.png', homeBoxes, 'home');

  // Submenus
  // Classic Mode: top 22%, left 5%, width 42%, height 20%
  // Online Duel: top 22%, left 53%, width 42%, height 20%
  // Weekly Tournament: top 48%, left 10%, width 80%, height 25%
  
  const subMenuBoxes = [
    { 
      name: 'classic', 
      x: 0.05, y: 0.22, w: 0.42, h: 0.20,
      blurRegions: [{ x: 0.1, y: 0.6, w: 0.8, h: 0.35 }] // Bottom portion for text
    },
    { 
      name: 'duel', 
      x: 0.53, y: 0.22, w: 0.42, h: 0.20,
      blurRegions: [{ x: 0.1, y: 0.6, w: 0.8, h: 0.35 }] 
    },
    { 
      name: 'tournament', 
      x: 0.10, y: 0.48, w: 0.80, h: 0.25,
      blurRegions: [{ x: 0.4, y: 0.3, w: 0.55, h: 0.6 }] // Right portion for text
    }
  ];

  await processImage('ui_4.png', subMenuBoxes, 'sub_football'); // Football
  await processImage('ui_3.png', subMenuBoxes, 'sub_cinema');   // Cinema
  await processImage('ui_1.png', subMenuBoxes, 'sub_music');    // Music

  console.log('Done!');
}

main().catch(console.error);
