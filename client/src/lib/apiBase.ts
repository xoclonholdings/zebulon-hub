const configuredApiBase = String(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "",
).trim();

export const API_BASE = configuredApiBase.replace(/\/+$/, "");

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}
