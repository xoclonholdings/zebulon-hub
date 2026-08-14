import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import type { ReactNode } from "react";

import { AuthProvider, type ExternalAuthAdapter } from "@/context/AuthContext";

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID?.trim() || "";

function PrivyBackedAuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const externalAuth: ExternalAuthAdapter = {
    ready,
    authenticated,
    userId: user?.id || null,
    getAccessToken,
    logout,
  };
  return <AuthProvider externalAuth={externalAuth}>{children}</AuthProvider>;
}

export default function PrivyAuthRoot({ children }: { children: ReactNode }) {
  if (!privyAppId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-6 text-center text-white">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold">ZAR sign-in is not configured</h1>
          <p className="mt-2 text-sm text-white/55">VITE_PRIVY_APP_ID is required for the universal ZCOS login.</p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["email"],
        appearance: { theme: "dark", accentColor: "#00f0ff" },
      }}
    >
      <PrivyBackedAuthProvider>{children}</PrivyBackedAuthProvider>
    </PrivyProvider>
  );
}
