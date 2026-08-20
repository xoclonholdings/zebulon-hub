import {
  BookOpen,
  Database,
  FolderOpen,
  History,
  MessageSquare,
  ShieldCheck,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface DockDestination {
  readonly id: string;
  readonly label: string;
  readonly Icon: LucideIcon;
  readonly route: string;
  readonly branch?: readonly DockDestination[];
}

export interface CommanderDockManifest {
  readonly tabs: readonly [DockDestination, DockDestination, DockDestination, DockDestination, DockDestination];
  readonly buttons: readonly DockDestination[];
}

export const COMMANDER_DOCK: CommanderDockManifest = {
  tabs: [
    {
      id: "chat",
      label: "Chat",
      Icon: MessageSquare,
      route: "/zar",
      branch: [{ id: "chat-talk", label: "Talk", Icon: MessageSquare, route: "/zar" }],
    },
    {
      id: "upload",
      label: "Upload",
      Icon: Upload,
      route: "/zar",
      branch: [
        { id: "upload-image", label: "Image", Icon: Upload, route: "/zar" },
        { id: "upload-document", label: "Document", Icon: Upload, route: "/zar" },
        { id: "upload-talk", label: "Talk", Icon: MessageSquare, route: "/zar" },
      ],
    },
    { id: "memory", label: "Memory", Icon: Database, route: "/command/memory" },
    { id: "knowledge", label: "Knowledge", Icon: BookOpen, route: "/command/knowledge" },
    { id: "projects", label: "Projects", Icon: FolderOpen, route: "/command/projects" },
  ],
  buttons: [
    { id: "history", label: "History", Icon: History, route: "/history" },
    { id: "admin", label: "Admin", Icon: ShieldCheck, route: "/command/access" },
  ],
};
