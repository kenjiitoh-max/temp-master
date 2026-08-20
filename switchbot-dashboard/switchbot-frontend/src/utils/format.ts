import type { TimeScale } from '../types'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp)
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`
    case 'week':
      return `${DAY_SHORT[date.getDay()]} ${hours}`
    case 'month':
    case 'year':
      return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`
    default:
      return date.toLocaleString()
  }
}

export function formatClockTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}
