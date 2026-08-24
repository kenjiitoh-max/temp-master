export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="notice notice-error" role="alert">
      <strong>Error.</strong> {message}
    </div>
  )
}
