import * as React from "react"
import { BotIcon, FileTextIcon, ExternalLinkIcon, CopyIcon, CheckIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { MarkdownContent } from "@/components/chat/markdown-content"
import { getInitials } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/api"
import type { Conversation } from "@/lib/chat-data"

function safeAttachmentUrl(rawUrl?: string): string {
  if (!rawUrl) return "#"
  const trimmed = rawUrl.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  if (trimmed.startsWith("/")) {
    return `${API_BASE_URL}${trimmed}`
  }
  return "#"
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copier le message"
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground/80 transition-all hover:bg-background/50 hover:text-foreground active:scale-95"
    >
      {copied ? (
        <>
          <CheckIcon className="size-3 text-success" />
          <span className="text-success">Copié</span>
        </>
      ) : (
        <>
          <CopyIcon className="size-3" />
          <span>Copier</span>
        </>
      )}
    </button>
  )
}

function EmptyConversationState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-4 py-12 my-auto">
      <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary shadow-xs border border-primary/20">
        <BotIcon className="size-8" />
        <span className="absolute -top-1 -right-1 flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
        </span>
      </div>
      <h3 className="font-heading text-xl font-bold text-foreground mb-1.5">
        Bienvenue sur Sinaps Support
      </h3>
      <p className="max-w-md text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
        Comment pouvons-nous vous aider aujourd&apos;hui ? Posez votre question ou utilisez les suggestions rapides ci-dessous.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-medium">
          <BotIcon className="size-3 text-primary" />
          IA Gemini 3.5 &amp; RAG
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-medium">
          ⚡ Réponses instantanées
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-medium">
          👤 Escalade humaine possible
        </span>
      </div>
    </div>
  )
}

export function ChatThread({ conversation }: { conversation: Conversation }) {
  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="px-4 py-5 sm:px-6">
            <Marker variant="separator">
              <MarkerContent>Aujourd&apos;hui</MarkerContent>
            </Marker>

            {conversation.messages.length === 0 && <EmptyConversationState />}

            {conversation.messages.map((message) => {
              const isClient = message.sender === "client"
              return (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={isClient}
                >
                  <Message align={isClient ? "end" : "start"}>
                    <MessageAvatar>
                      {message.sender === "ia" ? (
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                          <BotIcon className="size-4" />
                        </div>
                      ) : message.sender === "humain" ? (
                        <Avatar className="size-8 rounded-xl ring-2 ring-primary/20">
                          <AvatarImage
                            src={message.authorAvatar || "/placeholder.svg"}
                            alt={message.authorName ?? "Agent"}
                            className="rounded-xl"
                          />
                          <AvatarFallback className="rounded-xl">SA</AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="size-8 rounded-xl ring-2 ring-primary/20">
                          <AvatarImage
                            src={conversation.clientAvatar || "/placeholder.svg"}
                            alt={conversation.clientName}
                            className="rounded-xl"
                          />
                          <AvatarFallback className="rounded-xl">{getInitials(conversation.clientName)}</AvatarFallback>
                        </Avatar>
                      )}
                    </MessageAvatar>
                    <MessageContent>
                      {message.sender !== "client" && (
                        <MessageHeader>
                          {message.sender === "ia" ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="rounded-md bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                                🤖 Agent IA
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Gemini 3.5 + RAG
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                              {message.authorName}
                            </span>
                          )}
                        </MessageHeader>
                      )}
                      <Bubble
                        align={isClient ? "end" : "start"}
                        variant={isClient ? "default" : "secondary"}
                        className="group relative shadow-xs"
                      >
                        <BubbleContent className={`space-y-2 ${isClient ? "rounded-2xl rounded-tr-xs" : "rounded-2xl rounded-tl-xs"}`}>
                          {message.content && (
                            isClient ? (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            ) : (
                              <MarkdownContent content={message.content} />
                            )
                          )}

                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2 pt-1">
                              {message.attachments.map((att, i) => {
                                const fullUrl = safeAttachmentUrl(att.url)

                                if (att.type === "image") {
                                  return (
                                    <a key={i} href={fullUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                                      <img src={fullUrl} alt={att.name || "Image"} className="max-h-60 max-w-xs object-cover rounded-lg hover:opacity-90 transition-opacity" />
                                    </a>
                                  )
                                } else if (att.type === "video") {
                                  return (
                                    <video key={i} controls className="max-h-60 max-w-xs rounded-lg">
                                      <source src={fullUrl} />
                                      Votre navigateur ne supporte pas la vidéo.
                                    </video>
                                  )
                                } else {
                                  return (
                                    <a
                                      key={i}
                                      href={fullUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 rounded-lg bg-background/20 p-2 text-xs font-medium underline hover:bg-background/30"
                                    >
                                      <FileTextIcon className="size-4 shrink-0" />
                                      <span className="truncate">{att.name || "Télécharger la pièce jointe"}</span>
                                      <ExternalLinkIcon className="size-3 shrink-0 ml-auto" />
                                    </a>
                                  )
                                }
                              })}
                            </div>
                          )}
                        </BubbleContent>
                      </Bubble>
                      <MessageFooter className="flex items-center gap-2 text-xs">
                        <span>{message.time}</span>
                        {!isClient && message.content && (
                          <CopyMessageButton text={message.content} />
                        )}
                      </MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )
            })}

            {conversation.isTyping && (
              <MessageScrollerItem messageId="typing-indicator">
                <Message align="start">
                  <MessageAvatar>
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs animate-pulse">
                      <BotIcon className="size-4" />
                    </div>
                  </MessageAvatar>
                  <MessageContent>
                    <MessageHeader>
                      <Badge variant="secondary" className="rounded-md bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                        🤖 Agent IA
                      </Badge>
                    </MessageHeader>
                    <Bubble align="start" variant="secondary">
                      <BubbleContent className="rounded-xl rounded-tl-xs py-2.5 px-3.5 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                          <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                        </span>
                        <span className="text-xs text-muted-foreground font-medium ml-1">
                          Agent IA réfléchit...
                        </span>
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
