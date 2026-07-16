// Base URL for the backend API.
//
// - Normally the SPA is served by the FastAPI backend on the same origin, so
//   the base URL is an empty string and requests are made relative to the
//   current origin (e.g. "/api/meters").
// - During local development the Vite dev server proxies "/api" to the backend
//   on :8000, so an empty base URL works there too.
// - Only when the page is opened directly from disk (file:// protocol) do we
//   fall back to the production backend.
// - An explicit VITE_API_URL always takes precedence when provided.
function resolveApiUrl(): string {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    return "https://temp-master.fly.dev";
  }
  return "";
}

export const API_URL = resolveApiUrl();

// Frontend auto-refresh interval in milliseconds (matches the legacy dashboard).
export const REFRESH_INTERVAL = 30000;
