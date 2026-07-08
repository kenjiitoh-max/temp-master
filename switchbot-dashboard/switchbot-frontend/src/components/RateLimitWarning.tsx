import type { StatusResponse } from '../types'

interface RateLimitWarningProps {
  status: StatusResponse | null
}

export function RateLimitWarning({ status }: RateLimitWarningProps) {
  if (!status || !status.is_rate_limited) {
    return null
  }

  const remaining = status.backoff_remaining || 0

  return (
    <div className="alert alert-warning">
      <span>
        <strong>Rate Limited.</strong>{' '}
        {`SwitchBot API rate limit reached. Retry in ${remaining} seconds.`}
      </span>
    </div>
  )
}
