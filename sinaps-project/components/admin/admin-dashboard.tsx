"use client"

/**
 * admin-dashboard.tsx — Admin dashboard layout and data orchestrator.
 *
 * Responsibilities:
 * - Fetches agent list and stats on mount
 * - Manages approve/reject actions and optimistic local state updates
 * - Renders the responsive layout (collapsible sidebar + main content)
 * - Composes the sub-sections from their dedicated components
 *
 * Section components (each owns its own UI and display logic):
 * - StatsPanel           → components/admin/stats-panel.tsx
 * - PendingAgentsSection → components/admin/agent-table.tsx
 * - ValidatedAgentsSection → components/admin/agent-table.tsx
 * - ConversationHistory  → components/admin/conversation-history.tsx
 */

import {
  BarChart3,
  CheckCircle2,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { logout } from "@/components/auth-guard"
import { fetchAgents, approveAgent, rejectAgent, fetchStats } from "@/lib/api"
import { ConversationHistory } from "@/components/admin/conversation-history"
import type { Agent, Stats } from "@/lib/types"
import { getInitials } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Data mapping helper
// ---------------------------------------------------------------------------

function mapAgent(a: any): Agent {
  return {
    id: a._id,
    name: a.name,
    email: a.email,
    initials: getInitials(a.name),
    skills: a.skills || [],
    conversations: 0,
    avatar: "",
    status: a.status,
    role: a.role,
  }
}

// ---------------------------------------------------------------------------
// Main content area
// ---------------------------------------------------------------------------

function AdminContent({
  pending,
  approved,
  stats,
  onApprove,
  onReject,
  onRefresh,
  refreshing,
}: {
  pending: Agent[]
  approved: Agent[]
  stats: Stats | null
  onApprove: (agent: Agent) => void
  onReject: (agent: Agent) => void
  onRefresh?: () => void
  refreshing?: boolean
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7 lg:gap-9">
      <header id="overview" className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-border pb-7 sm:gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-bold uppercase text-primary">Centre de contrôle</p>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">Vue d'ensemble</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Consultez les agents et demandes disponibles dans cet aperçu.</p>
        </div>
        <Button variant="outline" size="sm" disabled aria-label="Actualiser" onClick={onRefresh}>
          <RefreshCw/>
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
      </header>
      <section id="stats" className="scroll-mt-24 py-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Statistiques</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Conversations", stats?.total ?? "—", "Données du service"],
            ["Demandes résolues", stats ? stats.resolvedByIA + stats.resolvedByHuman : "—", "Données du service"],
            ["Agents actifs", approved.length, "Agents validés"],
            ["Temps moyen de réponse", stats ? `${stats.avgResponseTimeSeconds} s` : "—", "Données du service"],
          ].map(([label,value,note]) => (
            <article key={label} className="rounded-lg border border-border bg-card p-5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
              <p className="mt-3 text-3xl font-bold">{value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{note}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="agents" className="scroll-mt-24 py-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold">Agents en attente de validation</h2>
          <p className="mt-1 text-xs text-muted-foreground">Les approbations ne sont pas disponibles sans connexion au service d'administration.</p>
        </div>
        <div className="grid min-h-36 place-items-center rounded-lg border border-border bg-card p-8 text-center">
          <div>
            <CheckCircle2 className="mx-auto size-7 text-mint-foreground"/>
            <p className="mt-3 text-sm font-bold">Aucune demande chargée</p>
            <p className="mt-1 text-xs text-muted-foreground">État inconnu — aucune API connectée.</p>
          </div>
        </div>
      </section>
      <section id="validated" className="scroll-mt-24 py-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Agents validés</h2>
            <p className="mt-1 text-xs text-muted-foreground">Exemples visuels, sans données personnelles réelles.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="hidden grid-cols-[1.3fr_1fr_120px] bg-muted px-5 py-3 text-[10px] font-bold uppercase text-muted-foreground sm:grid">
            <span>Agent</span>
            <span>Compétences</span>
            <span>Statut</span>
          </div>
          {approved.map((agent) => (
            <div key={agent.id} className="grid gap-2 border-t border-border px-5 py-4 first:border-t-0 sm:grid-cols-[1.3fr_1fr_120px] sm:items-center">
              <span className="text-sm font-bold">{agent.name}</span>
              <span className="text-xs text-muted-foreground">{agent.skills.join(", ")}</span>
              <span className="w-fit rounded-sm bg-mint/15 px-2 py-1 text-[10px] font-bold text-mint-foreground">{agent.status}</span>
            </div>
          ))}
        </div>
      </section>
      <section id="history" className="scroll-mt-24 py-7">
        <ConversationHistory />
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------

export function AdminDashboard() {
  const router = useRouter()
  const [pending, setPending] = useState<Agent[]>([])
  const [approved, setApproved] = useState<Agent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const [agentsData, statsData] = await Promise.all([fetchAgents(), fetchStats()])
      const mapped = agentsData.map(mapAgent)
      setPending(mapped.filter((_: Agent, i: number) => agentsData[i].status === "pending"))
      setApproved(mapped.filter((_: Agent, i: number) => agentsData[i].status === "approved"))
      setStats(statsData)
    } catch (error: any) {
      // Only show toast for genuine server errors, not auth failures (401)
      // AuthGuard handles authentication redirects, so 401 during initial load is expected
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.warn('Authentication error during load - AuthGuard will handle redirect')
      } else {
        toast.error("Erreur de chargement des données")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleApprove(agent: Agent) {
    try {
      await approveAgent(agent.id)
      setPending((items) => items.filter((item) => item.id !== agent.id))
      setApproved((items) => [...items, { ...agent, conversations: 0 }])
      toast.success(`${agent.name} a été validé`)
    } catch {
      toast.error("Erreur lors de la validation")
    }
  }

  async function handleReject(agent: Agent) {
    try {
      await rejectAgent(agent.id)
      setPending((items) => items.filter((item) => item.id !== agent.id))
      toast(`${agent.name} a été rejeté`)
    } catch {
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

  const contentProps = {
    pending,
    approved,
    stats,
    onApprove: handleApprove,
    onReject: handleReject,
    onRefresh: loadData,
    refreshing: loading,
  }

  return (
    <main className="min-h-screen bg-background md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-20 border-b border-border bg-card md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block md:px-5 md:py-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/sinaps-logo-light.png"
              alt="Sinaps Support"
              className="h-8 w-auto object-contain dark:hidden"
            />
            <img
              src="/sinaps-logo-dark.png"
              alt="Sinaps Support"
              className="h-8 w-auto object-contain hidden dark:block"
            />
          </div>
        </div>
        <nav className="hidden px-3 md:block">
          {[
            { hash: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
            { hash: "stats", label: "Statistiques", icon: BarChart3 },
            { hash: "agents", label: "En attente", icon: Users },
            { hash: "validated", label: "Agents validés", icon: UserCheck },
            { hash: "history", label: "Historique", icon: History },
          ].map((item) => (
            <button
              key={item.hash}
              onClick={() => {
                setActiveTab(item.hash)
                document.getElementById(item.hash)?.scrollIntoView({ behavior: "smooth" })
              }}
              className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs font-semibold ${
                activeTab === item.hash
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="size-4"/>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="grid grid-cols-5 gap-1 border-t border-border p-2 md:hidden">
          {[
            { hash: "overview", icon: LayoutDashboard },
            { hash: "stats", icon: BarChart3 },
            { hash: "agents", icon: Users },
            { hash: "validated", icon: UserCheck },
            { hash: "history", icon: History },
          ].map((item) => (
            <button
              key={item.hash}
              onClick={() => {
                setActiveTab(item.hash)
                document.getElementById(item.hash)?.scrollIntoView({ behavior: "smooth" })
              }}
              aria-label={item.hash}
              className={`grid h-9 place-items-center rounded-md ${
                activeTab === item.hash
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-4"/>
            </button>
          ))}
        </div>
        <div className="hidden border-t border-border p-4 md:absolute md:bottom-0 md:block md:w-[240px]">
          <p className="mb-3 text-xs font-bold">Admin SINAPS</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => logout(router)}
          >
            <LogOut/> Déconnexion
          </Button>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        <AdminContent {...contentProps} />
      </div>
    </main>
  )
}
