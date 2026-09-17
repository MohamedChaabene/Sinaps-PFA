import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, ChatMessage, MessageAttachment } from '../types/chat';
import { useAuth } from './AuthContext';
import {
  findOrCreateConversation as apiFindOrCreateConversation,
  fetchConversationById as apiFetchConversationById,
  escalateConversation as apiEscalateConversation,
  deescalateConversation as apiDeescalateConversation,
  sendQuickReply as apiSendQuickReply,
  closeConversation as apiCloseConversation,
} from '../api/conversations';
import { sendMessage as apiSendMessage } from '../api/messages';
import { mapBackendConversation, mapBackendMessage } from '../utils/formatters';
import {
  getSocket,
  joinConversationRoom,
  leaveConversationRoom,
  subscribeSocketConnection,
  SocketConnectionState,
} from '../socket/socket';

interface ChatContextType {
  conversation: Conversation | null;
  isLoading: boolean;
  isSending: boolean;
  isTyping: boolean;
  socketState: SocketConnectionState;
  error: string | null;
  refreshConversation: () => Promise<void>;
  sendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<void>;
  escalateToHuman: () => Promise<void>;
  switchToAI: () => Promise<void>;
  closeConversation: (rating: number, comment?: string) => Promise<void>;
  sendQuickReply: (action: string, metadata?: Record<string, unknown>) => Promise<void>;
  startNewConversation: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [socketState, setSocketState] = useState<SocketConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversation?.id || null;
  
  // BUG-001 FIX: Request version counter to prevent stale responses from overwriting newer state
  const loadConversationVersionRef = useRef<number>(0);

  const loadConversationDetails = useCallback(async (id: string) => {
    // BUG-001 FIX: Increment version counter for this request
    const currentVersion = ++loadConversationVersionRef.current;
    
    try {
      const data = await apiFetchConversationById(id);
      if (data?.conversation) {
        const mapped = mapBackendConversation(data.conversation, data.messages || []);
        
        // BUG-001 FIX: Only update state if this response is not stale
        setConversation((prev) => {
          // Check if this response is stale (a newer request has already updated state)
          if (currentVersion !== loadConversationVersionRef.current) {
            return prev; // Ignore stale response
          }
          return mapped;
        });
        
        setError(null);
      }
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        await logout();
      } else {
        setError(err.message || 'Erreur lors du chargement des messages');
      }
    }
  }, [logout]);

  const initConversation = useCallback(async () => {
    if (!isAuthenticated) {
      setConversation(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const rawConv = await apiFindOrCreateConversation();
      if (rawConv?._id) {
        await loadConversationDetails(rawConv._id);
      }
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        await logout();
      } else {
        setError(err.message || 'Impossible de charger la conversation');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadConversationDetails, logout]);

  useEffect(() => {
    const unsubscribe = subscribeSocketConnection(setSocketState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    initConversation();
  }, [initConversation]);

  // Setup Socket.IO subscription
  useEffect(() => {
    const convId = conversation?.id;
    if (!convId) return;

    let isMounted = true;

    async function setupSocket() {
      try {
        await joinConversationRoom(convId!);
        const socket = await getSocket();

        const handleMessageReceived = (data: any) => {
          if (!isMounted) return;
          if (data?.conversation && data.conversation._id === convId) {
            loadConversationDetails(convId!).catch((error) => {
              setError(error instanceof Error ? error.message : 'Impossible de synchroniser la conversation');
            });
          }
        };

        const handleConversationUpdated = (updated: any) => {
          if (!isMounted) return;
          if (updated?._id === convId) {
            loadConversationDetails(convId!).catch((error) => {
              setError(error instanceof Error ? error.message : 'Impossible de synchroniser la conversation');
            });
          }
        };

        const handleTypingStatus = (data: any) => {
          if (!isMounted) return;
          if (data?.conversationId === convId) {
            setIsTyping(!!data.isTyping);
          }
        };

        socket.on('message_received', handleMessageReceived);
        socket.on('conversation_updated', handleConversationUpdated);
        socket.on('typing_status', handleTypingStatus);

        return () => {
          leaveConversationRoom(convId!).catch((error) => {
            setError(error instanceof Error ? error.message : 'Impossible de quitter la conversation en temps réel');
          });
          socket.off('message_received', handleMessageReceived);
          socket.off('conversation_updated', handleConversationUpdated);
          socket.off('typing_status', handleTypingStatus);
        };
      } catch (err) {
        console.warn('Socket setup error:', err);
      }
    }

    const cleanupPromise = setupSocket();

    return () => {
      isMounted = false;
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [conversation?.id, loadConversationDetails]);

  const refreshConversation = async () => {
    if (conversation?.id) {
      await loadConversationDetails(conversation.id);
    } else {
      await initConversation();
    }
  };

  const handleSendMessage = async (content: string, attachments?: MessageAttachment[]) => {
    if (!conversation?.id) return;
    const convId = conversation.id;

    setIsSending(true);

    try {
      const response = await apiSendMessage(convId, content, attachments);
      
      // BUG-001 FIX: Process aiMessage from HTTP response as reliable fallback
      // This ensures AI response appears even if Socket.IO events fail
      if (response.aiMessage) {
        setConversation((prev) => {
          if (!prev) return prev
          
          // Check for duplicate message by _id to prevent Socket.IO duplicates
          const existingMessageIds = new Set(prev.messages.map(msg => msg.id))
          if (existingMessageIds.has(response.aiMessage._id)) {
            return prev // Skip duplicate
          }
          
          return {
            ...prev,
            messages: [...prev.messages, mapBackendMessage(response.aiMessage)]
          }
        })
      }
      
      // Socket-driven message_received/conversation_updated events still handle realtime updates
      // and will be ignored as duplicates if they arrive for the same message
    } catch (err: any) {
      setError(err.message || "Erreur d'envoi du message");
      throw err;
    } finally {
      setIsSending(false);
      // Server-driven typing_status events handle the typing indicator
    }
  };

  const handleEscalateToHuman = async () => {
    if (!conversation?.id) return;
    try {
      await apiEscalateConversation(conversation.id);
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              handledBy: 'humain',
              status: 'en_attente',
            }
          : null
      );
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'escalade vers un agent");
      throw err;
    }
  };

  const handleSwitchToAI = async () => {
    if (!conversation?.id) return;
    try {
      await apiDeescalateConversation(conversation.id);
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              handledBy: 'ia',
              status: 'en_cours',
            }
          : null
      );
    } catch (err: any) {
      setError(err.message || "Erreur lors du retour au mode IA");
      throw err;
    }
  };

  const handleQuickReply = async (action: string, metadata?: Record<string, unknown>) => {
    if (!conversation?.id) return;
    try {
      await apiSendQuickReply(conversation.id, action, metadata);
      await loadConversationDetails(conversation.id);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'action");
      throw err;
    }
  };

  const handleCloseConversation = async (rating: number, comment?: string) => {
    if (!conversation?.id) return;
    try {
      await apiCloseConversation(conversation.id, rating, comment);
      await loadConversationDetails(conversation.id);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la clôture de la conversation');
      throw err;
    }
  };

  const handleStartNewConversation = async () => {
    setConversation(null);
    await initConversation();
  };

  return (
    <ChatContext.Provider
      value={{
        conversation,
        isLoading,
        isSending,
        isTyping,
        socketState,
        error,
        refreshConversation,
        sendMessage: handleSendMessage,
        escalateToHuman: handleEscalateToHuman,
        switchToAI: handleSwitchToAI,
        closeConversation: handleCloseConversation,
        sendQuickReply: handleQuickReply,
        startNewConversation: handleStartNewConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return ctx;
}
