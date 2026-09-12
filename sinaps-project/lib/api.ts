/**
 * api.ts — HTTP API client for the SINAPS backend.
 *
 * Contains only fetch-based API call functions.
 * Session/token helpers → lib/session.ts
 * Backend-to-frontend data mappers → lib/mappers.ts
 *
 * Both are re-exported here so existing consumers don't need to change their
 * import paths. New code should import directly from the source module.
 */

import type { Stats } from "./types"
import {
  getAuthHeaders,
  getClientAuthHeaders,
  getAnyAuthHeaders,
} from "./session"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
export const API_BASE_URL = API_URL.replace(/\/api\/?$/, "")

// Re-export session helpers (backward compatibility — existing imports from api.ts still work)
export {
  getAuthHeaders,
  getStoredClientSession,
  storeClientSession,
  clearClientSession,
  getClientAuthHeaders,
  getAnyAuthHeaders,
} from "./session"

// Re-export data mappers (backward compatibility)
export { mapBackendMessage, mapBackendConversation } from "./mappers"

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function parseOrThrow<T = any>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || `Erreur ${res.status}`)
  }
  return data
}

// ---------------------------------------------------------------------------
// Agent authentication
// ---------------------------------------------------------------------------

export async function loginAgent(email: string, password: string) {
  const res = await fetch(`${API_URL}/agents/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  return parseOrThrow(res)
}

export async function signupAgent(name: string, email: string, password: string, skills: string[]) {
  const res = await fetch(`${API_URL}/agents/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, skills }),
  })
  return parseOrThrow(res)
}

// ---------------------------------------------------------------------------
// User (client) authentication
// ---------------------------------------------------------------------------

/**
 * Find or create a user account. Returns { user, token } where token is a
 * client-scoped JWT that must be sent on every subsequent request for this user.
 */
export async function findOrCreateUser(name: string, email: string, credential?: string, avatar?: string) {
  const res = await fetch(`${API_URL}/users/find-or-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, credential, avatar }),
  })
  return parseOrThrow(res)
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function fetchConversations(): Promise<any[]> {
  const res = await fetch(`${API_URL}/conversations`, { headers: getAuthHeaders() })
  return parseOrThrow<any[]>(res)
}

export async function fetchConversationsFiltered(status?: string, search?: string): Promise<any[]> {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (search) params.set("search", search)
  const res = await fetch(`${API_URL}/conversations?${params.toString()}`, { headers: getAuthHeaders() })
  return parseOrThrow<any[]>(res)
}

export async function fetchConversationById(id: string) {
  const res = await fetch(`${API_URL}/conversations/${id}`, { headers: getAnyAuthHeaders() })
  return parseOrThrow(res)
}

export async function findOrCreateConversation() {
  const res = await fetch(`${API_URL}/conversations/find-or-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
    body: JSON.stringify({}),
  })
  return parseOrThrow(res)
}

export async function escalateConversation(id: string) {
  const res = await fetch(`${API_URL}/conversations/${id}/escalate`, {
    method: "PATCH",
    headers: getClientAuthHeaders(),
  })
  return parseOrThrow(res)
}

export async function deescalateConversation(id: string) {
  try {
    const res = await fetch(`${API_URL}/conversations/${id}/de-escalate`, {
      method: "PATCH",
      headers: getClientAuthHeaders(),
    })
    if (res.ok) {
      return await parseOrThrow(res)
    }
  } catch {
    // Fallback gracefully if backend does not implement de-escalate
  }
  return null
}

export async function closeConversation(id: string, rating: number, comment: string) {
  const res = await fetch(`${API_URL}/conversations/${id}/close`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAnyAuthHeaders() },
    body: JSON.stringify({ rating, comment }),
  })
  return parseOrThrow(res)
}

export async function sendQuickReply(
  conversationId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/quick-reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAnyAuthHeaders() },
    body: JSON.stringify({ action, metadata: metadata || {} }),
  })
  return parseOrThrow(res)
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function sendMessage(
  conversationId: string,
  sender: string,
  content: string,
  attachments?: { url: string; type: string; name?: string }[]
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (sender === "humain") Object.assign(headers, getAuthHeaders())
  if (sender === "client") Object.assign(headers, getClientAuthHeaders())

  const res = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ conversationId, sender, content, attachments }),
  })
  return parseOrThrow(res)
}

// ---------------------------------------------------------------------------
// File upload
// ---------------------------------------------------------------------------

export async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: getAnyAuthHeaders(),
    body: formData,
  })
  return parseOrThrow(res)
}

// ---------------------------------------------------------------------------
// Agents (admin operations)
// ---------------------------------------------------------------------------

export async function fetchAgents(): Promise<any[]> {
  const res = await fetch(`${API_URL}/agents`, { headers: getAuthHeaders() })
  return parseOrThrow<any[]>(res)
}

export async function approveAgent(id: string): Promise<any> {
  const res = await fetch(`${API_URL}/agents/${id}/approve`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  })
  return parseOrThrow(res)
}

export async function rejectAgent(id: string): Promise<any> {
  const res = await fetch(`${API_URL}/agents/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  return parseOrThrow(res)
}

// ---------------------------------------------------------------------------
// Stats (admin only)
// ---------------------------------------------------------------------------

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_URL}/stats`, { headers: getAuthHeaders() })
  return parseOrThrow<Stats>(res)
}