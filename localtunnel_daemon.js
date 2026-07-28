const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const socketTsPath = path.join(__dirname, 'src', 'services', 'socket.ts');

function startTunnel() {
  console.log("Starting localtunnel...");
  const proc = exec('npx localtunnel --port 3000');
  
  proc.stdout.on('data', data => {
    const text = data.toString();
    console.log(text);
    const match = text.match(/your url is: (https:\/\/[^\s]+)/);
    if (match) {
      const newUrl = match[1];
      console.log('Detected new URL:', newUrl);
      
      // Update socket.ts
      let socketContent = fs.readFileSync(socketTsPath, 'utf8');
      socketContent = socketContent.replace(/export const SOCKET_URL = '.*?';/, `export const SOCKET_URL = '${newUrl}';`);
      fs.writeFileSync(socketTsPath, socketContent);
      console.log('Updated socket.ts with new URL');
    }
  });
  
  proc.stderr.on('data', data => console.error(data.toString()));
  
  proc.on('close', (code) => {
    console.log(`localtunnel exited with code ${code}. Restarting in 2 seconds...`);
    setTimeout(startTunnel, 2000);
  });
}

startTunnel();
