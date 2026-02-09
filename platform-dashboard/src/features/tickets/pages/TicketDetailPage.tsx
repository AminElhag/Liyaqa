import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, User, Tag, Send } from 'lucide-react'
import { useState } from 'react'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { Timeline } from '@/components/data/Timeline'
import { useToast } from '@/stores/toast-store'
import { fadeInUp } from '@/lib/motion'

const MOCK_TICKET = {
  id: 'TKT-1042',
  subject: 'Cannot process member payments',
  status: 'ACTIVE',
  priority: 'High',
  requester: 'FitZone Riyadh',
  assignee: 'Sarah Al-Rashid',
  createdAt: '2 hours ago',
  category: 'Billing',
  messages: [
    { id: '1', sender: 'Ahmed (FitZone)', time: '2 hours ago', content: 'We are unable to process member payments since this morning. The payment gateway returns error 502.' },
    { id: '2', sender: 'Sarah (Support)', time: '1 hour ago', content: 'Thank you for reporting this. I can see the payment gateway is experiencing intermittent issues. Our engineering team is investigating.' },
    { id: '3', sender: 'Ahmed (FitZone)', time: '30 min ago', content: 'Is there an ETA for the fix? We have 15 members waiting to make payments.' },
  ],
}

const ACTIVITY = [
  { id: '1', timestamp: '2 hours ago', title: 'Ticket created', description: 'By Ahmed at FitZone Riyadh', type: 'create' as const },
  { id: '2', timestamp: '1.5 hours ago', title: 'Assigned to Sarah', description: 'Auto-assignment by priority rules', type: 'update' as const },
  { id: '3', timestamp: '1 hour ago', title: 'First response sent', description: 'Response time: 1h (SLA: 2h)', type: 'access' as const },
]

export default function TicketDetailPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const toast = useToast()
  const [reply, setReply] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    toast.success('Reply sent')
    setReply('')
  }

  return (
    <div className="p-6">
      <Link to="/tickets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('common.back', 'Back to Tickets')}
      </Link>

      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{id ?? MOCK_TICKET.id}</div>
                <h1 className="mt-1 text-xl font-bold text-foreground">{MOCK_TICKET.subject}</h1>
              </div>
              <StatusBadge status={MOCK_TICKET.status} />
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {MOCK_TICKET.messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{msg.sender}</span>
                  <span>{msg.time}</span>
                </div>
                <p className="mt-2 text-sm text-foreground">{msg.content}</p>
              </motion.div>
            ))}
          </div>

          {/* Reply */}
          <form onSubmit={handleSend} className="rounded-xl border border-border bg-card p-4">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={t('common.typeReply', 'Type your reply...')}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
              >
                <Send className="h-4 w-4" />
                {t('common.send', 'Send Reply')}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('common.details', 'Details')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Priority:</span>
                <span className="font-medium text-foreground">{MOCK_TICKET.priority}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Requester:</span>
                <span className="font-medium text-foreground">{MOCK_TICKET.requester}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Assignee:</span>
                <span className="font-medium text-foreground">{MOCK_TICKET.assignee}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Created:</span>
                <span className="font-medium text-foreground">{MOCK_TICKET.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('common.activity', 'Activity')}</h3>
            <Timeline items={ACTIVITY} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
