import { formatClock } from '../lib/formatTimestamp'
import { Alert } from './Alert'

interface StatusBarProps {
  metersCount: number
  /** 最後にデータ取得に成功した時刻 (epoch ms)。0 は未取得 */
  lastRefresh: number
}

export function StatusBar({ metersCount, lastRefresh }: StatusBarProps) {
  return (
    <Alert variant="info" data-testid="status-bar">
      <div className="flex flex-wrap justify-between gap-x-4">
        <span>
          Monitoring {metersCount} {metersCount === 1 ? 'meter' : 'meters'}
        </span>
        {lastRefresh > 0 ? <span>Last refresh: {formatClock(new Date(lastRefresh))}</span> : null}
      </div>
    </Alert>
  )
}
