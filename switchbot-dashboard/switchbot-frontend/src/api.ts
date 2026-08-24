import { API_URL } from "./constants";
import type {
  HistoryResponse,
  MetersResponse,
  StatusResponse,
  TimeScale
} from "./types";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // Keep the HTTP status when the response is not JSON.
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export function fetchMeters(): Promise<MetersResponse> {
  return request<MetersResponse>("/api/meters");
}

export function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>("/api/status");
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale });
  return request<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${params.toString()}`
  );
}

export function triggerRefresh(): Promise<{ status: string }> {
  return request<{ status: string }>("/api/meters/refresh", { method: "POST" });
}
