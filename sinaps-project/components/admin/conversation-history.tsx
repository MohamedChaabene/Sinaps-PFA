"use client"

/**
 * conversation-history.tsx — Conversation history section for the admin dashboard.
 *
 * Fetches and displays all conversations with search and status filtering.
 * Self-contained: manages its own data loading and filter state.
 */

import { useState, useEffect } from "react"
import { Bot, Loader2, SearchIcon, Star, UserCheck, X, MessageSquare, XCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/chat/status-badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fetchConversationsFiltered, fetchConversationById } from "@/lib/api"
import { getInitials, formatTimestamp, formatTime, getClientAvatar } from "@/lib/utils"
import { toast } from "sonner"

export function ConversationHistory() {
  const [conversations, setConversations] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")
  const [includeTestData, setIncludeTestData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchConversationsFiltered(statusFilter, search, includeTestData ? 'true' : undefined)
      setConversations(data)
    } catch (error: any) {
      // Only show toast for genuine server errors, not auth failures (401)
      // AuthGuard handles authentication redirects, so 401 during initial load is expected
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.warn('Authentication error during load - AuthGuard will handle redirect')
      } else {
        toast.error("Erreur lors du chargement de l'historique")
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadConversationDetail(conversationId: string) {
    setDetailLoading(true)
    try {
      const { conversation, messages } = await fetchConversationById(conversationId)
      setSelectedConversation({ conversation, messages })
    } catch (error: any) {
      toast.error("Erreur lors du chargement de la conversation")
    } finally {
      setDetailLoading(false)
    }
  }

  // Debounce filter changes so we don't fire a request on every keystroke
  useEffect(() => {
    const timeout = setTimeout(load, 300)
    return () => clearTimeout(timeout)
  }, [statusFilter, search, includeTestData])

  const filterTabs = [
    { value: "", label: "Toutes", count: conversations.length },
    { value: "en_cours", label: "En cours" },
    { value: "en_attente", label: "En attente" },
    { value: "resolu", label: "Résolues" },
  ]

  return (
    <section id="history" className="flex flex-col gap-5 scroll-mt-6">
      {/* Section header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Historique des demandes
            </h2>
            <Badge variant="secondary" className="rounded-md border border-border/70 font-semibold px-2">
              {conversations.length}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground mt-0.5">
            Consultez, filtrez et analysez toutes les conversations support.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="w-fit rounded-lg border-border/80 text-xs font-medium gap-1.5 shadow-2xs hover:bg-muted"
          title="Actualiser la liste"
        >
          <Loader2 className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            placeholder="Rechercher par client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-9 rounded-lg border-border/80 bg-card text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {filterTabs.map((tab) => {
            const isSelected = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all shadow-2xs ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.value === "en_cours" && (
                  <span className={`size-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary animate-pulse"}`} />
                )}
                {tab.value === "en_attente" && (
                  <span className={`size-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-amber-500"}`} />
                )}
                {tab.value === "resolu" && (
                  <span className={`size-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-emerald-500"}`} />
                )}
                <span>{tab.label}</span>
              </button>
            )
          })}
          
          <div className="w-px h-6 bg-border/60 mx-1" />
          
          <button
            type="button"
            onClick={() => setIncludeTestData(!includeTestData)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all shadow-2xs ${
              includeTestData
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title="Inclure les données de test"
          >
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span className="hidden sm:inline">Données test</span>
            <span className="sm:hidden">Test</span>
          </button>
        </div>
      </div>

      {/* Conversations table */}
      <Card className="border border-border/80 bg-card shadow-xs overflow-hidden rounded-xl">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b border-border/70 hover:bg-transparent">
                <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Client</TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut</TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Traité par</TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Satisfaction</TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="font-medium text-xs">Chargement de l&apos;historique...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : conversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="rounded-xl bg-muted/60 p-3 text-muted-foreground">
                        <SearchIcon className="size-6 text-muted-foreground/60" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">Aucune conversation trouvée</p>
                      <p className="text-xs text-muted-foreground">
                        {search || statusFilter
                          ? "Aucun résultat ne correspond à vos critères de recherche."
                          : "Aucune conversation n'a encore été enregistrée."}
                      </p>
                      {(search || statusFilter) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSearch(""); setStatusFilter("") }}
                          className="mt-2 rounded-lg text-xs"
                        >
                          Effacer les filtres
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                conversations.map((c) => {
                  const rating = c.satisfaction?.rating
                  const isIA = c.handledBy === "ia"

                  return (
                    <TableRow key={c._id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar aria-label={`Avatar de ${c.client?.name || "Client"}`} className="size-8.5 rounded-lg ring-1 ring-primary/20 shrink-0">
                            <AvatarImage
                              src={getClientAvatar(c.client?.avatar, c.client)}
                              alt={`Avatar de ${c.client?.name || "Client"}`}
                              className="rounded-lg object-cover"
                            />
                            <AvatarFallback
                              aria-label={`Avatar de ${c.client?.name || "Client"}`}
                              className="rounded-lg bg-primary/10 text-primary font-semibold text-xs"
                            >
                              {getInitials(c.client?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-xs sm:text-sm text-foreground">
                              {c.client?.name || "Client inconnu"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <StatusBadge status={c.status} />
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {isIA ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                            <Bot className="size-3 text-purple-500 shrink-0" />
                            <span>Agent IA</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                            <UserCheck className="size-3 text-blue-500 shrink-0" />
                            <span className="truncate max-w-[120px]">{c.assignedAgent?.name || "Humain"}</span>
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {rating ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`size-3 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-foreground">{rating}/5</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div>
                          <p className="font-medium text-foreground">
                            {formatTimestamp(c.createdAt, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatTime(c.createdAt, { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadConversationDetail(c._id)}
                          className="h-8 px-2 rounded-lg text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                          aria-label={`Voir la conversation de ${c.client?.name || 'client inconnu'}`}
                        >
                          <MessageSquare className="size-3.5 mr-1.5" />
                          <span className="hidden sm:inline">Voir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={(open) => !open && setSelectedConversation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <Avatar aria-label={`Avatar de ${selectedConversation?.conversation.client?.name || "Client"}`} className="size-8 rounded-lg">
                  <AvatarImage
                    src={getClientAvatar(selectedConversation?.conversation.client?.avatar, selectedConversation?.conversation.client)}
                    alt={`Avatar de ${selectedConversation?.conversation.client?.name || "Client"}`}
                    className="rounded-lg object-cover"
                  />
                  <AvatarFallback aria-label={`Avatar de ${selectedConversation?.conversation.client?.name || "Client"}`} className="rounded-lg bg-primary/10 text-primary">
                    {getInitials(selectedConversation?.conversation.client?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{selectedConversation?.conversation.client?.name || "Client inconnu"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation?.conversation.status} • {selectedConversation?.conversation.handledBy === 'ia' ? 'IA' : 'Humain'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedConversation(null)}
                className="ml-auto"
              >
                <XCircle className="size-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : selectedConversation?.messages ? (
              <div className="space-y-4">
                {selectedConversation.messages.map((msg: any, idx: number) => (
                  <div
                    key={msg._id || idx}
                    className={`flex gap-3 ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender !== 'client' && (
                      <Avatar className="size-8 rounded-lg shrink-0">
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                          {msg.sender === 'ia' ? 'IA' : getInitials(msg.authorName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.sender === 'client'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {formatTime(msg.createdAt, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-12">Aucun message disponible</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
