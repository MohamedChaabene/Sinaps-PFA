import { UserRoundIcon, LogOutIcon, Hash, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/chat/status-badge"
import type { Conversation } from "@/lib/chat-data"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function ChatHeader({
  conversation,
  onEscalate,
  onClose,
  onLogout,
}: {
  conversation: Conversation
  onEscalate: () => void
  onClose?: () => void
  onLogout?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur-xs px-4 py-3 sm:px-6 shadow-xs">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          <Avatar className="size-9.5 shrink-0 ring-2 ring-primary/20">
            <AvatarImage src={conversation.clientAvatar || "/placeholder.svg"} alt={conversation.clientName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials(conversation.clientName)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" title="En ligne" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Hash className="size-4 text-primary/80 shrink-0" />
            <span className="font-heading font-bold text-sm text-foreground tracking-tight">support-sinaps</span>
            <span className="text-muted-foreground/50 text-xs hidden sm:inline">•</span>
            <p className="truncate text-xs font-medium text-muted-foreground hidden sm:inline">{conversation.clientName}</p>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <StatusBadge status={conversation.status} />
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              {conversation.handledBy === "humain"
                ? "Demande confiée à un agent humain"
                : "Support assisté par IA (Gemini 3.5 & RAG)"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {conversation.status !== "resolu" && (
          <Button
            onClick={onEscalate}
            variant="outline"
            size="sm"
            disabled={conversation.handledBy === "humain"}
            className="rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-xs font-medium transition-colors disabled:opacity-60"
          >
            <UserRoundIcon className="size-3.5 text-primary" data-icon="inline-start" />
            <span className="hidden sm:inline">
              {conversation.handledBy === "humain" ? "Agent demandé" : "Agent humain"}
            </span>
          </Button>
        )}

        {onClose && conversation.status !== "resolu" && (
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="rounded-full text-xs font-medium transition-colors"
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
            className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
