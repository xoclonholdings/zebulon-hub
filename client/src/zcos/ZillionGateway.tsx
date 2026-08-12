import { useEffect } from "react";
import { Landmark } from "lucide-react";

export const ZILLION_OPERATOR_PATH = "/workspaces/finance";

export function zillionOperatorUrl(origin: string): string | null {
  const clean = origin.trim();
  if (!clean) return null;
  return new URL(ZILLION_OPERATOR_PATH, clean.endsWith("/") ? clean : clean + "/").toString();
}

export default function ZillionGateway() {
  const destination = zillionOperatorUrl(import.meta.env.VITE_ZAR_APP_URL || "");
  useEffect(() => {
    if (destination) window.location.assign(destination);
  }, [destination]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#02050b] px-4 text-center text-white">
      <section className="max-w-sm rounded-3xl border border-emerald-300/20 bg-black/45 p-6 backdrop-blur-xl">
        <Landmark className="mx-auto text-emerald-300" size={32} />
        <h1 className="mt-4 text-xl font-semibold">Opening ZILLION</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          {destination ? "ZAR is issuing your owner-scoped CAPITAL launch." : "The ZAR application origin is not configured."}
        </p>
        {destination && <a className="mt-5 inline-flex min-h-[44px] items-center rounded-full border border-emerald-300/25 px-4 text-sm text-emerald-100" href={destination}>Continue</a>}
      </section>
    </main>
  );
}
