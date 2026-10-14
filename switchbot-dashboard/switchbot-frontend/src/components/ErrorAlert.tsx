import { XCircle } from 'lucide-react'

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      <XCircle className="size-4 shrink-0" aria-hidden />
      <strong>Error.</strong>
      <span>{message}</span>
    </div>
  )
}
