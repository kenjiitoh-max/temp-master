import type { StatusResponse } from "../api/types";
import { formatClockTime } from "../utils/format";

interface StatusBarProps {
  status: StatusResponse;
  lastRefresh: Date | null;
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  const count = status.meters_count ?? 0;
  const noun = count === 1 ? "meter" : "meters";

  return (
    <div className="alert alert-info">
      <span>
        Monitoring {count} {noun}
      </span>
      {lastRefresh && (
        <span className="status-last-refresh">
          Last refresh: {formatClockTime(lastRefresh)}
        </span>
      )}
    </div>
  );
}
