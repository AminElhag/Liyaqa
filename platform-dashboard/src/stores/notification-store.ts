import { create } from 'zustand'

export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  read: boolean
  createdAt: Date
  href?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  removeNotification: (id: string) => void
}

let notifId = 100

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000)
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)

const initialNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'warning',
    title: 'Contract expiring soon',
    message: 'Jeddah Sports Club contract expires in 30 days',
    read: false,
    createdAt: hoursAgo(1),
    href: '/compliance',
  },
  {
    id: 'n2',
    type: 'success',
    title: 'New tenant onboarded',
    message: 'Tabuk Training Academy has completed onboarding',
    read: false,
    createdAt: hoursAgo(3),
    href: '/tenants',
  },
  {
    id: 'n3',
    type: 'error',
    title: 'ZATCA submission failed',
    message: 'Invoice INV-2026-0038 failed ZATCA validation',
    read: false,
    createdAt: hoursAgo(5),
    href: '/compliance',
  },
  {
    id: 'n4',
    type: 'info',
    title: 'System update available',
    message: 'Platform version 2.4.1 is ready to deploy',
    read: true,
    createdAt: hoursAgo(8),
    href: '/monitoring/system',
  },
  {
    id: 'n5',
    type: 'system',
    title: 'Maintenance scheduled',
    message: 'Database upgrade planned for Feb 15, 2-4 AM',
    read: true,
    createdAt: daysAgo(1),
    href: '/settings/config',
  },
  {
    id: 'n6',
    type: 'warning',
    title: 'Payment retry failed',
    message: 'Khobar CrossFit Box subscription payment failed 3 times',
    read: true,
    createdAt: daysAgo(2),
    href: '/billing/invoices',
  },
  {
    id: 'n7',
    type: 'info',
    title: 'New support ticket',
    message: 'Riyadh Fitness Hub submitted a high-priority ticket',
    read: true,
    createdAt: daysAgo(3),
    href: '/tickets',
  },
]

function computeUnread(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,
  unreadCount: computeUnread(initialNotifications),

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      )
      return { notifications, unreadCount: computeUnread(notifications) }
    }),

  markAllAsRead: () =>
    set((state) => {
      const notifications = state.notifications.map((n) => ({ ...n, read: true }))
      return { notifications, unreadCount: 0 }
    }),

  addNotification: (notification) =>
    set((state) => {
      const newNotif: Notification = {
        ...notification,
        id: String(++notifId),
        read: false,
        createdAt: new Date(),
      }
      const notifications = [newNotif, ...state.notifications]
      return { notifications, unreadCount: computeUnread(notifications) }
    }),

  removeNotification: (id) =>
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id)
      return { notifications, unreadCount: computeUnread(notifications) }
    }),
}))
