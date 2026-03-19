import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  fetchCurrentSession,
  login as loginRequest,
  logout as logoutRequest,
  type AdminSession,
} from "../services/auth";


type AuthContextValue = {
  session: AdminSession | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const nextSession = await fetchCurrentSession();
      setSession(nextSession);
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const login = async (username: string, password: string) => {
    const nextSession = await loginRequest({ username, password });
    setSession(nextSession);
  };

  const logout = async () => {
    await logoutRequest();
    setSession(null);
  };

  const value = useMemo(
    () => ({
      session,
      isLoading,
      login,
      logout,
      refreshSession,
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
