import { apiRequest } from './client';
import { ConversationResponse } from '../types/api';

export async function findOrCreateConversation(): Promise<any> {
  return apiRequest('/conversations/find-or-create', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchConversationById(id: string): Promise<ConversationResponse> {
  return apiRequest<ConversationResponse>(`/conversations/${id}`, {
    method: 'GET',
  });
}

export async function fetchAllConversations(status?: string, search?: string): Promise<any[]> {
  const params = [];
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return apiRequest<any[]>(`/conversations${query}`, {
    method: 'GET',
  });
}

export async function assignAgent(conversationId: string, agentId: string): Promise<any> {
  return apiRequest(`/conversations/${conversationId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ agentId }),
  });
}

export async function escalateConversation(id: string): Promise<any> {
  return apiRequest(`/conversations/${id}/escalate`, {
    method: 'PATCH',
  });
}

export async function deescalateConversation(id: string): Promise<any> {
  return apiRequest(`/conversations/${id}/de-escalate`, {
    method: 'PATCH',
  });
}

export async function sendQuickReply(
  id: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<any> {
  return apiRequest(`/conversations/${id}/quick-reply`, {
    method: 'POST',
    body: JSON.stringify({ action, metadata: metadata || {} }),
  });
}

export async function closeConversation(
  id: string,
  rating: number,
  comment: string = ''
): Promise<any> {
  return apiRequest(`/conversations/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify({ rating, comment }),
  });
}
