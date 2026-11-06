import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { ChorSipahiEngine } from './src/game/engine';
import { ChatMessage, GameRules, GameState, Player, Role } from './src/game/types';

interface ServerRoom {
  id: string;
  roomCode: string;
  hostPlayerId: string;
  players: (Player & { socketId?: string })[];
  rules: GameRules;
  gameState: GameState | null;
  chatMessages: ChatMessage[];
  meetSession?: {
    meetingUrl: string;
    status: 'READY' | 'ACTIVE';
    createdAt: number;
  };
  createdAt: number;
}

const rooms = new Map<string, ServerRoom>();
const roomsByCode = new Map<string, string>(); // code -> roomId

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const gameNamespace = io.of('/game');

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// REST Endpoints
app.post('/api/v1/rooms', (req, res) => {
  const { hostPlayer, rules } = req.body;
  if (!hostPlayer || !hostPlayer.id || !hostPlayer.name) {
    return res.status(400).json({ success: false, error: 'Host player information required' });
  }

  let code = generateRoomCode();
  while (roomsByCode.has(code)) {
    code = generateRoomCode();
  }

  const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const room: ServerRoom = {
    id: roomId,
    roomCode: code,
    hostPlayerId: hostPlayer.id,
    players: [
      {
        ...hostPlayer,
        isHost: true,
        isReady: true,
        score: 0,
        connected: true,
      },
    ],
    rules: rules || {
      rajaPoints: 1000,
      mantriPoints: 800,
      sipahiCorrectPoints: 500,
      chorCorrectGuessPoints: 0,
      chorWrongGuessPoints: 500,
      guessTimeoutSeconds: 45,
      targetScore: 5000,
      maxRounds: 5,
    },
    gameState: null,
    chatMessages: [],
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  roomsByCode.set(code, roomId);

  res.json({ success: true, room });
});

app.post('/api/v1/rooms/join', (req, res) => {
  const { roomCode, player } = req.body;
  const normalizedCode = (roomCode || '').toUpperCase().trim();
  const roomId = roomsByCode.get(normalizedCode);

  if (!roomId || !rooms.has(roomId)) {
    return res.status(404).json({ success: false, error: 'Room not found with this code' });
  }

  const room = rooms.get(roomId)!;
  if (room.players.length >= 4 && !room.players.some((p) => p.id === player.id)) {
    return res.status(400).json({ success: false, error: 'Room is already full (maximum 4 players)' });
  }

  res.json({ success: true, roomId, room });
});

app.get('/api/v1/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: 'Room not found' });
  }
  res.json({ success: true, room });
});

// Socket.io Game logic
function broadcastRoomUpdate(room: ServerRoom) {
  gameNamespace.to(room.id).emit('room:updated', {
    id: room.id,
    roomCode: room.roomCode,
    hostPlayerId: room.hostPlayerId,
    players: room.players,
    rules: room.rules,
    meetSession: room.meetSession,
    isGameActive: !!room.gameState,
  });
}

function emitPrivateRoles(room: ServerRoom) {
  if (!room.gameState || !room.gameState.currentRound) return;
  const round = room.gameState.currentRound;

  room.players.forEach((player) => {
    if (player.socketId) {
      const myRole = round.roles[player.id];
      const maskedRound = ChorSipahiEngine.getMaskedRoundForViewer(round, player.id);
      gameNamespace.to(player.socketId).emit('game:round_state', {
        gameState: {
          ...room.gameState,
          currentRound: maskedRound,
        },
        myRole,
      });
    }
  });
}

function handleBotRounds(room: ServerRoom) {
  if (!room.gameState || !room.gameState.currentRound) return;
  const round = room.gameState.currentRound;

  // If Raja is a bot, announce automatically after 2 seconds
  if (round.phase === 'PRIVATE_REVEAL' || round.phase === 'RAJA_REVEAL') {
    const rajaId = Object.keys(round.roles).find((pId) => round.roles[pId] === 'RAJA');
    if (!rajaId) return;
    const rajaPlayer = room.players.find((p) => p.id === rajaId);
    if (rajaPlayer?.isBot) {
      setTimeout(() => {
        if (!room.gameState || !room.gameState.currentRound) return;
        try {
          room.gameState = ChorSipahiEngine.revealRaja(room.gameState, rajaId);
          emitPrivateRoles(room);
          gameNamespace.to(room.id).emit('game:raja_revealed', { rajaPlayerId: rajaId });
          handleBotRounds(room);
        } catch {
          // Ignore
        }
      }, 1800);
      return;
    }
  }

  // If Sipahi is a bot, guess automatically after 2.5 seconds
  if (round.phase === 'SIPAHI_GUESS') {
    const sipahiId = Object.keys(round.roles).find((pId) => round.roles[pId] === 'SIPAHI');
    if (!sipahiId) return;
    const sipahiPlayer = room.players.find((p) => p.id === sipahiId);
    if (sipahiPlayer?.isBot) {
      setTimeout(() => {
        if (!room.gameState || !room.gameState.currentRound) return;
        try {
          const suspects = room.players
            .map((p) => p.id)
            .filter((pId) => pId !== sipahiId && pId !== round.revealedRajaPlayerId);
          if (suspects.length > 0) {
            const randomGuess = suspects[Math.floor(Math.random() * suspects.length)];
            room.gameState = ChorSipahiEngine.submitGuess(room.gameState, sipahiId, randomGuess);

            // Update room player cumulative scores
            room.gameState.players.forEach((p) => {
              const matched = room.players.find((rp) => rp.id === p.id);
              if (matched) matched.score = p.score;
            });

            emitPrivateRoles(room);
            gameNamespace.to(room.id).emit('game:roles_revealed', {
              guess: room.gameState.currentRound!.guess,
              pointsAwarded: room.gameState.currentRound!.pointsAwarded,
              allRoles: room.gameState.currentRound!.roles,
            });
          }
        } catch {
          // Ignore
        }
      }, 2500);
    }
  }
}

gameNamespace.on('connection', (socket: Socket) => {
  let currentRoomId: string | null = null;
  let currentPlayerId: string | null = null;

  socket.on('room:join', ({ roomId, player }: { roomId: string; player: Player }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }

    currentRoomId = roomId;
    currentPlayerId = player.id;
    socket.join(roomId);

    const existingIndex = room.players.findIndex((p) => p.id === player.id);
    if (existingIndex >= 0) {
      room.players[existingIndex].socketId = socket.id;
      room.players[existingIndex].connected = true;
    } else if (room.players.length < 4) {
      room.players.push({
        ...player,
        socketId: socket.id,
        connected: true,
        isReady: false,
        score: 0,
      });
    }

    broadcastRoomUpdate(room);

    // If game already started, send current state
    if (room.gameState && room.gameState.currentRound) {
      const myRole = room.gameState.currentRound.roles[player.id];
      const maskedRound = ChorSipahiEngine.getMaskedRoundForViewer(
        room.gameState.currentRound,
        player.id
      );
      socket.emit('game:round_state', {
        gameState: {
          ...room.gameState,
          currentRound: maskedRound,
        },
        myRole,
      });
    }
  });

  socket.on('player:ready', ({ isReady }: { isReady: boolean }) => {
    if (!currentRoomId || !currentPlayerId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const p = room.players.find((pl) => pl.id === currentPlayerId);
    if (p) {
      p.isReady = isReady;
      broadcastRoomUpdate(room);
    }
  });

  socket.on('room:fill_bots', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const botNames = ['Veer (Bot)', 'Kavya (Bot)', 'Rohan (Bot)', 'Anaya (Bot)'];
    const botAvatars = ['⚔️', '🦚', '🏹', '💎'];

    while (room.players.length < 4) {
      const idx = room.players.length;
      room.players.push({
        id: `bot_${Date.now()}_${idx}`,
        name: botNames[idx - 1] || `Companion ${idx}`,
        avatar: botAvatars[idx - 1] || '🤖',
        isBot: true,
        isReady: true,
        score: 0,
        connected: true,
      });
    }

    broadcastRoomUpdate(room);
  });

  socket.on('game:start', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    if (room.players.length !== 4) {
      socket.emit('error', { code: 'NOT_ENOUGH_PLAYERS', message: 'Need exactly 4 players' });
      return;
    }

    const game = ChorSipahiEngine.createGame(room.players, true, room.rules, room.roomCode);
    room.gameState = ChorSipahiEngine.startNextRound(game);

    emitPrivateRoles(room);
    gameNamespace.to(room.id).emit('game:started');
    handleBotRounds(room);
  });

  socket.on('game:raja_reveal', () => {
    if (!currentRoomId || !currentPlayerId) return;
    const room = rooms.get(currentRoomId);
    if (!room || !room.gameState || !room.gameState.currentRound) return;

    try {
      room.gameState = ChorSipahiEngine.revealRaja(room.gameState, currentPlayerId);
      emitPrivateRoles(room);
      gameNamespace.to(room.id).emit('game:raja_revealed', { rajaPlayerId: currentPlayerId });
      handleBotRounds(room);
    } catch (err: unknown) {
      socket.emit('error', { message: (err as Error).message });
    }
  });

  socket.on('game:submit_guess', ({ targetPlayerId }: { targetPlayerId: string }) => {
    if (!currentRoomId || !currentPlayerId) return;
    const room = rooms.get(currentRoomId);
    if (!room || !room.gameState || !room.gameState.currentRound) return;

    try {
      room.gameState = ChorSipahiEngine.submitGuess(
        room.gameState,
        currentPlayerId,
        targetPlayerId
      );

      // Update room players cumulative scores
      room.gameState.players.forEach((p) => {
        const matched = room.players.find((rp) => rp.id === p.id);
        if (matched) matched.score = p.score;
      });

      emitPrivateRoles(room);
      if (room.gameState.currentRound) {
        gameNamespace.to(room.id).emit('game:roles_revealed', {
          guess: room.gameState.currentRound.guess,
          pointsAwarded: room.gameState.currentRound.pointsAwarded,
          allRoles: room.gameState.currentRound.roles,
        });
      }
    } catch (err: unknown) {
      socket.emit('error', { message: (err as Error).message });
    }
  });

  socket.on('game:next_round', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || !room.gameState) return;

    const completed = ChorSipahiEngine.completeRound(room.gameState);
    if (completed.status === 'FINISHED') {
      room.gameState = completed;
      emitPrivateRoles(room);
      gameNamespace.to(room.id).emit('game:finished', { players: room.gameState.players });
      return;
    }

    room.gameState = ChorSipahiEngine.startNextRound(completed);
    emitPrivateRoles(room);
    gameNamespace.to(room.id).emit('game:new_round_started', {
      roundNumber: room.gameState.currentRoundNumber,
    });
    handleBotRounds(room);
  });

  socket.on('chat:send', ({ text }: { text: string }) => {
    if (!currentRoomId || !currentPlayerId || !text.trim()) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const sender = room.players.find((p) => p.id === currentPlayerId);
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentPlayerId,
      senderName: sender?.name || 'Player',
      senderAvatar: sender?.avatar || '👑',
      text: text.trim().slice(0, 300),
      timestamp: Date.now(),
    };

    room.chatMessages.push(msg);
    gameNamespace.to(room.id).emit('chat:message', msg);
  });

  socket.on('room:set_meet', ({ meetingUrl }: { meetingUrl: string }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    room.meetSession = {
      meetingUrl,
      status: 'READY',
      createdAt: Date.now(),
    };

    broadcastRoomUpdate(room);
  });

  socket.on('disconnect', () => {
    if (currentRoomId && currentPlayerId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const player = room.players.find((p) => p.id === currentPlayerId);
        if (player) {
          player.connected = false;
          broadcastRoomUpdate(room);
        }
      }
    }
  });
});

async function startServer() {
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Chor Sipahi server listening on port ${PORT}`);
  });
}

startServer();
