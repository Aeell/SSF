const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../../dist')));

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Game state
const rooms = new Map();
const players = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    // Generate unique player ID
    const playerId = uuidv4();
    players.set(socket.id, {
        id: playerId,
        socket: socket,
        roomId: null
    });

    // Send player ID to client
    socket.emit('playerId', playerId);

    // Handle room creation
    socket.on('createRoom', () => {
        const roomId = uuidv4();
        rooms.set(roomId, {
            id: roomId,
            host: playerId,
            players: new Set([playerId]),
            gameState: {
                isPlaying: false,
                score: { home: 0, away: 0 },
                time: 0,
                currentHalf: 1,
                isHalfTime: false
            }
        });

        // Update player's room
        const player = players.get(socket.id);
        player.roomId = roomId;

        // Send room ID to client
        socket.emit('roomId', roomId);
        socket.join(roomId);

        // Notify other players in the room
        socket.to(roomId).emit('playerJoined', {
            id: playerId,
            isHost: true
        });
    });

    // Handle room joining
    socket.on('joinRoom', (roomId) => {
        const room = rooms.get(roomId);
        if (room && room.players.size < 12) { // Max 6v6 players
            room.players.add(playerId);

            // Update player's room
            const player = players.get(socket.id);
            player.roomId = roomId;

            // Join socket room
            socket.join(roomId);

            // Send room ID to client
            socket.emit('roomId', roomId);

            // Send current game state to new player
            socket.emit('gameState', room.gameState);

            // Notify other players
            socket.to(roomId).emit('playerJoined', {
                id: playerId,
                isHost: false
            });
        }
    });

    // Handle room leaving
    socket.on('leaveRoom', (roomId) => {
        const room = rooms.get(roomId);
        if (room) {
            room.players.delete(playerId);

            // Update player's room
            const player = players.get(socket.id);
            player.roomId = null;

            // Leave socket room
            socket.leave(roomId);

            // Notify other players
            socket.to(roomId).emit('playerLeft', playerId);

            // Clean up empty rooms
            if (room.players.size === 0) {
                rooms.delete(roomId);
            }
        }
    });

    // Handle game start
    socket.on('startGame', (roomId) => {
        const room = rooms.get(roomId);
        if (room && room.host === playerId) {
            room.gameState.isPlaying = true;
            room.gameState.time = 0;
            room.gameState.currentHalf = 1;
            room.gameState.score = { home: 0, away: 0 };

            // Broadcast game start to all players
            io.to(roomId).emit('gameState', room.gameState);
        }
    });

    // Handle game end
    socket.on('endGame', (roomId) => {
        const room = rooms.get(roomId);
        if (room) {
            room.gameState.isPlaying = false;
            io.to(roomId).emit('gameState', room.gameState);
        }
    });

    // Handle player updates
    socket.on('playerUpdate', (data) => {
        const room = rooms.get(data.roomId);
        if (room) {
            // Broadcast player update to other players in the room
            socket.to(data.roomId).emit('playerUpdate', {
                playerId: data.playerId,
                position: data.position,
                state: data.state
            });
        }
    });

    // Handle ball updates
    socket.on('ballUpdate', (data) => {
        const room = rooms.get(data.roomId);
        if (room) {
            // Broadcast ball update to all players in the room
            io.to(data.roomId).emit('ballUpdate', {
                position: data.position,
                state: data.state
            });
        }
    });

    // Handle goal scoring
    socket.on('goal', (data) => {
        const room = rooms.get(data.roomId);
        if (room) {
            room.gameState.score[data.team]++;
            io.to(data.roomId).emit('goal', {
                team: data.team,
                score: room.gameState.score
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player && player.roomId) {
            const room = rooms.get(player.roomId);
            if (room) {
                room.players.delete(player.id);
                socket.to(player.roomId).emit('playerLeft', player.id);

                // Clean up empty rooms
                if (room.players.size === 0) {
                    rooms.delete(player.roomId);
                }
            }
        }
        players.delete(socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 