import type { Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, TeamDoc } from '@anime-showdown/shared-types';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

interface QueueEntry {
  socket: AppSocket;
  format: string;
  team?: TeamDoc;
  characterId?: string;
  enqueuedAt: number;
}

const queue: QueueEntry[] = [];

/**
 * Adds a socket to the matchmaking queue for a specific battle format.
 */
export function enqueue(socket: AppSocket, format: string = 'ou_6v6', team?: TeamDoc, characterId?: string): void {
  dequeueSocket(socket.id);
  
  const entry: QueueEntry = {
    socket,
    format,
    team,
    characterId: characterId || team?.slots?.[0]?.characterId || team?.characterIds?.[0] || 'kaze',
    enqueuedAt: Date.now(),
  };
  
  queue.push(entry);

  const formatQueueLen = queue.filter(e => e.format === format && e.socket.connected).length;
  socket.emit('queue:status', { position: formatQueueLen, format });
  console.log(`[Matchmaking] ${socket.id} joined ${format} queue — format queue length: ${formatQueueLen}`);
}

/**
 * Removes a specific socket from the queue by socket ID.
 */
export function dequeueSocket(socketId: string): void {
  const idx = queue.findIndex(e => e.socket.id === socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

/**
 * Attempts to pair two players searching for the exact same battle format.
 */
export function tryMatch(): [QueueEntry, QueueEntry] | null {
  // Clean up disconnected sockets
  const activeQueue = queue.filter(e => e.socket.connected);
  queue.length = 0;
  queue.push(...activeQueue);

  // Group by format
  const formats = new Set(queue.map(e => e.format));
  for (const fmt of formats) {
    const matchCandidates = queue.filter(e => e.format === fmt);
    if (matchCandidates.length >= 2) {
      const a = matchCandidates[0];
      const b = matchCandidates[1];
      
      // Remove from real queue
      dequeueSocket(a.socket.id);
      dequeueSocket(b.socket.id);
      
      console.log(`[Matchmaking] Matched ${a.socket.id} vs ${b.socket.id} in format ${fmt}`);
      return [a, b];
    }
  }

  return null;
}

export type { QueueEntry };
