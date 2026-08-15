const { io } = require("socket.io-client");
const URL = "https://footballtaboo-server-production.up.railway.app";
const socket1 = io(URL, { transports: ["websocket"] });
const socket2 = io(URL, { transports: ["websocket"] });
let roomId = null;
socket1.on("connect", () => {
  socket1.emit("create_room", { name: "TestPlayer1", maxRounds: 1, isRanked: true, dbPlayerId: "player_test1", category: "football" });
});
socket1.on("room_created", (data) => {
  roomId = data.roomId;
  socket2.emit("join_room", { roomId, name: "TestPlayer2", dbPlayerId: "player_test2" });
});
socket1.on("room_update", (data) => {
  console.log("Room update (Socket 1):", data);
  if (data.players.length === 2 && data.hostId === socket1.id) {
    socket1.emit("start_game", { roomId });
  }
});
socket1.on("game_started", () => {
  console.log("Game started!");
  socket1.emit("request_guess_turn", { roomId, playerId: socket1.id });
});
socket1.on("guess_turn_started", (data) => {
  if (data.playerId === socket1.id) console.log("Socket 1 guessing!");
});
socket2.on("round_started", (data) => {
  setTimeout(() => { socket1.emit("guess_word", { roomId, guess: data.card.word, playerId: socket1.id }); }, 500);
});
socket1.on("game_over", (data) => {
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
});
setTimeout(() => process.exit(1), 10000);
