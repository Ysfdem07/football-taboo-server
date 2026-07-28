const { spawn } = require('child_process');
const https = require('https');

const NTFY_TOPIC = 'footballtaboo_ysfde_url';

function updateNtfy(tunnelUrl) {
  const req = https.request({
    hostname: 'ntfy.sh',
    path: `/${NTFY_TOPIC}`,
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(tunnelUrl)
    }
  }, (res) => {
    console.log(`Updated ntfy with ${tunnelUrl} - Status: ${res.statusCode}`);
  });

  req.on('error', (e) => {
    console.error(`Problem updating ntfy: ${e.message}`);
  });

  req.write(tunnelUrl);
  req.end();
}

function startTunnel() {
  console.log('Starting localhost.run tunnel...');
  const child = spawn('ssh', ['-R', '80:localhost:3000', 'nokey@localhost.run', '-T', '-o', 'StrictHostKeyChecking=no']);

  child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Tunnel stdout: ${output}`);
    
    // Parse the URL: e.g. "something.lhr.life tunneled with tls termination, https://something.lhr.life"
    const match = output.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.life/);
    if (match && match[0]) {
      const url = match[0];
      console.log(`>>> Detected Tunnel URL: ${url}`);
      updateNtfy(url);
    }
  });

  child.stderr.on('data', (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.life/);
    if (match && match[0]) {
      const url = match[0];
      console.log(`>>> Detected Tunnel URL: ${url}`);
      updateNtfy(url);
    }
  });

  child.on('close', (code) => {
    console.log(`Tunnel process exited with code ${code}. Restarting in 5 seconds...`);
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();
