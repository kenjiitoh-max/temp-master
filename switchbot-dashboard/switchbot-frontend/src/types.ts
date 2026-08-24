export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year'

export type MeterReading = {
  timestamp: string
  temperature: number
  humidity: number
  battery: number | null
}

export type MeterDevice = {
  device_id: string
  device_name: string
  device_type: string
  hub_device_id: string | null
  current_temperature: number | null
  current_humidity: number | null
  battery: number | null
  last_updated: string | null
}

export type MetersResponse = {
  meters: MeterDevice[]
  last_updated: string | null
}

export type HistoryResponse = {
  device_id: string
  time_scale: TimeScale
  history: MeterReading[]
  device: MeterDevice | null
}

export type StatusResponse = {
  configured: boolean
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining: number
  last_api_call: number
  collection_interval: number
}
