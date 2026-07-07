import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../api/client';

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwt(token: string): { sub: number; username: string } {
  return JSON.parse(atob(token.split('.')[1]));
}

function userFromToken(token: string): User | null {
  try {
    const { sub, username } = parseJwt(token);
    return { id: sub, username };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('token');
    return stored ? userFromToken(stored) : null;
  });

  function storeToken(token: string) {
    localStorage.setItem('token', token);
    setUser(userFromToken(token));
  }

  async function login(username: string, password: string) {
    const { access_token } = await api.post<{ access_token: string }>('/auth/login', { username, password });
    storeToken(access_token);
  }

  async function register(username: string, password: string) {
    await api.post('/auth/register', { username, password });
    await login(username, password);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
