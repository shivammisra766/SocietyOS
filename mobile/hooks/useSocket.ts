/**
 * useSocket — shares a single authenticated Socket.IO connection across screens.
 * Returns the socket instance (or null while connecting / disconnected).
 */
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getItem } from '../lib/storage';
import { BASE_URL, TOKEN_KEY } from '../lib/api';

let sharedSocket: Socket | null = null;
let connectionPromise: Promise<Socket | null> | null = null;
let subscriberCount = 0;

const listeners = new Set<(socket: Socket | null) => void>();

function notifyListeners(socket: Socket | null) {
  listeners.forEach((listener) => listener(socket));
}

async function connectSharedSocket(): Promise<Socket | null> {
  if (sharedSocket) return sharedSocket;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      const token = await getItem(TOKEN_KEY);
    if (!token) {
      notifyListeners(null);
      return null;
    }

    const socket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      notifyListeners(socket);
    });

    socket.on('connect_error', (error: unknown) => {
      console.warn('[useSocket] connection error:', error);
      notifyListeners(null);
    });

    socket.on('disconnect', () => {
      notifyListeners(null);
    });

      sharedSocket = socket;
      return socket;
    } catch (error) {
      console.warn('[useSocket] bootstrap error:', error);
      notifyListeners(null);
      return null;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(sharedSocket?.connected ? sharedSocket : null);

  useEffect(() => {
    subscriberCount += 1;
    listeners.add(setSocket);

    if (sharedSocket?.connected) {
      setSocket(sharedSocket);
    } else {
      void connectSharedSocket();
    }

    return () => {
      listeners.delete(setSocket);
      subscriberCount = Math.max(0, subscriberCount - 1);

      if (subscriberCount === 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, []);

  return socket;
}
