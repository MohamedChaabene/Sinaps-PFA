/**
 * mappers.ts — Functions that transform raw backend API responses into the
 * frontend's typed domain objects (Conversation, ChatMessage, etc.).
 *
 * Keeping these here (rather than inline in api.ts) makes it easy to adjust
 * field mappings in one place if the backend response shape ever changes.
 */

import type { Conversation, ChatMessage } from "./types"
import { formatTime, getClientAvatar } from "./utils"

/**
 * Maps a raw message object from the backend to the ChatMessage type used
 * by the frontend UI components.
 */
export function mapBackendMessage(msg: any): ChatMessage {
  return {
    id: msg._id,
    sender: msg.sender,
    authorName: msg.authorName,
    content: msg.content,
    attachments: msg.attachments || [],
    quickReplies: msg.quickReplies || [],
    time: formatTime(msg.createdAt, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdAt: msg.createdAt, // Preserve raw timestamp for re-formatting
  }
}

/**
 * Maps a raw conversation object (and its messages) from the backend to
 * the Conversation type used by the frontend UI components.
 */
export function mapBackendConversation(conv: any, messages: any[] = []): Conversation {
  const clientObj = conv.client
  const clientId = typeof clientObj === "object" && clientObj !== null
    ? (clientObj._id?.toString() || clientObj.id)
    : (typeof clientObj === "string" ? clientObj : (conv.clientId || undefined))
  const clientEmail = typeof clientObj === "object" && clientObj !== null
    ? clientObj.email
    : (conv.clientEmail || undefined)
  const clientName = typeof clientObj === "object" && clientObj !== null
    ? (clientObj.name || "Client")
    : (typeof conv.clientName === "string" ? conv.clientName : "Client")
  const clientAvatarProp = typeof clientObj === "object" && clientObj !== null
    ? clientObj.avatar
    : (typeof conv.clientAvatar === "string" ? conv.clientAvatar : undefined)

  return {
    id: conv._id,
    clientName,
    clientAvatar: getClientAvatar(clientAvatarProp, { id: clientId, email: clientEmail, name: clientName }),
    clientId,
    clientEmail,
    lastMessage: messages.length ? messages[messages.length - 1].content : "",
    unreadCount: 0,
    status: conv.status,
    handledBy: conv.handledBy || "ia",
    assignedAgent: conv.assignedAgent ? {
      id: conv.assignedAgent._id,
      name: conv.assignedAgent.name,
      email: conv.assignedAgent.email,
    } : undefined,
    messages: messages.map(mapBackendMessage),
  }
}
