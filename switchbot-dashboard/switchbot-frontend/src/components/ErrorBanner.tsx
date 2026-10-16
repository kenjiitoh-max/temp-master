interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 rounded border border-border bg-danger-bg px-4 py-3 text-sm text-danger-fg"
    >
      <span>
        <strong>Error.</strong> {message}
      </span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="font-bold leading-none hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  );
}
