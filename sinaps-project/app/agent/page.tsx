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
  Inbox,
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
  // Track which conversation IDs have had their messages loaded to avoid duplicate requests
  const loadedConversationIdsRef = React.useRef<Set<string>>(new Set())

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
      // Preserve messages for conversations that have already been loaded to prevent Socket.IO from wiping them
      setConversations((prev) => {
        return relevant.map((c: any) => {
          // If this conversation has been loaded with messages, preserve them
          // Look up by existing state ID to ensure consistent matching
          const existing = prev.find((existing) => existing.id === c._id)
          if (existing && loadedConversationIdsRef.current.has(existing.id)) {
            return mapBackendConversation(c, existing.messages || [])
          }
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
          loadedConversationIdsRef.current.add(activeId)
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
  }, [currentAgentId])

  // Ensure active conversation always has its messages loaded
  // This handles: fresh login, manual selection, page refresh with activeId, conversation restoration
  React.useEffect(() => {
    if (!activeId) return

    // Only fetch if we haven't loaded this conversation's messages yet
    if (!loadedConversationIdsRef.current.has(activeId)) {
      fetchConversationById(activeId).then(({ conversation, messages }) => {
        const mapped = mapBackendConversation(conversation, messages)
        setConversations((prev) => prev.map((c) => (c.id === activeId ? mapped : c)))
        loadedConversationIdsRef.current.add(activeId)
      }).catch(() => {
        console.error("Failed to load conversation details for active conversation")
      })
    }
  }, [activeId])

  async function handleSelect(id: string) {
    setActiveId(id)
    try {
      // Authoritative direct fetch for conversation selection
      // This ensures the selected conversation always loads with its messages
      const { conversation, messages } = await fetchConversationById(id)
      const mapped = mapBackendConversation(conversation, messages)
      setConversations((prev) => prev.map((c) => (c.id === id ? mapped : c)))
      loadedConversationIdsRef.current.add(id)
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
        loadedConversationIdsRef.current.add(activeConversation.id)
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
      loadedConversationIdsRef.current.delete(activeConversation.id)
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
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chargement de l&apos;espace agent...
        </p>
      </div>
    )
  }

  return (
    <main className="h-dvh min-h-[560px] overflow-hidden bg-background p-2 sm:p-4">
      <section className="mx-auto grid h-full max-w-[1500px] animate-enter grid-rows-[minmax(0,210px)_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-card shadow-sm md:grid-cols-[280px_minmax(0,1fr)] md:grid-rows-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 min-w-0 flex-col border-b border-border bg-card md:border-b-0 md:border-r">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="/sinaps-logo-light.png"
                alt="SINAPS"
                className="h-6 w-auto object-contain dark:hidden"
              />
              <img
                src="/sinaps-logo-dark.png"
                alt="SINAPS"
                className="h-6 w-auto object-contain hidden dark:block"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">File de support</p>
                <p className="text-[10px] text-mint-foreground">Agent en ligne</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {conversations.length > 0 && (
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 border border-primary/20">
                  {conversations.length}
                </Badge>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Quitter"
                onClick={() => logout(router)}
              >
                <LogOutIcon />
              </Button>
            </div>
          </header>
          <div className="border-b border-border p-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground"/>
              <Input
                placeholder="Filtrer les demandes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-1 gap-1 overflow-x-auto p-2 md:block md:overflow-y-auto">
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
              filteredConversations.map((c, index) => {
                const isSelected = c.id === activeId
                const isWaiting = c.status === "en_attente"
                const isAssignedToMe = c.assignedAgent?.id === currentAgentId
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={`mb-1 min-w-[210px] rounded-md border p-3 text-left transition-colors md:w-full md:min-w-0 ${
                      isSelected
                        ? "border-primary/25 bg-primary/5"
                        : "border-transparent hover:bg-muted"
                    }`}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                      <span className="truncate text-xs font-bold">{c.clientName}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold ${
                          isWaiting
                            ? "bg-warning/20 text-warning-foreground"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {isWaiting ? "En attente" : "En cours"}
                        </span>
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
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {c.lastMessage || "Nouvelle demande reçue…"}
                    </p>
                    {c.assignedAgent && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Assigné à: {c.assignedAgent.name}
                      </p>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </aside>
        <main
          className={`${
            !activeId ? "hidden md:flex" : "flex"
          } min-w-0 flex-1 flex-col transition-all duration-200 bg-background`}
        >
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-3 sm:gap-3 sm:px-5">
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
                  <Avatar aria-label={`Avatar de ${activeConversation.clientName}`} className="size-9 rounded-xl ring-2 ring-primary/20 shadow-xs">
                    <AvatarImage src={activeConversation.clientAvatar || undefined} alt={`Avatar de ${activeConversation.clientName}`} className="rounded-xl object-cover" />
                    <AvatarFallback aria-label={`Avatar de ${activeConversation.clientName}`} className="rounded-xl bg-primary/10 text-primary font-bold text-xs">
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
                  className="h-9 shrink-0 rounded-md border border-border text-xs font-semibold shadow-none transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 active:scale-[0.98] dark:hover:text-emerald-400"
                >
                  <CheckIcon className="size-3.5 text-emerald-500" data-icon="inline-start" />
                  <span>Résoudre la demande</span>
                </Button>
              </div>

              <ChatThread conversation={activeConversation} />

              <div className="border-t border-border bg-background/70 px-3 py-2 sm:px-5">
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
      </section>
    </main>
    )
}

export default function AgentPage() {
  return (
    <AuthGuard requiredRole="agent">
      <AgentPageContent />
    </AuthGuard>
  )
}
