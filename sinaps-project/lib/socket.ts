"use client"

import { io, Socket } from "socket.io-client"
import { API_BASE_URL, getStoredClientSession } from "./api"

const SOCKET_URL = API_BASE_URL

let socket: Socket | null = null

function getActiveAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined
  const agentToken = localStorage.getItem("sinaps_token")
  if (agentToken) return agentToken
  const clientSession = getStoredClientSession()
  return clientSession?.token
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      auth: (cb) => {
        cb({ token: getActiveAuthToken() })
      },
    })
  } else if (!socket.connected) {
    socket.connect()
  }
  return socket
}

export function joinConversationRoom(conversationId: string) {
  const s = getSocket()
  s.emit("join_conversation", conversationId)
}

export function leaveConversationRoom(conversationId: string) {
  const s = getSocket()
  s.emit("leave_conversation", conversationId)
}

export function sendTypingStatus(
  conversationId: string,
  isTyping: boolean,
  sender?: string,
  authorName?: string
) {
  const s = getSocket()
  s.emit("typing_status", { conversationId, isTyping, sender, authorName })
}
