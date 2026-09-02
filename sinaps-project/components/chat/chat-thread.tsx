"use client"

import { BotIcon } from "lucide-react"
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
                        <BubbleContent className="rounded-2xl">{message.content}</BubbleContent>
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
