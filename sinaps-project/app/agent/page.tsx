"use client"

import { useRouter } from "next/navigation"
import { LogOutIcon, HeadsetIcon, CheckIcon, Zap, ChevronLeft, Loader2 } from "lucide-react"
import { logout } from "@/components/auth-guard"
import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { getSocket } from "@/lib/socket"

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

        const socket = getSocket()
        const handleCreatedOrUpdated = () => {
            loadList()
            if (activeId) {
                fetchConversationById(activeId).then(({ conversation, messages }) => {
                    const mapped = mapBackendConversation(conversation, messages)
                    setConversations((prev) => prev.map((c) => (c.id === activeId ? mapped : c)))
                }).catch(() => {})
            }
        }

        socket.on("conversation_created", handleCreatedOrUpdated)
        socket.on("conversation_updated", handleCreatedOrUpdated)
        socket.on("message_received", handleCreatedOrUpdated)

        return () => {
            socket.off("conversation_created", handleCreatedOrUpdated)
            socket.off("conversation_updated", handleCreatedOrUpdated)
            socket.off("message_received", handleCreatedOrUpdated)
        }
    }, [activeId])

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

    async function handleSend(text: string, attachments?: { url: string; type: string; name?: string }[]) {
        if (!activeConversation) return
        try {
            await apiSendMessage(activeConversation.id, "humain", text, attachments)
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
            <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Chargement de l'espace agent...</p>
            </div>
        )
    }

    return (
        <AuthGuard requiredRole="agent">
            <div className="flex h-screen w-full overflow-hidden bg-background">
                <aside
                    className={`${
                        activeId ? "hidden md:flex" : "flex"
                    } w-full md:w-80 shrink-0 border-r border-sidebar-border bg-sidebar/50 flex-col transition-all duration-200`}
                >
                    <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3.5 bg-card/60">
                        <HeadsetIcon className="size-5 text-primary" />
                        <span className="font-heading text-sm font-bold">File d'attente</span>
                        {conversations.length > 0 && (
                            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2">
                                {conversations.length}
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => logout(router)}
                            className="ml-auto rounded-full text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive"
                            aria-label="Déconnexion"
                            title="Se déconnecter"
                        >
                            <LogOutIcon className="size-4" />
                        </Button>
                    </div>
                    <div className="flex flex-col flex-1 overflow-y-auto">
                        {conversations.length === 0 && (
                            <div className="p-8 text-center text-sm text-muted-foreground space-y-2">
                                <p className="text-3xl">🎉</p>
                                <p className="font-semibold text-foreground">File d'attente vide</p>
                                <p className="text-xs leading-relaxed">Toutes les demandes clients sont traitées ou assignées !</p>
                            </div>
                        )}
                        {conversations.map((c) => {
                            const isSelected = c.id === activeId
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelect(c.id)}
                                    className={`flex items-start gap-3 border-b border-sidebar-border/60 px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                        isSelected
                                            ? "border-l-3 border-l-primary bg-primary/10 font-medium"
                                            : "hover:bg-muted/50"
                                    }`}
                                >
                                    <Avatar className="size-8.5 shrink-0 ring-1 ring-primary/20">
                                        <AvatarImage src={c.clientAvatar || "/placeholder.svg"} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                            {initials(c.clientName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className="truncate text-xs font-semibold text-foreground">{c.clientName}</p>
                                            <StatusBadge status={c.status} />
                                        </div>
                                        <p className="truncate text-xs text-muted-foreground mt-0.5">{c.lastMessage || "Nouveau message client..."}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </aside>

                <main
                    className={`${
                        !activeId ? "hidden md:flex" : "flex"
                    } min-w-0 flex-1 flex-col transition-all duration-200`}
                >
                    {activeConversation ? (
                        <>
                            <div className="flex items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur-xs px-4 py-3 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => setActiveId(null)}
                                        className="md:hidden -ml-2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                                        aria-label="Retour à la file d'attente"
                                        title="Retour à la file d'attente"
                                    >
                                        <ChevronLeft className="size-5" />
                                    </Button>
                                    <Avatar className="size-9 ring-2 ring-primary/20">
                                        <AvatarImage src={activeConversation.clientAvatar || "/placeholder.svg"} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(activeConversation.clientName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-heading text-sm font-bold">{activeConversation.clientName}</p>
                                        <div className="mt-0.5">
                                            <StatusBadge status={activeConversation.status} />
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleResolve}
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <CheckIcon className="size-3.5 text-success" data-icon="inline-start" />
                                    Marquer résolu
                                </Button>
                            </div>
                            <ChatThread conversation={activeConversation} />

                            {/* Canned Responses for Agent */}
                            <div className="border-t border-border/60 bg-muted/30 px-4 py-2 sm:px-6">
                                <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
                                    <div className="flex items-center gap-1 font-medium text-muted-foreground shrink-0">
                                        <Zap className="size-3.5 text-amber-500" />
                                        <span>Réponses types :</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {[
                                            "Bonjour, je prends en charge votre demande !",
                                            "J'ai bien vérifié votre dossier, tout est en ordre.",
                                            "Votre demande est résolue, merci pour votre confiance !",
                                        ].map((template, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSend(template)}
                                                className="inline-flex items-center rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-medium text-foreground/90 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            >
                                                {template}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <MessageComposer onSend={handleSend} />
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-6">
                            <div className="rounded-full bg-muted/60 p-4">
                                <HeadsetIcon className="size-10 text-muted-foreground/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-base font-semibold text-foreground">Aucune conversation sélectionnée</p>
                                <p className="max-w-sm text-xs text-muted-foreground">Sélectionnez une demande dans la file d'attente pour répondre au client.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AuthGuard>
    )
}