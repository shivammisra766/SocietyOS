/**
 * useSocket — creates and manages a Socket.IO connection authenticated with the JWT.
 * Returns the socket instance (or null while connecting).
 */
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getItem } from '../lib/storage';
import { BASE_URL, TOKEN_KEY } from '../lib/api';

export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        const token = await getItem(TOKEN_KEY);
        if (!token || !mounted) return;

        const s = io(BASE_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 2000,
        });

        s.on('connect', () => {
          if (mounted) setSocket(s);
        });

        s.on('disconnect', () => {
          if (mounted) setSocket(null);
        });

        socketRef.current = s;
      } catch (err) {
        console.warn('[useSocket] connection error:', err);
      }
    };

    connect();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socket;
}
