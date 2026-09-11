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
  ClipboardList,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  ShieldCheck,
  Users,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { logout } from "@/components/auth-guard"
import { fetchAgents, approveAgent, rejectAgent, fetchStats } from "@/lib/api"
import { getInitials } from "@/lib/utils"
import { StatsPanel } from "@/components/admin/stats-panel"
import { PendingAgentsSection, ValidatedAgentsSection } from "@/components/admin/agent-table"
import { ConversationHistory } from "@/components/admin/conversation-history"
import type { Agent, Stats } from "@/lib/types"

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
// Sidebar
// ---------------------------------------------------------------------------

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
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sinaps_agent")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed) setAdminUser(parsed)
      }
    } catch {}
  }, [])

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
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    if (onClose) onClose()
  }

  return (
    <aside
      className={`flex h-full flex-col border-r border-border bg-card transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20 px-3 py-5" : "w-64 px-5 py-6"
      }`}
    >
      {/* Brand & collapse toggle */}
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-3 pb-4">
          <Link
            href="/"
            className="flex size-10 items-center justify-center rounded-xl bg-card border border-border/80 shadow-xs transition-transform hover:scale-105 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Sinaps Support"
          >
            <img src="/sinaps-logo-primary.png" alt="Sinaps" className="size-8 object-contain" />
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
            className="flex items-center gap-2.5 min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Sinaps Support"
          >
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

      {/* Navigation */}
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

      {/* Footer: security badge & logout */}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {!isCollapsed ? (
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-4.5" />
                <span className="absolute -top-0.5 -right-0.5 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">
                  {adminUser?.name || "Administrateur"}
                </p>
                <p className="truncate text-[10px] font-medium text-muted-foreground">
                  Session sécurisée
                </p>
              </div>
            </div>

            <Separator className="my-2.5 opacity-60" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => logout(router)}
              className="w-full justify-center gap-2 text-xs font-semibold rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border-border/80 focus-visible:ring-2 focus-visible:ring-destructive transition-colors shadow-2xs"
            >
              <LogOut className="size-3.5" />
              <span>Déconnexion</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs"
              title="Session sécurisée active"
            >
              <ShieldCheck className="size-4.5" />
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-emerald-500" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout(router)}
              title="Déconnexion"
              aria-label="Déconnexion"
              className="size-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive transition-colors"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
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
    <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Page header */}
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
          )}
        </div>

        {/* KPI stats + breakdown bar */}
        <StatsPanel stats={stats} />

        {/* Pending agents awaiting approval */}
        <PendingAgentsSection agents={pending} onApprove={onApprove} onReject={onReject} />

        {/* Validated/active agents */}
        <ValidatedAgentsSection agents={approved} />

        {/* Full conversation history with search + filters */}
        <ConversationHistory />
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------

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
    } catch {
      toast.error("Erreur de chargement des données")
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop / tablet layout */}
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
          <AdminContent {...contentProps} />
        </div>
      </div>

      {/* Mobile layout */}
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
            <img src="/sinaps-logo-primary.png" alt="Sinaps Admin" className="size-7 object-contain" />
            <span className="font-heading text-base font-bold">Sinaps Admin</span>
          </div>
          <div className="size-9" />
        </header>

        <div className="min-w-0 flex-1">
          <AdminContent {...contentProps} />
        </div>
      </div>

      {/* Mobile slide-in drawer */}
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