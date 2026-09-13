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
    <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-card px-4 py-3 sm:rounded-t-2xl sm:px-6 shadow-xs sticky top-0 z-20">
      <div className="flex min-w-0 items-center gap-3">
        {/* User avatar with live presence ring */}
        <div className="relative">
          <Avatar className="size-9.5 shrink-0 rounded-xl ring-2 ring-primary/20 shadow-xs">
            <AvatarImage
              src={conversation.clientAvatar || "/placeholder.svg"}
              alt={conversation.clientName}
              className="rounded-xl object-cover"
            />
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary font-bold text-xs">
              {getInitials(conversation.clientName)}
            </AvatarFallback>
          </Avatar>
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs"
            title="Session connectée en temps réel"
            aria-label="Connecté en temps réel"
          />
        </div>

        {/* Brand & Conversation metadata - simplified */}
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
              <span className="text-sm font-semibold text-foreground">SINAPS Copilot</span>
            </div>
            {/* Realtime indicator - simple green dot */}
            <span 
              className="size-2 rounded-full bg-emerald-500 shrink-0"
              title="Connecté en temps réel"
              aria-label="Connecté en temps réel"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span className="truncate">{conversation.clientName}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="truncate">{isHumanMode ? "Support humain" : "Gemini & RAG"}</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {!isResolved && (
          isHumanMode ? (
            <Button
              onClick={onSwitchToIA}
              variant="outline"
              size="sm"
              className="rounded-lg border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all duration-150 active:scale-[0.98] shadow-2xs"
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
              className="rounded-lg border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/15 text-primary text-xs font-semibold transition-all duration-150 active:scale-[0.98] shadow-2xs"
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
            className="rounded-lg border border-border/80 text-xs font-semibold hover:bg-muted transition-all duration-150 active:scale-[0.98] shadow-2xs"
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
            className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors p-2"
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
