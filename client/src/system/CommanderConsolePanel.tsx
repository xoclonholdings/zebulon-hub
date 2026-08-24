import { ArrowUp } from "lucide-react";
import { useState } from "react";

import { CommanderDock } from "./CommanderDock";
import { COMMANDER_DOCK, type CommanderSurfaceId } from "./commanderDock";

export function CommanderConsolePanel({
  activeId,
  onSelect,
  onSendChat,
}: {
  readonly activeId: CommanderSurfaceId | null;
  readonly onSelect: (id: CommanderSurfaceId) => void;
  readonly onSendChat: (message: string) => void;
}) {
  const [chatDraft, setChatDraft] = useState("");

  const submitChat = () => {
    const message = chatDraft.trim();
    if (!message) return;
    onSendChat(message);
    setChatDraft("");
  };

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

      {activeId === "chat" ? (
        <form
          className="zcos-dock-chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            submitChat();
          }}
        >
          <textarea
            aria-label="Type to Chat"
            placeholder="Type to Chat"
            rows={1}
            value={chatDraft}
            onChange={(event) => setChatDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitChat();
              }
            }}
          />
          <button type="submit" aria-label="Send" disabled={!chatDraft.trim()}>
            <ArrowUp size={18} />
          </button>
        </form>
      ) : null}

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
