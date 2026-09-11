"use client"

/**
 * stats-panel.tsx — KPI statistics section for the admin dashboard.
 *
 * Renders the 5 KPI cards (total conversations, AI resolution rate, human
 * escalation rate, average satisfaction, average response time) and the
 * AI-vs-human breakdown progress bar.
 */

import { Bot, Clock, MessageSquare, Star, UserCheck, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Stats } from "@/lib/types"

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}min ${remainingSeconds}s`
}

type StatColor = "primary" | "emerald" | "violet" | "amber" | "blue"

function StatCard({
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
  color?: StatColor
}) {
  const colorMap: Record<StatColor, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    violet: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  }

  const barColorMap: Record<StatColor, string> = {
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

export function StatsPanel({ stats }: { stats: Stats | null }) {
  const resolvedPct =
    stats && stats.total > 0
      ? {
          ia: Math.round((stats.resolvedByIA / stats.total) * 100),
          human: Math.round((stats.resolvedByHuman / stats.total) * 100),
        }
      : { ia: 0, human: 0 }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI grid */}
      <section id="stats" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 scroll-mt-6">
        <StatCard
          title="Total conversations"
          value={String(stats?.total ?? 0)}
          icon={MessageSquare}
          subtitle="Tickets enregistrés"
          color="primary"
        />
        <StatCard
          title="Résolu par IA"
          value={`${resolvedPct.ia} %`}
          icon={Bot}
          progress={resolvedPct.ia}
          subtitle="Autonome (RAG + Gemini)"
          color="violet"
        />
        <StatCard
          title="Résolu par agent"
          value={`${resolvedPct.human} %`}
          icon={UserCheck}
          progress={resolvedPct.human}
          subtitle="Escalade humaine"
          color="blue"
        />
        <StatCard
          title="Satisfaction client"
          value={`${stats?.avgSatisfaction ?? 0} / 5`}
          icon={Star}
          progress={(Number(stats?.avgSatisfaction ?? 0) / 5) * 100}
          subtitle="Moyenne des avis"
          color="amber"
        />
        <StatCard
          title="Temps de réponse"
          value={formatDuration(stats?.avgResponseTimeSeconds ?? 0)}
          icon={Clock}
          subtitle="Délai moyen SLA"
          color="emerald"
        />
      </section>

      {/* AI autonomy vs human escalation breakdown */}
      <Card className="rounded-xl border border-border/80 bg-card/85 p-5 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-3.5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-foreground">
                Performance du Copilot IA &amp; Relais Humain
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-primary" />
                Résolution autonome : <strong className="text-primary">{resolvedPct.ia}%</strong>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-blue-500" />
                Escalade conseiller : <strong className="text-blue-500">{resolvedPct.human}%</strong>
              </span>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/70 flex p-0.5 border border-border/40">
            <div
              className="h-full rounded-l-full bg-primary transition-all duration-500"
              style={{ width: `${resolvedPct.ia || (stats?.total === 0 ? 50 : 0)}%` }}
              title={`IA: ${resolvedPct.ia}%`}
            />
            <div
              className="h-full rounded-r-full bg-blue-500 transition-all duration-500"
              style={{ width: `${resolvedPct.human || (stats?.total === 0 ? 50 : 0)}%` }}
              title={`Conseiller: ${resolvedPct.human}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>{stats?.resolvedByIA ?? 0} conversations traitées directement par Gemini &amp; la base vectorielle</span>
            <span>{stats?.resolvedByHuman ?? 0} conversations escaladées vers un agent de support</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
