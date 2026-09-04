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
import type { Conversation } from "@/lib/chat-data"

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
  : "http://localhost:5000"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
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

export function ChatThread({ conversation }: { conversation: Conversation }) {
  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
            <Marker variant="separator">
              <MarkerContent>Aujourd&apos;hui</MarkerContent>
            </Marker>

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
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <BotIcon className="size-4" />
                        </div>
                      ) : message.sender === "humain" ? (
                        <Avatar className="size-8 ring-2 ring-primary/20">
                          <AvatarImage
                            src={message.authorAvatar || "/placeholder.svg"}
                            alt={message.authorName ?? "Agent"}
                          />
                          <AvatarFallback>SA</AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="size-8 ring-2 ring-primary/20">
                          <AvatarImage
                            src={conversation.clientAvatar || "/placeholder.svg"}
                            alt={conversation.clientName}
                          />
                          <AvatarFallback>{initials(conversation.clientName)}</AvatarFallback>
                        </Avatar>
                      )}
                    </MessageAvatar>
                    <MessageContent>
                      {message.sender !== "client" && (
                        <MessageHeader>
                          {message.sender === "ia" ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary text-[11px] font-medium">
                                Agent IA
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
                        <BubbleContent className="rounded-2xl space-y-2">
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
                                const fullUrl = att.url.startsWith("http") ? att.url : `${API_BASE}${att.url}`

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
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm animate-pulse">
                      <BotIcon className="size-4" />
                    </div>
                  </MessageAvatar>
                  <MessageContent>
                    <MessageHeader>
                      <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary text-[11px] font-medium">
                        Agent IA
                      </Badge>
                    </MessageHeader>
                    <Bubble align="start" variant="secondary">
                      <BubbleContent className="rounded-2xl py-3 px-4 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                          <span className="size-2 rounded-full bg-primary animate-bounce" />
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
