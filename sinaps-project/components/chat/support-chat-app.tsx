"use client"

import * as React from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatThread } from "@/components/chat/chat-thread"
import { MessageComposer } from "@/components/chat/message-composer"
import { SatisfactionDialog } from "@/components/chat/satisfaction-dialog"
import { ClientEntryForm } from "@/components/chat/client-entry-form"
import { QuickPrompts } from "@/components/chat/quick-prompts"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import type { Conversation } from "@/lib/chat-data"
import {
  fetchConversationById,
  sendMessage as apiSendMessage,
  escalateConversation as apiEscalateConversation,
  findOrCreateUser,
  findOrCreateConversation,
  mapBackendConversation,
  getStoredClientSession,
  storeClientSession,
  clearClientSession,
} from "@/lib/api"
import { getSocket, joinConversationRoom, leaveConversationRoom } from "@/lib/socket"

export function SupportChatApp() {
  const [conversation, setConversation] = React.useState<Conversation | null>(null)
  const [conversationId, setConversationId] = React.useState<string | null>(null)
  const [satisfactionOpen, setSatisfactionOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [needsEntry, setNeedsEntry] = React.useState(false)

  async function startSession(name: string, email: string, credential?: string, avatar?: string) {
    setLoading(true)
    try {
      const { user, token } = await findOrCreateUser(name, email, credential, avatar)
      storeClientSession(user._id, token)
      const conv = await findOrCreateConversation()
      setConversationId(conv._id)
      setNeedsEntry(false)
      await loadConversation(conv._id)
    } catch (error: any) {
      clearClientSession()
      setNeedsEntry(true)
      toast.error(error.message || "Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  async function loadConversation(id: string) {
    try {
      const { conversation: conv, messages } = await fetchConversationById(id)
      setConversation(mapBackendConversation(conv, messages))
    } catch (error) {
      toast.error("Erreur lors du chargement de la conversation")
      throw error
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    async function init() {
      const session = getStoredClientSession()
      if (!session) {
        setNeedsEntry(true)
        setLoading(false)
        return
      }
      try {
        const conv = await findOrCreateConversation()
        setConversationId(conv._id)
        await loadConversation(conv._id)
      } catch (error) {
        // Session token missing/expired/rejected — fall back to re-identifying.
        clearClientSession()
        setNeedsEntry(true)
        setLoading(false)
      }
    }
    init()
  }, [])

  React.useEffect(() => {
    if (!conversationId) return
    const socket = getSocket()
    joinConversationRoom(conversationId)

    const handleMessageReceived = (data: any) => {
      if (data?.conversation && data.conversation._id === conversationId) {
        loadConversation(conversationId).catch(() => {})
      }
    }

    const handleConversationUpdated = (updated: any) => {
      if (updated?._id === conversationId) {
        loadConversation(conversationId).catch(() => {})
      }
    }

    socket.on("message_received", handleMessageReceived)
    socket.on("conversation_updated", handleConversationUpdated)

    return () => {
      leaveConversationRoom(conversationId)
      socket.off("message_received", handleMessageReceived)
      socket.off("conversation_updated", handleConversationUpdated)
    }
  }, [conversationId])

  async function handleSend(text: string, attachments?: { url: string; type: string; name?: string }[]) {
    if (!conversationId) return
    try {
      if (conversation?.handledBy === "ia") {
        setConversation((prev) => (prev ? { ...prev, isTyping: true } : null))
      }
      await apiSendMessage(conversationId, "client", text, attachments)
      await loadConversation(conversationId)
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message")
    } finally {
      setConversation((prev) => (prev ? { ...prev, isTyping: false } : null))
    }
  }

  async function handleEscalate() {
    if (!conversationId) return
    try {
      await apiEscalateConversation(conversationId)
      toast.success("Demande transmise à l'équipe de support 👋")
      await loadConversation(conversationId)
    } catch (error) {
      toast.error("Erreur lors de l'escalade")
    }
  }

  function handleReset() {
    clearClientSession()
    if (typeof window !== "undefined") {
      localStorage.removeItem("sinaps_token")
      localStorage.removeItem("sinaps_agent")
    }
    setConversation(null)
    setConversationId(null)
    setNeedsEntry(true)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-8 animate-pulse rounded-full bg-primary/20 ring-8 ring-primary/5" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">Préparation de votre espace de support...</p>
        </div>
      </main>
    )
  }

  if (needsEntry) {
    return <ClientEntryForm onSubmit={startSession} />
  }

  if (!conversation) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <p className="text-sm font-semibold text-foreground">Impossible de charger la conversation.</p>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          Vérifiez que le serveur backend est bien démarré sur le port 5000 (<code className="rounded bg-muted px-1 py-0.5">npm run dev</code> dans <code className="rounded bg-muted px-1 py-0.5">sinaps-backend</code>).
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
          <Button size="sm" onClick={handleReset}>
            Recommencer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <ChatHeader
        conversation={conversation}
        onEscalate={handleEscalate}
        onClose={() => setSatisfactionOpen(true)}
        onLogout={handleReset}
      />
      <ChatThread conversation={conversation} />

      {conversation.status === "resolu" ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-card/80 backdrop-blur-xs px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Cette conversation est résolue et clôturée. Merci pour votre confiance !</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs shrink-0"
            onClick={handleReset}
          >
            Nouvelle demande
          </Button>
        </div>
      ) : (
        <>
          <QuickPrompts onSelect={(q) => handleSend(q)} disabled={conversation.isTyping} />
          <MessageComposer onSend={handleSend} />
        </>
      )}

      <SatisfactionDialog
        open={satisfactionOpen}
        onOpenChange={setSatisfactionOpen}
        clientName={conversation.clientName}
        conversationId={conversationId!}
        onClosed={() => loadConversation(conversationId!)}
      />
    </div>
  )
}
