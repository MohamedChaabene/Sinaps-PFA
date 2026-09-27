"use client"

import { UserRoundIcon, LogOutIcon, CheckCircle2, Bot } from "lucide-react"
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
  const hasAssignedAgent = !!conversation.assignedAgent
  const isResolved = conversation.status === "resolu"

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-3 sm:gap-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          <Avatar aria-label={`Avatar de ${conversation.clientName}`} className="size-10 shrink-0 rounded-lg ring-1 ring-border shadow-none">
            <AvatarImage
              src={conversation.clientAvatar || undefined}
              alt={`Avatar de ${conversation.clientName}`}
              className="rounded-xl object-cover"
            />
            <AvatarFallback aria-label={`Avatar de ${conversation.clientName}`} className="rounded-lg bg-primary/10 text-xs font-bold text-primary">
              {getInitials(conversation.clientName)}
            </AvatarFallback>
          </Avatar>
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs"
            title="Session connectée en temps réel"
            aria-label="Connecté en temps réel"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <img
                src="/sinaps-logo-light.png"
                alt="SINAPS"
                className="h-6 sm:h-7 w-auto object-contain dark:hidden"
              />
              <img
                src="/sinaps-logo-dark.png"
                alt="SINAPS"
                className="h-6 sm:h-7 w-auto object-contain hidden dark:block"
              />
              <span className="text-sm font-bold text-foreground">Assistance SINAPS</span>
            </div>
            <span 
              className="size-2 rounded-full bg-emerald-500 shrink-0"
              title="Connecté en temps réel"
              aria-label="Connecté en temps réel"
            />
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{conversation.clientName}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="truncate">{isHumanMode ? (hasAssignedAgent ? `Avec ${conversation.assignedAgent?.name}` : "Support humain demandé") : "Assistant IA"}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {!isResolved && (
          isHumanMode ? (
            <Button
              onClick={onSwitchToIA}
              variant="outline"
              size="sm"
              className="h-9 rounded-md border-emerald-500/30 bg-emerald-500/5 text-xs font-semibold text-emerald-600 shadow-none transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/15 active:scale-[0.98] dark:text-emerald-400"
              title="Rétablir l'assistance par l'agent IA"
            >
              <Bot className="size-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Repasser à l&apos;IA</span>
              <span className="sm:hidden">IA</span>
            </Button>
          ) : (
            <Button
              onClick={onEscalate}
              variant="outline"
              size="sm"
              className="h-9 rounded-md border-primary/30 bg-primary/5 text-xs font-semibold text-primary shadow-none transition-colors hover:border-primary/60 hover:bg-primary/15 active:scale-[0.98]"
              title="Demander l'assistance d'un agent humain"
            >
              <UserRoundIcon className="size-3.5 text-primary" />
              <span className="hidden sm:inline">Parler à un humain</span>
              <span className="sm:hidden">Humain</span>
            </Button>
          )
        )}

        {onClose && !isResolved && (
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="h-9 rounded-md border border-border text-xs font-semibold shadow-none transition-colors hover:bg-muted active:scale-[0.98]"
            title="Clôturer et évaluer l'assistance"
          >
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Clôturer</span>
          </Button>
        )}

        {onLogout && (
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="size-9 rounded-md px-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Quitter la session"
            aria-label="Se déconnecter"
          >
            <LogOutIcon className="size-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
