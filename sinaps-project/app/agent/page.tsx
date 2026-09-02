"use client"

import { useRouter } from "next/navigation"
import { LogOutIcon } from "lucide-react"
import { logout } from "@/components/auth-guard"
import * as React from "react"
import { HeadsetIcon, CheckIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/chat/status-badge"
import { ChatThread } from "@/components/chat/chat-thread"
import { MessageComposer } from "@/components/chat/message-composer"
import { AuthGuard } from "@/components/auth-guard"
import { toast } from "sonner"
import type { Conversation } from "@/lib/chat-data"
import {
    fetchConversations,
    fetchConversationById,
    sendMessage as apiSendMessage,
    closeConversation as apiCloseConversation,
    mapBackendConversation,
} from "@/lib/api"

function initials(name: string) {
    return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

export default function AgentPage() {
    const [conversations, setConversations] = React.useState<Conversation[]>([])
    const [activeId, setActiveId] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)
    const router = useRouter()

    const activeConversation = conversations.find((c) => c.id === activeId) ?? null

    async function loadList() {
        try {
            const data = await fetchConversations()
            const pending = data.filter((c: any) => c.status === "en_attente")
            const mapped = pending.map((c: any) => mapBackendConversation(c, []))
            setConversations(mapped)
        } catch (error) {
            toast("Erreur de connexion au serveur")
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        loadList()
    }, [])

    async function handleSelect(id: string) {
        setActiveId(id)
        try {
            const { conversation, messages } = await fetchConversationById(id)
            const mapped = mapBackendConversation(conversation, messages)
            setConversations((prev) => prev.map((c) => (c.id === id ? mapped : c)))
        } catch (error) {
            toast("Erreur lors du chargement de la conversation")
        }
    }

    async function handleSend(text: string) {
        if (!activeConversation) return
        try {
            await apiSendMessage(activeConversation.id, "humain", text)
            const refreshed = await fetchConversationById(activeConversation.id)
            const mapped = mapBackendConversation(refreshed.conversation, refreshed.messages)
            setConversations((prev) => prev.map((c) => (c.id === activeConversation.id ? mapped : c)))
        } catch (error) {
            toast("Erreur lors de l'envoi du message")
        }
    }

    async function handleResolve() {
        if (!activeConversation) return
        try {
            await apiCloseConversation(activeConversation.id, 0, "")
            toast("Conversation marquée comme résolue ✅")
            setActiveId(null)
            loadList()
        } catch (error) {
            toast("Erreur lors de la clôture")
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
        )
    }

    return (
        <AuthGuard requiredRole="agent">
            <div className="flex h-screen w-full overflow-hidden bg-background">
                <aside className="w-72 shrink-0 border-r border-sidebar-border">
                    <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
                        <HeadsetIcon className="size-5 text-primary" />
                        <span className="font-heading text-sm font-bold">File d'attente agent</span>
                        <Button variant="ghost" size="icon-sm" onClick={() => logout(router)} className="ml-auto" aria-label="Déconnexion">
                            <LogOutIcon className="size-4" />
                        </Button>
                    </div>
                    <div className="flex flex-col">
                        {conversations.length === 0 && (
                            <p className="p-4 text-sm text-muted-foreground">Aucune conversation en attente 🎉</p>
                        )}
                        {conversations.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => handleSelect(c.id)}
                                className={`flex items-center gap-3 border-b border-sidebar-border px-4 py-3 text-left hover:bg-muted ${c.id === activeId ? "bg-muted" : ""
                                    }`}
                            >
                                <Avatar className="size-8">
                                    <AvatarImage src={c.clientAvatar || "/placeholder.svg"} />
                                    <AvatarFallback>{initials(c.clientName)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{c.clientName}</p>
                                    <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="flex min-w-0 flex-1 flex-col">
                    {activeConversation ? (
                        <>
                            <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-9">
                                        <AvatarImage src={activeConversation.clientAvatar || "/placeholder.svg"} />
                                        <AvatarFallback>{initials(activeConversation.clientName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-heading text-sm font-bold">{activeConversation.clientName}</p>
                                        <StatusBadge status={activeConversation.status} />
                                    </div>
                                </div>
                                <Button onClick={handleResolve} variant="secondary" size="sm" className="rounded-full">
                                    <CheckIcon data-icon="inline-start" />
                                    Marquer résolu
                                </Button>
                            </div>
                            <ChatThread conversation={activeConversation} />
                            <MessageComposer onSend={handleSend} />
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-sm text-muted-foreground">Sélectionnez une conversation à gauche.</p>
                        </div>
                    )}
                </main>
            </div>
        </AuthGuard>
    )
}