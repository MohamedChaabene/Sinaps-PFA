"use client"

import { SearchIcon, History } from "lucide-react"
import { Input } from "@/components/ui/input"
import { fetchConversationsFiltered } from "@/lib/api"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { logout } from "@/components/auth-guard"
import { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart3, Check, ChevronDown, ClipboardList, LayoutDashboard, Menu, ShieldCheck, Users, X } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchAgents, approveAgent, rejectAgent, fetchStats } from "@/lib/api"

type Agent = { id: string; name: string; email: string; initials: string; skills: string[]; conversations: number; avatar: string }
type Stats = { total: number; resolvedByIA: number; resolvedByHuman: number; avgSatisfaction: string; avgResponseTimeSeconds: number }

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
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Chargement...</TableCell></TableRow>
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

function AdminSidebar({ active, onClose }: { active: string; onClose?: () => void }) {
  const router = useRouter()
  const items = [["overview", "Vue d'ensemble", LayoutDashboard], ["agents", "Agents", Users], ["history", "Historique", History], ["stats", "Statistiques", BarChart3]] as const
  return <aside className="flex h-full w-72 shrink-0 flex-col border-r bg-card px-5 py-6"><div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl bg-primary font-heading text-lg font-extrabold text-primary-foreground">S</div><span className="font-heading text-xl font-bold">Supportly</span></Link>{onClose && <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer"><X /></Button>}</div><Separator className="my-7" /><nav className="flex flex-col gap-2" aria-label="Navigation administration">{items.map(([id, label, Icon]) => <a key={id} href={`#${id}`} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${active === id ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-4" />{label}</a>)}</nav><div className="mt-auto rounded-2xl bg-secondary/60 p-4"><ShieldCheck className="mb-3 size-5 text-primary" /><p className="text-sm font-semibold">Espace sécurisé</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Gérez les accès de votre équipe support.</p><Button variant="outline" size="sm" onClick={() => logout(router)} className="mt-3 w-full justify-start gap-2"><LogOut className="size-4" />Déconnexion</Button></div></aside>
}

export function AdminDashboard() {
  const [pending, setPending] = useState<Agent[]>([])
  const [approved, setApproved] = useState<Agent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
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
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Chargement...</p></div>
  }

  return <div className="min-h-screen bg-background text-foreground"><div className="hidden min-h-screen md:flex"><AdminSidebar active="overview" /><AdminContent pending={pending} approved={approved} approve={approve} reject={reject} stats={stats} onMenu={() => setMobileOpen(true)} /></div><div className="flex min-h-screen flex-col md:hidden"><header className="flex h-16 items-center justify-between border-b bg-card px-4"><Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu"><Menu /></Button><span className="font-heading text-lg font-bold">Administration</span><div className="size-9 rounded-full bg-secondary" /></header><AdminContent pending={pending} approved={approved} approve={approve} reject={reject} stats={stats} onMenu={() => setMobileOpen(true)} /></div>{mobileOpen && <div className="fixed inset-0 z-50 flex md:hidden"><button className="flex-1 bg-foreground/20" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} /><AdminSidebar active="overview" onClose={() => setMobileOpen(false)} /></div>}</div>
}

function AdminContent({ pending, approved, approve, reject, stats }: { pending: Agent[]; approved: Agent[]; approve: (agent: Agent) => void; reject: (agent: Agent) => void; stats: Stats | null; onMenu?: () => void }) {
  const resolvedPct = stats && stats.total > 0 ? {
    ia: Math.round((stats.resolvedByIA / stats.total) * 100),
    human: Math.round((stats.resolvedByHuman / stats.total) * 100),
  } : { ia: 0, human: 0 }

  return <main className="min-w-0 flex-1 px-4 py-7 sm:px-8 lg:px-12 lg:py-10"><div className="mx-auto flex max-w-7xl flex-col gap-8"><div className="flex flex-col gap-1"><p className="text-sm font-semibold text-primary">Centre de contrôle</p><h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Vue d&apos;ensemble</h1><p className="text-sm leading-6 text-muted-foreground">Suivez votre équipe et gardez un œil sur la qualité du support.</p></div><section id="stats" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Stat title="Total conversations" value={String(stats?.total ?? 0)} detail="" /><Stat title="Résolu par IA" value={`${resolvedPct.ia} %`} detail="" /><Stat title="Résolu par agent" value={`${resolvedPct.human} %`} detail="" /><Stat title="Satisfaction moyenne" value={`${stats?.avgSatisfaction ?? 0} / 5`} detail="" /><Stat title="Temps de réponse moyen" value={formatDuration(stats?.avgResponseTimeSeconds ?? 0)} detail="" /></section><section id="agents" className="flex flex-col gap-4"><div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-heading text-2xl font-bold">Agents en attente de validation</h2><p className="text-sm leading-6 text-muted-foreground">Examinez les nouveaux profils avant leur activation.</p></div><Badge variant="outline" className="w-fit">{pending.length} en attente</Badge></div><Card><CardContent className="p-0">{pending.length ? <div className="divide-y">{pending.map((agent) => <div key={agent.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><AgentAvatar agent={agent} /><div className="min-w-0"><p className="truncate font-semibold">{agent.name}</p><p className="truncate text-sm text-muted-foreground">{agent.email}</p></div></div><SkillBadges skills={agent.skills} /><div className="flex gap-2"><Button size="sm" onClick={() => approve(agent)}><Check data-icon="inline-start" />Valider</Button><Button size="sm" variant="outline" onClick={() => reject(agent)}><X data-icon="inline-start" />Rejeter</Button></div></div>)}</div> : <div className="flex flex-col items-center gap-2 p-10 text-center"><ClipboardList className="size-8 text-muted-foreground" /><p className="font-semibold">Tout est à jour</p><p className="text-sm text-muted-foreground">Aucun agent en attente de validation.</p></div>}</CardContent></Card></section><section id="overview" className="flex flex-col gap-4"><div><h2 className="font-heading text-2xl font-bold">Agents validés</h2><p className="text-sm leading-6 text-muted-foreground">Les membres actifs de votre équipe support.</p></div><Card><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Compétences</TableHead><TableHead>Conversations</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader><TableBody>{approved.map((agent) => <TableRow key={agent.id}><TableCell><div className="flex items-center gap-3"><AgentAvatar agent={agent} /><div><p className="font-semibold">{agent.name}</p><p className="text-xs text-muted-foreground">{agent.email}</p></div></div></TableCell><TableCell><SkillBadges skills={agent.skills} /></TableCell><TableCell className="font-semibold">{agent.conversations}</TableCell><TableCell><Badge className="bg-success text-success-foreground hover:bg-success">Actif</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></section><ConversationHistory /></div></main>
}
function Stat({ title, value, detail }: { title: string; value: string; detail: string }) { return <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><ChevronDown className="size-4 rotate-[-45deg] text-primary" /></CardHeader><CardContent><p className="font-heading text-3xl font-bold">{value}</p>{detail && <p className="mt-2 text-xs text-success">{detail}</p>}</CardContent></Card> }