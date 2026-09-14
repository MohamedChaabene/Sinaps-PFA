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
import type { Conversation, ChatMessage, MessageAttachment } from "@/lib/chat-data"
import { formatTime } from "@/lib/utils"
import {
  fetchConversationById,
  sendMessage as apiSendMessage,
  escalateConversation as apiEscalateConversation,
  deescalateConversation as apiDeescalateConversation,
  sendQuickReply as apiSendQuickReply,
  findOrCreateUser,
  findOrCreateConversation,
  mapBackendConversation,
  mapBackendMessage,
  getStoredClientSession,
  storeClientSession,
  clearClientSession,
  getStoredConversationId,
  storeConversationId,
  clearConversationId,
} from "@/lib/api"
import { getSocket, joinConversationRoom, leaveConversationRoom } from "@/lib/socket"

export function SupportChatApp() {
  const [conversation, setConversation] = React.useState<Conversation | null>(null)
  const [conversationId, setConversationId] = React.useState<string | null>(null)
  const [satisfactionOpen, setSatisfactionOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [needsEntry, setNeedsEntry] = React.useState(false)
  const [loadingQuickReplyAction, setLoadingQuickReplyAction] = React.useState<string | null>(null)
  const [initError, setInitError] = React.useState<string | null>(null)
  const [dismissedQuickReplyId, setDismissedQuickReplyId] = React.useState<string | null>(null)
  const composerInputRef = React.useRef<HTMLTextAreaElement>(null)
  
  // BUG-001 FIX: Request version counter to prevent stale responses from overwriting newer state
  const loadConversationVersionRef = React.useRef(0)
  // Track optimistic in-flight client messages to prevent duplication or premature removal
  const pendingMessagesRef = React.useRef<Map<string, ChatMessage>>(new Map())

  async function startSession(name: string, email: string, credential?: string, avatar?: string) {
    setLoading(true)
    setInitError(null)
    try {
      const { user, token } = await findOrCreateUser(name, email, credential, avatar)
      storeClientSession(user._id, token)
      
      // Check if there's an existing conversation ID in storage
      const existingConversationId = getStoredConversationId()
      let conv
      
      if (existingConversationId) {
        // Try to load the existing conversation first
        try {
          const { conversation: fetchedConv } = await fetchConversationById(existingConversationId)
          // Verify the conversation belongs to this user and is still active
          // Handle both string and object client references
          const clientId = typeof fetchedConv.client === 'string' ? fetchedConv.client : fetchedConv.client._id
          if (clientId === user._id && fetchedConv.status !== 'resolu') {
            setConversationId(fetchedConv._id)
            setNeedsEntry(false)
            await loadConversation(fetchedConv._id)
            return
          }
        } catch (error) {
          // Existing conversation is invalid or belongs to another user, clear it and create new
          clearConversationId()
        }
      }
      
      // Create or find a new conversation
      conv = await findOrCreateConversation()
      setConversationId(conv._id)
      storeConversationId(conv._id)
      setNeedsEntry(false)
      await loadConversation(conv._id)
    } catch (error: any) {
      clearClientSession()
      clearConversationId()
      setNeedsEntry(true)
      setInitError(error.message || "Erreur de connexion au serveur")
      toast.error(error.message || "Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  async function loadConversation(id: string) {
    // BUG-001 FIX: Increment version counter for this request
    const currentVersion = ++loadConversationVersionRef.current
    
    try {
      const { conversation: conv, messages } = await fetchConversationById(id)
      const mapped = mapBackendConversation(conv, messages)
      
      // BUG-001 FIX: Only update state if this response is not stale
      setConversation((prev) => {
        // Check if this response is stale (a newer request has already updated state)
        if (currentVersion !== loadConversationVersionRef.current) {
          return prev // Ignore stale response
        }
        
        // If current state was manually switched to IA, preserve handledBy unless backend resolved it
        const handledBy = (prev && prev.id === id && prev.handledBy === "ia" && conv.status !== "resolu" && !conv.assignedAgent)
          ? "ia"
          : mapped.handledBy
        const status = handledBy === "ia" && mapped.status !== "resolu" ? "en_cours" : mapped.status

        // Preserve typing indicator if currently active and handledBy is not human
        const isTyping = (prev?.isTyping || pendingMessagesRef.current.size > 0) && handledBy !== "humain"

        // Retain any pending optimistic messages that have not yet reached the server
        const serverMessageIds = new Set(mapped.messages.map((m) => m.id))
        const pendingToKeep: ChatMessage[] = []

        if (pendingMessagesRef.current.size > 0) {
          pendingMessagesRef.current.forEach((pendingMsg, tempId) => {
            const alreadyInServer = mapped.messages.some(
              (sm) => sm.sender === "client" && sm.content === pendingMsg.content
            )
            if (alreadyInServer) {
              pendingMessagesRef.current.delete(tempId)
            } else if (!serverMessageIds.has(tempId)) {
              pendingToKeep.push(pendingMsg)
            }
          })
        }

        return {
          ...mapped,
          handledBy,
          status,
          isTyping,
          messages: [...mapped.messages, ...pendingToKeep],
        }
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
        // Check if there's an existing conversation ID in storage
        const existingConversationId = getStoredConversationId()
        
        if (existingConversationId) {
          // Try to load the existing conversation first
          try {
            const { conversation: fetchedConv } = await fetchConversationById(existingConversationId)
            // Verify the conversation belongs to this user and is still active
            const clientId = typeof fetchedConv.client === 'string' ? fetchedConv.client : fetchedConv.client._id
            if (clientId === session.userId && fetchedConv.status !== 'resolu') {
              setConversationId(fetchedConv._id)
              await loadConversation(fetchedConv._id)
              return
            }
          } catch (error) {
            // Existing conversation is invalid, clear it and create new
            clearConversationId()
          }
        }
        
        // Create or find a new conversation
        const conv = await findOrCreateConversation()
        setConversationId(conv._id)
        storeConversationId(conv._id)
        await loadConversation(conv._id)
      } catch (error: any) {
        // Session token missing/expired/rejected — fall back to re-identifying.
        clearClientSession()
        clearConversationId()
        setNeedsEntry(true)
        setInitError(error.message || "Erreur de connexion au serveur")
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
        setConversation((prev) => {
          if (!prev) return null
          // Do not turn off isTyping if an optimistic client message is still awaiting AI response
          if (!data.isTyping && pendingMessagesRef.current.size > 0 && prev.handledBy !== "humain") {
            return prev
          }
          return { ...prev, isTyping: !!data.isTyping }
        })
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
    // Prevent sending another message while AI is actively generating response
    if (conversation?.isTyping && conversation?.handledBy !== "humain") return

    setDismissedQuickReplyId(null)

    const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date()
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender: "client",
      content: text,
      attachments: (attachments || []) as MessageAttachment[],
      time: formatTime(now.toISOString(), { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.toISOString(),
    }

    pendingMessagesRef.current.set(tempId, optimisticMsg)

    // AI only generates responses when handledBy is not 'humain' and conversation is not resolved
    const willAiRespond = conversation?.handledBy !== "humain" && conversation?.status !== "resolu"

    // 1. Optimistic UI update: immediately display the client's message and typing indicator
    setConversation((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        lastMessage: text || (attachments?.length ? "Pièce jointe" : prev.lastMessage),
        isTyping: willAiRespond ? true : prev.isTyping,
        messages: [...prev.messages, optimisticMsg],
      }
    })

    try {
      const response = await apiSendMessage(conversationId, "client", text, attachments)
      pendingMessagesRef.current.delete(tempId)

      const realClientMsg = mapBackendMessage(response.message)
      const realAiMsg = response.aiMessage ? mapBackendMessage(response.aiMessage) : null

      setConversation((prev) => {
        if (!prev) return prev

        // Replace tempId with the real client message
        let replaced = false
        const updated = prev.messages.map((m) => {
          if (m.id === tempId) {
            replaced = true
            return realClientMsg
          }
          return m
        })

        let nextMessages = replaced ? updated : prev.messages

        // If tempId was already replaced (e.g. by loadConversation), ensure real client message is present
        if (!replaced && !nextMessages.some((m) => m.id === realClientMsg.id)) {
          nextMessages = [...nextMessages, realClientMsg]
        }

        // Append AI response if present and not already in nextMessages
        if (realAiMsg && !nextMessages.some((m) => m.id === realAiMsg.id)) {
          nextMessages = [...nextMessages, realAiMsg]
        }

        return {
          ...prev,
          isTyping: false,
          messages: nextMessages,
        }
      })
    } catch (error) {
      pendingMessagesRef.current.delete(tempId)
      // Rollback optimistic message on failure
      setConversation((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          isTyping: false,
          messages: prev.messages.filter((m) => m.id !== tempId),
        }
      })
      toast.error("Erreur lors de l'envoi du message")
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
    clearConversationId()
    if (typeof window !== "undefined") {
      localStorage.removeItem("sinaps_token")
      localStorage.removeItem("sinaps_agent")
    }
    setConversation(null)
    setConversationId(null)
    setDismissedQuickReplyId(null)
    setNeedsEntry(true)
  }

  async function handleQuickReplyClick(action: string, metadata?: Record<string, unknown>, label?: string) {
    if (!conversationId) return
    // Prevent triggering quick reply while AI is actively generating response
    if (conversation?.isTyping && conversation?.handledBy !== "humain") return
    setLoadingQuickReplyAction(action)
    try {
      if (action === "ESCALATE_TO_HUMAN") {
        // 2. 👨💼 "Parler à un agent" — pure action, no client message
        setConversation((prev) => (prev ? { ...prev, handledBy: "humain", status: "en_attente", isTyping: false } : null))
        await apiSendQuickReply(conversationId, action, metadata)
        toast.success("Demande transmise à l'équipe de support 👋")
        await loadConversation(conversationId)
      } else if (action === "NEW_QUESTION" || action === "YES_ANOTHER_QUESTION") {
        // 3. "J'ai une autre question" — pure UI/action, no client message, focus input
        const lastMsg = conversation?.messages[conversation.messages.length - 1]
        if (lastMsg) {
          setDismissedQuickReplyId(lastMsg.id)
        }
        await apiSendQuickReply(conversationId, action, metadata).catch(() => {})
        setTimeout(() => {
          composerInputRef.current?.focus()
        }, 50)
      } else if (action === "CONFIRM_RESOLVED" || action === "NO_ALL_DONE") {
        // 4. ✅ "C'est ce qu'il me fallait" — resolve conversation & open satisfaction modal
        setConversation((prev) => (prev ? { ...prev, status: "resolu" } : null))
        await apiSendQuickReply(conversationId, action, metadata)
        setSatisfactionOpen(true)
        await loadConversation(conversationId)
      } else if (action === "RETRY_AI") {
        await apiSendQuickReply(conversationId, action, metadata)
        await loadConversation(conversationId)
      } else {
        // Conversational quick reply with custom prompt text
        if (label) {
          await handleSend(label)
        } else {
          await apiSendQuickReply(conversationId, action, metadata)
          await loadConversation(conversationId)
        }
      }
    } catch (error) {
      toast.error("Erreur lors de l'action")
    } finally {
      setLoadingQuickReplyAction(null)
    }
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
          {initError && (
            <div className="pt-2 flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
              <Button size="sm" className="rounded-lg" onClick={handleReset}>
                Recommencer
              </Button>
            </div>
          )}
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
      <h1 className="sr-only">Assistance client SINAPS — Discussion en direct</h1>
      <ChatHeader
        conversation={conversation}
        onEscalate={handleEscalate}
        onSwitchToIA={handleSwitchToIA}
        onClose={() => setSatisfactionOpen(true)}
        onLogout={handleReset}
      />
      <ChatThread 
        conversation={conversation} 
        onQuickReplyClick={handleQuickReplyClick}
        disabledQuickReplies={conversation.status === "resolu" || !!conversation.isTyping}
        loadingQuickReplyAction={loadingQuickReplyAction}
        dismissedQuickReplyId={dismissedQuickReplyId}
      />

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
          <MessageComposer onSend={handleSend} disabled={!!conversation.isTyping} inputRef={composerInputRef} />
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
