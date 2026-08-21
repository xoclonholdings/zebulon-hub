import { useEffect, useRef, useState } from "react";

import { COMMANDER_DOCK, type DockDestination } from "./commanderDock";

export function CommanderDock({ navigate }: { readonly navigate: (to: string) => void }) {
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openBranch) return;
    const onDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpenBranch(null);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [openBranch]);

  const go = (destination: DockDestination) => {
    if (destination.branch?.length) {
      setOpenBranch((current) => (current === destination.id ? null : destination.id));
      return;
    }
    setOpenBranch(null);
    navigate(destination.route);
  };

  return (
    <div
      ref={rootRef}
      data-testid="commander-dock"
      className="relative grid w-full grid-cols-5 overflow-visible rounded-xl border border-violet-200/10 bg-black/30 px-1 py-1.5 backdrop-blur-xl sm:px-2"
    >
      {COMMANDER_DOCK.tabs.map((tab, index) => {
        const { id, label, Icon, branch } = tab;
        return (
          <div key={id} className={`relative ${index ? "border-l border-white/[0.055]" : ""}`}>
              <button
                type="button"
                data-testid={`commander-tab-${id}`}
                onClick={() => go(tab)}
                aria-expanded={branch ? openBranch === id : undefined}
                className={`flex min-h-[54px] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-white/55 transition-colors hover:bg-white/[0.035] hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-200/40 sm:min-h-[62px] ${openBranch === id ? "bg-white/[0.035] text-cyan-100" : ""}`}
              >
                <Icon size={17} strokeWidth={1.35} />
                <span className="max-w-full truncate text-[7px] font-medium uppercase tracking-[0.11em] sm:text-[9px] sm:tracking-[0.16em]">{label}</span>
              </button>

              {branch && openBranch === id ? (
                <div data-testid={`commander-branch-${id}`} className="absolute bottom-[calc(100%+10px)] left-1/2 z-50 flex -translate-x-1/2 flex-col gap-1 rounded-xl border border-violet-300/15 bg-[rgba(6,8,20,0.98)] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                  {branch.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => { setOpenBranch(null); navigate(sub.route); }}
                      data-testid={`commander-branch-item-${sub.id}`}
                      className="flex min-h-[38px] items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors hover:bg-white/5 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-200/40"
                    >
                      <sub.Icon size={13} /> {sub.label}
                    </button>
                  ))}
                </div>
              ) : null}
          </div>
        );
      })}
    </div>
  );
}
