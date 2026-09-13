/**
 * session.ts — Client and agent session token management.
 *
 * Centralizes localStorage key names and token retrieval so the storage keys
 * and shapes are consistent across the entire frontend.
 *
 * Two separate session types exist:
 * - Agent session: stored under "sinaps_token" / "sinaps_agent" after email+password login
 * - Client session: stored under "sinaps_client" after Google OAuth / email entry
 */

const AGENT_TOKEN_KEY = "sinaps_token"
const CLIENT_STORAGE_KEY = "sinaps_client"
const CONVERSATION_ID_KEY = "sinaps_conversation_id"

// ---------------------------------------------------------------------------
// Agent (support staff) session
// ---------------------------------------------------------------------------

export function getAgentToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AGENT_TOKEN_KEY)
}

/**
 * Returns Authorization headers for authenticated agent/admin requests.
 * Returns an empty object if no agent token is stored.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAgentToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ---------------------------------------------------------------------------
// Client (end-user) session
// ---------------------------------------------------------------------------

export interface ClientSession {
  userId: string
  token: string
}

export function getStoredClientSession(): ClientSession | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(CLIENT_STORAGE_KEY)
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored)
    if (!parsed?.userId || !parsed?.token) return null
    return parsed
  } catch {
    return null
  }
}

export function storeClientSession(userId: string, token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify({ userId, token }))
}

export function clearClientSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CLIENT_STORAGE_KEY)
  localStorage.removeItem(CONVERSATION_ID_KEY)
}

// ---------------------------------------------------------------------------
// Conversation ID persistence
// ---------------------------------------------------------------------------

export function getStoredConversationId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CONVERSATION_ID_KEY)
}

export function storeConversationId(conversationId: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CONVERSATION_ID_KEY, conversationId)
}

export function clearConversationId(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CONVERSATION_ID_KEY)
}

/**
 * Returns Authorization headers for authenticated client requests.
 * Returns an empty object if no client session is stored.
 */
export function getClientAuthHeaders(): Record<string, string> {
  const session = getStoredClientSession()
  return session ? { Authorization: `Bearer ${session.token}` } : {}
}

// ---------------------------------------------------------------------------
// Shared helper — picks the right token based on the current page
// ---------------------------------------------------------------------------

/**
 * Some routes (GET conversation, upload, close conversation) are shared by
 * both the client chat and the agent inbox. This helper routes the correct
 * token based on the current URL so a stale agent token never interferes
 * with client chat, and vice versa.
 */
export function getAnyAuthHeaders(): Record<string, string> {
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname
    if (pathname.startsWith("/agent") || pathname.startsWith("/admin")) {
      const agentHeaders = getAuthHeaders()
      if (agentHeaders.Authorization) return agentHeaders
    }
  }
  const clientHeaders = getClientAuthHeaders()
  if (clientHeaders.Authorization) return clientHeaders

  const agentHeaders = getAuthHeaders()
  if (agentHeaders.Authorization) return agentHeaders

  return {}
}
