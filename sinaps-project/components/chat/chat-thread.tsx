import * as React from "react"
import { BotIcon, FileTextIcon, ExternalLinkIcon, CopyIcon, CheckIcon, Sparkles, User, ShieldCheck } from "lucide-react"
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
      title="Copier la réponse"
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground/70 transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-95"
    >
      {copied ? (
        <>
          <CheckIcon className="size-3 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copié</span>
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
      <div className="relative mb-5 flex items-center justify-center">
        <img
          src="/sinaps-logo-soft.png"
          alt="SINAPS"
          className="h-14 sm:h-16 w-auto object-contain drop-shadow-xs transition-transform hover:scale-105"
        />
      </div>
      <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground mb-1.5 tracking-tight">
        Bienvenue sur l&apos;assistance SINAPS
      </h3>
      <p className="max-w-md text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
        Comment pouvons-nous vous aider aujourd&apos;hui ? Posez votre question ou utilisez les suggestions rapides ci-dessous.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-semibold shadow-2xs">
          <BotIcon className="size-3 text-primary" />
          Gemini 1.5 &amp; RAG
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-semibold shadow-2xs">
          ⚡ Réponses temps réel
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-semibold shadow-2xs">
          <ShieldCheck className="size-3 text-emerald-500" />
          Relais humain disponible
        </span>
      </div>
    </div>
  )
}

export function ChatThread({ conversation }: { conversation: Conversation }) {
  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1 bg-background">
        <MessageScrollerViewport>
          <MessageScrollerContent className="px-4 py-6 sm:px-6 max-w-4xl mx-auto w-full space-y-4">
            <Marker variant="separator">
              <MarkerContent className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground/70">
                Session de support active
              </MarkerContent>
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
                  <Message align={isClient ? "end" : "start"} className="gap-2.5">
                    <MessageAvatar>
                      {message.sender === "ia" ? (
                        <div className="flex size-8.5 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20">
                          <BotIcon className="size-4.5" />
                        </div>
                      ) : message.sender === "humain" ? (
                        <Avatar className="size-8.5 rounded-xl ring-2 ring-blue-500/20 shadow-xs">
                          <AvatarImage
                            src={message.authorAvatar || "/placeholder.svg"}
                            alt={message.authorName ?? "Conseiller"}
                            className="rounded-xl object-cover"
                          />
                          <AvatarFallback className="rounded-xl bg-blue-500/10 text-blue-600 font-bold text-xs">
                            {getInitials(message.authorName || "Conseiller")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="size-8.5 rounded-xl ring-2 ring-primary/20 shadow-xs">
                          <AvatarImage
                            src={conversation.clientAvatar || "/placeholder.svg"}
                            alt={conversation.clientName}
                            className="rounded-xl object-cover"
                          />
                          <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xs">
                            {getInitials(conversation.clientName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </MessageAvatar>

                    <MessageContent className="max-w-[85%] sm:max-w-[75%] space-y-1">
                      {message.sender !== "client" && (
                        <MessageHeader className="mb-1">
                          {message.sender === "ia" ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                                <Sparkles className="size-3 text-primary" />
                                <span>SINAPS Copilot</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Gemini + RAG
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                <span>Conseiller Support</span>
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                {message.authorName || "Agent SINAPS"}
                              </span>
                            </div>
                          )}
                        </MessageHeader>
                      )}

                      <Bubble
                        align={isClient ? "end" : "start"}
                        variant={isClient ? "default" : "secondary"}
                        className="group relative"
                      >
                        <BubbleContent
                          className={`space-y-2.5 px-4 py-3 sm:px-4.5 sm:py-3.5 text-sm leading-relaxed shadow-xs transition-shadow ${
                            isClient
                              ? "rounded-2xl sm:rounded-[20px] rounded-br-xs sm:rounded-br-[5px] bg-primary text-primary-foreground border-transparent font-normal selection:bg-primary-foreground/20"
                              : message.sender === "humain"
                              ? "rounded-2xl sm:rounded-[20px] rounded-bl-xs sm:rounded-bl-[5px] border border-blue-200/80 bg-blue-50/70 text-foreground dark:border-blue-900/60 dark:bg-blue-950/25"
                              : "rounded-2xl sm:rounded-[20px] rounded-bl-xs sm:rounded-bl-[5px] border border-border/80 bg-card text-foreground"
                          }`}
                        >
                          {message.content && (
                            isClient ? (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : (
                              <MarkdownContent content={message.content} />
                            )
                          )}

                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2 pt-1.5 border-t border-border/40">
                              {message.attachments.map((att, i) => {
                                const fullUrl = safeAttachmentUrl(att.url)

                                if (att.type === "image") {
                                  return (
                                    <a
                                      key={i}
                                      href={fullUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block overflow-hidden rounded-xl border border-border/80 shadow-xs hover:border-primary/50 transition-colors"
                                    >
                                      <img
                                        src={fullUrl}
                                        alt={att.name || "Image jointe"}
                                        className="max-h-64 max-w-sm w-full object-cover hover:scale-[1.01] transition-transform duration-200"
                                      />
                                    </a>
                                  )
                                } else if (att.type === "video") {
                                  return (
                                    <video
                                      key={i}
                                      controls
                                      className="max-h-64 max-w-sm rounded-xl border border-border/80"
                                    >
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
                                      className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/50 p-2.5 text-xs font-medium text-foreground hover:bg-muted/70 hover:border-primary/40 transition-colors shadow-2xs"
                                    >
                                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                                        <FileTextIcon className="size-4" />
                                      </div>
                                      <span className="truncate flex-1 font-semibold">{att.name || "Document joint"}</span>
                                      <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                                    </a>
                                  )
                                }
                              })}
                            </div>
                          )}
                        </BubbleContent>
                      </Bubble>

                      <MessageFooter className="flex items-center gap-2 text-[11px] text-muted-foreground/80 px-1 pt-0.5">
                        <span>{message.time}</span>
                        {!isClient && message.content && (
                          <>
                            <span>•</span>
                            <CopyMessageButton text={message.content} />
                          </>
                        )}
                      </MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )
            })}

            {conversation.isTyping && (
              <MessageScrollerItem messageId="typing-indicator">
                <Message align="start" className="gap-2.5">
                  <MessageAvatar>
                    <div className="flex size-8.5 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs animate-pulse ring-2 ring-primary/20">
                      <BotIcon className="size-4.5" />
                    </div>
                  </MessageAvatar>
                  <MessageContent>
                    <Bubble align="start" variant="secondary" className="relative">
                      <BubbleContent className="rounded-2xl sm:rounded-[20px] rounded-bl-xs sm:rounded-bl-[5px] border border-border/80 bg-card py-2.5 px-4 flex items-center gap-2.5 shadow-2xs">
                        <span className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                          <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          SINAPS Copilot compose une réponse...
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
