"use client"

import * as React from "react"
import { PaperclipIcon, SendHorizonalIcon, SmileIcon, XIcon, FileIcon, Loader2, CornerDownLeft } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { uploadFile } from "@/lib/api"

const EMOJIS = ["😀", "😂", "🙏", "👍", "🎉", "😍", "😕", "🤔", "❤️", "🔥", "✨", "🙌", "👋", "🚀", "💡", "📦", "💳", "✅"]

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

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !uploading

  return (
    <div className="border-t border-border/80 bg-card px-4 py-3 sm:rounded-b-2xl sm:px-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,application/pdf,.doc,.docx"
      />

      {/* Attachments preview list */}
      {attachments.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-foreground shadow-2xs"
            >
              <FileIcon className="size-3.5 text-primary" />
              <span className="max-w-[160px] truncate font-medium">{att.name || "Pièce jointe"}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                title="Supprimer"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer Input Group */}
      <div className="relative rounded-xl border border-border/80 bg-background/95 shadow-xs focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-150">
        <InputGroup className="rounded-xl border-0 shadow-none focus-within:ring-0 focus-within:border-transparent bg-transparent">
          <InputGroupTextarea
            placeholder="Écrivez votre message à l'assistance..."
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-11 resize-none text-sm px-3.5 pt-3 placeholder:text-muted-foreground/50 leading-relaxed font-normal"
            aria-label="Écrivez votre message..."
          />
          <InputGroupAddon align="block-end" className="px-2.5 pb-2 pt-0 gap-1">
            {/* Emoji Picker Popover */}
            <Popover>
              <PopoverTrigger
                render={
                  <InputGroupButton
                    aria-label="Insérer un emoji"
                    className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  />
                }
              >
                <SmileIcon className="size-4" />
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-xl p-2.5 shadow-xl border border-border/80 bg-card/95 backdrop-blur-md" align="start">
                <div className="grid grid-cols-6 gap-1">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setValue((prev) => prev + emoji)}
                      className="flex size-7.5 items-center justify-center rounded-lg text-base transition-transform hover:scale-125 hover:bg-muted active:scale-95"
                      aria-label={`Ajouter l'emoji ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* File Attachment Button */}
            <InputGroupButton
              aria-label="Joindre un fichier"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Joindre une image, document ou vidéo (max 15 Mo)"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <PaperclipIcon className="size-4" />
              )}
            </InputGroupButton>

            {/* Send Button */}
            <InputGroupButton
              aria-label="Envoyer le message"
              variant="default"
              className="ml-auto h-7.5 px-3 rounded-lg font-semibold text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shadow-primary/25 transition-all duration-150 active:scale-95 disabled:opacity-30"
              disabled={!canSend}
              onClick={handleSend}
            >
              <span className="hidden sm:inline">Envoyer</span>
              <SendHorizonalIcon className="size-3.5" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground/60 select-none">
        <span className="hidden sm:flex items-center gap-1 font-medium">
          <CornerDownLeft className="size-3 text-muted-foreground/50" />
          <span>Entrée pour envoyer • Maj+Entrée pour nouvelle ligne</span>
        </span>
        <span className="ml-auto text-muted-foreground/50 font-medium font-mono text-[10px]">
          SINAPS Copilot IA
        </span>
      </div>
    </div>
  )
}
