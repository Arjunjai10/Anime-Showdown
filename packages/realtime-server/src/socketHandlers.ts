import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { enqueue, dequeueSocket, tryMatch } from './matchmaking.js';
import { BattleSession, activeSessions } from './battleSession.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  LobbyUser,
  ChatMessage,
} from '@anime-showdown/shared-types';

type AppIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const onlineUsers = new Map<string, LobbyUser>();

function broadcastLobbyUsers(io: AppIO): void {
  const users = Array.from(onlineUsers.values());
  io.to('lobby').emit('lobby:users', { users });
}

export function registerSocketHandlers(io: AppIO): void {
  io.on('connection', (socket: AppSocket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Default username if not logged in
    const username = socket.handshake.query?.username || `AnimeDuelist_${socket.id.slice(0, 4)}`;
    socket.data.username = typeof username === 'string' ? username : 'Duelist';

    onlineUsers.set(socket.id, {
      id: socket.id,
      username: socket.data.username,
      status: 'in-lobby',
    });

    // ── lobby:join ────────────────────────────────────────────────────────────
    socket.on('lobby:join', () => {
      try {
        socket.join('lobby');
        const user = onlineUsers.get(socket.id);
        if (user) user.status = 'in-lobby';
        broadcastLobbyUsers(io);
      } catch (err) {
        console.error(`[Socket] lobby:join error for ${socket.id}:`, err);
      }
    });

    // ── chat:send ─────────────────────────────────────────────────────────────
    socket.on('chat:send', (payload) => {
      try {
        const { room, text } = payload;
        if (!room || !text?.trim()) return;

        const msg: ChatMessage = {
          id: uuidv4(),
          sender: socket.data.username || 'Anonymous',
          text: text.trim().slice(0, 300),
          timestamp: Date.now(),
          room,
        };

        io.to(room).emit('chat:message', msg);
      } catch (err) {
        console.error(`[Socket] chat:send error for ${socket.id}:`, err);
      }
    });

    // ── queue:join ────────────────────────────────────────────────────────────
    socket.on('queue:join', (payload) => {
      try {
        const { format = 'ou_6v6', team, characterId } = payload || {};
        if (!team && !characterId) {
          socket.emit('matchmaking:error', { message: 'A team or character is required to battle' });
          return;
        }

        socket.data.characterId = characterId;
        socket.data.team = team;
        socket.data.format = format;

        const user = onlineUsers.get(socket.id);
        if (user) {
          user.status = 'in-queue';
          broadcastLobbyUsers(io);
        }

        enqueue(socket, format, team, characterId);

        const match = tryMatch();
        if (match) {
          const [entryA, entryB] = match;
          const battleId = uuidv4();

          entryA.socket.join(battleId);
          entryB.socket.join(battleId);
          entryA.socket.data.battleId = battleId;
          entryB.socket.data.battleId = battleId;
          entryA.socket.data.playerKey = 'playerA';
          entryB.socket.data.playerKey = 'playerB';

          const userA = onlineUsers.get(entryA.socket.id);
          const userB = onlineUsers.get(entryB.socket.id);
          if (userA) userA.status = 'in-battle';
          if (userB) userB.status = 'in-battle';
          broadcastLobbyUsers(io);

          const session = new BattleSession(
            battleId,
            entryA.socket.id,
            entryA.team,
            entryA.characterId,
            entryB.socket.id,
            entryB.team,
            entryB.characterId,
            entryA.format,
            io,
            entryA.socket.data.username,
            entryB.socket.data.username,
          );
          activeSessions.set(battleId, session);
          session.start();
        }
      } catch (err) {
        console.error(`[Socket] queue:join error for ${socket.id}:`, err);
        socket.emit('matchmaking:error', { message: 'Failed to join queue — please try again' });
      }
    });

    // ── queue:leave ───────────────────────────────────────────────────────────
    socket.on('queue:leave', () => {
      try {
        dequeueSocket(socket.id);
        const user = onlineUsers.get(socket.id);
        if (user) {
          user.status = 'in-lobby';
          broadcastLobbyUsers(io);
        }
        console.log(`[Socket] ${socket.id} left queue`);
      } catch (err) {
        console.error(`[Socket] queue:leave error for ${socket.id}:`, err);
      }
    });

    // ── battle:action ─────────────────────────────────────────────────────────
    socket.on('battle:action', (payload) => {
      try {
        const battleId = socket.data.battleId;
        if (!battleId) {
          socket.emit('battle:error', { message: 'You are not in an active battle' });
          return;
        }

        const session = activeSessions.get(battleId);
        if (!session) {
          socket.emit('battle:error', { message: 'Battle session not found' });
          return;
        }

        session.submitAction(socket.id, payload);
      } catch (err) {
        console.error(`[Socket] battle:action error for ${socket.id}:`, err);
        socket.emit('battle:error', { message: 'Action failed — please try again' });
      }
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
      try {
        dequeueSocket(socket.id);
        onlineUsers.delete(socket.id);
        broadcastLobbyUsers(io);

        const battleId = socket.data.battleId;
        if (battleId) {
          const session = activeSessions.get(battleId);
          if (session?.hasSocket(socket.id)) {
            session.forfeit(socket.id);
          }
        }
      } catch (err) {
        console.error(`[Socket] disconnect handler error for ${socket.id}:`, err);
      }
    });
  });
}
