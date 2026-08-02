import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { enqueue, dequeueSocket, tryMatch } from './matchmaking.js';
import { BattleSession, activeSessions } from './battleSession.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@anime-showdown/shared-types';

type AppIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Registers all socket event handlers.
 * Every handler is wrapped in a try/catch that logs the error and emits
 * a typed error event back to the client — no unhandled rejections, ever.
 */
export function registerSocketHandlers(io: AppIO): void {
  io.on('connection', (socket: AppSocket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── queue:join ────────────────────────────────────────────────────────────
    socket.on('queue:join', (payload) => {
      try {
        const { characterId } = payload;
        if (!characterId || typeof characterId !== 'string') {
          socket.emit('matchmaking:error', { message: 'characterId is required to join queue' });
          return;
        }

        // Store on socket data for reconnect / forfeit resolution
        socket.data.characterId = characterId;

        enqueue(socket, characterId);

        // Attempt to match immediately
        const match = tryMatch();
        if (match) {
          const [entryA, entryB] = match;
          const battleId = uuidv4();

          // Join both sockets to a battle room
          entryA.socket.join(battleId);
          entryB.socket.join(battleId);
          entryA.socket.data.battleId = battleId;
          entryB.socket.data.battleId = battleId;
          entryA.socket.data.playerKey = 'playerA';
          entryB.socket.data.playerKey = 'playerB';

          const session = new BattleSession(
            battleId,
            entryA.socket.id,
            entryA.characterId,
            entryB.socket.id,
            entryB.characterId,
            io,
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
        console.log(`[Socket] ${socket.id} left queue`);
      } catch (err) {
        console.error(`[Socket] queue:leave error for ${socket.id}:`, err);
      }
    });

    // ── battle:action ─────────────────────────────────────────────────────────
    socket.on('battle:action', (payload) => {
      try {
        const { moveId } = payload;
        const battleId = socket.data.battleId;

        if (!battleId) {
          socket.emit('battle:error', { message: 'You are not in an active battle' });
          return;
        }
        if (!moveId || typeof moveId !== 'string') {
          socket.emit('battle:error', { message: 'moveId is required' });
          return;
        }

        const session = activeSessions.get(battleId);
        if (!session) {
          socket.emit('battle:error', { message: 'Battle session not found' });
          return;
        }

        session.submitAction(socket.id, moveId);
      } catch (err) {
        console.error(`[Socket] battle:action error for ${socket.id}:`, err);
        socket.emit('battle:error', { message: 'Action failed — please try again' });
      }
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
      try {
        // Remove from queue if waiting
        dequeueSocket(socket.id);

        // Forfeit any active battle
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
