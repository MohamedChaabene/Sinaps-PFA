"use client"

import { SearchIcon, History } from "lucide-react"
import { Input } from "@/components/ui/input"
import { fetchConversationsFiltered } from "@/lib/api"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { logout } from "@/components/auth-guard"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Users,
  X,
  MessageSquare,
  Bot,
  UserCheck,
  Star,
  Clock,
  Loader2,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchAgents, approveAgent, rejectAgent, fetchStats } from "@/lib/api"
import type { Agent, Stats } from "@/lib/types"

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

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
    initials: initials(a.name),
    skills: a.skills || [],
    conversations: 0,
    avatar: "",
  }
}

function AgentAvatar({ agent }: { agent: Agent }) { return <Avatar className="size-10"><AvatarImage src={agent.avatar || "/placeholder.svg"} alt={`Avatar de ${agent.name}`} /><AvatarFallback>{agent.initials}</AvatarFallback></Avatar> }
function SkillBadges({ skills }: { skills: string[] }) { return <div className="flex flex-wrap gap-1.5">{skills.map((skill) => <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>)}</div> }

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

  const statusLabels: Record<string, string> = {
    en_cours: "En cours",
    en_attente: "En attente",
    resolu: "Résolu",
  }

  return (
    <section id="history" className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-bold">Historique des demandes</h2>
        <p className="text-sm leading-6 text-muted-foreground">Consultez et filtrez toutes les conversations.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="en_cours">En cours</option>
          <option value="en_attente">En attente</option>
          <option value="resolu">Résolu</option>
        </select>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Traité par</TableHead>
                <TableHead>Satisfaction</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-5 animate-spin text-primary" />
                      <span>Chargement de l'historique...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : conversations.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Aucune conversation trouvée.</TableCell></TableRow>
              ) : (
                conversations.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{c.client?.name || "Client"}</p>
                        <p className="text-xs text-muted-foreground">{c.client?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{statusLabels[c.status] || c.status}</Badge></TableCell>
                    <TableCell className="capitalize">{c.handledBy === "ia" ? "Agent IA" : "Agent humain"}</TableCell>
                    <TableCell>{c.satisfaction?.rating ? `${c.satisfaction.rating} / 5` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                  </TableRow>
                ))
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
        isCollapsed ? "w-20 px-3 py-6" : "w-64 px-5 py-6"
      }`}
    >
      {/* Brand & Toggle Header */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Sinaps Support"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-lg font-extrabold text-primary-foreground shadow-xs">
            S
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate font-heading text-base font-bold tracking-tight text-foreground">
                Sinaps Support
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Administration
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="size-5" />
          </Button>
        )}

        {/* Desktop & Tablet Collapse Toggle Button */}
        {onToggleCollapse && !onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Développer le menu" : "Réduire le menu"}
            title={isCollapsed ? "Développer" : "Réduire"}
            className="hidden md:flex text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isCollapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        )}
      </div>

      <Separator className="my-6" />

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
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isCollapsed ? "justify-center px-0" : ""
              } ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon
                className={`size-4.5 shrink-0 transition-transform duration-200 ${
                  isActive ? "text-primary scale-110" : "group-hover:scale-105"
                }`}
              />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </a>
          )
        })}
      </nav>

      {/* Footer Area: Security Badge & Logout */}
      <div className="mt-auto flex flex-col gap-3">
        {!isCollapsed ? (
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-4.5" />
              <p className="text-xs font-bold uppercase tracking-wider">Espace sécurisé</p>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Gérez les accès de votre équipe et surveillez le support.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout(router)}
              className="mt-3 w-full justify-start gap-2 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 focus-visible:ring-2 focus-visible:ring-destructive"
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
              className="size-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive"
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
}: {
  pending: Agent[]
  approved: Agent[]
  approve: (agent: Agent) => void
  reject: (agent: Agent) => void
  stats: Stats | null
}) {
  const resolvedPct = stats && stats.total > 0 ? {
    ia: Math.round((stats.resolvedByIA / stats.total) * 100),
    human: Math.round((stats.resolvedByHuman / stats.total) * 100),
  } : { ia: 0, human: 0 }

  return (
    <main className="min-w-0 flex-1 px-4 py-7 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-primary">Centre de contrôle</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Vue d&apos;ensemble</h1>
          <p className="text-sm leading-6 text-muted-foreground">Suivez votre équipe et gardez un œil sur la qualité du support.</p>
        </div>

        <section id="stats" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 scroll-mt-10">
          <EnhancedStatCard title="Total conversations" value={String(stats?.total ?? 0)} icon={MessageSquare} subtitle="Tickets enregistrés" color="primary" />
          <EnhancedStatCard title="Résolu par IA" value={`${resolvedPct.ia} %`} icon={Bot} progress={resolvedPct.ia} subtitle="Autonome (RAG + Gemini)" color="violet" />
          <EnhancedStatCard title="Résolu par agent" value={`${resolvedPct.human} %`} icon={UserCheck} progress={resolvedPct.human} subtitle="Escalade humaine" color="blue" />
          <EnhancedStatCard title="Satisfaction client" value={`${stats?.avgSatisfaction ?? 0} / 5`} icon={Star} progress={(Number(stats?.avgSatisfaction ?? 0) / 5) * 100} subtitle="Moyenne des avis" color="amber" />
          <EnhancedStatCard title="Temps de réponse" value={formatDuration(stats?.avgResponseTimeSeconds ?? 0)} icon={Clock} subtitle="Délai moyen SLA" color="emerald" />
        </section>

        <section id="agents" className="flex flex-col gap-4 scroll-mt-10">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold">Agents en attente de validation</h2>
              <p className="text-sm leading-6 text-muted-foreground">Examinez les nouveaux profils avant leur activation.</p>
            </div>
            <Badge variant="outline" className="w-fit">{pending.length} en attente</Badge>
          </div>
          <Card>
            <CardContent className="p-0">
              {pending.length ? (
                <div className="divide-y divide-border">
                  {pending.map((agent) => (
                    <div key={agent.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-3">
                        <AgentAvatar agent={agent} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{agent.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                      <SkillBadges skills={agent.skills} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approve(agent)} className="focus-visible:ring-2 focus-visible:ring-primary">
                          <Check data-icon="inline-start" />Valider
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reject(agent)} className="focus-visible:ring-2 focus-visible:ring-destructive">
                          <X data-icon="inline-start" />Rejeter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 p-10 text-center">
                  <ClipboardList className="size-8 text-muted-foreground" />
                  <p className="font-semibold">Tout est à jour</p>
                  <p className="text-sm text-muted-foreground">Aucun agent en attente de validation.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section id="overview" className="flex flex-col gap-4 scroll-mt-10">
          <div>
            <h2 className="font-heading text-2xl font-bold">Agents validés</h2>
            <p className="text-sm leading-6 text-muted-foreground">Les membres actifs de votre équipe support.</p>
          </div>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Compétences</TableHead>
                    <TableHead>Conversations</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approved.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                        Aucun agent validé pour le moment.
                      </TableCell>
                    </TableRow>
                  ) : (
                    approved.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <AgentAvatar agent={agent} />
                            <div>
                              <p className="font-semibold">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><SkillBadges skills={agent.skills} /></TableCell>
                        <TableCell className="font-semibold">{agent.conversations}</TableCell>
                        <TableCell><Badge className="bg-success text-success-foreground hover:bg-success">Actif</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

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
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    violet: "text-purple-500 bg-purple-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    blue: "text-blue-500 bg-blue-500/10",
  }

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className={`flex size-8 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-heading text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
        {progress !== undefined ? (
          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        ) : (
          subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}