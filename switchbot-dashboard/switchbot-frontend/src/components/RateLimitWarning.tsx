type RateLimitWarningProps = {
  remaining: number
}

export function RateLimitWarning({ remaining }: RateLimitWarningProps) {
  return (
    <div className="notice notice-warning" role="status">
      <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {remaining} seconds.
    </div>
  )
}
