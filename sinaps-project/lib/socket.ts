"use client"

import { io, Socket } from "socket.io-client"

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
  : "http://localhost:5000"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
    })
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
