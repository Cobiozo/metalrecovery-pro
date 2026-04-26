import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getAuthApiBase } from "@/lib/api";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: "admin" | "user" | "vip";
  isActive: boolean;
  emailVerified: boolean;
  aiUsageCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authHeaders: () => Record<string, string>;
  isAdmin: boolean;
  isVip: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "mrp_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback((): Record<string, string> => {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);

  const fetchMe = useCallback(async (tok: string) => {
    try {
      const res = await fetch(`${getAuthApiBase()}/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setUser(data as AuthUser);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${getAuthApiBase()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Błąd logowania");
    const { token: tok, user: u } = data as { token: string; user: AuthUser };
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    const tok = localStorage.getItem(TOKEN_KEY);
    if (tok) {
      await fetch(`${getAuthApiBase()}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";
  const isVip = user?.role === "vip" || user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authHeaders, isAdmin, isVip }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
