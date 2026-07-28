const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const PORT_EXPO = 8081;
const LOG_FILE = path.join(__dirname, 'dev_tunnel.log');
const QR_FILE = path.join(__dirname, '..', '..', '..', '..', '..', '.gemini', 'antigravity', 'brain', '13653dc5-97b5-40f9-960f-c3523139db17', 'expo_go_tunnel_qr.png');

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(msg);
}

// Clear log file
if (fs.existsSync(LOG_FILE)) {
  fs.unlinkSync(LOG_FILE);
}

log("Starting Expo Metro Bundler...");
const expoProcess = spawn('npx', ['expo', 'start', '--port', PORT_EXPO.toString()], {
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, CI: '1' },
  shell: true
});

expoProcess.stdout.on('data', (data) => {
  log(`[Metro] ${data.toString().trim()}`);
});

expoProcess.stderr.on('data', (data) => {
  log(`[Metro Error] ${data.toString().trim()}`);
});

expoProcess.on('close', (code) => {
  log(`[Metro] Process exited with code ${code}`);
  process.exit(code);
});

let sshProcess = null;

function startTunnel() {
  log("Starting localhost.run SSH tunnel...");
  sshProcess = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=15',
    '-o', 'ServerAliveCountMax=3',
    '-o', 'ExitOnForwardFailure=yes',
    '-R', `80:localhost:${PORT_EXPO}`,
    'nokey@localhost.run',
    '-T'
  ]);

  sshProcess.stdout.on('data', handleTunnelData);
  sshProcess.stderr.on('data', handleTunnelData);

  sshProcess.on('close', (code) => {
    log(`[Tunnel] SSH connection closed with code ${code}. Reconnecting in 5s...`);
    setTimeout(startTunnel, 5000);
  });
}

function handleTunnelData(data) {
  const output = data.toString();
  log(`[Tunnel] ${output.trim()}`);

  const match = output.match(/(\S+\.lhr\.life|\S+\.localhost\.run)/);
  if (match) {
    const tunnelUrl = match[1];
    const expoGoUrl = `exp://${tunnelUrl}`;
    log(`=========================================`);
    log(`TUNNEL SUCCESS: ${tunnelUrl}`);
    log(`EXPO GO URL: ${expoGoUrl}`);
    log(`=========================================`);

    // Generate new QR code image directly in the artifact directory
    QRCode.toFile(QR_FILE, expoGoUrl, { scale: 8 }, (err) => {
      if (err) {
        log(`[QR Error] Failed to generate QR code: ${err.message}`);
      } else {
        log(`[QR] Successfully generated QR code at ${QR_FILE}`);
      }
    });
  }
}

// Wait 5 seconds for Metro to start before launching the tunnel
setTimeout(startTunnel, 5000);

// Handle process shutdown
process.on('SIGINT', () => {
  log("Shutting down dev tunnel...");
  if (expoProcess) expoProcess.kill();
  if (sshProcess) sshProcess.kill();
  process.exit(0);
});
