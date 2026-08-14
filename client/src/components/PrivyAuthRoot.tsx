import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import type { ReactNode } from "react";

import { AuthProvider, type ExternalAuthAdapter } from "@/context/AuthContext";

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID?.trim() || "";
const polygonRpcUrl = import.meta.env.VITE_POLYGON_RPC_URL?.trim() || "";

const polygon = {
  id: 137,
  name: "Polygon",
  network: "polygon",
  nativeCurrency: {
    name: "Polygon",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: polygonRpcUrl ? [polygonRpcUrl] : [] },
    public: { http: polygonRpcUrl ? [polygonRpcUrl] : [] },
  },
  blockExplorers: {
    default: { name: "Polygonscan", url: "https://polygonscan.com" },
  },
} as any;

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
  // Admin secure-phrase access is intentionally independent from Privy configuration.
  // This keeps the administrative path available while Privy credentials are being provisioned.
  if (!privyAppId) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Migrated from the working ZWAP Privy contract.
        loginMethods: ["email"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        externalWallets: {
          enabled: false,
        } as any,
        ...(polygonRpcUrl
          ? {
              defaultChain: polygon,
              supportedChains: [polygon],
            }
          : {}),
        appearance: {
          theme: "dark",
          accentColor: "#22d3ee",
        },
      }}
    >
      <PrivyBackedAuthProvider>{children}</PrivyBackedAuthProvider>
    </PrivyProvider>
  );
}
