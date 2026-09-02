"use client"

import * as React from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatThread } from "@/components/chat/chat-thread"
import { MessageComposer } from "@/components/chat/message-composer"
import { SatisfactionDialog } from "@/components/chat/satisfaction-dialog"
import { ClientEntryForm } from "@/components/chat/client-entry-form"
import { toast } from "sonner"
import type { Conversation } from "@/lib/chat-data"
import {
  fetchConversationById,
  sendMessage as apiSendMessage,
  escalateConversation as apiEscalateConversation,
  findOrCreateUser,
  findOrCreateConversation,
  mapBackendConversation,
} from "@/lib/api"

const STORAGE_KEY = "sinaps_client"

export function SupportChatApp() {
  const [conversation, setConversation] = React.useState<Conversation | null>(null)
  const [conversationId, setConversationId] = React.useState<string | null>(null)
  const [satisfactionOpen, setSatisfactionOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [needsEntry, setNeedsEntry] = React.useState(false)

  async function startSession(name: string, email: string) {
    try {
      const user = await findOrCreateUser(name, email)
      const conv = await findOrCreateConversation(user._id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: user._id }))
      setConversationId(conv._id)
      setNeedsEntry(false)
      await loadConversation(conv._id)
    } catch (error) {
      toast("Erreur de connexion")
    }
  }

  async function loadConversation(id: string) {
    try {
      const { conversation: conv, messages } = await fetchConversationById(id)
      setConversation(mapBackendConversation(conv, messages))
    } catch (error) {
      toast("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    async function init() {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setNeedsEntry(true)
        setLoading(false)
        return
      }
      try {
        const { userId } = JSON.parse(stored)
        const conv = await findOrCreateConversation(userId)
        setConversationId(conv._id)
        await loadConversation(conv._id)
      } catch (error) {
        setNeedsEntry(true)
        setLoading(false)
      }
    }
    init()
  }, [])

  async function handleSend(text: string) {
    if (!conversationId) return
    try {
      await apiSendMessage(conversationId, "client", text)
      await loadConversation(conversationId)
    } catch (error) {
      toast("Erreur lors de l'envoi du message")
    }
  }

  async function handleEscalate() {
    if (!conversationId) return
    try {
      await apiEscalateConversation(conversationId)
      toast("Un agent va prendre le relais 👋")
      await loadConversation(conversationId)
    } catch (error) {
      toast("Erreur lors de l'escalade")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (needsEntry) {
    return <ClientEntryForm onSubmit={startSession} />
  }

  if (!conversation) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Impossible de charger la conversation.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <ChatHeader conversation={conversation} onEscalate={handleEscalate} />
      <ChatThread conversation={conversation} />
      <MessageComposer onSend={handleSend} />
      <div className="flex justify-center border-t border-border bg-card px-4 py-2">
        <button
          type="button"
          onClick={() => setSatisfactionOpen(true)}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Clôturer la conversation
        </button>
      </div>
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