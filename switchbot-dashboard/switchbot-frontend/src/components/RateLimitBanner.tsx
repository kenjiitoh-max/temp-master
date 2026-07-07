import type { StatusResponse } from '../api/types'

interface Props {
  status: StatusResponse | null
}

export function RateLimitBanner({ status }: Props) {
  if (!status?.is_rate_limited) return null

  const remaining = status.backoff_remaining ?? 0

  return (
    <div className="alert alert-warning">
      <strong>Rate Limited.</strong>{' '}
      <span>
        SwitchBot API rate limit reached. Retry in {remaining} seconds.
      </span>
    </div>
  )
}
