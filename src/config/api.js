const BACKEND_ORIGIN = String(import.meta.env.VITE_BACKEND_ORIGIN || "")
  .trim()
  .replace(/\/+$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${normalizedPath}` : normalizedPath;
}
