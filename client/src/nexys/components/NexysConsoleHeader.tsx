import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export interface NexysHeaderContext {
  readonly label: string;
  readonly color: string;
}

export function NexysConsoleHeaderBrand({
  onWordmarkClick,
  wordmarkAriaLabel,
  context,
}: {
  readonly onWordmarkClick: () => void;
  readonly wordmarkAriaLabel: string;
  readonly context: NexysHeaderContext | null;
}) {
  const { logout } = useAuth();
  return (
    <div className="min-w-0">
      <div className="flex h-9 items-center gap-2 leading-none">
        <button type="button" onClick={onWordmarkClick} aria-label={wordmarkAriaLabel} className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent focus:outline-none sm:text-3xl">
          ZCOS
        </button>
        <button type="button" onClick={logout} aria-label="Sign out" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-200/40">
          <LogOut size={14} />
        </button>
      </div>
      <div className="flex h-4 items-center text-[9px] font-medium uppercase tracking-[0.12em] text-white/40">Zebulon Commander</div>
      <div className="flex h-6 items-center">
        {context && (
          <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 backdrop-blur">
            <span className="block h-1.5 w-1.5 rounded-full" style={{ background: context.color, boxShadow: `0 0 8px 2px ${context.color}88` }} />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">{context.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function NexysConsoleHeaderTelemetry({ visible }: { readonly visible: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!visible) return null;
  return (
    <div className="hidden text-right text-[9px] uppercase tracking-[0.12em] text-white/45 sm:block">
      <div>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      <div>{now.toLocaleDateString([], { month: "short", day: "numeric" })}</div>
    </div>
  );
}
