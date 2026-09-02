export type ConversationStatus = "resolu" | "en_cours" | "en_attente"

export type MessageSender = "client" | "ia" | "humain"

export interface MessageAttachment {
  url: string
  type: "image" | "video" | "document" | "link"
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
  isTyping?: boolean
  messages: ChatMessage[]
}

export const statusLabels: Record<ConversationStatus, string> = {
  resolu: "Résolu",
  en_cours: "En cours",
  en_attente: "En attente",
}

export const conversations: Conversation[] = []
