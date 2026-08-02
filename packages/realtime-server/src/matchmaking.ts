import type { Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@anime-showdown/shared-types';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * In-memory matchmaking queue.
 *
 * Pairs waiting sockets by FIFO order, matching the first two players
 * regardless of team composition (ELO matching is a Phase 3+ concern).
 *
 * One server instance only — move to Redis pub/sub when scaling past one process.
 */

interface QueueEntry {
  socket: AppSocket;
  characterId: string;
  enqueuedAt: number;
}

const queue: QueueEntry[] = [];

/**
 * Adds a socket to the matchmaking queue.
 * If the socket is already queued, removes and re-adds (handles re-queue after disconnect).
 */
export function enqueue(socket: AppSocket, characterId: string): void {
  // Remove any stale entry for this socket
  dequeueSocket(socket.id);
  queue.push({ socket, characterId, enqueuedAt: Date.now() });
  
  // Emit queue position
  socket.emit('queue:status', { position: queue.length });
  console.log(`[Matchmaking] ${socket.id} queued with ${characterId} — queue length: ${queue.length}`);
}

/**
 * Removes a specific socket from the queue by socket ID.
 */
export function dequeueSocket(socketId: string): void {
  const idx = queue.findIndex(e => e.socket.id === socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

/**
 * Attempts to pair two players.
 * Returns a matched pair or null if fewer than 2 players are queued.
 */
export function tryMatch(): [QueueEntry, QueueEntry] | null {
  // Clean up disconnected sockets first
  const activeQueue = queue.filter(e => e.socket.connected);
  // Sync the real queue with active-only entries
  queue.length = 0;
  queue.push(...activeQueue);

  if (queue.length < 2) return null;

  const [a, b] = queue.splice(0, 2);
  console.log(`[Matchmaking] Matched ${a.socket.id} vs ${b.socket.id}`);
  return [a, b];
}

export type { QueueEntry };
