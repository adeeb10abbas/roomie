import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/context/types';

const getSocketUrl = (): string => {
  if (Platform.OS === 'web') {
    return window.location.origin;
  }
  const domain = process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}`;
  return 'http://localhost';
};

export type SocketStatus = 'connecting' | 'connected' | 'disconnected';

interface UseSocketOptions {
  authToken: string | null;
  matchIds: string[];
  activeChatMatchId: string | null;
  onNewMessage: (message: Message) => void;
  onStatusChange?: (status: SocketStatus) => void;
}

export function useSocket({ authToken, matchIds, activeChatMatchId, onNewMessage, onStatusChange }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  const onStatusChangeRef = useRef(onStatusChange);
  const matchIdsRef = useRef(matchIds);
  const activeChatMatchIdRef = useRef(activeChatMatchId);

  onNewMessageRef.current = onNewMessage;
  onStatusChangeRef.current = onStatusChange;
  matchIdsRef.current = matchIds;
  activeChatMatchIdRef.current = activeChatMatchId;

  const joinRooms = useCallback((socket: Socket, ids: string[]) => {
    if (ids.length > 0) {
      socket.emit('join_rooms', ids);
    }
  }, []);

  useEffect(() => {
    if (!authToken) {
      onStatusChangeRef.current?.('disconnected');
      return;
    }

    const socket = io(getSocketUrl(), {
      path: '/api/socket.io',
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;
    onStatusChangeRef.current?.('connecting');

    socket.on('connect', () => {
      onStatusChangeRef.current?.('connected');
      joinRooms(socket, matchIdsRef.current);
      // Re-emit active chat state on every connect/reconnect so the server
      // doesn't miss suppression when the socket reconnects mid-conversation.
      if (activeChatMatchIdRef.current !== null) {
        socket.emit('set_active_chat', activeChatMatchIdRef.current);
      }
    });

    socket.on('disconnect', () => {
      onStatusChangeRef.current?.('disconnected');
    });

    socket.on('connect_error', () => {
      onStatusChangeRef.current?.('disconnected');
    });

    socket.on('new_message', (message: Message) => {
      onNewMessageRef.current(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      onStatusChangeRef.current?.('disconnected');
    };
  }, [authToken, joinRooms]);

  useEffect(() => {
    const socket = socketRef.current;
    if (socket && socket.connected && matchIds.length > 0) {
      joinRooms(socket, matchIds);
    }
  }, [matchIds, joinRooms]);

  // Notify the server whenever the active chat changes so it can skip push notifications
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('set_active_chat', activeChatMatchId ?? null);
    }
  }, [activeChatMatchId]);

  return socketRef;
}
