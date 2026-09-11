import { Conversation, ChatMessage, ClientProfile } from './chat';

export interface AuthResponse {
  user: ClientProfile;
  token: string;
}

export interface ConversationResponse {
  conversation: any;
  messages: any[];
}

export interface SendMessageResponse {
  message: any;
  aiMessage?: any;
}

export interface UploadResponse {
  url: string;
  type: 'image' | 'video' | 'document';
  name: string;
  size?: number;
}
