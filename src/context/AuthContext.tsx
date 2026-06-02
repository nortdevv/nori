import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "../services/api";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY  = "nori_auth";
const TOKEN_KEY = "nori_token";
const USER_KEY  = "nori_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const logout = useCallback(() => {
    [AUTH_KEY, TOKEN_KEY, USER_KEY].forEach((k) => localStorage.removeItem(k));
    document.title = "Nori";
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // Restore session and validate JWT with auth-service
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (!token || localStorage.getItem(AUTH_KEY) !== "true") {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const { valid, user: payload } = await authApi.verify(token);
        if (!valid || !payload?.userId) {
          logout();
          if (!cancelled) setIsLoading(false);
          return;
        }

        const restored: AuthUser = storedUser
          ? JSON.parse(storedUser)
          : {
              id: payload.userId,
              email: payload.email,
              name: null,
              role: payload.role === 'admin' ? 'admin' : 'user',
            };

        if (payload.role && restored.role !== payload.role) {
          restored.role = payload.role === 'admin' ? 'admin' : 'user';
        }
        if (payload.userId) restored.id = payload.userId;
        if (payload.email) restored.email = payload.email;

        localStorage.setItem(USER_KEY, JSON.stringify(restored));
        if (!cancelled) {
          setUser(restored);
          setIsAuthenticated(true);
        }
      } catch {
        logout();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = async (email: string, password: string): Promise<void> => {
    const { token, user: apiUser } = await authApi.login(email, password);
    localStorage.setItem(AUTH_KEY,  "true");
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY,  JSON.stringify(apiUser));
    setIsAuthenticated(true);
    setUser(apiUser);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
