import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth as authApi, setToken, clearToken } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio?: string;
  is_private?: boolean;
  is_verified?: boolean;
  is_artist?: boolean;
  is_admin?: boolean;
  is_blocked?: boolean;
  block_count?: number;
  theme?: string;
  avatars?: { id: string; url: string; is_primary: boolean }[];
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; block_count?: number }>;
  register: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = localStorage.getItem('buzzzy_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authApi.me();
      if (data.error) {
        clearToken();
        setUser(null);
      } else {
        setUser(data);
        if (data.theme) {
          document.documentElement.setAttribute('data-theme', data.theme);
          localStorage.setItem('buzzzy_theme', data.theme);
        }
      }
    } catch {
      clearToken();
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('buzzzy_theme') || 'dark-green';
    document.documentElement.setAttribute('data-theme', savedTheme);
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      if (data.error) {
        return { error: data.error, block_count: data.block_count };
      }
      setToken(data.token);
      await refresh();
      return {};
    } catch (e: unknown) {
      const err = e as { error?: string; block_count?: number };
      return { error: err.error || 'Connection error', block_count: err.block_count };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const data = await authApi.register(username, email, password);
      if (data.error) return { error: data.error };
      setToken(data.token);
      await refresh();
      return {};
    } catch (e: unknown) {
      const err = e as { error?: string };
      return { error: err.error || 'Connection error' };
    }
  };

  const logout = () => {
    authApi.logout();
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function useAuth() {
  return useContext(AuthContext);
}
