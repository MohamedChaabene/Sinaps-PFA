"use client"

import {
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  SearchIcon,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { fetchConversationsFiltered } from "@/lib/api"
import { useRouter } from "next/navigation"
import { logout } from "@/components/auth-guard"
import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchAgents, approveAgent, rejectAgent, fetchStats } from "@/lib/api"
import { getInitials } from "@/lib/utils"
import { StatusBadge } from "@/components/chat/status-badge"
import type { Agent, Stats } from "@/lib/types"

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}min ${remainingSeconds}s`
}

function mapAgent(a: any): Agent {
  return {
    id: a._id,
    name: a.name,
    email: a.email,
    initials: getInitials(a.name),
    skills: a.skills || [],
    conversations: 0,
    avatar: "",
  }
}

function AgentAvatar({ agent }: { agent: Agent }) {
  return (
    <Avatar className="size-10 rounded-xl ring-2 ring-primary/20">
      <AvatarImage src={agent.avatar || "/placeholder.svg"} alt={`Avatar de ${agent.name}`} className="rounded-xl" />
      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-xs">{agent.initials}</AvatarFallback>
    </Avatar>
  )
}

function SkillBadges({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <Badge key={skill} variant="secondary" className="font-normal rounded-md border border-border/60">
          {skill}
        </Badge>
      ))}
    </div>
  )
}

function ConversationHistory() {
  const [conversations, setConversations] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchConversationsFiltered(statusFilter, search)
      setConversations(data)
    } catch (error) {
      toast.error("Erreur lors du chargement de l'historique")
    } finally {
      setLoading(false)
    }
  }

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

      {/* Search and Quick Filters Bar */}
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

      {/* Table Container */}
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
                          onClick={() => {
                            setSearch("")
                            setStatusFilter("")
                          }}
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
                                  className={`size-3 ${
                                    star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                                  }`}
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
                            {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
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

function AdminSidebar({
  active,
  setActive,
  isCollapsed = false,
  onToggleCollapse,
  onClose,
}: {
  active: string
  setActive?: (tab: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
}) {
  const router = useRouter()
  const items = [
    ["stats", "Statistiques", BarChart3],
    ["agents", "En attente", ClipboardList],
    ["overview", "Agents validés", Users],
    ["history", "Historique", History],
  ] as const

  const handleNavClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (setActive) setActive(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    if (onClose) onClose()
  }

  return (
    <aside
      className={`flex h-full flex-col border-r border-border bg-card transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20 px-3 py-5" : "w-64 px-5 py-6"
      }`}
    >
      {/* Brand & Toggle Header */}
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-3 pb-4">
          <Link
            href="/"
            className="flex size-10 items-center justify-center rounded-xl bg-primary font-heading text-lg font-extrabold text-primary-foreground shadow-xs transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Sinaps Support"
          >
            S
          </Link>
          {onToggleCollapse && !onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapse}
              aria-label="Développer le menu"
              title="Développer le menu"
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <PanelLeft className="size-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 pb-2">
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Sinaps Support"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-lg font-extrabold text-primary-foreground shadow-xs">
              S
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate font-heading text-base font-bold tracking-tight text-foreground">
                Sinaps Support
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Administration
              </span>
            </div>
          </Link>

          {onClose ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Fermer le menu"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="size-5" />
            </Button>
          ) : (
            onToggleCollapse && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleCollapse}
                aria-label="Réduire le menu"
                title="Réduire le menu"
                className="hidden md:flex size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            )
          )}
        </div>
      )}

      <Separator className="my-4" />

      {/* Navigation list */}
      <nav className="flex flex-col gap-1.5" aria-label="Navigation administration">
        {items.map(([id, label, Icon]) => {
          const isActive = active === id
          return (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => handleNavClick(id, e)}
              title={label}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isCollapsed ? "justify-center px-0 size-10 mx-auto" : ""
              } ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold shadow-2xs border-l-2 border-l-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon
                className={`size-4.5 shrink-0 transition-transform duration-150 ${
                  isActive ? "text-primary scale-105" : "group-hover:scale-105"
                }`}
              />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </a>
          )
        })}
      </nav>

      {/* Footer Area: Security Badge & Logout */}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {!isCollapsed ? (
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-4" />
              <p className="text-[11px] font-bold uppercase tracking-wider">Espace sécurisé</p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Accès restreint aux administrateurs Sinaps.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout(router)}
              className="mt-3 w-full justify-start gap-2 text-xs font-semibold rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 focus-visible:ring-2 focus-visible:ring-destructive transition-colors"
            >
              <LogOut className="size-3.5" />
              Déconnexion
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout(router)}
              title="Déconnexion"
              aria-label="Déconnexion"
              className="size-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive transition-colors"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}

export function AdminDashboard() {
  const [pending, setPending] = useState<Agent[]>([])
  const [approved, setApproved] = useState<Agent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<string>("stats")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const [agentsData, statsData] = await Promise.all([fetchAgents(), fetchStats()])
      const mapped = agentsData.map(mapAgent)
      setPending(mapped.filter((_: Agent, i: number) => agentsData[i].status === "pending"))
      setApproved(mapped.filter((_: Agent, i: number) => agentsData[i].status === "approved"))
      setStats(statsData)
    } catch (error) {
      toast.error("Erreur de chargement des données")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function approve(agent: Agent) {
    try {
      await approveAgent(agent.id)
      setPending((items) => items.filter((item) => item.id !== agent.id))
      setApproved((items) => [...items, { ...agent, conversations: 0 }])
      toast.success(`${agent.name} a été validé`)
    } catch (error) {
      toast.error("Erreur lors de la validation")
    }
  }

  async function reject(agent: Agent) {
    try {
      await rejectAgent(agent.id)
      setPending((items) => items.filter((item) => item.id !== agent.id))
      toast(`${agent.name} a été rejeté`)
    } catch (error) {
      toast.error("Erreur lors du rejet")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Chargement du tableau de bord...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop / Tablet View */}
      <div className="hidden min-h-screen md:flex">
        <div className="sticky top-0 h-screen shrink-0">
          <AdminSidebar
            active={activeTab}
            setActive={setActiveTab}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          />
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto">
          <AdminContent
            pending={pending}
            approved={approved}
            approve={approve}
            reject={reject}
            stats={stats}
            onRefresh={loadData}
            refreshing={loading}
          />
        </div>
      </div>

      {/* Mobile View */}
      <div className="flex min-h-screen flex-col md:hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/95 backdrop-blur-xs px-4 shadow-xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary font-heading text-xs font-bold text-primary-foreground">
              S
            </div>
            <span className="font-heading text-base font-bold">Sinaps Admin</span>
          </div>
          <div className="size-9" />
        </header>

        <div className="min-w-0 flex-1">
          <AdminContent
            pending={pending}
            approved={approved}
            approve={approve}
            reject={reject}
            stats={stats}
            onRefresh={loadData}
            refreshing={loading}
          />
        </div>
      </div>

      {/* Mobile Slide-in Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity duration-300"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-1 flex-col shadow-2xl">
            <AdminSidebar
              active={activeTab}
              setActive={setActiveTab}
              isCollapsed={false}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function AdminContent({
  pending,
  approved,
  approve,
  reject,
  stats,
  onRefresh,
  refreshing,
}: {
  pending: Agent[]
  approved: Agent[]
  approve: (agent: Agent) => void
  reject: (agent: Agent) => void
  stats: Stats | null
  onRefresh?: () => void
  refreshing?: boolean
}) {
  const resolvedPct = stats && stats.total > 0 ? {
    ia: Math.round((stats.resolvedByIA / stats.total) * 100),
    human: Math.round((stats.resolvedByHuman / stats.total) * 100),
  } : { ia: 0, human: 0 }

  return (
    <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Top Header Banner */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Centre de contrôle</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Opérationnel
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Vue d&apos;ensemble
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Supervisez votre équipe support, suivez les KPI et examinez les demandes clients.
            </p>
          </div>

          {onRefresh && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="rounded-lg text-xs font-medium gap-1.5 shadow-2xs hover:bg-muted"
                title="Actualiser les données"
              >
                <Loader2 className={`size-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
                <span>Actualiser</span>
              </Button>
            </div>
          )}
        </div>

        {/* KPI Stats Grid */}
        <section id="stats" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 scroll-mt-6">
          <EnhancedStatCard
            title="Total conversations"
            value={String(stats?.total ?? 0)}
            icon={MessageSquare}
            subtitle="Tickets enregistrés"
            color="primary"
          />
          <EnhancedStatCard
            title="Résolu par IA"
            value={`${resolvedPct.ia} %`}
            icon={Bot}
            progress={resolvedPct.ia}
            subtitle="Autonome (RAG + Gemini)"
            color="violet"
          />
          <EnhancedStatCard
            title="Résolu par agent"
            value={`${resolvedPct.human} %`}
            icon={UserCheck}
            progress={resolvedPct.human}
            subtitle="Escalade humaine"
            color="blue"
          />
          <EnhancedStatCard
            title="Satisfaction client"
            value={`${stats?.avgSatisfaction ?? 0} / 5`}
            icon={Star}
            progress={(Number(stats?.avgSatisfaction ?? 0) / 5) * 100}
            subtitle="Moyenne des avis"
            color="amber"
          />
          <EnhancedStatCard
            title="Temps de réponse"
            value={formatDuration(stats?.avgResponseTimeSeconds ?? 0)}
            icon={Clock}
            subtitle="Délai moyen SLA"
            color="emerald"
          />
        </section>

        {/* Pending Agents Section */}
        <section id="agents" className="flex flex-col gap-4 scroll-mt-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Agents en attente de validation
                </h2>
                <Badge
                  variant="outline"
                  className={`rounded-md font-semibold text-xs px-2 ${
                    pending.length > 0
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {pending.length > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {pending.length} en attente
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3 text-emerald-500" />
                      À jour
                    </span>
                  )}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground mt-0.5">
                Examinez et approuvez les nouveaux profils d&apos;agents avant leur mise en service.
              </p>
            </div>
          </div>

          <Card className="border border-border/80 bg-card shadow-xs overflow-hidden rounded-xl">
            <CardContent className="p-0">
              {pending.length ? (
                <div className="divide-y divide-border/60">
                  {pending.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <AgentAvatar agent={agent} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-sm text-foreground">{agent.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium hidden lg:inline">Compétences :</span>
                        <SkillBadges skills={agent.skills} />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => approve(agent)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5 shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <Check className="size-3.5" />
                          <span>Valider</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reject(agent)}
                          className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60 font-medium text-xs gap-1.5 focus-visible:ring-2 focus-visible:ring-destructive"
                        >
                          <X className="size-3.5" />
                          <span>Rejeter</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2.5 p-10 text-center">
                  <div className="rounded-xl bg-emerald-500/10 text-emerald-500 p-3">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">Toutes les demandes sont traitées</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Aucun nouvel agent en attente de validation pour le moment.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Validated Agents Section */}
        <section id="overview" className="flex flex-col gap-4 scroll-mt-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Agents validés
                </h2>
                <Badge variant="secondary" className="rounded-md border border-border/70 font-semibold px-2">
                  {approved.length} actif{approved.length > 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground mt-0.5">
                Membres actifs de votre équipe support habilités à répondre aux clients.
              </p>
            </div>
          </div>

          <Card className="border border-border/80 bg-card shadow-xs overflow-hidden rounded-xl">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-b border-border/70 hover:bg-transparent">
                    <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Agent</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Domaines de compétences</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Conversations</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approved.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="size-6 text-muted-foreground/60" />
                          <p className="font-medium text-xs">Aucun agent validé pour le moment.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    approved.map((agent) => (
                      <TableRow key={agent.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <AgentAvatar agent={agent} />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <SkillBadges skills={agent.skills} />
                        </TableCell>
                        <TableCell className="py-3 px-4 font-semibold text-sm">
                          <Badge variant="secondary" className="rounded-md font-mono text-xs">
                            {agent.conversations}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md font-semibold hover:bg-emerald-500/15 gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Actif
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Conversation History Section */}
        <ConversationHistory />
      </div>
    </main>
  )
}

function EnhancedStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  color = "primary",
}: {
  title: string
  value: string
  subtitle?: string
  icon: any
  progress?: number
  color?: "primary" | "emerald" | "violet" | "amber" | "blue"
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    violet: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  }

  const barColorMap = {
    primary: "bg-primary",
    emerald: "bg-emerald-500",
    violet: "bg-purple-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
  }

  return (
    <Card className="relative overflow-hidden rounded-xl border border-border/80 bg-card/90 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className={`flex size-8 items-center justify-center rounded-lg border ${colorMap[color]} shadow-2xs`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4">
        <p className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
        {progress !== undefined ? (
          <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
              <div
                className={`h-full rounded-full ${barColorMap[color]} transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            {subtitle && <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>}
          </div>
        ) : (
          subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}