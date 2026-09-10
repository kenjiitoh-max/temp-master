interface RateLimitWarningProps {
  backoffRemaining: number
}

export function RateLimitWarning({ backoffRemaining }: RateLimitWarningProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-fg"
    >
      <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {backoffRemaining} seconds.
    </div>
  )
}
