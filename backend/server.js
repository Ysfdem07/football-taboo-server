const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const nodemailer = require('nodemailer');

// Global crash logging helper to debug cloud environment startup issues
process.on('uncaughtException', (err) => {
  const logMsg = `\n[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.stack || err.message || err}\n`;
  console.error(logMsg);
  try { fs.appendFileSync('crash_log.txt', logMsg); } catch(e) {}
});

process.on('unhandledRejection', (reason, promise) => {
  const logMsg = `\n[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason?.stack || reason?.message || reason}\n`;
  console.error(logMsg);
  try { fs.appendFileSync('crash_log.txt', logMsg); } catch(e) {}
});

// Resolve SMTP environment variables case-insensitively with synonyms
// Hardcoded fallback ensures mail works even if Railway env vars are missing
const smtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.smtp_user || process.env.smtp_username || 'wordrushtr@gmail.com';
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.smtp_pass || process.env.smtp_password || 'gtxsemnokpizucmx';

// Diagnostic variables to trace mail sending status remotely
let mailErrorLog = 'None';
let mailSuccessLog = 'None';

const transporter = nodemailer.createTransport({
  host: '74.125.130.108', // smtp.gmail.com IPv4 - Railway IPv6 engeli asildi
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: { servername: 'smtp.gmail.com' },
  connectionTimeout: 15000,
  socketTimeout: 15000
});

// Send mail using Resend API over HTTPS (Bypasses Render SMTP port blocking)
function sendResendEmail(email, username, code) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      from: 'Wordico Destek <noreply@wordico.net>',
      to: [email],
      subject: 'FutTaboo - Şifre Sıfırlama Kodu',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4CAF50;">Merhaba ${username},</h2>
          <p>FutTaboo hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
          <p style="font-size: 16px; margin: 20px 0;">Şifre sıfırlama kodunuz:</p>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-radius: 4px; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4CAF50; border: 1px dashed #4CAF50;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">Bu kod 15 dakika süreyle geçerlidir.</p>
          <p style="color: #999; font-size: 12px;">Eğer bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayın.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; font-weight: bold; color: #4CAF50;">FutTaboo Ekibi</p>
        </div>
      `
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY || ''}`
      },
      timeout: 10000 // 10s timeout
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Resend API returned status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Resend API request timed out after 10s'));
    });

    req.write(data);
    req.end();
  });
}

async function sendResetEmail(email, username, code) {
  // 1) SMTP - Gmail port 587 TLS IPv4
  try {
    await transporter.sendMail({
      from: `Wordico Destek <${smtpUser}>`,
      to: email,
      subject: 'FutTaboo - Şifre Sıfırlama Kodu',
      text: `Merhaba ${username},\n\nŞifre sıfırlama kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir.`
    });
    const msg = `SMTP OK: Reset email sent to ${email}`;
    console.log(msg);
    mailSuccessLog = msg;
    mailErrorLog = 'None';
    return { success: true };
  } catch (smtpErr) {
    console.error(`[SMTP ERR] ${smtpErr.message}`);
    mailErrorLog = `SMTP failed: ${smtpErr.message}`;
  }

  // 2) Resend HTTP API fallback
  const resendKey = process.env.RESEND_API_KEY || '';
  if (resendKey) {
    try {
      await sendResendEmail(email, username, code);
      const msg = `Resend OK: Reset email sent to ${email}`;
      console.log(msg);
      mailSuccessLog = msg;
      mailErrorLog = 'None';
      return { success: true };
    } catch (resendErr) {
      console.error(`[Resend ERR] ${resendErr.message}`);
      mailErrorLog = `Resend failed: ${resendErr.message}`;
    }
  }

  // 3) Her ikisi de başarısız — devMode
  const devMsg = `[Mail DevMode] No active mail config. Code for ${email}: ${code}`;
  console.warn(devMsg);
  mailErrorLog = devMsg;
  return { success: true, devMode: true };
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
app.use(express.static(path.join(__dirname, 'public')));
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

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/debug-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) return res.json({ error: 'Not connected' });
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const players = await mongoose.connection.collection('players').find({}).toArray();
    
    res.json({
      databaseName: db.databaseName,
      collections: collections.map(c => c.name),
      playersCount: players.length,
      playerEmails: players.map(p => p.email),
      playerUsernames: players.map(p => p.username)
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get('/health-legacy', async (req, res) => {
  const uri = process.env.MONGODB_URI || 'not-set';
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  
  let dbSuccessLogs = [];
  let dbErrorLogs = [];
  try {
    dbSuccessLogs = await db.getLogs('smtp_success', 3);
    dbErrorLogs = await db.getLogs('smtp_error', 3);
  } catch(e) {}

  res.json({ 
    status: 'ok', 
    mongodb_uri: maskedUri, 
    time: new Date(),
    resend_api_active: !!process.env.RESEND_API_KEY,
    smtp_user_exists: !!smtpUser,
    smtp_pass_exists: !!smtpPass,
    mail_success_log: mailSuccessLog,
    mail_error_log: mailErrorLog,
    db_success_logs: dbSuccessLogs.map(l => l.message),
    db_error_logs: dbErrorLogs.map(l => l.message)
  });
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
const CSV_URLS = {
  football: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=0",
  cinema: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=927039923",
  music: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=648666227"
};
const WORDS_PATH = path.join(__dirname, '..', 'assets', 'data', 'words.json');
let wordsDb = { football: [], cinema: [], music: [] };

async function loadWords() {
  for (const category of Object.keys(CSV_URLS)) {
    try {
      const response = await fetch(CSV_URLS[category]);
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
            wordsDb[category] = newWords;
            console.log(`Loaded ${wordsDb[category].length} words from Cloud Database for ${category}.`);
          }
        }
      });
    } catch (e) {
      console.error(`Cloud fetch failed for ${category}, falling back to local words.json if football`, e);
      if (category === 'football') {
         wordsDb.football = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8'));
      }
    }
  }
}

// Load initially and refresh every 1 hour
loadWords();
setInterval(loadWords, 3600000);

// ─── Tournament Init ─────────────────────────────────────────────────────────
async function initTournament() {
  setTimeout(async () => {
    try {
      for (const category of Object.keys(wordsDb)) {
        const wordSource = wordsDb[category].length > 0 ? wordsDb[category] : (category === 'football' ? JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')) : []);
        if (wordSource.length > 0) {
           await db.ensureWeeklyTournament(wordSource, category);
           console.log(`[Tournament] Weekly tournament ensured for ${category}.`);
        }
      }
    } catch (e) {
      console.error('[Tournament] Async Init error:', e);
    }
  }, 5000);
}
initTournament();

// Check every hour: if it's Sunday night, give rewards
setInterval(async () => {
  const now = new Date();
  // Sunday = 0, after 23:00
  if (now.getDay() === 0 && now.getHours() >= 23) {
    const result = await db.giveWeeklyRewards();
    if (result?.success) console.log(`[Tournament] Weekly rewards given to ${result.rewarded} players.`);
  }
  // Monday = 1, after 00:01 — ensure new tournament exists
  if (now.getDay() === 1 && now.getHours() === 0) {
    for (const category of Object.keys(wordsDb)) {
      const wordSource = wordsDb[category].length > 0 ? wordsDb[category] : (category === 'football' ? JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')) : []);
      if (wordSource.length > 0) {
         await db.ensureWeeklyTournament(wordSource, category);
      }
    }
  }
}, 3600000);

let queue = [];
const activeRooms = {}; // roomId -> room details
const disconnectTimeouts = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ─── Tournament Events ──────────────────────────────────────────────────
  socket.on('get_weekly_tournament', async (data) => {
    const playerId = data?.playerId || 'guest';
    const category = data?.category || 'football';
    const wordSource = wordsDb[category]?.length > 0 ? wordsDb[category] : (category === 'football' ? JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')) : []);
    const result = await db.getWeeklyTournament(playerId, wordSource, category);
    socket.emit('weekly_tournament_data', result);
  });

  socket.on('grant_tournament_ad_attempt', async (data) => {
    const { playerId, category } = data;
    if (!playerId) return;
    const result = await db.grantAdAttempt(playerId, category || 'football');
    socket.emit('weekly_tournament_data', result);
  });

  socket.on('submit_tournament_score', async (data) => {
    const { playerId, username, avatar, score, correctCount, category } = data;
    if (!playerId || !username) {
      socket.emit('tournament_score_result', { error: 'Skoru kaydetmek için giriş yapmalısın.' });
      return;
    }
    const result = await db.submitTournamentScore(playerId, username, avatar, score, correctCount, category || 'football');
    socket.emit('tournament_score_result', result);
  });

  socket.on('get_tournament_leaderboard', async (data) => {
    const category = data?.category || 'football';
    const board = await db.getTournamentLeaderboard(category);
    socket.emit('tournament_leaderboard', board);
  });
  // ────────────────────────────────────────────────────────────────────────

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
    console.log(`[ForgotPwd Request] Received forgot_password event for email: "${email}"`);
    
    // generateResetCode internally calls connectDB() - no need to pre-check
    let result;
    try {
      result = await db.generateResetCode(email);
    } catch (dbErr) {
      console.error(`[ForgotPwd Error] generateResetCode exception:`, dbErr.message);
      return socket.emit('forgot_password_response', { success: false, error: 'Sunucu hatası. Lütfen tekrar deneyin.' });
    }

    if (result.error && !result.devMode) {
      console.warn(`[ForgotPwd Warning] generateResetCode failed: ${result.error}`);
      return socket.emit('forgot_password_response', { success: false, error: result.error });
    }

    const resetCode = result.code || '777777';
    const username = result.username || 'TestOyuncusu';

    console.log(`[ForgotPwd Info] Generated reset code ${resetCode} for ${email}. Triggering sendResetEmail...`);
    
    // Run mailer in background (Non-blocking)
    sendResetEmail(email, username, resetCode)
      .then(mailRes => {
        if (mailRes) {
          console.log(`[ForgotPwd Mailer] Background sendResetEmail finished. Success: ${mailRes.success}, devMode: ${!!mailRes.devMode}`);
        } else {
          console.warn(`[ForgotPwd Mailer] Background sendResetEmail returned no response`);
        }
      })
      .catch(mailErr => {
        console.error(`[ForgotPwd Mailer Error] Background sendResetEmail crashed:`, mailErr);
      });

    console.log(`[ForgotPwd Success] Emitting immediate forgot_password_response to client`);
    
    // Emit immediate success to client so spinner disappears instantly
    socket.emit('forgot_password_response', { 
      success: true, 
      message: result.devMode ? 'Geliştirici Modu: Kod sunucu tarafından üretildi.' : 'Doğrulama kodu e-posta adresinize gönderildi.',
      code: result.devMode ? resetCode : null,
      devMode: !!result.devMode
    });
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
  socket.on('get_leaderboard', async (data) => {
    const category = data?.category || null;
    const leaderboard = await db.getLeaderboard(category);
    socket.emit('leaderboard_data', { leaderboard, category });
  });

  socket.on('join_queue', (data) => {
    // Make sure user isn't already in queue
    if (queue.find(u => u.id === socket.id)) return;
    
    const category = data.category || 'football';
    console.log(socket.id, 'joined queue. Name:', data.name, 'DB Player ID:', data.dbPlayerId, 'Category:', category);
    queue.push({ 
      id: socket.id, 
      name: data.name || 'Misafir',
      dbPlayerId: data.dbPlayerId || null,
      category 
    });

    const categoryQueue = queue.filter(u => u.category === category);
    if (categoryQueue.length >= 2) {
      const p1 = queue.splice(queue.findIndex(u => u.id === categoryQueue[0].id), 1)[0];
      const p2 = queue.splice(queue.findIndex(u => u.id === categoryQueue[1].id), 1)[0];
      
      const roomId = `room_${Date.now()}_${Math.random()}`;
      
      // Make them join socket room
      io.sockets.sockets.get(p1.id)?.join(roomId);
      io.sockets.sockets.get(p2.id)?.join(roomId);

      activeRooms[roomId] = {
        category,
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
      category: data.category || 'football',
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
                    const roomCat = room.category || 'football';
                    const remainingPlayer = room.players[0];
                    if (remainingPlayer && remainingPlayer.dbPlayerId) {
                      await db.updatePlayerStats(remainingPlayer.dbPlayerId, 50, true, 0, 0, roomCat);
                    }
                    if (disconnectedPlayer && disconnectedPlayer.dbPlayerId) {
                      await db.updatePlayerStats(disconnectedPlayer.dbPlayerId, -35, false, 0, 0, roomCat);
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
    const roomCat = room.category || 'football';
    if (room.isRanked1v1 && room.players.length === 2) {
      const p1 = room.players[0];
      const p2 = room.players[1];
      const s1 = room.scores[p1.id] || 0;
      const s2 = room.scores[p2.id] || 0;
      
      if (s1 > s2) {
        if (p1.dbPlayerId) await db.updatePlayerStats(p1.dbPlayerId, 50, true, 0, 0, roomCat);
        if (p2.dbPlayerId) await db.updatePlayerStats(p2.dbPlayerId, -25, false, 0, 0, roomCat);
        kpChanges[p1.id] = 50;
        kpChanges[p2.id] = -25;
      } else if (s2 > s1) {
        if (p1.dbPlayerId) await db.updatePlayerStats(p1.dbPlayerId, -25, false, 0, 0, roomCat);
        if (p2.dbPlayerId) await db.updatePlayerStats(p2.dbPlayerId, 50, true, 0, 0, roomCat);
        kpChanges[p1.id] = -25;
        kpChanges[p2.id] = 50;
      } else {
        if (p1.dbPlayerId) await db.updatePlayerStats(p1.dbPlayerId, 10, false, 0, 0, roomCat);
        if (p2.dbPlayerId) await db.updatePlayerStats(p2.dbPlayerId, 10, false, 0, 0, roomCat);
        kpChanges[p1.id] = 10;
        kpChanges[p2.id] = 10;
      }
    } else if (room.isGroupRanked && room.players.length >= 3) {
      const sorted = [...room.players].sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0));
      // 1st place
      if (sorted[0].dbPlayerId) await db.updatePlayerStats(sorted[0].dbPlayerId, 125, true, 0, 0, roomCat);
      kpChanges[sorted[0].id] = 125;
      // 2nd place
      if (sorted[1].dbPlayerId) await db.updatePlayerStats(sorted[1].dbPlayerId, 50, false, 0, 0, roomCat);
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
  const roomCategory = room.category || 'football';
  const availableWords = (wordsDb[roomCategory] || []).filter(w => !room.usedWords.includes(w.word));
  const cardList = availableWords.length > 0 ? availableWords : (wordsDb[roomCategory] || []); // fallback if we somehow exhaust all words
  
  if (cardList.length === 0) {
    // Failsafe in case words haven't loaded for this category
    console.error(`No words found for category ${roomCategory}`);
    return;
  }
  
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

