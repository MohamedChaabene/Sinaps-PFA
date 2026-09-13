export type ConversationStatus = 'resolu' | 'en_cours' | 'en_attente';

export type MessageSender = 'client' | 'ia' | 'humain';

export interface MessageAttachment {
  url: string;
  type: 'image' | 'video' | 'document' | 'link';
  name?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  time: string;
  createdAt: string;
  attachments?: MessageAttachment[];
  quickReplies?: Array<{
    id: string;
    label: string;
    action: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface ClientProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  googleId?: string;
}

export interface AssignedAgent {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
}

export interface Conversation {
  id: string;
  client: ClientProfile;
  assignedAgent?: AssignedAgent | null;
  lastMessage?: string;
  status: ConversationStatus;
  handledBy: 'ia' | 'humain';
  satisfaction?: {
    rating: number;
    comment?: string;
  };
  messages: ChatMessage[];
  updatedAt: string;
  createdAt: string;
}
