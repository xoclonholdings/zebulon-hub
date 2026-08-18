import { useEffect } from "react";
import { API_BASE } from "@/lib/apiBase";

export default function ZarGateway() {
  const authority = API_BASE || window.location.origin;

  useEffect(() => {
    window.location.assign(`${authority}/api/sso/authorize?client=zar`);
  }, [authority]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-black px-4 text-center text-white">
      <p className="text-sm text-white/55">Opening ZAR with your ZCOS identity…</p>
    </main>
  );
}
