import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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

  // On mount, restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (stored === "true") {
      setIsAuthenticated(true);
      if (storedUser) setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { token, user: apiUser } = await authApi.login(email, password);
    localStorage.setItem(AUTH_KEY,  "true");
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY,  JSON.stringify(apiUser));
    setIsAuthenticated(true);
    setUser(apiUser);
  };

  const logout = () => {
    [AUTH_KEY, TOKEN_KEY, USER_KEY].forEach((k) => localStorage.removeItem(k));
    document.title = "Nori";
    setIsAuthenticated(false);
    setUser(null);
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
