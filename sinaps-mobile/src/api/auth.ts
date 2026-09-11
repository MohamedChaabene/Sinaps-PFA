import { apiRequest } from './client';
import { AuthResponse } from '../types/api';

export interface AgentLoginResponse {
  agent: {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role: 'agent' | 'admin';
    status: 'pending' | 'approved';
    skills?: string[];
    avatar?: string;
  };
  token: string;
}

export async function findOrCreateUser(
  name: string,
  email: string,
  credential?: string,
  avatar?: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/users/find-or-create', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      credential,
      avatar,
    }),
  });
}

export async function loginAgent(email: string, password: string): Promise<AgentLoginResponse> {
  return apiRequest<AgentLoginResponse>('/agents/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
}
