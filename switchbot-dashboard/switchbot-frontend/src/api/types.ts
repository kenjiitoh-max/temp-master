export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year'

export const TIME_SCALES: TimeScale[] = ['hour', 'day', 'week', 'month', 'year']

export const TIME_SCALE_LABELS: Record<TimeScale, string> = {
  hour: 'Last Hour',
  day: 'Last 24 Hours',
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  year: 'Last Year',
}

export interface Meter {
  device_id: string
  device_name: string
  device_type: string
  hub_device_id: string | null
  current_temperature: number | null
  current_humidity: number | null
  battery: number | null
  last_updated: string | null
}

export interface Reading {
  timestamp: string
  temperature: number
  humidity: number
  battery: number | null
}

export interface Status {
  configured: boolean
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining: number
  last_api_call: number | null
  collection_interval: number
}

export interface MetersResponse {
  meters: Meter[]
  last_updated: string | null
}

export interface HistoryResponse {
  device_id: string
  time_scale: TimeScale
  history: Reading[]
  device: Meter | null
}

export interface RefreshResponse {
  status: string
  message: string
  meters_count: number
}
