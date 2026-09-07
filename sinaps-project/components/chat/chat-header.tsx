import { UserRoundIcon, LogOutIcon, Hash, CheckCircle2, Bot, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/chat/status-badge"
import { getInitials } from "@/lib/utils"
import type { Conversation } from "@/lib/chat-data"

export function ChatHeader({
  conversation,
  onEscalate,
  onSwitchToIA,
  onClose,
  onLogout,
}: {
  conversation: Conversation
  onEscalate: () => void
  onSwitchToIA: () => void
  onClose?: () => void
  onLogout?: () => void
}) {
  const isHumanMode = conversation.handledBy === "humain"

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur-xs px-4 py-3 sm:px-6 shadow-2xs">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          <Avatar className="size-9.5 shrink-0 rounded-xl ring-2 ring-primary/20">
            <AvatarImage src={conversation.clientAvatar || "/placeholder.svg"} alt={conversation.clientName} className="rounded-xl" />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-xs">
              {getInitials(conversation.clientName)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" title="En ligne" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Hash className="size-4 text-primary/80 shrink-0" />
            <span className="font-heading font-bold text-sm text-foreground tracking-tight">support-sinaps</span>
            <span className="text-muted-foreground/50 text-xs hidden sm:inline">•</span>
            <p className="truncate text-xs font-medium text-muted-foreground hidden sm:inline">{conversation.clientName}</p>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={conversation.status} />
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              {isHumanMode ? (
                <>
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  <span>Agent humain demandé</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3 text-primary/70" />
                  <span>IA Gemini 3.5 & RAG</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {conversation.status !== "resolu" && (
          isHumanMode ? (
            <Button
              onClick={onSwitchToIA}
              variant="outline"
              size="sm"
              className="rounded-lg border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-medium transition-all shadow-2xs"
              title="Repasser à l'assistant IA"
            >
              <Bot className="size-3.5 text-emerald-500" data-icon="inline-start" />
              <span className="hidden sm:inline">Repasser à l&apos;IA</span>
              <span className="sm:hidden">Mode IA</span>
            </Button>
          ) : (
            <Button
              onClick={onEscalate}
              variant="outline"
              size="sm"
              className="rounded-lg border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-xs font-medium transition-all shadow-2xs"
              title="Demander l'assistance d'un agent humain"
            >
              <UserRoundIcon className="size-3.5 text-primary" data-icon="inline-start" />
              <span className="hidden sm:inline">Agent humain</span>
              <span className="sm:hidden">Humain</span>
            </Button>
          )
        )}

        {onClose && conversation.status !== "resolu" && (
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="rounded-lg text-xs font-medium transition-all shadow-2xs"
          >
            <CheckCircle2 className="size-3.5 text-success" data-icon="inline-start" />
            <span className="hidden sm:inline">Clôturer</span>
          </Button>
        )}

        {onLogout && (
          <Button
            onClick={onLogout}
            variant="ghost"
            size="icon-sm"
            className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Se déconnecter de ce compte"
            aria-label="Se déconnecter de ce compte"
          >
            <LogOutIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
