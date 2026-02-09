import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  CheckCheck,
  Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationStore, type NotificationType } from '@/stores/notification-store'

/* ------------------------------------------------------------------ */
/*  Icon mapping                                                       */
/* ------------------------------------------------------------------ */

const typeConfig: Record<NotificationType, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-status-info', bg: 'bg-status-info-bg' },
  warning: { icon: AlertTriangle, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
  success: { icon: CheckCircle, color: 'text-status-success', bg: 'bg-status-success-bg' },
  error: { icon: XCircle, color: 'text-status-error', bg: 'bg-status-error-bg' },
  system: { icon: Settings, color: 'text-muted-foreground', bg: 'bg-muted' },
}

/* ------------------------------------------------------------------ */
/*  Time ago helper                                                    */
/* ------------------------------------------------------------------ */

function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

function getDateGroup(date: Date): 'today' | 'earlier' | 'older' {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  if (diffDays === 0) return 'today'
  if (diffDays <= 7) return 'earlier'
  return 'older'
}

const groupLabels: Record<string, string> = {
  today: 'Today',
  earlier: 'Earlier',
  older: 'Older',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NotificationCenter() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const handleNotificationClick = useCallback(
    (id: string, href?: string) => {
      markAsRead(id)
      setOpen(false)
      if (href) navigate(href)
    },
    [markAsRead, navigate],
  )

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead()
  }, [markAllAsRead])

  // Group notifications
  const grouped = notifications.reduce<Record<string, typeof notifications>>(
    (acc, notif) => {
      const group = getDateGroup(notif.createdAt)
      if (!acc[group]) acc[group] = []
      acc[group].push(notif)
      return acc
    },
    {},
  )

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={t('notifications.bell', 'Notifications')}
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="absolute end-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-bg-inverse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ transformOrigin: 'top end' }}
            className="absolute end-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                {t('notifications.title', 'Notifications')}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-brand-accent transition-colors hover:text-brand-accent-hover"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {t('notifications.markAllRead', 'Mark All Read')}
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground/40" />
                  <span className="text-sm font-medium text-foreground">
                    {t('notifications.empty', 'No notifications')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('notifications.emptyDescription', "You're all caught up!")}
                  </span>
                </div>
              ) : (
                (['today', 'earlier', 'older'] as const).map((groupKey) => {
                  const items = grouped[groupKey]
                  if (!items?.length) return null
                  return (
                    <div key={groupKey}>
                      <div className="sticky top-0 z-10 bg-card/90 px-4 py-1.5 backdrop-blur-sm">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {groupLabels[groupKey]}
                        </span>
                      </div>
                      {items.map((notif) => {
                        const config = typeConfig[notif.type]
                        const Icon = config.icon
                        return (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif.id, notif.href)}
                            className={cn(
                              'flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/50',
                              !notif.read && 'bg-brand-accent/5',
                            )}
                          >
                            <div className={cn('mt-0.5 rounded-lg p-1.5', config.bg)}>
                              <Icon className={cn('h-4 w-4', config.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className={cn('text-sm', notif.read ? 'text-foreground' : 'font-medium text-foreground')}>
                                  {notif.title}
                                </span>
                                {!notif.read && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-accent" />
                                )}
                              </div>
                              {notif.message && (
                                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                  {notif.message}
                                </p>
                              )}
                              <span className="mt-1 text-[10px] text-muted-foreground/70">
                                {timeAgo(notif.createdAt)}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
