"use client"

import * as React from "react"
import { StarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { closeConversation } from "@/lib/api"

export function SatisfactionDialog({
  open,
  onOpenChange,
  clientName,
  conversationId,
  onClosed,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  conversationId: string
  onClosed?: () => void
}) {
  const [rating, setRating] = React.useState(0)
  const [hoverRating, setHoverRating] = React.useState(0)
  const [comment, setComment] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await closeConversation(conversationId, rating, comment)
      toast("Merci pour votre retour ! ✨", {
        description: rating > 0 ? `Vous avez donné ${rating} étoile${rating > 1 ? "s" : ""}.` : undefined,
      })
      onOpenChange(false)
      setRating(0)
      setComment("")
      onClosed?.()
    } catch (error) {
      toast("Erreur lors de l'envoi de votre avis")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Comment évaluez-vous notre support ?</DialogTitle>
          <DialogDescription>
            La conversation avec {clientName} va être clôturée. Votre avis nous aide à nous améliorer 🙏
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="rating-stars">Votre note</FieldLabel>
            <div
              id="rating-stars"
              role="radiogroup"
              aria-label="Note de satisfaction sur 5 étoiles"
              className="flex items-center gap-1"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hoverRating || rating)
                return (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={star === rating}
                    aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="rounded-md p-1 transition-transform hover:scale-110"
                  >
                    <StarIcon
                      className={cn(
                        "size-7 transition-colors",
                        filled ? "fill-accent text-accent" : "fill-transparent text-muted-foreground"
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="satisfaction-comment">Un commentaire ? (facultatif)</FieldLabel>
            <Textarea
              id="satisfaction-comment"
              placeholder="Dites-nous en plus sur votre expérience..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <Button onClick={handleSubmit} disabled={rating === 0 || submitting}>
            {submitting ? "Envoi..." : "Envoyer mon avis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}