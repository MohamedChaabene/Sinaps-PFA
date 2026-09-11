"use client"

/**
 * agent-table.tsx — Agent management sections for the admin dashboard.
 *
 * Renders two sections:
 * - Pending agents (with approve / reject actions)
 * - Validated / active agents table
 *
 * The parent (AdminDashboard) owns the data and the approve/reject handlers;
 * this component is purely presentational with callbacks.
 */

import { Check, CheckCircle2, Users, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getInitials } from "@/lib/utils"
import type { Agent } from "@/lib/types"

// ---------------------------------------------------------------------------
// Small shared sub-components
// ---------------------------------------------------------------------------

function AgentAvatar({ agent }: { agent: Agent }) {
  return (
    <Avatar className="size-10 rounded-xl ring-2 ring-primary/20">
      <AvatarImage src={agent.avatar || "/placeholder.svg"} alt={`Avatar de ${agent.name}`} className="rounded-xl" />
      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-xs">
        {agent.initials}
      </AvatarFallback>
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

// ---------------------------------------------------------------------------
// Pending agents section
// ---------------------------------------------------------------------------

export function PendingAgentsSection({
  agents,
  onApprove,
  onReject,
}: {
  agents: Agent[]
  onApprove: (agent: Agent) => void
  onReject: (agent: Agent) => void
}) {
  return (
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
                agents.length > 0
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {agents.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {agents.length} en attente
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-500" />À jour
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
          {agents.length ? (
            <div className="divide-y divide-border/60">
              {agents.map((agent) => (
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
                      onClick={() => onApprove(agent)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5 shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Check className="size-3.5" />
                      <span>Valider</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(agent)}
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
  )
}

// ---------------------------------------------------------------------------
// Validated agents section
// ---------------------------------------------------------------------------

export function ValidatedAgentsSection({ agents }: { agents: Agent[] }) {
  return (
    <section id="overview" className="flex flex-col gap-4 scroll-mt-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">Agents validés</h2>
            <Badge variant="secondary" className="rounded-md border border-border/70 font-semibold px-2">
              {agents.length} actif{agents.length > 1 ? "s" : ""}
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
              {agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="size-6 text-muted-foreground/60" />
                      <p className="font-medium text-xs">Aucun agent validé pour le moment.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
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
  )
}
