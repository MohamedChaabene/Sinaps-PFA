"use client"

/**
 * conversation-history.tsx — Conversation history section for the admin dashboard.
 *
 * Fetches and displays all conversations with search and status filtering.
 * Self-contained: manages its own data loading and filter state.
 */

import { useState, useEffect } from "react"
import { Bot, Loader2, SearchIcon, Star, UserCheck, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/chat/status-badge"
import { fetchConversationsFiltered } from "@/lib/api"
import { getInitials } from "@/lib/utils"
import { toast } from "sonner"

export function ConversationHistory() {
  const [conversations, setConversations] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchConversationsFiltered(statusFilter, search)
      setConversations(data)
    } catch {
      toast.error("Erreur lors du chargement de l'historique")
    } finally {
      setLoading(false)
    }
  }

  // Debounce filter changes so we don't fire a request on every keystroke
  useEffect(() => {
    const timeout = setTimeout(load, 300)
    return () => clearTimeout(timeout)
  }, [statusFilter, search])

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
            placeholder="Rechercher par client, email..."
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-14 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="font-medium text-xs">Chargement de l&apos;historique...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : conversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-14 text-center text-sm text-muted-foreground">
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
                          <Avatar className="size-8.5 rounded-lg ring-1 ring-primary/20 shrink-0">
                            <AvatarImage src={c.client?.avatar || "/placeholder.svg"} className="rounded-lg" />
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                              {getInitials(c.client?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-xs sm:text-sm text-foreground">
                              {c.client?.name || "Client inconnu"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{c.client?.email || "—"}</p>
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
                            {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(c.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
