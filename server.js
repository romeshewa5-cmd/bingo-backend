const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your frontend to talk to this backend

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any frontend URL to connect
    methods: ["GET", "POST"]
  }
});

// Store active lobbies and card states in memory (Free & simple)
let activePlayers = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a player joins the lobby
  socket.on('join_lobby', (data) => {
    activePlayers[socket.id] = {
      username: data.username,
      cardsPurchased: data.cardsPurchased,
      cardState: data.cardState // Store current selections
    };
    
    // Let everyone in the lobby know someone joined
    io.emit('lobby_update', Object.values(activePlayers));
  });

  // When a player updates their card (selects a number)
  socket.on('update_card', (cardData) => {
    if (activePlayers[socket.id]) {
      activePlayers[socket.id].cardState = cardData;
    }
  });

  // When a Bingo is achieved
  socket.on('claim_bingo', (data) => {
    // Notify all players in the lobby that someone won!
    socket.broadcast.emit('bingo_popup_notification', {
      winner: data.username,
      message: `${data.username} just got a BINGO!`
    });
  });

  // Clean up when players disconnect
  socket.on('disconnect', () => {
    delete activePlayers[socket.id];
    io.emit('lobby_update', Object.values(activePlayers));
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
