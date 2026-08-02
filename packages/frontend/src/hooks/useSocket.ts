import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL ?? 'http://localhost:3002';

/**
 * Singleton socket — we reuse a single connection across the app rather than
 * creating a new one per component. This is the one place in the frontend
 * that touches socket.io directly.
 */
let socketInstance: AppSocket | null = null;
function getAuthUsername(): string | null {
  try {
    const raw = localStorage.getItem('anime-showdown-auth');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.username && data.token) {
        return data.username;
      }
    }
  } catch {}
  return null;
}

export function resetSocketAuth() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

function getSocket(): AppSocket {
  const authUsername = getAuthUsername();
  if (!socketInstance || socketInstance.disconnected) {
    socketInstance = io(REALTIME_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: authUsername ? { username: authUsername } : {},
    });
  } else if (authUsername && socketInstance.io.opts.query?.username !== authUsername) {
    socketInstance.io.opts.query = { username: authUsername };
    socketInstance.disconnect().connect();
  }
  return socketInstance;
}

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (err: Error) => void;
}

/**
 * useSocket — the single hook for socket access.
 *
 * Usage:
 *   const { socket, isConnected, connect, disconnect } = useSocket({ onConnect });
 *
 * Rules:
 * - Call connect() when you want to start a socket session (e.g. entering the queue)
 * - Call disconnect() on cleanup
 * - Never instantiate socket.io directly in a component — use this hook
 */
export function useSocket(options: UseSocketOptions = {}) {
  const socket = getSocket();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handleConnect = () => {
      console.log('[Socket] Connected:', socket.id);
      optionsRef.current.onConnect?.();
    };
    const handleDisconnect = (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      optionsRef.current.onDisconnect?.(reason);
    };
    const handleError = (err: Error) => {
      console.error('[Socket] Error:', err);
      optionsRef.current.onError?.(err);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
    };
  }, [socket]);

  const connect = useCallback(() => {
    if (!socket.connected) socket.connect();
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket.connected) socket.disconnect();
  }, [socket]);

  return {
    socket,
    isConnected: socket.connected,
    connect,
    disconnect,
  };
}
