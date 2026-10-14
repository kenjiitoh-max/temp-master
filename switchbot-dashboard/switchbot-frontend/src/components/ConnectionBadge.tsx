export type ConnectionState = 'connecting' | 'connected' | 'disconnected'

const STYLES: Record<ConnectionState, { label: string; className: string; dot: string }> = {
  connecting: {
    label: 'Connecting…',
    className: 'border-border bg-surface-muted text-muted-foreground',
    dot: 'bg-muted-foreground animate-pulse',
  },
  connected: {
    label: 'Connected',
    className: 'border-success/40 bg-success/10 text-success',
    dot: 'bg-success',
  },
  disconnected: {
    label: 'Disconnected',
    className: 'border-danger/40 bg-danger/10 text-danger',
    dot: 'bg-danger',
  },
}

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const style = STYLES[state]
  return (
    <span
      id="connection-status"
      data-state={state}
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.className}`}
    >
      <span className={`size-2 rounded-full ${style.dot}`} aria-hidden />
      {style.label}
    </span>
  )
}
