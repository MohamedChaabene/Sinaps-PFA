import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredSession, saveSession, clearSession } from '../utils/storage';
import { findOrCreateUser as apiFindOrCreateUser, loginAgent as apiLoginAgent } from '../api/auth';
import { disconnectSocket } from '../socket/socket';

export type UserRole = 'client' | 'agent' | 'admin';

export interface AuthUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  skills?: string[];
  status?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, email: string, credential?: string, avatar?: string) => Promise<void>;
  loginAgent: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('client');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await getStoredSession();
        if (stored?.token && stored?.user) {
          setUser({
            ...stored.user,
            role: stored.role || (stored.user.role as UserRole) || 'client',
          });
          setToken(stored.token);
          setRole(stored.role || (stored.user.role as UserRole) || 'client');
        }
      } catch (error) {
        console.warn('Failed restoring auth session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (name: string, email: string, credential?: string, avatar?: string) => {
    setIsLoading(true);
    try {
      const res = await apiFindOrCreateUser(name, email, credential, avatar);
      if (res?.token && res?.user) {
        const authUser: AuthUser = {
          ...res.user,
          role: 'client',
        };
        await saveSession(authUser, res.token, 'client');
        setUser(authUser);
        setToken(res.token);
        setRole('client');
      } else {
        throw new Error('Réponse de connexion client invalide');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAgent = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiLoginAgent(email, password);
      if (res?.token && res?.agent) {
        const agentRole: UserRole = res.agent.role || 'agent';
        const authUser: AuthUser = {
          _id: res.agent._id || res.agent.id || '',
          id: res.agent.id || res.agent._id,
          name: res.agent.name,
          email: res.agent.email,
          role: agentRole,
          avatar: res.agent.avatar,
          skills: res.agent.skills,
          status: res.agent.status,
        };
        await saveSession(authUser, res.token, agentRole);
        setUser(authUser);
        setToken(res.token);
        setRole(agentRole);
      } else {
        throw new Error('Identifiants invalides');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      disconnectSocket();
      await clearSession();
      setUser(null);
      setToken(null);
      setRole('client');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginAgent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
