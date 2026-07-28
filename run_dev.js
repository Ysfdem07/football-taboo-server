const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const http = require('http');
const net = require('net');

const PORT_SOCKET = 3000;
const PORT_EXPO = 19004;
const PORT_PROXY = 19003;
const ARTIFACT_DIR = 'C:/Users/ysfde/.gemini/antigravity/brain/13653dc5-97b5-40f9-960f-c3523139db17';

let sshProcess = null;
let expoProcess = null;
let socketProcess = null;
let currentTunnelUrl = '';

// 1. Start Socket Server
console.log(`[Socket] Starting backend/server.js on port ${PORT_SOCKET}...`);
socketProcess = spawn('node', [path.join('backend', 'server.js')], {
  env: { ...process.env, PORT: PORT_SOCKET },
  stdio: 'inherit'
});

// 2. Start Proxy Server on PORT_PROXY (19003)
function startProxyServer() {
  const server = http.createServer((req, res) => {
    const isSocket = req.url.startsWith('/socket.io');
    const targetPort = isSocket ? PORT_SOCKET : PORT_EXPO;
    
    const proxyReq = http.request({
      host: 'localhost',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    
    req.pipe(proxyReq, { end: true });
    
    proxyReq.on('error', (err) => {
      res.writeHead(502);
      res.end('Bad Gateway');
    });
  });

  server.on('upgrade', (req, socket, head) => {
    const isSocket = req.url.startsWith('/socket.io');
    const targetPort = isSocket ? PORT_SOCKET : PORT_EXPO;
    
    const rawSocket = net.connect(targetPort, 'localhost', () => {
      rawSocket.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`);
      for (const [key, value] of Object.entries(req.headers)) {
        rawSocket.write(`${key}: ${value}\r\n`);
      }
      rawSocket.write('\r\n');
      rawSocket.write(head);
      socket.pipe(rawSocket).pipe(socket);
    });
    
    rawSocket.on('error', (err) => {
      socket.destroy();
    });
  });

  server.listen(PORT_PROXY, () => {
    console.log(`[Proxy] Listening on port ${PORT_PROXY} (Routing socket to ${PORT_SOCKET} and expo to ${PORT_EXPO})`);
  });
}

startProxyServer();

// 3. Start localhost.run Tunnel exposing PORT_PROXY (19003) with maximum stability keep-alives
function startTunnel() {
  console.log(`[Tunnel] Starting localhost.run tunnel for port ${PORT_PROXY}...`);
  sshProcess = spawn('ssh', [
    '-o', 'ServerAliveInterval=10',
    '-o', 'ServerAliveCountMax=6',
    '-o', 'TCPKeepAlive=yes',
    '-o', 'ExitOnForwardFailure=yes',
    '-o', 'StrictHostKeyChecking=no',
    '-R', `80:localhost:${PORT_PROXY}`,
    'nokey@localhost.run',
    '-T'
  ]);

  sshProcess.stdout.on('data', handleTunnelOutput);
  sshProcess.stderr.on('data', handleTunnelOutput);
  
  sshProcess.on('error', (err) => {
    console.error('[Tunnel Error] SSH process encountered error:', err);
  });

  sshProcess.on('close', (code) => {
    console.log(`[Tunnel] Process exited. Reconnecting in 5s...`);
    currentTunnelUrl = '';
    setTimeout(startTunnel, 5000);
  });
}

function handleTunnelOutput(data) {
  const output = data.toString();
  console.log(`[Tunnel Log] ${output.trim()}`);
  
  // Parse localhost.run URL (matches *.lhr.life)
  const match = output.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.life/);
  if (match && match[0]) {
    const tunnelUrl = match[0];
    handleTunnelUrlAcquired(tunnelUrl);
  }
}

function handleTunnelUrlAcquired(tunnelUrl) {
  if (currentTunnelUrl === tunnelUrl) return;
  
  console.log(`\n======================================================`);
  console.log(`>>> DETECTED NEW TUNNEL URL: ${tunnelUrl}`);
  console.log(`======================================================\n`);
  
  currentTunnelUrl = tunnelUrl;
  
  // Generate QR Code
  const deepLink = tunnelUrl.replace('https://', 'exp://');
  console.log(`[QR] Generating QR code for link: ${deepLink}`);
  
  const qrArtifactPath = path.join(ARTIFACT_DIR, 'expo_qr_localhost_run.png');
  const qrLocalPath = path.join(__dirname, 'tunnel_qr_localhost_run.png');
  
  QRCode.toFile(qrArtifactPath, deepLink, { width: 400 }, (err) => {
    if (err) {
      console.error('[QR Error]', err);
    } else {
      console.log(`[QR] Saved to artifacts: ${qrArtifactPath}`);
      try {
        fs.copyFileSync(qrArtifactPath, qrLocalPath);
        console.log(`[QR] Copied to workspace: ${qrLocalPath}`);
      } catch (e) {
        console.error('[QR Copy Error]', e);
      }
    }
  });

  // If expo is already running, kill the old process tree first
  if (expoProcess) {
    console.log(`[Expo] Stopping old Expo process tree (PID ${expoProcess.pid}) for URL change...`);
    spawn('taskkill', ['/F', '/T', '/PID', String(expoProcess.pid)]);
    expoProcess = null;
  }
  
  // Wait a moment for ports to clear, then start Expo on PORT_EXPO (19004)
  setTimeout(() => {
    console.log(`[Expo] Starting expo on port ${PORT_EXPO} with EXPO_PACKAGER_PROXY_URL=${tunnelUrl}...`);
    expoProcess = spawn('npx', ['expo', 'start', '--port', String(PORT_EXPO)], {
      env: {
        ...process.env,
        EXPO_PACKAGER_PROXY_URL: tunnelUrl
      },
      shell: true,
      stdio: 'inherit'
    });
  }, 1000);
}

startTunnel();

// Clean shutdown on exits
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

function cleanup() {
  console.log('Cleaning up processes...');
  if (sshProcess) sshProcess.kill();
  if (expoProcess) {
    try {
      spawn('taskkill', ['/F', '/T', '/PID', String(expoProcess.pid)]);
    } catch(e) {}
  }
  if (socketProcess) socketProcess.kill();
}
