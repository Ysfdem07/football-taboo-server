const QRCode = require('qrcode');

const url = 'exp://clever-coins-wink.loca.lt';
const outputPath = 'C:/Users/ysfde/.gemini/antigravity/brain/13653dc5-97b5-40f9-960f-c3523139db17/expo_qr_ios_tunnel.png';

QRCode.toFile(outputPath, url, {
  color: {
    dark: '#000000',
    light: '#ffffff'
  },
  width: 400
}, function (err) {
  if (err) throw err;
  console.log('QR Code successfully saved to ' + outputPath);
});
