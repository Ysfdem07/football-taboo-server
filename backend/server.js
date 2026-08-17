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

const memLogs = [];
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  originalLog.apply(console, args);
  memLogs.push({ time: new Date().toISOString(), type: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
  if (memLogs.length > 500) memLogs.shift();
};
console.error = function(...args) {
  originalError.apply(console, args);
  memLogs.push({ time: new Date().toISOString(), type: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
  if (memLogs.length > 500) memLogs.shift();
};

app.get('/api/logs', (req, res) => {
  res.json(memLogs);
});


// Load privacy policy HTML string directly into memory
const getPrivacyHtmlContent = () => {
  const p1 = path.resolve(__dirname, 'backend', 'public', 'gizlilik.html');
  if (fs.existsSync(p1)) return fs.readFileSync(p1, 'utf-8');
  const p2 = path.resolve(__dirname, 'public', 'gizlilik.html');
  if (fs.existsSync(p2)) return fs.readFileSync(p2, 'utf-8');
  const p3 = path.resolve(process.cwd(), 'backend', 'public', 'gizlilik.html');
  if (fs.existsSync(p3)) return fs.readFileSync(p3, 'utf-8');
  return `<!DOCTYPE html><html><head><title>Wordico Privacy Policy</title></head><body><h1>Wordico Privacy Policy</h1></body></html>`;
};

const sendPrivacyHtml = (req, res) => {
  res.type('html').send(getPrivacyHtmlContent());
};

// Web page route aliases (Guaranteed 200 OK without file path issues)
app.get('/privacy', sendPrivacyHtml);
app.get('/privacy.html', sendPrivacyHtml);
app.get('/privacy-policy', sendPrivacyHtml);
app.get('/privacy-policy.html', sendPrivacyHtml);
app.get('/gizlilik', sendPrivacyHtml);
app.get('/gizlilik.html', sendPrivacyHtml);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'backend', 'public')));

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

app.get('/version', (req, res) => {
  res.json({ version: '2026-08-14-v3-tournament-fix', wordsLoaded: { football: wordsDb.football.length, cinema: wordsDb.cinema.length, music: wordsDb.music.length } });
});

app.get('/debug-tournament', async (req, res) => {
  try {
    const category = req.query.category || 'football';
    const playerId = req.query.playerId || 'guest';
    let wordSource = wordsDb[category]?.length > 0 ? wordsDb[category] : wordsDb.football;
    if (!wordSource || wordSource.length === 0) {
      try { wordSource = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')); } catch(e) { wordSource = []; }
    }
    const result = await db.getWeeklyTournament(playerId, wordSource, category);
    res.json({ category, playerId, wordSourceLength: wordSource.length, result });
  } catch (e) {
    res.json({ error: e.message, stack: e.stack });
  }
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
  football_en: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=2110439967",
  cinema: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=927039923",
  cinema_en: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=1200646404",
  music: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=648666227",
  music_en: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=1685819327"
};
const WORDS_PATH = path.join(__dirname, '..', 'assets', 'data', 'words.json');
let wordsDb = { football: [], football_en: [], cinema: [], cinema_en: [], music: [], music_en: [] };

async function loadWords() {
  const promises = Object.keys(CSV_URLS).map(category => new Promise(async (resolve) => {
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
            let word = '';
            let forbidden = [];

            if (category === 'cinema_en') {
              // Format: EntityID, Answer, Clue_1, Clue_2, Clue_3, Clue_4, Clue_5, Difficulty
              if (!row[1] || row[1].trim() === '') continue;
              word = row[1].trim();
              for (let col = 2; col <= 6; col++) {
                if (row[col] && row[col].trim() !== '') forbidden.push(row[col].trim());
              }
            } else {
              // Standard format: Word, Forbidden1, Forbidden2, Forbidden3, Forbidden4, Forbidden5
              if (!row[0] || row[0].trim() === '') continue;
              word = row[0].trim();
              for (let col = 1; col <= 5; col++) {
                if (row[col] && row[col].trim() !== '') forbidden.push(row[col].trim());
              }
            }
            
            newWords.push({ word, forbidden });
          }
          if (newWords.length > 0) {
            wordsDb[category] = newWords;
            console.log(`Loaded ${wordsDb[category].length} words from Cloud Database for ${category}.`);
          }
          resolve(wordsDb[category].length);
        },
        error: (err) => {
          console.error(`Papa.parse error for ${category}:`, err);
          resolve(0);
        }
      });
    } catch (e) {
      console.error(`Cloud fetch failed for ${category}, falling back to local words.json if football`, e);
      if (category === 'football') {
         try { wordsDb.football = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')); } catch(fe) {}
      }
      resolve(wordsDb[category]?.length || 0);
    }
  }));
  await Promise.all(promises);
  console.log(`[Words] Load complete: football=${wordsDb.football.length}, football_en=${wordsDb.football_en.length}, cinema=${wordsDb.cinema.length}, music=${wordsDb.music.length}, music_en=${wordsDb.music_en.length}`);
  return wordsDb;
}

// Load initially and refresh every 1 hour
loadWords().then(() => {
  // initTournament AFTER words are loaded
  initTournament();
});
// Refresh every 10 minutes (600,000 ms)
setInterval(loadWords, 600000);

// API endpoint to manually trigger a word refresh without restarting the server
app.get('/api/refresh-words', async (req, res) => {
  try {
    await loadWords();
    res.json({ success: true, message: 'Kelimeler Google Sheetten başarıyla güncellendi.', stats: {
      football: wordsDb.football.length,
      football_en: wordsDb.football_en.length,
      cinema: wordsDb.cinema.length,
      cinema_en: wordsDb.cinema_en.length,
      music: wordsDb.music.length,
      music_en: wordsDb.music_en.length
    }});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Temporary endpoint to fix tournaments
app.get('/api/fix-tournaments', async (req, res) => {
  try {
    const WeeklyTournament = require('mongoose').model('WeeklyTournament');
    const result = await WeeklyTournament.deleteMany({ weekId: { $regex: /_en$/ } });
    res.json({ success: true, message: `Deleted ${result.deletedCount} EN tournaments. They will be regenerated.` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Tournament Init ─────────────────────────────────────────────────────────
async function initTournament() {
  try {
    for (const category of Object.keys(wordsDb)) {
      const wordSource = wordsDb[category].length > 0 ? wordsDb[category] : (category === 'football' ? JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')) : []);
      if (wordSource.length > 0) {
         await db.ensureWeeklyTournament(wordSource, category);
         console.log(`[Tournament] Weekly tournament ensured for ${category}.`);
      } else {
        console.warn(`[Tournament] No words available for ${category}, skipping ensureWeeklyTournament.`);
      }
    }
  } catch (e) {
    console.error('[Tournament] Init error:', e);
  }
}

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
    const { playerId, category: cat } = data || {};
    const category = cat || 'football';
    let wordSource = wordsDb[category]?.length > 0 ? wordsDb[category] : wordsDb.football;
    if (!wordSource || wordSource.length === 0) {
      try { wordSource = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')); } catch(e) { wordSource = []; }
    }
    console.log(`[Tournament] get_weekly_tournament: playerId=${playerId}, category=${category}, wordSource=${wordSource.length}`);
    try {
      const result = await db.getWeeklyTournament(playerId || 'guest', wordSource, category);
      if (result && result.error) {
        // Soft error (tournament not ready) - send it to client so it can show a friendlier message
        console.warn(`[Tournament] Soft error for ${playerId}: ${result.error}`);
        socket.emit('weekly_tournament_data', result);
      } else {
        socket.emit('weekly_tournament_data', result);
      }
    } catch (e) {
      console.error('[Tournament] get_weekly_tournament error:', e);
      socket.emit('weekly_tournament_data', { error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
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

  // Update Avatar Request
  socket.on('update_avatar', async (data) => {
    const { playerId, avatar } = data;
    if (!playerId || !avatar) return;
    const updated = await db.updateAvatar(playerId, avatar);
    if (updated) {
      socket.emit('update_avatar_response', { success: true, player: updated });
    } else {
      socket.emit('update_avatar_response', { success: false, error: 'Güncellenemedi' });
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
    const { category } = data;
    const leaderboard = await db.getLeaderboard(category);
    socket.emit('leaderboard_data', { leaderboard });
  });

  socket.on('buy_joker', async (data) => {
    const { playerId, jokerType } = data;
    if (!playerId || !jokerType) return socket.emit('joker_error', { message: 'Eksik bilgi!' });
    const result = await db.buyJoker(playerId, jokerType, 50);
    if (result.error) {
      socket.emit('joker_error', { message: result.error });
    } else {
      socket.emit('joker_bought', { player: result.player, jokerType });
    }
  });

  socket.on('reward_double_coins', async (data) => {
    const { playerId } = data;
    if (!playerId) return;
    const result = await db.updatePlayerCoins(playerId, 50);
    if (result) {
      socket.emit('coins_updated', { player: result });
    }
  });

  // Debug: client can call this to get real-time coin balance from DB
  socket.on('check_my_coins', async (data) => {
    const { playerId } = data;
    if (!playerId) { socket.emit('my_coins_result', { error: 'no playerId' }); return; }
    try {
      await db.connectDB ? db.connectDB() : null;
      const player = await require('mongoose').model('Player').findOne({ id: playerId });
      if (!player) { socket.emit('my_coins_result', { error: 'player not found', playerId }); return; }
      socket.emit('my_coins_result', { coins: player.coins, playerId, username: player.username });
    } catch (e) {
      socket.emit('my_coins_result', { error: e.message });
    }
  });

  socket.on('use_joker', async (data) => {
    const { roomId, playerId, jokerType } = data;
    const room = activeRooms[roomId];
    if (!room) return socket.emit('joker_error', { message: 'Oda bulunamadı!' });
    
    // PRE-VALIDATION for game logic
    if (jokerType === 'extraTime' || jokerType === 'shield') {
      if (!room.isPaused || room.guessingPlayerId !== playerId) {
        return socket.emit('joker_error', { message: 'Bu joker sadece tahmin sırası sizdeyken kullanılabilir!' });
      }
    }
    
    // Validate if player actually has the joker
    const result = await db.useJoker(playerId, jokerType);
    if (result.error) {
      return socket.emit('joker_error', { message: result.error });
    }

    // Apply joker effect PRIVATELY (socket.emit instead of io.to(roomId).emit)
    if (jokerType === 'extraTime') {
      room.guessTimeLeft += 5;
      socket.emit('joker_used', { jokerType, playerId }); // no message = no popup
    } else if (jokerType === 'revealLetters') {
      const w = room.card.word;
      let privateHint = "";
      if (w.length > 2) {
        let arr = room.wordHintArray.slice();
        arr[0] = w[0];
        arr[w.length - 1] = w[w.length - 1];
        privateHint = arr.join('');
      } else {
        privateHint = w;
      }
      socket.emit('joker_used', { jokerType, playerId, hint: privateHint }); // no message = no popup
    } else if (jokerType === 'instantHints') {
      const card = room.card;
      if (card && card.forbidden) {
        // Find up to 2 hints that haven't been shown yet
        const hintsToReveal = [];
        for (let i = 0; i < 2; i++) {
          const targetIndex = room.hintsShown + i;
          if (targetIndex < card.forbidden.length) {
            hintsToReveal.push(card.forbidden[targetIndex]);
          }
        }
        hintsToReveal.forEach(hint => {
          socket.emit('hint_revealed', { hint, potentialScore: getPotentialScore(room) });
        });
        socket.emit('joker_used', { jokerType, playerId }); // no message = no popup
      }
    } else if (jokerType === 'shield') {
      if (!room.activeShields) room.activeShields = {};
      room.activeShields[playerId] = true;
      socket.emit('joker_used', { jokerType, playerId });
    }
    
    // Update player data on client side so joker count drops
    socket.emit('joker_used_success', { player: result.player, jokerType });
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
        roomId,
        category
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
    
    socket.emit('room_created', { roomCode: code, roomId, category: activeRooms[roomId].category });
    io.to(roomId).emit('room_update', { players: activeRooms[roomId].players, hostId: socket.id, category: activeRooms[roomId].category });
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
    
    socket.emit('room_joined', { roomId, roomCode: room.roomCode, category: room.category });
    io.to(roomId).emit('room_update', { players: room.players, hostId: room.hostId, category: room.category });
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
    const { roomId, playerId } = data;
    const id = playerId || socket.id;
    const room = activeRooms[roomId];
    if (!room || !room.roundActive || room.isPaused || room.guessingPlayerId) return; // someone is already guessing or round ended

    room.guessingPlayerId = id;
    room.isPaused = true;
    room.guessTimeLeft = 15; // Increased to 15 seconds as requested!

    io.to(roomId).emit('guess_turn_started', { playerId: id, time: room.guessTimeLeft });

    room.guessTimer = setInterval(() => {
      room.guessTimeLeft--;
      if (room.guessTimeLeft <= 0) {
        clearInterval(room.guessTimer);
        room.guessTimer = null;
        room.guessingPlayerId = null;
        room.isPaused = false;
        
        // Timeout penalty
        const penalty = 10;
        room.scores[id] = (room.scores[id] || 0) - penalty;
        io.to(roomId).emit('wrong_guess', { scores: room.scores, reason: 'timeout', playerId: id });
        io.to(roomId).emit('guess_turn_ended');
      } else {
        io.to(roomId).emit('guess_time_tick', { time: room.guessTimeLeft });
      }
    }, 1000);
  });

  socket.on('pass_round', (data) => {
    const { roomId, playerId } = data;
    const id = playerId || socket.id;
    const room = activeRooms[roomId];
    if (!room || !room.roundActive) {
      console.log(`[PassRound] Rejected - room exists: ${!!room}, roundActive: ${room?.roundActive}`);
      return;
    }

    if (!room.passVotes) {
      room.passVotes = new Set();
    }

    // Add this socket's vote
    room.passVotes.add(id);

    // Count votes by checking which room players have voted
    // room.players[i].id === socket.id always (set at join time)
    const activePlayers = room.players || [];
    const totalPlayers = activePlayers.length;
    const validVotesCount = activePlayers.filter(p => room.passVotes.has(p.id)).length;

    // Fallback: if player list seems wrong, use passVotes.size directly
    const effectiveVotes = validVotesCount > 0 ? validVotesCount : room.passVotes.size;
    const requiredVotes = Math.max(1, totalPlayers || room.passVotes.size);

    console.log(`[PassRound] Room ${roomId}: socket=${socket.id}, passVotes=[${[...room.passVotes].join(',')}], players=[${activePlayers.map(p=>p.id).join(',')}], validVotes=${validVotesCount}, effectiveVotes=${effectiveVotes}, required=${requiredVotes}`);

    io.to(roomId).emit('pass_update', {
      votesCount: effectiveVotes,
      totalPlayers: requiredVotes,
      voterId: id
    });

    if (effectiveVotes >= requiredVotes) {
      room.roundActive = false;
      room.isPaused = false;
      room.guessingPlayerId = null;
      if (room.timer) clearInterval(room.timer);
      if (room.guessTimer) clearInterval(room.guessTimer);

      io.to(roomId).emit('round_ended', {
        winnerId: null,
        winnerName: null,
        word: room.card ? room.card.word : 'PAS',
        reason: 'pass',
        scores: room.scores
      });

      setTimeout(() => {
        startRound(roomId);
      }, 3000);
    }
  });

  socket.on('guess_word', (data) => {
    const { roomId, guess, playerId } = data;
    const id = playerId || socket.id;
    const room = activeRooms[roomId];
    if (!room || !room.roundActive) return;
    
    if (room.guessingPlayerId !== id) return;

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
      
      const pointsEarned = getPotentialScore(room);
      room.scores[id] = (room.scores[id] || 0) + pointsEarned;
      
      const winnerPlayer = room.players.find(p => p.id === id);
      
      io.to(roomId).emit('round_ended', {
        winnerId: id,
        winnerName: winnerPlayer ? winnerPlayer.name : 'Oyuncu',
        word: room.card.word,
        reason: 'correct_guess',
        pointsEarned: pointsEarned,
        scores: room.scores
      });
      
      setTimeout(() => {
        startRound(roomId);
      }, 4000);
    } else {
      // Incorrect guess
      let penalty = 10;
      let reason = 'incorrect';
      
      if (room.activeShields && room.activeShields[id]) {
        room.activeShields[id] = false; // consume shield
        penalty = 0;
        reason = 'shielded';
      } else {
        room.scores[id] = Math.max(0, (room.scores[id] || 0) - penalty);
      }
      
      room.guessingPlayerId = null;
      room.isPaused = false;

      io.to(roomId).emit('wrong_guess', { scores: room.scores, penalty: penalty, reason: reason, playerId: id });
      io.to(roomId).emit('guess_turn_ended');
    }
  });

  socket.on('leave_room', async (data) => {
    const { roomId } = data;
    if (!roomId) return;
    
    socket.leave(roomId);
    
    const room = activeRooms[roomId];
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      if (room.status === 'waiting') {
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
        const disconnectedPlayer = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        io.to(roomId).emit('player_disconnected', { playerId: socket.id, players: room.players });
        
        if (room.players.length <= 1) {
          if (room.timer) clearInterval(room.timer);
          if (room.guessTimer) clearInterval(room.guessTimer);
          
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

function getPotentialScore(room) {
  if (!room) return 10;
  const hintsPenalty = Math.max(0, (room.hintsShown || 1) - 1);
  const lettersPenalty = (room.revealedIndices ? room.revealedIndices.length : 0);
  
  // Standardize scoring across all modes (Ranked and Friendly start at 100)
  return Math.max(10, 100 - (hintsPenalty * 10) - (lettersPenalty * 10));
}

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
    const coinChanges = {};
    const playerUpdates = {};  // socketId → updatedPlayerObj (included in game_over)
    const roomCat = room.category || 'football';

    // Helper: emit updated profile to a specific player socket AND record in playerUpdates
    const applyReward = (socketId, updatedPlayer) => {
      if (!updatedPlayer) return;
      const key = updatedPlayer.id || updatedPlayer._id;
      playerUpdates[key] = updatedPlayer;          // key by dbPlayerId
      const playerSocket = io.sockets.sockets.get(socketId);
      if (playerSocket) playerSocket.emit('coins_updated', { player: updatedPlayer }); // early notification
    };

    if (room.isRanked1v1 && room.players.length === 2) {
      // ── Ranked 1v1: KP + coins ───────────────────────────────────────────
      const p1 = room.players[0];
      const p2 = room.players[1];
      const s1 = room.scores[p1.id] || 0;
      const s2 = room.scores[p2.id] || 0;
      console.log(`[Ranked1v1] Room ${roomId} ended. s1=${s1} s2=${s2} | p1=${p1.name}(${p1.dbPlayerId}) p2=${p2.name}(${p2.dbPlayerId})`);
      if (s1 > s2) {
        const [r1, r2] = await Promise.all([
          p1.dbPlayerId ? db.updatePlayerStats(p1.dbPlayerId, 50, true, 0, 0, roomCat)  : Promise.resolve(null),
          p2.dbPlayerId ? db.updatePlayerStats(p2.dbPlayerId, -25, false, 0, 0, roomCat) : Promise.resolve(null),
        ]);
        applyReward(p1.id, r1); applyReward(p2.id, r2);
        kpChanges[p1.id] = 50;  coinChanges[p1.id] = 50;
        kpChanges[p2.id] = -25; coinChanges[p2.id] = 0;
      } else if (s2 > s1) {
        const [r1, r2] = await Promise.all([
          p1.dbPlayerId ? db.updatePlayerStats(p1.dbPlayerId, -25, false, 0, 0, roomCat) : Promise.resolve(null),
          p2.dbPlayerId ? db.updatePlayerStats(p2.dbPlayerId, 50, true, 0, 0, roomCat)   : Promise.resolve(null),
        ]);
        applyReward(p1.id, r1); applyReward(p2.id, r2);
        kpChanges[p1.id] = -25; coinChanges[p1.id] = 0;
        kpChanges[p2.id] = 50;  coinChanges[p2.id] = 50;
      } else {
        const [r1, r2] = await Promise.all([
          p1.dbPlayerId ? db.updatePlayerStats(p1.dbPlayerId, 10, false, 0, 0, roomCat) : Promise.resolve(null),
          p2.dbPlayerId ? db.updatePlayerStats(p2.dbPlayerId, 10, false, 0, 0, roomCat) : Promise.resolve(null),
        ]);
        applyReward(p1.id, r1); applyReward(p2.id, r2);
        kpChanges[p1.id] = 10; coinChanges[p1.id] = 0;
        kpChanges[p2.id] = 10; coinChanges[p2.id] = 0;
      }

    } else if (room.isGroupRanked && room.players.length >= 3) {
      // ── Group Ranked: KP rewards ─────────────────────────────────────────
      const sorted = [...room.players].sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0));
      const r0 = sorted[0].dbPlayerId ? await db.updatePlayerStats(sorted[0].dbPlayerId, 125, true, 0, 0, roomCat)  : null;
      const r1 = sorted[1].dbPlayerId ? await db.updatePlayerStats(sorted[1].dbPlayerId, 50, false, 0, 0, roomCat)  : null;
      applyReward(sorted[0].id, r0);
      applyReward(sorted[1].id, r1);
      kpChanges[sorted[0].id] = 125; coinChanges[sorted[0].id] = 50;
      kpChanges[sorted[1].id] = 50;  coinChanges[sorted[1].id] = 0;
      for (let i = 2; i < sorted.length; i++) {
        const ri = sorted[i].dbPlayerId ? await db.updatePlayerStats(sorted[i].dbPlayerId, -25, false, 0, 0, roomCat) : null;
        applyReward(sorted[i].id, ri);
        kpChanges[sorted[i].id] = -25; coinChanges[sorted[i].id] = 0;
      }

    } else {
      // ── Friendly / Private match: coins only, no KP ──────────────────────
      let highScore = -Infinity;
      room.players.forEach(p => { if ((room.scores[p.id] || 0) > highScore) highScore = room.scores[p.id] || 0; });
      const isTie = room.players.filter(p => (room.scores[p.id] || 0) === highScore).length > 1;
      console.log(`[FriendlyGame] Room ${roomId} ending. players=${room.players.length} highScore=${highScore} isTie=${isTie}`);
      for (const p of room.players) {
        const score = room.scores[p.id] || 0;
        console.log(`  → player "${p.name}" dbPlayerId=${p.dbPlayerId} score=${score}`);
        if (!p.dbPlayerId) {
          console.log(`    SKIP: no dbPlayerId (not logged in)`);
          continue;
        }
        const isWinner = !isTie && score === highScore;
        const coinsEarned = isWinner ? 25 : 5;
        const updatedPlayer = await db.updatePlayerCoins(p.dbPlayerId, coinsEarned);
        if (updatedPlayer) {
          console.log(`    OK: +${coinsEarned} coins → newBalance=${updatedPlayer.coins} (winner=${isWinner})`);
          applyReward(p.id, updatedPlayer);
        } else {
          console.log(`    ERROR: Player not found in DB for dbPlayerId=${p.dbPlayerId}`);
        }
        coinChanges[p.id] = coinsEarned;
        kpChanges[p.id] = 0;
      }
    }

    // playerUpdates is embedded in game_over so client always gets updated profile
    io.to(roomId).emit('game_over', { scores: room.scores, kpChanges, coinChanges, playerUpdates });
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
  
  // Dynamic Fisher-Yates Clue Rotation: Ensure forbidden clues never appear in fixed order
  const shuffledForbidden = [...(card.forbidden || [])];
  for (let i = shuffledForbidden.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledForbidden[i], shuffledForbidden[j]] = [shuffledForbidden[j], shuffledForbidden[i]];
  }
  const rotatedCard = { ...card, forbidden: shuffledForbidden };


  room.usedWords.push(card.word);
  room.card = rotatedCard;
  room.timeLeft = 30;
  room.hintsShown = 1; // First hint immediately
  room.passVotes = new Set();

  // Create word hint replacing only non-space chars with underscore
  room.wordHintArray = card.word.split('').map(c => c === ' ' ? ' ' : '_');
  room.revealedIndices = [];
  room.finalCountdownStarted = false;

  // Initial emit
  io.to(roomId).emit('game_start', {
    wordLength: card.word.length,
    wordHint: room.wordHintArray.join(''),
    firstHint: rotatedCard.forbidden[0],
    potentialScore: getPotentialScore(room),
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
    // Hints at: t=25 (2nd), t=20 (3rd), t=15 (4th), t=10 (5th)
    if (room.timeLeft % 5 === 0 && room.timeLeft < 30 && room.timeLeft > 0 && room.hintsShown < room.card.forbidden.length && room.hintsShown < 5) {
      const hintWord = room.card.forbidden[room.hintsShown]; // use room.card (always current)
      room.hintsShown++;
      io.to(roomId).emit('hint_revealed', { hint: hintWord, potentialScore: getPotentialScore(room) });
    }

    // After ALL hints are shown (hintsShown >= 5 OR no more hints) AND timeLeft < 10,
    // reveal one letter every 2 seconds, max 3 letters
    const allHintsShown = room.hintsShown >= Math.min(5, room.card.forbidden.length);
    if (allHintsShown && room.timeLeft < 10 && room.timeLeft % 2 === 0 && room.revealedIndices.length < 3) {
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
        io.to(roomId).emit('word_hint_update', { wordHint: room.wordHintArray.join(''), potentialScore: getPotentialScore(room) });
      }
      
      // If we just revealed the 3rd letter, or no more letters can be revealed, give bonus time
      if (!room.finalCountdownStarted && (room.revealedIndices.length === 3 || availableIndices.length <= 1)) {
        room.finalCountdownStarted = true;
        room.timeLeft = 12; // FIX: was 15, reduced to prevent huge time jumps
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

