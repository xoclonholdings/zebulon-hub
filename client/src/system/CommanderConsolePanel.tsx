import { Mic } from "lucide-react";

import { CommanderDock } from "./CommanderDock";
import { COMMANDER_DOCK, type CommanderSurfaceId } from "./commanderDock";

export function CommanderConsolePanel({
  activeId,
  onSelect,
}: {
  readonly activeId: CommanderSurfaceId | null;
  readonly onSelect: (id: CommanderSurfaceId) => void;
}) {
  return (
    <section data-testid="commander-console-panel" className="commander-console-panel">
      <header className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_9px_2px_rgba(110,231,183,0.6)]" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-violet-100/75">Commander</span>
          <span className="text-[8px] uppercase tracking-[0.18em] text-white/30">Online</span>
        </div>
      </header>

      <CommanderDock activeId={activeId} onSelect={onSelect} />

      <button
        type="button"
        data-testid="commander-voice"
        onClick={() => onSelect("chat")}
        className="mt-2 flex min-h-[78px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-violet-200/10 bg-black/30 text-white/45 transition hover:border-violet-200/20 hover:bg-white/[0.025] hover:text-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-200/35 sm:min-h-[98px]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-200/20 bg-violet-400/[0.06] shadow-[0_0_26px_rgba(139,92,246,0.12)]">
          <Mic size={17} strokeWidth={1.35} />
        </span>
      </button>

      <footer className="mt-2 flex items-center justify-between">
        {COMMANDER_DOCK.buttons.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            data-testid={`commander-button-${id}`}
            onClick={() => onSelect(id as CommanderSurfaceId)}
            aria-pressed={activeId === id}
            className={`inline-flex min-h-[34px] items-center gap-2 rounded-full border bg-black/20 px-3 text-[8px] font-medium uppercase tracking-[0.15em] transition focus:outline-none focus:ring-2 focus:ring-violet-200/35 ${activeId === id ? "border-cyan-200/25 text-cyan-100" : "border-white/[0.075] text-white/40 hover:border-violet-200/20 hover:text-violet-100"}`}
          >
            <Icon size={12} strokeWidth={1.4} /> {label}
          </button>
        ))}
      </footer>
    </section>
  );
}
