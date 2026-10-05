// When served from the FastAPI backend (same origin), API_URL stays empty.
// When opened directly as a file:// URL, fall back to the production backend.
export const API_URL = window.location.protocol === 'file:' ? 'https://temp-master.fly.dev' : '';

export const REFRESH_INTERVAL = 30000;

export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year';

export const DEFAULT_TIME_SCALE: TimeScale = 'day';

export const TIME_SCALE_OPTIONS: ReadonlyArray<{ value: TimeScale; label: string }> = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];
