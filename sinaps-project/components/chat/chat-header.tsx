"use client"

import { UserRoundIcon } from "lucide-react"
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
}: {
  conversation: Conversation
  onEscalate: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={conversation.clientAvatar || "/placeholder.svg"} alt={conversation.clientName} />
          <AvatarFallback>{initials(conversation.clientName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold text-foreground">{conversation.clientName}</p>
          <div className="mt-0.5">
            <StatusBadge status={conversation.status} />
          </div>
        </div>
      </div>
      <Button onClick={onEscalate} variant="secondary" size="sm" className="rounded-full">
        <UserRoundIcon data-icon="inline-start" />
        <span className="hidden sm:inline">Basculer vers un agent humain</span>
        <span className="sm:hidden">Agent humain</span>
      </Button>
    </div>
  )
}
