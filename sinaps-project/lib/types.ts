export type ConversationStatus = 'resolu' | 'en_cours' | 'en_attente'

export type MessageSender = 'client' | 'ia' | 'humain'

export interface MessageAttachment {
  url: string
  type: 'image' | 'video' | 'document' | 'link'
  name?: string
}

export interface ChatMessage {
  id: string
  sender: MessageSender
  authorName?: string
  authorAvatar?: string
  content: string
  time: string
  attachments?: MessageAttachment[]
}

export interface Conversation {
  id: string
  clientName: string
  clientAvatar: string
  lastMessage: string
  unreadCount: number
  status: ConversationStatus
  handledBy?: "ia" | "humain"
  isTyping?: boolean
  messages: ChatMessage[]
}

export interface Agent {
  id: string
  name: string
  email: string
  initials: string
  skills: string[]
  conversations: number
  avatar: string
  status?: 'pending' | 'approved'
  role?: 'agent' | 'admin'
}

export interface Stats {
  total: number
  resolvedByIA: number
  resolvedByHuman: number
  avgSatisfaction: string
  avgResponseTimeSeconds: number
}

export interface ClientSession {
  userId: string
  token: string
}

export interface UserProfile {
  _id: string
  name: string
  email: string
  avatar?: string
  googleId?: string
}
