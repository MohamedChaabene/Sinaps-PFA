const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

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

export async function fetchConversations() {
  const res = await fetch(`${API_URL}/conversations`)
  return res.json()
}

export async function fetchConversationById(id: string) {
  const res = await fetch(`${API_URL}/conversations/${id}`)
  return res.json()
}

export async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  })
  return res.json()
}

export async function sendMessage(
  conversationId: string,
  sender: string,
  content: string,
  attachments?: { url: string; type: string; name?: string }[]
) {
  const res = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, sender, content, attachments }),
  })
  return res.json()
}

export async function escalateConversation(id: string) {
  const res = await fetch(`${API_URL}/conversations/${id}/escalate`, { method: "PATCH" })
  return res.json()
}

export async function closeConversation(id: string, rating: number, comment: string) {
  const res = await fetch(`${API_URL}/conversations/${id}/close`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating, comment }),
  })
  return res.json()
}
export function mapBackendMessage(msg: any) {
  return {
    id: msg._id,
    sender: msg.sender,
    authorName: msg.authorName,
    content: msg.content,
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

export async function findOrCreateUser(name: string, email: string, credential?: string, avatar?: string) {
  const res = await fetch(`${API_URL}/users/find-or-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, credential, avatar }),
  })
  return res.json()
}

export async function findOrCreateConversation(clientId: string) {
  const res = await fetch(`${API_URL}/conversations/find-or-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
  })
  return res.json()
}

export async function fetchConversationsFiltered(status?: string, search?: string) {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (search) params.set("search", search)
  const res = await fetch(`${API_URL}/conversations?${params.toString()}`, { headers: getAuthHeaders() })
  return res.json()
}