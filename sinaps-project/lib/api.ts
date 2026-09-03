const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

async function parseOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || `Erreur ${res.status}`)
  }
  return data
}

export async function loginAgent(email: string, password: string) {
  const res = await fetch(`${API_URL}/agents/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Erreur de connexion")
  }
  return res.json()
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("sinaps_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Client sessions: a JWT issued by /users/find-or-create after Google
// verification (or the interim direct name/email entry), scoped to that one
// user. Centralized here so the storage key and shape are consistent
// wherever the client chat needs to prove who it is.
const CLIENT_STORAGE_KEY = "sinaps_client"

export function getStoredClientSession(): { userId: string; token: string } | null {
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

export function storeClientSession(userId: string, token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify({ userId, token }))
}

export function clearClientSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(CLIENT_STORAGE_KEY)
}

export function getClientAuthHeaders(): Record<string, string> {
  const session = getStoredClientSession()
  return session ? { Authorization: `Bearer ${session.token}` } : {}
}

// A few routes (GET conversation, close conversation) are used by both the
// client chat and the agent inbox. Prefer an agent token when one is present
// (agent browsing), otherwise fall back to the client's own token.
export function getAnyAuthHeaders(): Record<string, string> {
  const agentHeaders = getAuthHeaders()
  if (agentHeaders.Authorization) return agentHeaders
  return getClientAuthHeaders()
}

export async function fetchConversations() {
  const res = await fetch(`${API_URL}/conversations`, { headers: getAuthHeaders() })
  return res.json()
}

export async function fetchConversationById(id: string) {
  const res = await fetch(`${API_URL}/conversations/${id}`, { headers: getAnyAuthHeaders() })
  return parseOrThrow(res)
}

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

export async function escalateConversation(id: string) {
  const res = await fetch(`${API_URL}/conversations/${id}/escalate`, {
    method: "PATCH",
    headers: getClientAuthHeaders(),
  })
  return parseOrThrow(res)
}

export async function closeConversation(id: string, rating: number, comment: string) {
  const res = await fetch(`${API_URL}/conversations/${id}/close`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAnyAuthHeaders() },
    body: JSON.stringify({ rating, comment }),
  })
  return parseOrThrow(res)
}
export function mapBackendMessage(msg: any) {
  return {
    id: msg._id,
    sender: msg.sender,
    authorName: msg.authorName,
    content: msg.content,
    attachments: msg.attachments || [],
    time: new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  }
}

export function mapBackendConversation(conv: any, messages: any[] = []) {
  return {
    id: conv._id,
    clientName: conv.client?.name || "Client",
    clientAvatar: conv.client?.avatar || "/avatar-placeholder.png",
    lastMessage: messages.length ? messages[messages.length - 1].content : "",
    unreadCount: 0,
    status: conv.status,
    messages: messages.map(mapBackendMessage),
  }
}

export async function signupAgent(name: string, email: string, password: string, skills: string[]) {
  const res = await fetch(`${API_URL}/agents/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, skills }),
  })
  return res.json()
}

export async function fetchAgents() {
  const res = await fetch(`${API_URL}/agents`, { headers: getAuthHeaders() })
  return res.json()
}

export async function approveAgent(id: string) {
  const res = await fetch(`${API_URL}/agents/${id}/approve`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  })
  return res.json()
}

export async function rejectAgent(id: string) {
  const res = await fetch(`${API_URL}/agents/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/stats`, { headers: getAuthHeaders() })
  return res.json()
}

// Returns { user, token }. `token` is a client-scoped JWT that must be sent
// on every subsequent conversation/message request for this user.
export async function findOrCreateUser(name: string, email: string, credential?: string, avatar?: string) {
  const res = await fetch(`${API_URL}/users/find-or-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, credential, avatar }),
  })
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

export async function fetchConversationsFiltered(status?: string, search?: string) {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (search) params.set("search", search)
  const res = await fetch(`${API_URL}/conversations?${params.toString()}`, { headers: getAuthHeaders() })
  return res.json()
}