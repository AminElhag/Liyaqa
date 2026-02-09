import { cn } from '@/lib/utils'

type StatusType = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'TRIAL' | 'PROVISIONING' | 'ARCHIVED'
type Variant = 'dot' | 'pill' | 'outline'

interface StatusBadgeProps {
  status: StatusType | string
  variant?: Variant
  label?: string
}

const statusColors: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  ACTIVE: { bg: 'bg-status-success-bg', text: 'text-status-success', dot: 'bg-status-success', border: 'border-status-success' },
  SUSPENDED: { bg: 'bg-status-warning-bg', text: 'text-status-warning', dot: 'bg-status-warning', border: 'border-status-warning' },
  DEACTIVATED: { bg: 'bg-status-error-bg', text: 'text-status-error', dot: 'bg-status-error', border: 'border-status-error' },
  TRIAL: { bg: 'bg-status-info-bg', text: 'text-status-info', dot: 'bg-status-info', border: 'border-status-info' },
  PROVISIONING: { bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-500' },
  ARCHIVED: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground', border: 'border-muted-foreground' },
}

const defaultColor = statusColors.ARCHIVED

export function StatusBadge({ status, variant = 'pill', label }: StatusBadgeProps) {
  const colors = statusColors[status.toUpperCase()] ?? defaultColor
  const displayLabel = label ?? status

  if (variant === 'dot') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
        <span className={cn('h-2 w-2 rounded-full', colors.dot, status === 'PROVISIONING' && 'animate-pulse')} />
        <span className={colors.text}>{displayLabel}</span>
      </span>
    )
  }

  if (variant === 'outline') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
          colors.border,
          colors.text,
        )}
      >
        {displayLabel}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text,
        status === 'PROVISIONING' && 'animate-pulse',
      )}
    >
      {displayLabel}
    </span>
  )
}
