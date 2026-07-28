// Minimal Socket.IO server for testing dynamic clues
const { Server } = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 3005;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('⚡️ Client connected', socket.id);

  socket.on('requestClues', async ({ entityId }) => {
    // For now just send an empty array – the client will fallback to static clues if needed
    socket.emit('clues', { entityId, clues: [] });
  });

  socket.on('disconnect', () => console.log('👋 Client disconnected'));
});

server.listen(PORT, () => console.log(`🟢 Socket server listening on http://localhost:${PORT}`));
