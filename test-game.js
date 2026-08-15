const { io } = require("socket.io-client");

const URL = "https://footballtaboo-server-production.up.railway.app";
const socket1 = io(URL, { transports: ["websocket"] });
const socket2 = io(URL, { transports: ["websocket"] });

let roomId = null;

socket1.on("connect", () => {
  console.log("Socket 1 connected:", socket1.id);
  // Create a ranked room
  socket1.emit("create_room", {
    name: "TestPlayer1",
    maxRounds: 1,
    isRanked: true,
    dbPlayerId: "player_test1",
    category: "football"
  });
});

socket2.on("connect", () => {
  console.log("Socket 2 connected:", socket2.id);
});

socket1.on("room_created", (data) => {
  console.log("Room Created:", data.roomId);
  roomId = data.roomId;
  
  // Socket 2 joins
  socket2.emit("join_room", {
    roomId: roomId,
    name: "TestPlayer2",
    dbPlayerId: "player_test2"
  });
});

socket1.on("game_started", () => {
  console.log("Game started!");
  // Socket 1 requests turn
  socket1.emit("request_guess_turn", { roomId, playerId: socket1.id });
});

socket1.on("guess_turn_started", (data) => {
  if (data.playerId === socket1.id) {
    console.log("Socket 1 guessing!");
  }
});

let currentWord = "";
socket2.on("round_started", (data) => {
  console.log("Socket 2 received round_started. Word:", data.card.word);
  currentWord = data.card.word;
  // Socket 1 sends guess
  setTimeout(() => {
    socket1.emit("guess_word", { roomId, guess: currentWord, playerId: socket1.id });
  }, 1000);
});

socket1.on("game_over", (data) => {
  console.log("GAME OVER (Socket 1):");
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
});
socket2.on("game_over", (data) => {
  console.log("GAME OVER (Socket 2):");
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
});

socket1.on("room_update", (data) => {
  if (data.players.length === 2 && socket1.id === data.hostId) {
    console.log("Socket 1 starting game");
    socket1.emit("start_game", { roomId });
  }
});

setTimeout(() => {
  console.log("Timeout");
  process.exit(1);
}, 15000);
