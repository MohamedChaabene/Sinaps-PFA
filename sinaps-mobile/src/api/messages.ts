import { apiRequest } from './client';
import { SendMessageResponse } from '../types/api';
import { MessageAttachment } from '../types/chat';

export async function sendMessage(
  conversationId: string,
  content: string,
  attachments?: MessageAttachment[],
  sender: 'client' | 'humain' = 'client',
  authorName?: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>('/messages', {
    method: 'POST',
    body: JSON.stringify({
      conversationId,
      sender,
      content,
      authorName,
      attachments: attachments || [],
    }),
  });
}
