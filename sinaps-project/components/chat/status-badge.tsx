import { cn } from "@/lib/utils"
import { statusLabels, type ConversationStatus } from "@/lib/chat-data"

const statusStyles: Record<ConversationStatus, string> = {
  resolu: "bg-success/10 text-success border-success/20",
  en_cours: "bg-primary/10 text-primary border-primary/20",
  en_attente: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
}

const statusDot: Record<ConversationStatus, string> = {
  resolu: "bg-success",
  en_cours: "bg-primary",
  en_attente: "bg-amber-500",
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
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-tight transition-all shrink-0 whitespace-nowrap",
        statusStyles[status],
        className
      )}
    >
      <span className="relative flex size-1.5 shrink-0">
        {status === "en_cours" && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
        )}
        <span className={cn("relative inline-flex size-1.5 rounded-full", statusDot[status])} aria-hidden="true" />
      </span>
      {statusLabels[status]}
    </span>
  )
}
