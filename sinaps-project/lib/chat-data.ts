export type {
  ConversationStatus,
  MessageSender,
  MessageAttachment,
  ChatMessage,
  Conversation,
} from "./types"

import type { ConversationStatus, Conversation } from "./types"

export const statusLabels: Record<ConversationStatus, string> = {
  resolu: "Résolu",
  en_cours: "En cours",
  en_attente: "En attente",
}

export const conversations: Conversation[] = []
