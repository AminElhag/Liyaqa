import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, Info, Megaphone, Check } from 'lucide-react'
import { useState } from 'react'
import { staggerContainer, staggerItem } from '@/lib/motion'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'announcement'
  title: string
  description: string
  time: string
  read: boolean
}

const MOCK: Notification[] = [
  { id: '1', type: 'warning', title: 'SLA breach warning', description: 'Ticket TKT-1042 response time approaching limit', time: '5 min ago', read: false },
  { id: '2', type: 'success', title: 'Payment received', description: 'FitZone Riyadh paid invoice INV-2024-089', time: '15 min ago', read: false },
  { id: '3', type: 'info', title: 'New tenant signup', description: 'PowerGym Jeddah started trial', time: '1 hour ago', read: false },
  { id: '4', type: 'announcement', title: 'Platform update v2.5', description: 'New analytics features deployed', time: '3 hours ago', read: true },
  { id: '5', type: 'success', title: 'Deal won', description: 'Elite Sports Dammam converted to paid plan', time: '5 hours ago', read: true },
  { id: '6', type: 'warning', title: 'Trial expiring', description: 'Gym Nation trial expires in 2 days', time: 'Yesterday', read: true },
  { id: '7', type: 'info', title: 'Support ticket assigned', description: 'TKT-1038 assigned to you', time: 'Yesterday', read: true },
]

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  announcement: Megaphone,
}

const colorMap = {
  info: 'bg-status-info-bg text-status-info',
  success: 'bg-status-success-bg text-status-success',
  warning: 'bg-status-warning-bg text-status-warning',
  announcement: 'bg-brand-accent-light text-brand-accent',
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState(MOCK)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('nav.communication', 'Notifications')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Check className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
        {notifications.map((n) => {
          const Icon = iconMap[n.type]
          return (
            <motion.div
              key={n.id}
              variants={staggerItem}
              onClick={() => markRead(n.id)}
              className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${
                n.read ? 'border-border bg-card' : 'border-brand-accent/30 bg-brand-accent/5'
              } hover:bg-muted/50`}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorMap[n.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{n.title}</span>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-brand-accent" />}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.description}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
