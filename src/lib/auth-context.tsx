import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as authApi, setToken, clearToken } from "./api";

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  is_private: boolean;
  is_verified: boolean;
  is_artist: boolean;
  is_admin: boolean;
  is_blocked: boolean;
  block_count: number;
  telegram: string;
  instagram: string;
  website: string;
  tiktok: string;
  youtube: string;
  show_likes: string;
  show_reposts: string;
  show_followers: string;
  show_following: string;
  show_friends: string;
  allow_messages: boolean;
  theme: string;
  avatars: { id: string; url: string; is_primary: boolean }[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; blocked?: boolean; block_count?: number }>;
  register: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      if (data.error) {
        setUser(null);
        clearToken();
      } else {
        setUser(data);
        if (data.theme) {
          document.documentElement.setAttribute("data-theme", data.theme);
          localStorage.setItem("buzzzy_theme", data.theme);
        }
      }
    } catch {
      setUser(null);
      clearToken();
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("buzzzy_theme") || "dark-green";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const token = localStorage.getItem("buzzzy_token");
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      if (data.error === "blocked") {
        return { error: "blocked", blocked: true, block_count: data.block_count };
      }
      if (data.error) return { error: data.error };
      setToken(data.token);
      await refreshUser();
      return {};
    } catch (e: unknown) {
      const err = e as { error?: string; block_count?: number };
      if (err.error === "blocked") return { error: "blocked", blocked: true, block_count: err.block_count };
      return { error: err.error || "Login failed" };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const data = await authApi.register(username, email, password);
      if (data.error) return { error: data.error };
      setToken(data.token);
      await refreshUser();
      return {};
    } catch (e: unknown) {
      return { error: (e as { error?: string }).error || "Registration failed" };
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
