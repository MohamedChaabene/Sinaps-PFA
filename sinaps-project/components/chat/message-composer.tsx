"use client"

import * as React from "react"
import { PaperclipIcon, SendHorizonalIcon, SmileIcon, XIcon, FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { uploadFile } from "@/lib/api"

const EMOJIS = ["😀", "😂", "🙏", "👍", "🎉", "😍", "😕", "🤔", "❤️", "🔥", "✨", "🙌"]

export function MessageComposer({
  onSend,
}: {
  onSend: (text: string, attachments?: { url: string; type: string; name?: string }[]) => void
}) {
  const [value, setValue] = React.useState("")
  const [attachments, setAttachments] = React.useState<{ url: string; type: string; name?: string }[]>([])
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed && attachments.length === 0) return
    onSend(trimmed, attachments)
    setValue("")
    setAttachments([])
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isComposing = event.nativeEvent.isComposing || event.keyCode === 229
    if (event.key === "Enter" && !event.shiftKey && !isComposing) {
      event.preventDefault()
      handleSend()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const res = await uploadFile(file)
      if (res.url) {
        setAttachments((prev) => [...prev, { url: res.url, type: res.type, name: res.name }])
        toast.success(`Fichier joint : ${res.name}`)
      } else {
        toast.error("Échec du téléversement")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi du fichier")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="border-t border-border bg-card px-4 py-3 sm:px-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,application/pdf,.doc,.docx"
      />

      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-lg border bg-muted/60 px-2.5 py-1 text-xs text-foreground"
            >
              <FileIcon className="size-3.5 text-primary" />
              <span className="max-w-[150px] truncate">{att.name || "Pièce jointe"}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative rounded-xl border border-input/80 bg-background/90 shadow-2xs focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
        <InputGroup className="rounded-xl border-0 shadow-none focus-within:ring-0 focus-within:border-transparent bg-transparent">
          <InputGroupTextarea
            placeholder="Écrivez votre message..."
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-11 resize-none text-sm px-3.5 pt-2.5 placeholder:text-muted-foreground/60"
            aria-label="Écrivez votre message..."
          />
          <InputGroupAddon align="block-end" className="px-2 pb-2 pt-0 gap-1.5">
            <Popover>
              <PopoverTrigger
                render={
                  <InputGroupButton
                    aria-label="Insérer un emoji"
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  />
                }
              >
                <SmileIcon className="size-4" />
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-xl p-2.5 shadow-lg border border-border/80" align="start">
                <div className="grid grid-cols-6 gap-1">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setValue((prev) => prev + emoji)}
                      className="rounded-lg p-1.5 text-lg transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
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
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <PaperclipIcon className="size-4" />
            </InputGroupButton>
            <InputGroupButton
              aria-label="Envoyer le message"
              variant="default"
              className="ml-auto h-8 px-3 rounded-lg font-medium text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all active:scale-[0.98] disabled:opacity-40"
              disabled={(!value.trim() && attachments.length === 0) || uploading}
              onClick={handleSend}
            >
              <span className="hidden sm:inline">Envoyer</span>
              <SendHorizonalIcon className="size-3.5" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  )
}
