"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuickReply } from "@/lib/types"

interface QuickReplyButtonsProps {
  quickReplies: QuickReply[]
  onQuickReplyClick?: (action: string, metadata?: Record<string, unknown>, label?: string) => void
  disabled?: boolean
  loadingAction?: string | null
}

export function QuickReplyButtons({
  quickReplies,
  onQuickReplyClick,
  disabled = false,
  loadingAction = null,
}: QuickReplyButtonsProps) {
  if (!quickReplies || quickReplies.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2.5 max-w-full overflow-hidden">
      {quickReplies.map((quickReply) => {
        const label = quickReply.label || (quickReply as any).text || ""
        const isLoading = loadingAction === quickReply.action
        const isDisabled = disabled || isLoading || !onQuickReplyClick

        return (
          <Button
            key={quickReply.id}
            variant="outline"
            size="sm"
            className="rounded-lg text-xs shadow-2xs transition-all duration-200 hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] h-auto min-h-8 py-1.5 px-3 max-w-full whitespace-normal break-words text-left justify-start leading-snug"
            onClick={() => onQuickReplyClick?.(quickReply.action, quickReply.metadata, label)}
            disabled={isDisabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3 animate-spin mr-1.5 shrink-0" />
                <span>Envoi...</span>
              </>
            ) : (
              <span>{label}</span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
