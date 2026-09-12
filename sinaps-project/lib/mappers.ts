/**
 * mappers.ts — Functions that transform raw backend API responses into the
 * frontend's typed domain objects (Conversation, ChatMessage, etc.).
 *
 * Keeping these here (rather than inline in api.ts) makes it easy to adjust
 * field mappings in one place if the backend response shape ever changes.
 */

import type { Conversation, ChatMessage } from "./types"

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
    time: new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }
}

/**
 * Maps a raw conversation object (and its messages) from the backend to
 * the Conversation type used by the frontend UI components.
 */
export function mapBackendConversation(conv: any, messages: any[] = []): Conversation {
  return {
    id: conv._id,
    clientName: conv.client?.name || "Client",
    clientAvatar: conv.client?.avatar || "/avatar-placeholder.png",
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
