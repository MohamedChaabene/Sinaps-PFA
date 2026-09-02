export type ConversationStatus = "resolu" | "en_cours" | "en_attente"

export type MessageSender = "client" | "ia" | "humain"

export interface ChatMessage {
  id: string
  sender: MessageSender
  authorName?: string
  authorAvatar?: string
  content: string
  time: string
}

export interface Conversation {
  id: string
  clientName: string
  clientAvatar: string
  lastMessage: string
  unreadCount: number
  status: ConversationStatus
  isTyping?: boolean
  messages: ChatMessage[]
}

export const statusLabels: Record<ConversationStatus, string> = {
  resolu: "Résolu",
  en_cours: "En cours",
  en_attente: "En attente",
}

export const conversations: Conversation[] = [
  {
    id: "1",
    clientName: "Léa Fontaine",
    clientAvatar: "/avatar-woman-brown-hair.png",
    lastMessage: "Ma commande n'est toujours pas arrivée 😕",
    unreadCount: 2,
    status: "en_cours",
    isTyping: true,
    messages: [
      {
        id: "m1",
        sender: "client",
        content: "Bonjour ! J'ai commandé il y a 6 jours et le colis n'est toujours pas arrivé 😕",
        time: "09:12",
      },
      {
        id: "m2",
        sender: "ia",
        content:
          "Bonjour Léa 👋 Je suis désolé pour ce retard ! Je vérifie tout de suite le statut de votre commande, un instant 🔍",
        time: "09:12",
      },
      {
        id: "m3",
        sender: "ia",
        content:
          "J'ai trouvé votre commande #48291. Elle est actuellement bloquée en centre de tri depuis 2 jours. Voulez-vous que je lance une réclamation auprès du transporteur ?",
        time: "09:13",
      },
      {
        id: "m4",
        sender: "client",
        content: "Oui merci, ça serait super. Vous pouvez aussi me dire si un remboursement est possible ?",
        time: "09:15",
      },
      {
        id: "m5",
        sender: "client",
        content: "Ma commande n'est toujours pas arrivée 😕",
        time: "09:16",
      },
    ],
  },
  {
    id: "2",
    clientName: "Karim Belhadj",
    clientAvatar: "/avatar-man-glasses.png",
    lastMessage: "Parfait, merci beaucoup ! 🙏",
    unreadCount: 0,
    status: "resolu",
    messages: [
      {
        id: "m1",
        sender: "client",
        content: "Je n'arrive pas à changer mon mot de passe, la page reste bloquée",
        time: "Hier",
      },
      {
        id: "m2",
        sender: "ia",
        content: "Bonjour Karim 👋 Essayons ensemble ! Pouvez-vous me dire quel navigateur vous utilisez ?",
        time: "Hier",
      },
      {
        id: "m3",
        sender: "client",
        content: "Chrome sur mon téléphone",
        time: "Hier",
      },
      {
        id: "m4",
        sender: "humain",
        authorName: "Sophie · Support",
        authorAvatar: "/avatar-support-agent-woman.png",
        content: "Bonjour Karim, je prends le relais ! J'ai réinitialisé le cache de votre session, pouvez-vous réessayer maintenant ? 🔄",
        time: "Hier",
      },
      {
        id: "m5",
        sender: "client",
        content: "Parfait, merci beaucoup ! 🙏",
        time: "Hier",
      },
    ],
  },
  {
    id: "3",
    clientName: "Amélie Rousseau",
    clientAvatar: "/avatar-woman-curly-hair.png",
    lastMessage: "D'accord, j'attends votre retour alors.",
    unreadCount: 5,
    status: "en_attente",
    messages: [
      {
        id: "m1",
        sender: "client",
        content: "Bonjour, je souhaite savoir si l'article \"Sac week-end\" existe en bleu marine ?",
        time: "11:02",
      },
      {
        id: "m2",
        sender: "ia",
        content: "Bonjour Amélie ! 🤖 Je vérifie le stock pour vous tout de suite, un instant ✨",
        time: "11:03",
      },
      {
        id: "m3",
        sender: "ia",
        content:
          "Je transmets votre question à un membre de notre équipe pour confirmer la disponibilité exacte en boutique.",
        time: "11:04",
      },
      {
        id: "m4",
        sender: "client",
        content: "D'accord, j'attends votre retour alors.",
        time: "11:05",
      },
    ],
  },
  {
    id: "4",
    clientName: "Thomas Girard",
    clientAvatar: "/avatar-man-beard.png",
    lastMessage: "Super, tout fonctionne maintenant 🎉",
    unreadCount: 0,
    status: "resolu",
    messages: [
      {
        id: "m1",
        sender: "client",
        content: "La facture de mon abonnement n'est pas téléchargeable",
        time: "Lundi",
      },
      {
        id: "m2",
        sender: "ia",
        content: "Bonjour Thomas, je regarde ça immédiatement 📄",
        time: "Lundi",
      },
      {
        id: "m3",
        sender: "ia",
        content: "C'est corrigé ! Votre facture de janvier est maintenant disponible dans votre espace client.",
        time: "Lundi",
      },
      {
        id: "m4",
        sender: "client",
        content: "Super, tout fonctionne maintenant 🎉",
        time: "Lundi",
      },
    ],
  },
  {
    id: "5",
    clientName: "Nadia El Amrani",
    clientAvatar: "/avatar-woman-headscarf.png",
    lastMessage: "Je souhaite parler à un vrai conseiller",
    unreadCount: 1,
    status: "en_cours",
    messages: [
      {
        id: "m1",
        sender: "client",
        content: "Bonjour, mon code promo ne fonctionne pas au moment de payer",
        time: "14:20",
      },
      {
        id: "m2",
        sender: "ia",
        content: "Bonjour Nadia 👋 Pouvez-vous me communiquer le code utilisé ?",
        time: "14:21",
      },
      {
        id: "m3",
        sender: "client",
        content: "BIENVENUE10",
        time: "14:22",
      },
      {
        id: "m4",
        sender: "ia",
        content: "Ce code est réservé aux nouveaux comptes. Je comprends la confusion, souhaitez-vous que je vous mette en relation avec un agent ?",
        time: "14:23",
      },
      {
        id: "m5",
        sender: "client",
        content: "Je souhaite parler à un vrai conseiller",
        time: "14:24",
      },
    ],
  },
]
