import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  fetchCurrentSession,
  login as loginRequest,
  logout as logoutRequest,
  type AdminSession,
} from "../services/auth";
import { unauthorizedEventName } from "../services/api";


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
  const expiryTimeoutRef = useRef<number | null>(null);

  const clearExpiryTimeout = () => {
    if (expiryTimeoutRef.current !== null) {
      window.clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }
  };

  const applySession = (nextSession: AdminSession | null) => {
    clearExpiryTimeout();

    if (nextSession === null) {
      setSession(null);
      return;
    }

    const expiresAtMs = Date.parse(nextSession.expires_at);
    if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
      setSession(null);
      return;
    }

    expiryTimeoutRef.current = window.setTimeout(() => {
      setSession(null);
      expiryTimeoutRef.current = null;
    }, expiresAtMs - Date.now());

    setSession(nextSession);
  };

  const refreshSession = async () => {
    try {
      const nextSession = await fetchCurrentSession();
      applySession(nextSession);
    } catch {
      applySession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearExpiryTimeout();
      setSession(null);
      setIsLoading(false);
    };

    window.addEventListener(unauthorizedEventName, handleUnauthorized);
    return () => {
      window.removeEventListener(unauthorizedEventName, handleUnauthorized);
      clearExpiryTimeout();
    };
  }, []);

  const login = async (username: string, password: string) => {
    const nextSession = await loginRequest({ username, password });
    applySession(nextSession);
  };

  const logout = async () => {
    await logoutRequest();
    applySession(null);
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
