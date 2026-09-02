"use client"

import * as React from "react"
import { PaperclipIcon, SendHorizonalIcon, SmileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

const EMOJIS = ["😀", "😂", "🙏", "👍", "🎉", "😍", "😕", "🤔", "❤️", "🔥", "✨", "🙌"]

export function MessageComposer({
  onSend,
}: {
  onSend: (text: string) => void
}) {
  const [value, setValue] = React.useState("")

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue("")
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isComposing = event.nativeEvent.isComposing || event.keyCode === 229
    if (event.key === "Enter" && !event.shiftKey && !isComposing) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-card px-4 py-3 sm:px-6">
      <InputGroup className="rounded-2xl">
        <InputGroupTextarea
          placeholder="Écrivez votre message..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="min-h-10 resize-none"
          aria-label="Écrivez votre message..."
        />
        <InputGroupAddon align="block-end">
          <Popover>
            <PopoverTrigger render={<InputGroupButton aria-label="Insérer un emoji" />}>
              <SmileIcon />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-6 gap-1">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue((prev) => prev + emoji)}
                    className="rounded-lg p-1.5 text-lg transition-colors hover:bg-muted"
                    aria-label={`Ajouter l'emoji ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <InputGroupButton
            aria-label="Joindre un fichier"
            onClick={() => toast("Pièce jointe ajoutée 📎", { description: "capture-ecran.png" })}
          >
            <PaperclipIcon />
          </InputGroupButton>
          <InputGroupButton
            aria-label="Envoyer le message"
            variant="default"
            className="ml-auto rounded-full"
            disabled={!value.trim()}
            onClick={handleSend}
          >
            <SendHorizonalIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
