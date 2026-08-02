import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@anime-showdown/shared-types';

const PORT = parseInt(process.env.REALTIME_PORT ?? '3002', 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const httpServer = createServer();

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
  // Prefer WebSocket, fall back to polling
  transports: ['websocket', 'polling'],
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`[Realtime] Socket.io server running on http://localhost:${PORT}`);
});
