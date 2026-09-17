import { ChatMessage, Conversation } from '../types/chat';

export function formatMessageTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function mapBackendMessage(msg: any): ChatMessage {
  return {
    id: msg._id || msg.id || `${Date.now()}-${Math.random()}`,
    sender: msg.sender,
    authorName: msg.authorName,
    authorAvatar: msg.authorAvatar,
    content: msg.content || '',
    attachments: (msg.attachments || []).map((att: any) => ({
      url: att.url,
      type: att.type || 'image',
      name: att.name,
      size: att.size,
    })),
    quickReplies: msg.quickReplies || [],
    time: formatMessageTime(msg.createdAt),
    createdAt: msg.createdAt || new Date().toISOString(),
  };
}

export function mapBackendConversation(conv: any, messages: any[] = []): Conversation {
  return {
    id: conv._id,
    client: {
      _id: conv.client?._id || conv.client || '',
      name: conv.client?.name || 'Client',
      email: conv.client?.email || '',
      avatar: conv.client?.avatar || '',
    },
    assignedAgent: conv.assignedAgent
      ? {
          _id: conv.assignedAgent._id || conv.assignedAgent,
          name: conv.assignedAgent.name || 'Agent Sinaps',
          avatar: conv.assignedAgent.avatar,
          email: conv.assignedAgent.email,
        }
      : null,
    status: conv.status || 'en_cours',
    handledBy: conv.handledBy || 'ia',
    satisfaction: conv.satisfaction,
    lastMessage: messages.length > 0 ? messages[messages.length - 1].content : '',
    messages: messages.map(mapBackendMessage),
    createdAt: conv.createdAt || new Date().toISOString(),
    updatedAt: conv.updatedAt || new Date().toISOString(),
  };
}

export function resolveAttachmentUrl(baseUrl: string, rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanBase = baseUrl.replace(/\/api\/?$/, '');
  if (trimmed.startsWith('/')) {
    return `${cleanBase}${trimmed}`;
  }
  return `${cleanBase}/${trimmed}`;
}
