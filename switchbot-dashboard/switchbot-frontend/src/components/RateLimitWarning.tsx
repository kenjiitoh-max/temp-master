export function RateLimitWarning({ backoffRemaining }: { backoffRemaining: number }) {
  return (
    <div id="rate-limit-warning" className="alert alert--warning" role="alert">
      <strong>Rate Limited.</strong>{' '}
      <span id="rate-limit-text">
        SwitchBot API rate limit reached. Retry in {backoffRemaining} seconds.
      </span>
    </div>
  );
}
