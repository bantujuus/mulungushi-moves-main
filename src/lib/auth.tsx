import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Role = "staff" | "transport" | "security" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  sessionId: string | null;
  login: (user: AuthUser, sessionId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("mm_session");
    if (stored) {
      try {
        const { user, sessionId } = JSON.parse(stored);
        setUser(user);
        setSessionId(sessionId);
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = (u: AuthUser, sid: string) => {
    setUser(u);
    setSessionId(sid);
    localStorage.setItem("mm_session", JSON.stringify({ user: u, sessionId: sid }));
  };

  const logout = () => {
    setUser(null);
    setSessionId(null);
    localStorage.removeItem("mm_session");
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}