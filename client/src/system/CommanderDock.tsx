import { COMMANDER_DOCK, type CommanderSurfaceId } from "./commanderDock";

export function CommanderDock({
  activeId,
  onSelect,
}: {
  readonly activeId: CommanderSurfaceId | null;
  readonly onSelect: (id: CommanderSurfaceId) => void;
}) {
  return (
    <div
      data-testid="commander-dock"
      className="relative grid w-full grid-cols-5 overflow-visible rounded-xl border border-violet-200/10 bg-black/30 px-1 py-1.5 backdrop-blur-xl sm:px-2"
    >
      {COMMANDER_DOCK.tabs.map((tab, index) => {
        const { id, label, Icon } = tab;
        const isActive = activeId === id;
        return (
          <div key={id} className={`relative ${index ? "border-l border-white/[0.055]" : ""}`}>
              <button
                type="button"
                data-testid={`commander-tab-${id}`}
                onClick={() => onSelect(id as CommanderSurfaceId)}
                aria-pressed={isActive}
                className={`flex min-h-[54px] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-white/55 transition-colors hover:bg-white/[0.035] hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-200/40 sm:min-h-[62px] ${isActive ? "bg-cyan-300/[0.055] text-cyan-100" : ""}`}
              >
                <Icon size={17} strokeWidth={1.35} />
                <span className="max-w-full truncate text-[7px] font-medium uppercase tracking-[0.11em] sm:text-[9px] sm:tracking-[0.16em]">{label}</span>
              </button>
          </div>
        );
      })}
    </div>
  );
}
