import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api, registerUnauthorizedHandler } from '../api/client';
import { userFromToken } from './authToken';

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

/** Restore a valid stored session or remove an unusable token. */
function initialUser(): User | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const user = userFromToken(token);
  if (!user) localStorage.removeItem('token');
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(initialUser);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => registerUnauthorizedHandler(logout), [logout]);

  function storeToken(token: string) {
    const nextUser = userFromToken(token);
    if (!nextUser) {
      logout();
      throw new Error('Invalid authentication token');
    }
    localStorage.setItem('token', token);
    setUser(nextUser);
  }

  async function login(username: string, password: string) {
    const { access_token } = await api.post<{ access_token: string }>('/auth/login', { username, password });
    storeToken(access_token);
  }

  async function register(username: string, password: string) {
    await api.post('/auth/register', { username, password });
    await login(username, password);
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
