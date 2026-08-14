import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AuthUser = {
  id?: string | number;
  username: string;
  displayName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
  role?: string;
};

export type ExternalAuthAdapter = {
  ready: boolean;
  authenticated: boolean;
  userId: string | null;
  getAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function establishPrivySession(getAccessToken: () => Promise<string | null>) {
  const accessToken = (await getAccessToken())?.trim();
  if (!accessToken) throw new Error("Privy did not return an access token. Sign in again.");

  const response = await fetch("/api/auth/privy/session", {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await readJson(response);
  if (!response.ok || !data.success) {
    throw new Error(data.error || "ZCOS could not verify this Privy session.");
  }
}

export function AuthProvider({
  children,
  externalAuth,
}: {
  children: ReactNode;
  externalAuth?: ExternalAuthAdapter;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const synchronizedPrivyUserRef = useRef<string | null>(null);
  const synchronizationRef = useRef<Promise<AuthUser | null> | null>(null);

  async function readSession(): Promise<AuthUser | null> {
    try {
      const response = await fetch("/api/me", { credentials: "include" });
      if (!response.ok) return null;
      const data = await readJson(response);
      return data?.user ?? null;
    } catch {
      return null;
    }
  }

  async function synchronizeSession(): Promise<AuthUser | null> {
    let sessionUser = await readSession();
    if (
      !sessionUser &&
      externalAuth?.ready &&
      externalAuth.authenticated &&
      externalAuth.userId &&
      synchronizedPrivyUserRef.current !== externalAuth.userId
    ) {
      if (!synchronizationRef.current) {
        synchronizationRef.current = establishPrivySession(externalAuth.getAccessToken)
          .then(async () => {
            const established = await readSession();
            if (!established) throw new Error("ZCOS could not establish the secure session.");
            synchronizedPrivyUserRef.current = externalAuth.userId;
            return established;
          })
          .finally(() => {
            synchronizationRef.current = null;
          });
      }
      sessionUser = await synchronizationRef.current;
    }
    return sessionUser;
  }

  async function refresh() {
    setIsLoading(true);
    setAuthError("");
    try {
      setUser(await synchronizeSession());
    } catch (error) {
      setUser(null);
      setAuthError(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {
      // Keep the client signed out even if the remote session is already unavailable.
    }
    try {
      await externalAuth?.logout();
    } catch {
      // The HttpOnly session has already been cleared above.
    }
    synchronizedPrivyUserRef.current = null;
    synchronizationRef.current = null;
    setAuthError("");
    setUser(null);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (externalAuth && !externalAuth.ready) return;
      setIsLoading(true);
      setAuthError("");
      try {
        const sessionUser = await synchronizeSession();
        if (active) setUser(sessionUser);
      } catch (error) {
        if (active) {
          setUser(null);
          setAuthError(error instanceof Error ? error.message : "Sign-in failed.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [externalAuth?.ready, externalAuth?.authenticated, externalAuth?.userId]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        authError,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
