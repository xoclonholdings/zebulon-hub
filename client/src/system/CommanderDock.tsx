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
      className="relative flex w-full items-center justify-between gap-2 rounded-2xl border border-violet-300/15 bg-[linear-gradient(105deg,rgba(4,8,20,0.92),rgba(8,6,24,0.94),rgba(3,8,18,0.92))] px-3 py-2.5 shadow-[0_12px_55px_rgba(0,0,0,0.55),0_0_32px_rgba(124,58,237,0.1)] backdrop-blur-2xl sm:px-4"
    >
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {COMMANDER_DOCK.buttons.map(({ id, label, Icon, route }) => (
          <button
            key={id}
            type="button"
            data-testid={`commander-button-${id}`}
            onClick={() => navigate(route)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-1 text-white/55 transition-colors hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-200/40"
          >
            <Icon size={15} />
            <span className="hidden text-[9px] font-medium uppercase tracking-[0.16em] sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_2px_rgba(139,92,246,0.7)]" />
          <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-violet-200/70">Commander</span>
        </div>
        {COMMANDER_DOCK.tabs.map((tab) => {
          const { id, label, Icon, branch } = tab;
          return (
            <div key={id} className="relative">
              <button
                type="button"
                data-testid={`commander-tab-${id}`}
                onClick={() => go(tab)}
                aria-expanded={branch ? openBranch === id : undefined}
                className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-0.5 text-white/60 transition-colors hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-200/40 ${openBranch === id ? "text-cyan-100" : ""}`}
              >
                <Icon size={16} />
                <span className="text-[8px] font-medium uppercase tracking-[0.12em]">{label}</span>
              </button>

              {branch && openBranch === id ? (
                <div className="absolute bottom-[calc(100%+10px)] left-1/2 z-50 flex -translate-x-1/2 flex-col gap-1 rounded-xl border border-violet-300/15 bg-[rgba(6,8,20,0.97)] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                  {branch.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => { setOpenBranch(null); navigate(sub.route); }}
                      className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors hover:bg-white/5 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-200/40"
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
    </div>
  );
}
