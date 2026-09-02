import { cn } from "@/lib/utils"
import { statusLabels, type ConversationStatus } from "@/lib/chat-data"

const statusStyles: Record<ConversationStatus, string> = {
  resolu: "bg-success/15 text-success",
  en_cours: "bg-primary/15 text-primary",
  en_attente: "bg-accent/20 text-accent-foreground",
}

const statusDot: Record<ConversationStatus, string> = {
  resolu: "bg-success",
  en_cours: "bg-primary",
  en_attente: "bg-accent",
}

export function StatusBadge({
  status,
  className,
}: {
  status: ConversationStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status],
        className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", statusDot[status])} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  )
}
