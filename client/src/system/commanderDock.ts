import {
  BookOpen,
  Database,
  FileText,
  FolderOpen,
  History,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
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
    },
    {
      id: "upload",
      label: "Upload",
      Icon: Upload,
      route: "/zar",
      branch: [
        { id: "upload-image", label: "Image", Icon: ImageIcon, route: "/zar" },
        { id: "upload-document", label: "Document", Icon: FileText, route: "/zar" },
        { id: "upload-other", label: "Other file", Icon: Paperclip, route: "/zar" },
      ],
    },
    { id: "memory", label: "All Memory", Icon: Database, route: "/command/memory" },
    { id: "knowledge", label: "All Knowledge", Icon: BookOpen, route: "/command/knowledge" },
    { id: "projects", label: "All Projects", Icon: FolderOpen, route: "/command/projects" },
  ],
  buttons: [
    { id: "history", label: "History", Icon: History, route: "/history" },
    { id: "admin", label: "Admin Access", Icon: ShieldCheck, route: "/command/access" },
  ],
};
