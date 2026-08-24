import path from "path";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const FILE_CATEGORIES = ["image", "document", "other"] as const;
export type FileCategory = typeof FILE_CATEGORIES[number];

const DOCUMENT_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".txt", ".rtf"]);

export function parseFileCategory(value: unknown): FileCategory {
  if (typeof value === "string" && FILE_CATEGORIES.includes(value as FileCategory)) {
    return value as FileCategory;
  }
  throw Object.assign(new Error("A valid upload category is required"), { status: 400 });
}

export function validateFileForCategory(file: Pick<Express.Multer.File, "originalname" | "mimetype" | "size">, category: FileCategory): void {
  if (!file.originalname.trim() || file.size < 1) {
    throw Object.assign(new Error("The selected file is empty"), { status: 400 });
  }
  if (category === "image" && !file.mimetype.toLowerCase().startsWith("image/")) {
    throw Object.assign(new Error("Image accepts image files only"), { status: 415 });
  }
  if (category === "document" && !DOCUMENT_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())) {
    throw Object.assign(new Error("Document accepts PDF, DOC, DOCX, TXT, or RTF files"), { status: 415 });
  }
}

export function safeDownloadName(value: string): string {
  return path.basename(value).replace(/[\r\n"\\]/g, "_") || "download";
}
