import { useEffect, useState } from "react";
import { Command, LogOut } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export function CommanderHeader({
  onWordmarkClick,
  onCommand,
  context,
}: {
  readonly onWordmarkClick: () => void;
  readonly onCommand: () => void;
  readonly context: Readonly<{ label: string; color: string }> | null;
}) {
  const { logout } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex w-full items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex h-9 items-center gap-2 leading-none">
          <button
            type="button"
            onClick={onWordmarkClick}
            aria-label="Reset the Zebulon constellation"
            className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_14px_rgba(192,132,252,0.28)] focus:outline-none sm:text-3xl"
          >
            ZCOS
          </button>
        </div>
        <div className="flex h-4 items-center text-[8px] font-medium uppercase tracking-[0.2em] text-white/45 sm:text-[9px]">
          Zebulon Commander
        </div>
        <div className="mt-1 flex h-7 items-center gap-2">
          <button type="button" onClick={onCommand} className="inline-flex min-h-[28px] items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 text-[8px] uppercase tracking-[0.17em] text-white/50 backdrop-blur transition hover:text-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-200/35">
            <Command size={11} /> Command
          </button>
          {context ? (
            <div className="flex min-h-[28px] w-fit items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 backdrop-blur">
              <span
                className="block h-1.5 w-1.5 rounded-full"
                style={{ background: context.color, boxShadow: `0 0 8px 2px ${context.color}88` }}
              />
              <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-white/65">
                {context.label}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-2 text-right">
        <div className="hidden pt-0.5 sm:block">
          <p className="text-sm font-medium tracking-[0.08em] text-white/75">
            {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-white/35">
            {now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p className="mt-2 text-[7px] uppercase tracking-[0.16em] text-emerald-200/45">Authenticated · Command ready</p>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/45 backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-200/40"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
