export const TIME_SCALES = ['hour', 'day', 'week', 'month', 'year'] as const
export type TimeScale = (typeof TIME_SCALES)[number]

export interface MeterDevice {
  device_id: string
  device_name: string
  device_type: string
  hub_device_id: string | null
  current_temperature: number | null
  current_humidity: number | null
  battery: number | null
  last_updated: string | null
}

export interface MeterReading {
  timestamp: string
  temperature: number
  humidity: number
  battery: number | null
}

export interface MetersResponse {
  meters: MeterDevice[]
  last_updated: string | null
}

export interface StatusResponse {
  configured: boolean
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining: number
  last_api_call: number | null
  collection_interval: number
}

export interface HistoryResponse {
  device_id: string
  time_scale: TimeScale
  history: MeterReading[]
  device: MeterDevice | null
}
