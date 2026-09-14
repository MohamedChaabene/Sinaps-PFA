"use client"

import { useRouter } from "next/navigation"
import {
  LogOutIcon,
  HeadsetIcon,
  CheckIcon,
  Zap,
  ChevronLeft,
  Loader2,
  SearchIcon,
  XIcon,
  Clock,
  Sparkles,
  Inbox,
  ShieldCheck,
  UserCheck
} from "lucide-react"
import { logout } from "@/components/auth-guard"
import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/chat/status-badge"
import { ChatThread } from "@/components/chat/chat-thread"
import { MessageComposer } from "@/components/chat/message-composer"
import { AuthGuard } from "@/components/auth-guard"
import { toast } from "sonner"
import type { Conversation } from "@/lib/chat-data"
import {
  fetchConversations,
  fetchConversationById,
  sendMessage as apiSendMessage,
  closeConversation as apiCloseConversation,
  assignConversation,
  mapBackendConversation,
  mapBackendMessage,
} from "@/lib/api"
import { getSocket } from "@/lib/socket"
import { getInitials } from "@/lib/utils"

function AgentPageContent() {
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const router = useRouter()
  const [currentAgentId, setCurrentAgentId] = React.useState<string | null>(null)

  // Track explicit user-initiated refreshes to skip redundant Socket.IO refreshes
  const explicitRefreshRef = React.useRef<Set<string>>(new Set())

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null

  // Get current agent ID from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("sinaps_agent")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.id) {
          setCurrentAgentId(parsed.id)
        }
      }
    } catch (error) {
      console.error("Failed to parse agent from localStorage:", error)
    }
  }, [])

  async function loadList() {
    // Guard: wait for agent ID to be initialized from localStorage
    // This prevents race condition where loadList() executes before currentAgentId is set
    if (!currentAgentId) {
      return
    }

    try {
      const data = await fetchConversations()
      // Show both waiting conversations AND conversations assigned to current agent
      const relevant = data.filter((c: any) => {
        const isWaiting = c.status === "en_attente"
        const isAssignedToMe = c.assignedAgent?._id === currentAgentId && c.status === "en_cours"
        return isWaiting || isAssignedToMe
      })
      // Always map fresh data - backend now provides proper plain object serialization
      // Message preservation was causing broken timestamps to persist from before the backend fix
      setConversations(() => {
        return relevant.map((c: any) => {
          return mapBackendConversation(c, [])
        })
      })
    } catch (error: any) {
      // Only show toast for genuine server errors, not auth failures (401)
      // AuthGuard handles authentication redirects, so 401 during initial load is expected
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.warn('Authentication error during load - AuthGuard will handle redirect')
      } else {
        toast("Erreur de connexion au serveur")
      }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadList()

    const socket = getSocket()
    const handleCreatedOrUpdated = () => {
      loadList()
      // Only refresh active conversation via Socket.IO if not being explicitly refreshed
      if (activeId && !explicitRefreshRef.current.has(activeId)) {
        fetchConversationById(activeId).then(({ conversation, messages }) => {
          const mapped = mapBackendConversation(conversation, messages)
          setConversations((prev) => prev.map((c) => (c.id === activeId ? mapped : c)))
        }).catch(() => {})
      }
    }

    socket.on("conversation_created", handleCreatedOrUpdated)
    socket.on("conversation_updated", handleCreatedOrUpdated)
    socket.on("message_received", handleCreatedOrUpdated)

    return () => {
      socket.off("conversation_created", handleCreatedOrUpdated)
      socket.off("conversation_updated", handleCreatedOrUpdated)
      socket.off("message_received", handleCreatedOrUpdated)
    }
  }, [activeId, currentAgentId])

  async function handleSelect(id: string) {
    setActiveId(id)
    try {
      // Authoritative direct fetch for conversation selection
      // This ensures the selected conversation always loads with its messages
      const { conversation, messages } = await fetchConversationById(id)
      const mapped = mapBackendConversation(conversation, messages)
      setConversations((prev) => prev.map((c) => (c.id === id ? mapped : c)))
    } catch (error) {
      toast("Erreur lors du chargement de la conversation")
    }
  }

  async function handleSend(text: string, attachments?: { url: string; type: string; name?: string }[]) {
    if (!activeConversation) return
    try {
      await apiSendMessage(activeConversation.id, "humain", text, attachments)
      // Authoritative direct fetch after message send
      // Mark as explicit refresh to prevent Socket.IO race condition
      explicitRefreshRef.current.add(activeConversation.id)
      try {
        const refreshed = await fetchConversationById(activeConversation.id)
        const mapped = mapBackendConversation(refreshed.conversation, refreshed.messages)
        setConversations((prev) => prev.map((c) => (c.id === activeConversation.id ? mapped : c)))
      } finally {
        // Delay removal to allow Socket.IO events to complete
        setTimeout(() => {
          explicitRefreshRef.current.delete(activeConversation.id)
        }, 500)
      }
    } catch (error) {
      toast("Erreur lors de l'envoi du message")
    }
  }

  async function handleResolve() {
    if (!activeConversation) return
    try {
      await apiCloseConversation(activeConversation.id, 0, "")
      toast.success("Demande marquée comme résolue ✅")
      setActiveId(null)
      loadList()
    } catch (error) {
      toast.error("Erreur lors de la clôture")
    }
  }

  async function handleTakeConversation(conversationId: string) {
    if (!currentAgentId) {
      toast.error("Impossible de récupérer votre identifiant d'agent")
      return
    }
    try {
      await assignConversation(conversationId, currentAgentId)
      toast.success("Conversation assignée ✅")
      loadList()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'assignation")
    }
  }

  const filteredConversations = conversations.filter((c) =>
    c.clientName.toLowerCase().includes(search.toLowerCase()) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chargement de l&apos;espace agent...
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar Ticket Queue */}
        <aside
          className={`${
            activeId ? "hidden md:flex" : "flex"
          } w-full md:w-84 shrink-0 border-r border-border/70 bg-card/60 backdrop-blur-sm flex-col transition-all duration-200`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-card/90">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <HeadsetIcon className="size-4" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-bold leading-tight">File de Support</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Agent en ligne</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {conversations.length > 0 && (
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 border border-primary/20">
                  {conversations.length}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => logout(router)}
                className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Se déconnecter"
                aria-label="Déconnexion"
              >
                <LogOutIcon className="size-4" />
              </Button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-border/60 bg-muted/20">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrer les demandes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs rounded-lg bg-background border-border/80 shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex flex-col flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground space-y-3 my-auto">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Inbox className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-sm">File d&apos;attente vide</p>
                  <p className="text-xs leading-relaxed text-muted-foreground max-w-xs mx-auto">
                    Toutes les demandes de support sont actuellement traitées.
                  </p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Aucune demande ne correspond à votre recherche.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.id === activeId
                const isWaiting = c.status === "en_attente"
                const isAssignedToMe = c.assignedAgent?.id === currentAgentId
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={`flex items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? "border-l-3 border-l-primary bg-primary/10 font-medium"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <Avatar className="size-9 shrink-0 rounded-xl ring-1 ring-primary/20 shadow-2xs">
                      <AvatarImage src={c.clientAvatar || "/placeholder.svg"} className="rounded-xl object-cover" />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(c.clientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex-1 min-w-0 truncate text-xs font-bold text-foreground">{c.clientName}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={c.status} />
                          {isWaiting && !isSelected && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTakeConversation(c.id)
                              }}
                              className="shrink-0 rounded-lg text-xs font-medium shadow-2xs"
                            >
                              Prendre
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="truncate text-xs text-muted-foreground mt-0.5 font-normal">
                        {c.lastMessage || "Nouvelle demande reçue..."}
                      </p>
                      {c.assignedAgent && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Assigné à: {c.assignedAgent.name}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Main Conversation Panel */}
        <main
          className={`${
            !activeId ? "hidden md:flex" : "flex"
          } min-w-0 flex-1 flex-col transition-all duration-200 bg-background`}
        >
          {activeConversation ? (
            <>
              {/* Active Ticket Header */}
              <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-card/85 backdrop-blur-md px-4 py-2.5 sm:px-6 shadow-xs">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setActiveId(null)}
                    className="md:hidden -ml-2 rounded-lg text-muted-foreground hover:text-foreground"
                    title="Retour à la file d'attente"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Avatar className="size-9 rounded-xl ring-2 ring-primary/20 shadow-xs">
                    <AvatarImage src={activeConversation.clientAvatar || "/placeholder.svg"} className="rounded-xl object-cover" />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xs">
                      {getInitials(activeConversation.clientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-bold text-foreground">{activeConversation.clientName}</span>
                      <StatusBadge status={activeConversation.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Demande en cours de prise en charge humaine</p>
                  </div>
                </div>

                <Button
                  onClick={handleResolve}
                  variant="secondary"
                  size="sm"
                  className="rounded-lg text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 transition-all duration-150 active:scale-[0.98] shadow-2xs border border-border/80"
                >
                  <CheckIcon className="size-3.5 text-emerald-500" data-icon="inline-start" />
                  <span>Résoudre la demande</span>
                </Button>
              </div>

              {/* Chat Thread */}
              <ChatThread conversation={activeConversation} />

              {/* Canned Responses Toolbar */}
              <div className="border-t border-border/60 bg-muted/25 px-4 py-2 sm:px-6">
                <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
                  <div className="flex items-center gap-1 font-semibold text-muted-foreground shrink-0 select-none">
                    <Zap className="size-3.5 text-amber-500" />
                    <span className="text-[11px] uppercase tracking-wider">Réponses rapides :</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 py-0.5">
                    {[
                      "Bonjour, je prends en charge votre demande immédiatement !",
                      "J'ai vérifié votre dossier, la situation est en cours de résolution.",
                      "Votre problème a été résolu. Restons à votre disposition !",
                    ].map((template, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(template)}
                        className="inline-flex items-center rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-[0.98] shadow-2xs"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message Composer */}
              <MessageComposer onSend={handleSend} />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-6 my-auto">
              <div className="rounded-2xl bg-muted/60 p-5 border border-border/70 shadow-xs">
                <HeadsetIcon className="size-10 text-primary/70" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">Aucune conversation active</p>
                <p className="max-w-sm text-xs text-muted-foreground leading-relaxed">
                  Sélectionnez un ticket dans la file d&apos;attente à gauche pour dialoguer avec le client.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    )
}

export default function AgentPage() {
  return (
    <AuthGuard requiredRole="agent">
      <AgentPageContent />
    </AuthGuard>
  )
}