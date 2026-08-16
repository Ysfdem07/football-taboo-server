const https = require('https');
const check = () => {
  https.get('https://wordico.net/api/logs', (res) => {
    if (res.statusCode === 200) {
      console.log('Deployed!');
      process.exit(0);
    } else {
      console.log(`Status: ${res.statusCode}. Waiting...`);
      setTimeout(check, 5000);
    }
  }).on('error', (e) => {
    console.log(`Error: ${e.message}. Waiting...`);
    setTimeout(check, 5000);
  });
};
check();
