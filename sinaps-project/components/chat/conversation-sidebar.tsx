"use client"

import { SearchIcon, SparklesIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/chat-data"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <SparklesIcon className="size-4" />
        </div>
        <h1 className="font-heading text-lg font-bold tracking-tight text-sidebar-foreground">
          Conversations
        </h1>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="rounded-full bg-background pl-9"
            aria-label="Rechercher une conversation"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <ul className="flex flex-col gap-1">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeId
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  aria-current={isActive}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={conversation.clientAvatar || "/placeholder.svg"} alt={conversation.clientName} />
                    <AvatarFallback>{initials(conversation.clientName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{conversation.clientName}</span>
                      {conversation.unreadCount > 0 && (
                        <Badge
                          className={cn(
                            "h-5 min-w-5 justify-center rounded-full px-1.5 text-xs",
                            isActive
                              ? "bg-primary-foreground text-primary"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 truncate text-xs",
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {conversation.isTyping ? "en train d'écrire..." : conversation.lastMessage}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
