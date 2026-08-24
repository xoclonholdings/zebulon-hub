import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { COMMANDER_DOCK, type CommanderSurfaceId, type DockDestination } from "./commanderDock";
import { apiUrl } from "@/lib/queryClient";

const SURFACES = [...COMMANDER_DOCK.tabs, ...COMMANDER_DOCK.buttons] as readonly DockDestination[];

function surfaceById(id: CommanderSurfaceId): DockDestination {
  return SURFACES.find((surface) => surface.id === id) ?? COMMANDER_DOCK.tabs[0];
}

function Waveform() {
  return (
    <div className="zcos-console-wave" aria-hidden="true">
      {[3, 6, 10, 5, 13, 8, 4, 11, 7, 14, 9, 5, 12, 6, 3, 8, 5].map((height, index) => (
        <span key={`${height}-${index}`} style={{ height }} />
      ))}
    </div>
  );
}

export interface CommanderChatMessage {
  readonly id: string;
  readonly text: string;
}

function ChatSurface({ messages }: { readonly messages: readonly CommanderChatMessage[] }) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  return (
    <div className="zcos-console-chat">
      <div ref={logRef} className="zcos-console-chat-log" aria-live="polite">
        {messages.map((message) => (
          <p key={message.id} className="zcos-console-chat-message">{message.text}</p>
        ))}
      </div>
    </div>
  );
}

function UploadSurface() {
  const inputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef("other");
  const [status, setStatus] = useState<{ state: "idle" | "uploading" | "stored" | "error"; text: string }>({ state: "idle", text: "" });
  const uploadOptions = COMMANDER_DOCK.tabs.find((surface) => surface.id === "upload")?.branch ?? [];

  const openPicker = (id: string) => {
    if (!inputRef.current) return;
    categoryRef.current = id === "upload-image" ? "image" : id === "upload-document" ? "document" : "other";
    inputRef.current.accept = id === "upload-image"
      ? "image/*"
      : id === "upload-document"
        ? ".pdf,.doc,.docx,.txt,.rtf"
        : "";
    inputRef.current.click();
  };

  const uploadFile = async (file: File) => {
    setStatus({ state: "uploading", text: file.name });
    const body = new FormData();
    body.append("category", categoryRef.current);
    body.append("file", file);
    try {
      const response = await fetch(apiUrl("/api/zcos/files"), { method: "POST", body, credentials: "include" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Upload failed");
      setStatus({ state: "stored", text: result.file?.originalName || file.name });
    } catch (error) {
      setStatus({ state: "error", text: error instanceof Error ? error.message : "Upload failed" });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="zcos-console-menu" data-testid="commander-upload-menu">
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void uploadFile(file);
        }}
      />
      {uploadOptions.map(({ id, label, Icon }) => (
        <button key={id} type="button" onClick={() => openPicker(id)} disabled={status.state === "uploading"}>
          <span className="zcos-console-menu-icon"><Icon size={18} /></span>
          <span>{label}</span>
        </button>
      ))}
      {status.state !== "idle" ? (
        <div className={`zcos-console-upload-status is-${status.state}`} role="status">
          <span>{status.state === "uploading" ? "Uploading" : status.state === "stored" ? "Uploaded" : "Upload failed"}</span>
          <strong>{status.text}</strong>
        </div>
      ) : null}
    </div>
  );
}

function SurfaceContent({
  id,
  chatMessages,
}: {
  readonly id: CommanderSurfaceId;
  readonly chatMessages: readonly CommanderChatMessage[];
}) {
  if (id === "chat") return <ChatSurface messages={chatMessages} />;
  if (id === "upload") return <UploadSurface />;
  return <div className="zcos-console-void" aria-hidden="true" />;
}

export function CommanderConsoleScreen({
  windows,
  activeId,
  onActivate,
  onPrevious,
  onNext,
  onMinimize,
  chatMessages,
  reducedMotion,
}: {
  readonly windows: readonly CommanderSurfaceId[];
  readonly activeId: CommanderSurfaceId;
  readonly onActivate: (id: CommanderSurfaceId) => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onMinimize: () => void;
  readonly chatMessages: readonly CommanderChatMessage[];
  readonly reducedMotion: boolean;
}) {
  const activeSurface = surfaceById(activeId);
  const activeIndex = windows.indexOf(activeId);
  const previousId = windows.length > 1 ? windows[(activeIndex - 1 + windows.length) % windows.length] : null;
  const nextId = windows.length > 1 ? windows[(activeIndex + 1) % windows.length] : null;

  const finishDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x <= -60) onNext();
    if (info.offset.x >= 60) onPrevious();
  };

  return (
    <motion.div
      className="zcos-console-deck"
      data-testid="commander-console-screen"
      initial={reducedMotion ? false : { y: "108%", opacity: 0.5 }}
      animate={{ y: 0, opacity: 1 }}
      exit={reducedMotion ? undefined : { y: "108%", opacity: 0.35 }}
      transition={{ duration: reducedMotion ? 0 : 0.48, ease: [0.22, 0.78, 0.2, 1] }}
    >
      {previousId ? (
        <button
          type="button"
          className="zcos-console-peek zcos-console-peek-left"
          onClick={() => onActivate(previousId)}
          aria-label={`Show ${surfaceById(previousId).label}`}
        >
          <ChevronLeft size={15} />
        </button>
      ) : null}

      {nextId ? (
        <button
          type="button"
          className="zcos-console-peek zcos-console-peek-right"
          onClick={() => onActivate(nextId)}
          aria-label={`Show ${surfaceById(nextId).label}`}
        >
          <ChevronRight size={15} />
        </button>
      ) : null}

      <motion.section
        className="zcos-console-window"
        drag={windows.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragEnd={finishDrag}
      >
        <div className="zcos-console-window-rail" aria-hidden="true" />
        <header className="zcos-console-window-header">
          <activeSurface.Icon size={15} strokeWidth={1.4} />
          <span>{activeSurface.label}</span>
        </header>

        <div className="zcos-console-window-body">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeId}
              className="zcos-console-surface"
              initial={reducedMotion ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, x: -18 }}
              transition={{ duration: reducedMotion ? 0 : 0.18 }}
            >
              <SurfaceContent id={activeId} chatMessages={chatMessages} />
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="zcos-console-window-footer">
          <Waveform />
          <button type="button" onClick={onMinimize} aria-label="Minimize console and return to Galaxy view">
            <ChevronDown size={15} />
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}
