const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function cleanLeagueBadge(filePath) {
  console.log(`Cleaning background for ${path.basename(filePath)}...`);
  const image = sharp(filePath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  
  // Flood-fill / BFS from outer border to mark background pixels
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Push all 4 border edges into queue
  for (let x = 0; x < width; x++) {
    queue.push(x, 0);
    queue.push(x, height - 1);
    visited[x] = 1;
    visited[(height - 1) * width + x] = 1;
  }
  for (let y = 0; y < height; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
    visited[y * width] = 1;
    visited[y * width + (width - 1)] = 1;
  }

  // BFS
  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const idx = cy * width + cx;

    // Check 4 neighbors
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (!visited[nidx]) {
          const r = data[nidx * 4];
          const g = data[nidx * 4 + 1];
          const b = data[nidx * 4 + 2];
          const a = data[nidx * 4 + 3];

          // Check if pixel is background (either alpha=0 or checkerboard white/gray pixel)
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const diff = maxC - minC;

          // Background if alpha is low or if it's gray/white checkerboard (low saturation, brightness > 150)
          const isBackground = (a < 50) || (diff < 20 && r > 150);

          if (isBackground) {
            visited[nidx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Apply transparency to visited background pixels
  const rgba = Buffer.from(data);
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      rgba[i * 4 + 3] = 0; // Set alpha to 0
    }
  }

  await sharp(rgba, {
    raw: { width, height, channels: 4 }
  }).png().toFile(filePath + '.clean.png');

  fs.renameSync(filePath + '.clean.png', filePath);
  console.log(`Finished cleaning ${path.basename(filePath)}!`);
}

async function main() {
  const dir = 'C:/Dev/FootballTaboo/assets/leagues';
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.png')) {
      await cleanLeagueBadge(path.join(dir, file));
    }
  }
}

main().catch(console.error);
