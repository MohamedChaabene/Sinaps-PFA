'use client'

import React from 'react'
import { Package, RotateCcw, KeyRound, Receipt, Sparkles } from 'lucide-react'

interface QuickPromptsProps {
  onSelect: (prompt: string) => void
  disabled?: boolean
}

const PROMPTS = [
  {
    icon: Package,
    label: 'Suivre ma commande',
    query: 'Comment suivre ma commande ?',
  },
  {
    icon: RotateCcw,
    label: 'Demande de remboursement',
    query: 'Comment obtenir un remboursement pour ma commande ?',
  },
  {
    icon: KeyRound,
    label: 'Mot de passe oublié',
    query: 'Comment réinitialiser mon mot de passe ?',
  },
  {
    icon: Receipt,
    label: 'Facturation & Paiement',
    query: "J'ai une question sur ma facture et mon paiement.",
  },
]

export function QuickPrompts({ onSelect, disabled }: QuickPromptsProps) {
  return (
    <div className="border-t border-border/60 bg-muted/15 px-4 py-2 sm:px-6">
      <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
        <div className="flex items-center gap-1.5 font-semibold text-muted-foreground shrink-0 select-none">
          <div className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="size-3" />
          </div>
          <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Suggestions :</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 py-0.5">
          {PROMPTS.map((p, idx) => {
            const Icon = p.icon
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(p.query)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/95 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40"
              >
                <Icon className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary shrink-0" />
                <span className="whitespace-nowrap">{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
