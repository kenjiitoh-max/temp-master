import { formatClock } from '../utils/format';

export function StatusBar({ metersCount, lastRefresh }: { metersCount: number; lastRefresh: Date | null }) {
  const noun = metersCount === 1 ? 'meter' : 'meters';
  return (
    <div id="status-bar" className="alert alert--info status-bar">
      <span id="status-meters-count">
        Monitoring {metersCount} {noun}
      </span>
      {lastRefresh && <span id="status-last-refresh">Last refresh: {formatClock(lastRefresh)}</span>}
    </div>
  );
}
