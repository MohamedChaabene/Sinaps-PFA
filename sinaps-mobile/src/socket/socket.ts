import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '../api/client';
import { getStoredSession } from '../utils/storage';

let socket: Socket | null = null;
let currentConnectedUrl: string | null = null;

export async function getSocket(): Promise<Socket> {
  const baseUrl = await getApiBaseUrl();
  const session = await getStoredSession();

  if (!socket || currentConnectedUrl !== baseUrl) {
    if (socket) {
      socket.disconnect();
    }
    currentConnectedUrl = baseUrl;
    socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      auth: {
        token: session?.token,
      },
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected to:', baseUrl);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket.IO connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });
  }

  return socket;
}

export async function joinConversationRoom(conversationId: string): Promise<void> {
  if (!conversationId) return;
  const s = await getSocket();
  s.emit('join_conversation', conversationId);
}

export async function leaveConversationRoom(conversationId: string): Promise<void> {
  if (!conversationId) return;
  if (socket) {
    socket.emit('leave_conversation', conversationId);
  }
}

export async function sendTypingStatus(
  conversationId: string,
  isTyping: boolean,
  sender?: string,
  authorName?: string
): Promise<void> {
  if (!conversationId) return;
  const s = await getSocket();
  s.emit('typing_status', { conversationId, isTyping, sender, authorName });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentConnectedUrl = null;
  }
}
