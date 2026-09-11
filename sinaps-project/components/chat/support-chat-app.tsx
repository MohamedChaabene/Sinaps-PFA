"use client"

import * as React from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatThread } from "@/components/chat/chat-thread"
import { MessageComposer } from "@/components/chat/message-composer"
import { SatisfactionDialog } from "@/components/chat/satisfaction-dialog"
import { ClientEntryForm } from "@/components/chat/client-entry-form"
import { QuickPrompts } from "@/components/chat/quick-prompts"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Conversation } from "@/lib/chat-data"
import {
  fetchConversationById,
  sendMessage as apiSendMessage,
  escalateConversation as apiEscalateConversation,
  deescalateConversation as apiDeescalateConversation,
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
      const mapped = mapBackendConversation(conv, messages)
      setConversation((prev) => {
        // If current state was manually switched to IA, preserve handledBy unless backend resolved it
        if (prev && prev.id === id && prev.handledBy === "ia" && conv.status !== "resolu" && !conv.assignedAgent) {
          return {
            ...mapped,
            handledBy: "ia",
            status: "en_cours",
          }
        }
        return mapped
      })
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

    const handleTypingStatus = (data: any) => {
      if (data?.conversationId === conversationId) {
        setConversation((prev) => (prev ? { ...prev, isTyping: !!data.isTyping } : null))
      }
    }

    socket.on("message_received", handleMessageReceived)
    socket.on("conversation_updated", handleConversationUpdated)
    socket.on("typing_status", handleTypingStatus)

    return () => {
      leaveConversationRoom(conversationId)
      socket.off("message_received", handleMessageReceived)
      socket.off("conversation_updated", handleConversationUpdated)
      socket.off("typing_status", handleTypingStatus)
    }
  }, [conversationId])

  async function handleSend(text: string, attachments?: { url: string; type: string; name?: string }[]) {
    if (!conversationId) return
    const isCurrentlyIA = conversation?.handledBy === "ia"
    try {
      if (isCurrentlyIA) {
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
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              handledBy: "humain",
              status: "en_attente",
            }
          : null
      )
      toast.success("Demande transmise à l'équipe de support 👋")
    } catch (error) {
      toast.error("Erreur lors de l'escalade")
    }
  }

  async function handleSwitchToIA() {
    if (!conversationId) return
    try {
      await apiDeescalateConversation(conversationId)
    } catch {
      // Gracefully continue with client-side state
    }
    setConversation((prev) =>
      prev
        ? {
            ...prev,
            handledBy: "ia",
            status: "en_cours",
          }
        : null
    )
    toast.success("Retour à l'assistant IA activé 🤖")
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
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background p-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/15 bg-card p-8 shadow-lg text-center max-w-sm">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary animate-pulse">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-heading text-base font-bold text-foreground">Sinaps Support</p>
            <p className="text-xs text-muted-foreground">Initialisation de votre session de support...</p>
          </div>
        </div>
      </div>
    )
  }

  if (needsEntry) {
    return <ClientEntryForm onSubmit={startSession} />
  }

  if (!conversation) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 shadow-lg max-w-md">
          <p className="font-heading text-base font-bold text-foreground">Impossible de charger la conversation</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Vérifiez que le serveur backend est bien démarré sur le port 5000 (<code className="rounded bg-muted px-1 py-0.5">npm run dev</code> dans <code className="rounded bg-muted px-1 py-0.5">sinaps-backend</code>).
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
            <Button size="sm" className="rounded-lg" onClick={handleReset}>
              Recommencer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background sm:p-3 lg:p-5">
      <ChatHeader
        conversation={conversation}
        onEscalate={handleEscalate}
        onSwitchToIA={handleSwitchToIA}
        onClose={() => setSatisfactionOpen(true)}
        onLogout={handleReset}
      />
      <ChatThread conversation={conversation} />

      {conversation.status === "resolu" ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-card/90 backdrop-blur-xs px-4 py-3 sm:px-6 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Cette conversation est résolue et clôturée. Merci pour votre confiance !</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg text-xs shrink-0 shadow-2xs"
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
