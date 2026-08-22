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
  readonly branch?: readonly DockDestination[];
}

export type CommanderSurfaceId =
  | "chat"
  | "upload"
  | "memory"
  | "knowledge"
  | "projects"
  | "history"
  | "admin";

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
    },
    {
      id: "upload",
      label: "Upload",
      Icon: Upload,
      branch: [
        { id: "upload-image", label: "Image", Icon: ImageIcon },
        { id: "upload-document", label: "Document", Icon: FileText },
        { id: "upload-other", label: "Other file", Icon: Paperclip },
      ],
    },
    { id: "memory", label: "Memory", Icon: Database },
    { id: "knowledge", label: "Knowledge", Icon: BookOpen },
    { id: "projects", label: "Projects", Icon: FolderOpen },
  ],
  buttons: [
    { id: "history", label: "History", Icon: History },
    { id: "admin", label: "Admin Access", Icon: ShieldCheck },
  ],
};
