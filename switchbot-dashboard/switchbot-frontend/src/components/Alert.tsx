import type { ReactNode } from 'react'

const VARIANT_CLASSES = {
  info: 'border-info-border bg-info-bg text-info-text',
  warning: 'border-warning-border bg-warning-bg text-warning-text',
  danger: 'border-danger-border bg-danger-bg text-danger-text',
} as const

interface AlertProps {
  variant: keyof typeof VARIANT_CLASSES
  children: ReactNode
  'data-testid'?: string
}

export function Alert({ variant, children, 'data-testid': testId }: AlertProps) {
  return (
    <div
      role={variant === 'info' ? 'status' : 'alert'}
      data-testid={testId}
      className={`mb-5 rounded border p-[15px] ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </div>
  )
}
