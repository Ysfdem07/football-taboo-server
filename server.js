const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendResetEmail(email, username, code) {
  const mailOptions = {
    from: `"FutTaboo Destek" <${process.env.SMTP_USER || 'no-reply@futtaboo.com'}>`,
    to: email,
    subject: 'FutTaboo - Şifre Sıfırlama Kodu',
    text: `Merhaba ${username},\n\nFutTaboo hesabınız için şifre sıfırlama talebinde bulundunuz.\n\nŞifre sıfırlama kodunuz: ${code}\n\nBu kod 15 dakika süreyle geçerlidir.\n\nEğer bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayın.\n\nİyi oyunlar!`
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[Mail Warning] SMTP_USER or SMTP_PASS is not set. Resending code via logs:`);
    console.log(`[Reset Code for ${email}]: ${code}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reset email sent successfully to ${email}`);
  } catch (err) {
    console.error('Failed to send reset email:', err);
  }
}

function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const app = express();
app.use(cors());

// Seed route to insert initial players into MongoDB Atlas
app.get('/seed-players', async (req, res) => {
  try {
    await db.connectDB();
    const mongoose = require('mongoose');
    const Player = mongoose.model('Player');
    
    const existingPlayers = [
      {
        id: 'player_d2qebyx51',
        username: 'Lionel Yusuf',
        password: 'Ysfdem88',
        avatar: '🦅',
        email: 'yusuf@futtaboo.com',
        marketingConsent: true,
        kp: 0,
        matches_played: 9,
        matches_won: 2,
        correct_guesses: 0,
        taboos: 0
      },
      {
        id: 'player_7j9cehjaz',
        username: 'toledo7',
        password: 'Kaandikbasan1',
        avatar: '⚽',
        email: 'kaan@futtaboo.com',
        marketingConsent: true,
        kp: 275,
        matches_played: 10,
        matches_won: 7,
        correct_guesses: 0,
        taboos: 0
      }
    ];

    const results = [];
    for (const p of existingPlayers) {
      const exists = await Player.findOne({ id: p.id });
      if (exists) {
        await Player.updateOne({ id: p.id }, p);
        results.push(`Updated ${p.username}`);
      } else {
        await Player.create(p);
        results.push(`Created ${p.username}`);
      }
    }
    res.json({ success: true, message: 'Players seeded successfully!', details: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const uri = process.env.MONGODB_URI || 'not-set';
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  res.json({ status: 'ok', mongodb_uri: maskedUri, time: new Date() });
});

const server = http.createServer(app);
const io = require('socket.io')(server, {
  pingTimeout: 120000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const Papa = require('papaparse');
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv";
const WORDS_PATH = path.join(__dirname, '..', 'assets', 'data', 'words.json');
let wordsDb = [];

async function loadWords() {
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    const csvText = await response.text();
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const newWords = [];
        const rows = results.data;
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[0] || row[0].trim() === '') continue;
          const word = row[0].trim();
          const forbidden = [];
          for (let col = 1; col <= 5; col++) {
             if (row[col] && row[col].trim() !== '') forbidden.push(row[col].trim());
          }
          newWords.push({ word, forbidden });
        }
        if (newWords.length > 0) {
          wordsDb = newWords;
          console.log(`Loaded ${wordsDb.length} words from Cloud Database.`);
        }
      }
    });
  } catch (e) {
    console.error("Cloud fetch failed, falling back to local words.json", e);
    wordsDb = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8'));
  }
}

// Load initially and refresh every 1 hour
loadWords();
setInterval(loadWords, 3600000);

let queue = [];
const activeRooms = {}; // roomId -> room details
const disconnectTimeouts = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (socket.recovered) {
    if (disconnectTimeouts[socket.id]) {
      clearTimeout(disconnectTimeouts[socket.id]);
      delete disconnectTimeouts[socket.id];
    }
  }

  // Profile Registration
  socket.on('register_profile', async (data) => {
    const { username, password, avatar, email, marketingConsent } = data;
    const result = await db.registerPlayer(username, password, avatar, email, marketingConsent);
    if (result.error) {
      socket.emit('register_response', { success: false, error: result.error });
    } else {
      socket.emit('register_response', { success: true, player: result.player });
    }
  });

  // Profile Login
  socket.on('login_profile', async (data) => {
    const { username, password } = data;
    const result = await db.loginPlayer(username, password);
    if (result.error) {
      socket.emit('login_response', { success: false, error: result.error });
    } else {
      socket.emit('login_response', { success: true, player: result.player });
    }
  });

  // Forgot Password Code Request
  socket.on('forgot_password', async (data) => {
    const { email } = data;
    const result = await db.generateResetCode(email);
    if (result.error) {
      socket.emit('forgot_password_response', { success: false, error: result.error });
    } else {
      await sendResetEmail(email, result.username, result.code);
      socket.emit('forgot_password_response', { success: true, message: 'Doğrulama kodu e-posta adresinize gönderildi.' });
    }
  });

  // Reset Password Verification
  socket.on('reset_password', async (data) => {
    const { email, code, newPassword } = data;
    const result = await db.resetPasswordWithCode(email, code, newPassword);
    if (result.error) {
      socket.emit('reset_password_response', { success: false, error: result.error });
    } else {
      socket.emit('reset_password_response', { success: true, player: result.player, message: 'Şifreniz başarıyla sıfırlandı!' });
    }
  });

  // Global Leaderboard Fetch
  socket.on('get_leaderboard', async () => {
    const leaderboard = await db.getLeaderboard();
    socket.emit('leaderboard_data', { leaderboard });
  });

  socket.on('join_queue', (data) => {
    // Make sure user isn't already in queue
    if (queue.find(u => u.id === socket.id)) return;
    
    console.log(socket.id, 'joined queue. Name:', data.name, 'DB Player ID:', data.dbPlayerId);
    queue.push({ 
      id: socket.id, 
      name: data.name || 'Misafir',
      dbPlayerId: data.dbPlayerId || null 
    });

    if (queue.length >= 2) {
      const p1 = queue.shift();
      const p2 = queue.shift();
      
      const roomId = `room_${Date.now()}_${Math.random()}`;
      
      // Make them join socket room
      io.sockets.sockets.get(p1.id)?.join(roomId);
      io.sockets.sockets.get(p2.id)?.join(roomId);

      activeRooms[roomId] = {
        isPrivate: false,
        isRanked1v1: true,
        status: 'playing',
        players: [p1, p2],
        scores: { [p1.id]: 0, [p2.id]: 0 },
        currentRound: 0,
        maxRounds: 10,
        usedWords: [], // Track words used in this session
        timer: null,
        roundActive: false,
        isPaused: false,
        guessingPlayerId: null,
        guessTimer: null
      };

      io.to(roomId).emit('match_found', {
        players: [p1, p2],
        roomId
      });

      // Give 3 seconds before starting the game
      setTimeout(() => {
        startRound(roomId);
      }, 3000);
    }
  });

  socket.on('create_room', (data) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i=0; i<5; i++) code += characters.charAt(Math.floor(Math.random() * characters.length));
    
    const roomId = 'private_' + code;
    socket.join(roomId);
    
    activeRooms[roomId] = {
      isPrivate: true,
      isGroupRanked: data.isRanked || false,
      roomCode: code,
      hostId: socket.id,
      status: 'waiting', 
      players: [{ id: socket.id, name: data.name || 'Oyuncu', dbPlayerId: data.dbPlayerId || null }],
      scores: { [socket.id]: 0 },
      currentRound: 0,
      maxRounds: data.maxRounds || 10,
      usedWords: [],
      timer: null,
      roundActive: false,
      isPaused: false,
      guessingPlayerId: null,
      guessTimer: null
    };
    
    socket.emit('room_created', { roomCode: code, roomId });
    io.to(roomId).emit('room_update', { players: activeRooms[roomId].players, hostId: socket.id });
  });

  socket.on('join_room', (data) => {
    const { roomCode, name, dbPlayerId } = data;
    const roomId = Object.keys(activeRooms).find(id => activeRooms[id].roomCode === roomCode.toUpperCase());
    
    if (!roomId) {
      socket.emit('join_error', { message: 'Oda bulunamadı veya kapalı!' });
      return;
    }
    
    const room = activeRooms[roomId];
    if (room.status !== 'waiting') {
      socket.emit('join_error', { message: 'Oyun zaten başlamış!' });
      return;
    }
    
    if (room.players.find(p => p.id === socket.id)) return;
    
    socket.join(roomId);
    room.players.push({ id: socket.id, name: name || 'Oyuncu', dbPlayerId: dbPlayerId || null });
    room.scores[socket.id] = 0;
    
    socket.emit('room_joined', { roomId, roomCode: room.roomCode });
    io.to(roomId).emit('room_update', { players: room.players, hostId: room.hostId });
  });

  socket.on('start_room_game', (data) => {
    const { roomId } = data;
    const room = activeRooms[roomId];
    if (!room || room.hostId !== socket.id || room.status !== 'waiting') return;
    
    room.status = 'playing';
    io.to(roomId).emit('game_starting_soon');
    setTimeout(() => {
      startRound(roomId);
    }, 3000);
  });

  socket.on('request_guess_turn', (data) => {
    const { roomId } = data;
    const room = activeRooms[roomId];
    if (!room || !room.roundActive || room.isPaused || room.guessingPlayerId) return; // someone is already guessing or round ended

    room.guessingPlayerId = socket.id;
    room.isPaused = true;
    let guessTimeLeft = 10;

    io.to(roomId).emit('guess_turn_started', { playerId: socket.id, time: guessTimeLeft });

    room.guessTimer = setInterval(() => {
      guessTimeLeft--;
      if (guessTimeLeft <= 0) {
        clearInterval(room.guessTimer);
        room.guessTimer = null;
        room.guessingPlayerId = null;
        room.isPaused = false;
        
        // Timeout penalty
        const penalty = (room.isRanked1v1 || room.isGroupRanked) ? 10 : 3;
        room.scores[socket.id] -= penalty;
        io.to(roomId).emit('wrong_guess', { scores: room.scores, reason: 'timeout', playerId: socket.id });
        io.to(roomId).emit('guess_turn_ended');
      } else {
        io.to(roomId).emit('guess_time_tick', { time: guessTimeLeft });
      }
    }, 1000);
  });

  socket.on('guess_word', (data) => {
    const { roomId, guess } = data;
    const room = activeRooms[roomId];
    if (!room || !room.roundActive) return;
    
    if (room.guessingPlayerId !== socket.id) return;

    if (room.guessTimer) {
      clearInterval(room.guessTimer);
      room.guessTimer = null;
    }

    if (normalizeText(guess) === normalizeText(room.card.word)) {
      // Correct!
      room.roundActive = false;
      room.isPaused = false;
      room.guessingPlayerId = null;
      clearInterval(room.timer);
      
      let pointsEarned = 5;
      if (room.isRanked1v1 || room.isGroupRanked) {
        // Variable scoring: 100 - 10 per hint (excluding first) - 10 per letter, min 10
        const hintsPenalty = (room.hintsShown - 1) * 10;
        const lettersPenalty = (room.revealedIndices ? room.revealedIndices.length : 0) * 10;
        pointsEarned = Math.max(10, 100 - hintsPenalty - lettersPenalty);
      } else {
        if (room.revealedIndices && room.revealedIndices.length === 0) {
          pointsEarned += 3; // Bonus for guessing before letters reveal
        }
      }
      
      room.scores[socket.id] += pointsEarned;
      
      io.to(roomId).emit('round_ended', {
        winnerId: socket.id,
        winnerName: room.players.find(p => p.id === socket.id)?.name,
        word: room.card.word,
        reason: 'correct_guess',
        scores: room.scores
      });
      
      setTimeout(() => {
        startRound(roomId);
      }, 4000);
    } else {
      // Incorrect guess
      const penalty = (room.isRanked1v1 || room.isGroupRanked) ? 10 : 3;
      room.scores[socket.id] -= penalty;
      room.guessingPlayerId = null;
      room.isPaused = false;

      io.to(roomId).emit('wrong_guess', { scores: room.scores, reason: 'incorrect', playerId: socket.id });
      io.to(roomId).emit('guess_turn_ended');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    queue = queue.filter(u => u.id !== socket.id);
    
    // If they were in an active room
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        if (room.status === 'waiting') {
           // Remove from lobby immediately
           room.players.splice(playerIndex, 1);
           delete room.scores[socket.id];
           if (room.players.length === 0) {
             delete activeRooms[roomId];
           } else {
             if (room.hostId === socket.id) {
               room.hostId = room.players[0].id;
             }
             io.to(roomId).emit('room_update', { players: room.players, hostId: room.hostId });
           }
        } else {
           // Playing state: Delay removal to allow Socket.io auto-reconnect
           io.to(roomId).emit('player_disconnected_warning', { playerId: socket.id });
           
           disconnectTimeouts[socket.id] = setTimeout(async () => {
             if (!activeRooms[roomId]) return;
             
             const pIndex = room.players.findIndex(p => p.id === socket.id);
             if (pIndex !== -1) {
               const disconnectedPlayer = room.players[pIndex];
               room.players.splice(pIndex, 1);
               io.to(roomId).emit('player_disconnected', { playerId: socket.id, players: room.players });
               
               if (room.players.length <= 1) {
                 clearInterval(room.timer);
                 if(room.guessTimer) clearInterval(room.guessTimer);
                 
                 // Apply rage quit penalty if ranked 1v1
                 if (room.isRanked1v1) {
                   const remainingPlayer = room.players[0];
                   if (remainingPlayer && remainingPlayer.dbPlayerId) {
                     await db.updatePlayerStats(remainingPlayer.dbPlayerId, 50, true);
                   }
                   if (disconnectedPlayer && disconnectedPlayer.dbPlayerId) {
                     await db.updatePlayerStats(disconnectedPlayer.dbPlayerId, -35, false);
                   }
                 }
                 
                 io.to(roomId).emit('opponent_disconnected'); 
                 delete activeRooms[roomId];
               }
             }
           }, 15000); // Wait 15 seconds for reconnect before kicking
        }
      }
    }
  });
});

async function startRound(roomId) {
  const room = activeRooms[roomId];
  if (!room) return;

  // Clear any existing timer just in case
  if (room.timer) clearInterval(room.timer);
  if (room.guessTimer) clearInterval(room.guessTimer);
  room.roundActive = true;
  room.isPaused = false;
  room.guessingPlayerId = null;
  room.guessTimer = null;

  room.currentRound++;
  if (room.currentRound > room.maxRounds) {
    const kpChanges = {};
    if (room.isRanked1v1 && room.players.length === 2) {
      const p1 = room.players[0];
      const p2 = room.players[1];
      const s1 = room.scores[p1.id] || 0;
      const s2 = room.scores[p2.id] || 0;
      
      if (s1 > s2) {
        if (p1.dbPlayerId) await db.updatePlayerStats(p1.dbPlayerId, 50, true);
        if (p2.dbPlayerId) await db.updatePlayerStats(p2.dbPlayerId, -25, false);
        kpChanges[p1.id] = 50;
        kpChanges[p2.id] = -25;
      } else if (s2 > s1) {
        if (p1.dbPlayerId) await db.updatePlayerStats(p1.dbPlayerId, -25, false);
        if (p2.dbPlayerId) await db.updatePlayerStats(p2.dbPlayerId, 50, true);
        kpChanges[p1.id] = -25;
        kpChanges[p2.id] = 50;
      } else {
        if (p1.dbPlayerId) await db.updatePlayerStats(p1.dbPlayerId, 10, false);
        if (p2.dbPlayerId) await db.updatePlayerStats(p2.dbPlayerId, 10, false);
        kpChanges[p1.id] = 10;
        kpChanges[p2.id] = 10;
      }
    } else if (room.isGroupRanked && room.players.length >= 3) {
      const sorted = [...room.players].sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0));
      // 1st place
      if (sorted[0].dbPlayerId) await db.updatePlayerStats(sorted[0].dbPlayerId, 125, true);
      kpChanges[sorted[0].id] = 125;
      // 2nd place
      if (sorted[1].dbPlayerId) await db.updatePlayerStats(sorted[1].dbPlayerId, 50, false);
      kpChanges[sorted[1].id] = 50;
      // Others
      for (let i = 2; i < sorted.length; i++) {
        if (sorted[i].dbPlayerId) await db.updatePlayerStats(sorted[i].dbPlayerId, -25, false);
        kpChanges[sorted[i].id] = -25;
      }
    }

    io.to(roomId).emit('game_over', { scores: room.scores, kpChanges });
    delete activeRooms[roomId];
    return;
  }

  // Pick a random card that hasn't been used yet
  const availableWords = wordsDb.filter(w => !room.usedWords.includes(w.word));
  const cardList = availableWords.length > 0 ? availableWords : wordsDb; // fallback if we somehow exhaust all words
  const card = cardList[Math.floor(Math.random() * cardList.length)];
  
  room.usedWords.push(card.word);
  room.card = card;
  room.timeLeft = 30;
  room.hintsShown = 1; // First hint immediately

  // Create word hint replacing only non-space chars with underscore
  room.wordHintArray = card.word.split('').map(c => c === ' ' ? ' ' : '_');
  room.revealedIndices = [];
  room.finalCountdownStarted = false;

  // Initial emit
  io.to(roomId).emit('game_start', {
    wordLength: card.word.length,
    wordHint: room.wordHintArray.join(''),
    firstHint: card.forbidden[0],
    timeLeft: room.timeLeft,
    currentRound: room.currentRound,
    maxRounds: room.maxRounds,
    scores: room.scores,
    players: room.players
  });

  room.timer = setInterval(() => {
    if (room.isPaused) return; // PAUSE logic

    room.timeLeft--;

    // Every 5 seconds (25, 20, 15, 10), we show another hint
    if (room.timeLeft % 5 === 0 && room.timeLeft < 30 && room.timeLeft > 0 && room.hintsShown < 5) {
      const hintWord = card.forbidden[room.hintsShown];
      room.hintsShown++;
      io.to(roomId).emit('hint_revealed', { hint: hintWord });
    }

    // After all hints are shown (timeLeft < 10), reveal one letter every 2 seconds, max 3 letters
    if (room.timeLeft < 10 && room.timeLeft % 2 === 0 && room.revealedIndices.length < 3) {
      const availableIndices = [];
      for (let i = 0; i < card.word.length; i++) {
        if (card.word[i] !== ' ' && !room.revealedIndices.includes(i)) {
          availableIndices.push(i);
        }
      }
      if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        room.revealedIndices.push(randomIndex);
        room.wordHintArray[randomIndex] = card.word[randomIndex];
        io.to(roomId).emit('word_hint_update', { wordHint: room.wordHintArray.join('') });
      }
      
      // If we just revealed the 3rd letter, or no more letters can be revealed
      if (!room.finalCountdownStarted && (room.revealedIndices.length === 3 || availableIndices.length <= 1)) {
        room.finalCountdownStarted = true;
        room.timeLeft = 15; // Provide 15 seconds for the final guesses
      }
    }

    if (room.timeLeft <= 0 && room.roundActive) {
      room.roundActive = false;
      clearInterval(room.timer);
      io.to(roomId).emit('round_ended', {
        winnerId: null,
        word: card.word,
        reason: 'timeout',
        scores: room.scores
      });
      
      setTimeout(() => {
        startRound(roomId);
      }, 4000);
    } else if (room.timeLeft > 0 && room.roundActive) {
      io.to(roomId).emit('time_tick', { timeLeft: room.timeLeft });
    }
  }, 1000);
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
