import type { TimeScale } from '../types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatTimestamp(timestamp: string | number, timeScale: TimeScale): string {
  const date = new Date(timestamp)
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`
    case 'week':
      return `${DAYS[date.getDay()]} ${hours}`
    case 'month':
    case 'year':
      return `${MONTHS[date.getMonth()]} ${date.getDate()}`
    default:
      return date.toLocaleString()
  }
}

export function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}
