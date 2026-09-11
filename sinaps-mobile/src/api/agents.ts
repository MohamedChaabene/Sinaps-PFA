import { apiRequest } from './client';

export interface AdminAgentItem {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'agent' | 'admin';
  status: 'pending' | 'approved';
  skills?: string[];
  avatar?: string;
  createdAt?: string;
}

export interface AdminStats {
  total: number;
  resolvedByIA: number;
  resolvedByHuman: number;
  avgSatisfaction: string;
  avgResponseTimeSeconds: number;
}

export async function fetchAgents(): Promise<AdminAgentItem[]> {
  return apiRequest<AdminAgentItem[]>('/agents', {
    method: 'GET',
  });
}

export async function approveAgent(id: string): Promise<any> {
  return apiRequest(`/agents/${id}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectAgent(id: string): Promise<any> {
  return apiRequest(`/agents/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>('/stats', {
    method: 'GET',
  });
}
