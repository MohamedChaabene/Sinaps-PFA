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
    label: 'Demander un remboursement',
    query: 'Comment obtenir un remboursement pour ma commande ?',
  },
  {
    icon: KeyRound,
    label: 'Réinitialiser mot de passe',
    query: 'Comment réinitialiser mon mot de passe ?',
  },
  {
    icon: Receipt,
    label: 'Problème de facturation',
    query: "J'ai une question sur ma facture et mon paiement.",
  },
]

export function QuickPrompts({ onSelect, disabled }: QuickPromptsProps) {
  return (
    <div className="border-t border-border/60 bg-muted/20 px-4 py-2 sm:px-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <div className="flex items-center gap-1 font-medium text-muted-foreground shrink-0">
          <Sparkles className="size-3.5 text-primary" />
          <span>Suggestions rapides :</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {PROMPTS.map((p, idx) => {
            const Icon = p.icon
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(p.query)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-medium text-foreground/90 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                <Icon className="size-3.5 text-primary/80" />
                <span>{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
