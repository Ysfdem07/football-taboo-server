const io = require('socket.io-client');
const socket = io('https://wordico.net');
socket.on('connect', () => {
  console.log('connected');
  socket.emit('get_weekly_tournament', { playerId: 'guest', category: 'football' });
});
socket.on('weekly_tournament_data', (data) => {
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
});
