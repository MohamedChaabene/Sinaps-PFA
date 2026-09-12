"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuickReply } from "@/lib/types"

interface QuickReplyButtonsProps {
  quickReplies: QuickReply[]
  onQuickReplyClick: (action: string, metadata?: Record<string, unknown>) => void
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
    <div className="flex flex-wrap gap-2 mt-3">
      {quickReplies.map((quickReply) => {
        const isLoading = loadingAction === quickReply.action
        const isDisabled = disabled || isLoading

        return (
          <Button
            key={quickReply.id}
            variant="outline"
            size="sm"
            className="rounded-lg text-xs shadow-2xs transition-all duration-200 hover:shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => onQuickReplyClick(quickReply.action, quickReply.metadata)}
            disabled={isDisabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3 animate-spin mr-1.5" />
                <span>Envoi...</span>
              </>
            ) : (
              quickReply.label
            )}
          </Button>
        )
      })}
    </div>
  )
}
