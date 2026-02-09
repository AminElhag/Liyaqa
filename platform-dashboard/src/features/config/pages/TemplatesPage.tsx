import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FileText, Mail, MessageSquare, Bell as BellIcon, Plus, Pencil, Copy, Eye } from 'lucide-react'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { SearchInput } from '@/components/forms/SearchInput'
import { useToast } from '@/stores/toast-store'
import { staggerContainer, staggerItem } from '@/lib/motion'

type TemplateType = 'email' | 'sms' | 'push' | 'in-app'

interface Template {
  id: string
  name: string
  type: TemplateType
  status: 'ACTIVE' | 'ARCHIVED'
  lastModified: string
  description: string
}

const MOCK: Template[] = [
  { id: '1', name: 'Welcome Email', type: 'email', status: 'ACTIVE', lastModified: '2 days ago', description: 'Sent to new tenant admins after onboarding' },
  { id: '2', name: 'Payment Reminder', type: 'email', status: 'ACTIVE', lastModified: '1 week ago', description: 'Sent 3 days before invoice due date' },
  { id: '3', name: 'Trial Expiring', type: 'email', status: 'ACTIVE', lastModified: '3 days ago', description: 'Sent 7 days before trial ends' },
  { id: '4', name: 'Booking Confirmation', type: 'sms', status: 'ACTIVE', lastModified: '5 days ago', description: 'SMS to members after booking a class' },
  { id: '5', name: 'Class Reminder', type: 'push', status: 'ACTIVE', lastModified: '1 week ago', description: 'Push notification 1 hour before class' },
  { id: '6', name: 'System Maintenance', type: 'in-app', status: 'ACTIVE', lastModified: '2 weeks ago', description: 'In-app banner for scheduled maintenance' },
  { id: '7', name: 'Legacy Welcome', type: 'email', status: 'ARCHIVED', lastModified: '1 month ago', description: 'Old welcome email template' },
]

const typeIcons: Record<TemplateType, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  push: BellIcon,
  'in-app': FileText,
}

const typeColors: Record<TemplateType, string> = {
  email: 'bg-status-info-bg text-status-info',
  sms: 'bg-status-success-bg text-status-success',
  push: 'bg-status-warning-bg text-status-warning',
  'in-app': 'bg-brand-accent-light text-brand-accent',
}

export default function TemplatesPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [search, setSearch] = useState('')

  const filtered = MOCK.filter(
    (tpl) =>
      tpl.name.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('nav.templates', 'Templates')}</h1>
        <button className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover">
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      <SearchInput onChange={setSearch} placeholder="Search templates..." className="mb-4 max-w-sm" />

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tpl) => {
          const Icon = typeIcons[tpl.type]
          return (
            <motion.div
              key={tpl.id}
              variants={staggerItem}
              className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${typeColors[tpl.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <StatusBadge status={tpl.status} variant="pill" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{tpl.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{tpl.lastModified}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => toast.info('Preview template')}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toast.info('Edit template')}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toast.success('Template duplicated')}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
