"use client"

import { BotIcon, FileTextIcon, ExternalLinkIcon } from "lucide-react"
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

export function ChatThread({ conversation }: { conversation: Conversation }) {
  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="px-4 py-5 sm:px-6">
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
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <BotIcon className="size-4" />
                        </div>
                      ) : message.sender === "humain" ? (
                        <Avatar className="size-8">
                          <AvatarImage
                            src={message.authorAvatar || "/placeholder.svg"}
                            alt={message.authorName ?? "Agent"}
                          />
                          <AvatarFallback>SA</AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="size-8">
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
                            <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary">
                              🤖 Agent IA
                            </Badge>
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
                      >
                        <BubbleContent className="rounded-2xl space-y-2">
                          {message.content && <p>{message.content}</p>}

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
                      <MessageFooter>{message.time}</MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )
            })}

            {conversation.isTyping && (
              <MessageScrollerItem messageId="typing-indicator">
                <Message align="start">
                  <MessageAvatar>
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <BotIcon className="size-4" />
                    </div>
                  </MessageAvatar>
                  <MessageContent>
                    <Bubble align="start" variant="secondary">
                      <BubbleContent className="rounded-2xl shimmer">en train d&apos;écrire...</BubbleContent>
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
