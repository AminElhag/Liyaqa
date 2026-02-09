import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  MessageSquare,
  Clock,
  AlertCircle,
  Send,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataTable, AreaChartCard, PieChartCard } from '@/components/data'
import { StatusBadge } from '@/components/feedback'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Priority = 'critical' | 'high' | 'medium' | 'low'
type TicketStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'DEACTIVATED'

interface TicketMessage {
  id: string
  sender: string
  senderType: 'customer' | 'agent' | 'internal'
  content: string
  timestamp: string
}

interface Ticket {
  id: string
  number: string
  subject: string
  tenantName: string
  priority: Priority
  status: TicketStatus
  statusLabel: string
  slaRemaining: string
  assignee: string
  createdAt: string
  messages: TicketMessage[]
}

interface AgentStat {
  name: string
  resolved: number
  avgResponseTime: string
  satisfaction: number
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const priorityColors: Record<Priority, string> = {
  critical: 'border-s-status-error',
  high: 'border-s-brand-accent',
  medium: 'border-s-status-info',
  low: 'border-s-muted-foreground',
}

const priorityTextColors: Record<Priority, string> = {
  critical: 'text-status-error',
  high: 'text-brand-accent',
  medium: 'text-status-info',
  low: 'text-muted-foreground',
}

const mockTickets: Ticket[] = [
  {
    id: '1', number: 'TKT-001', subject: 'Cannot process member payments', tenantName: 'Riyadh Fitness Hub',
    priority: 'critical', status: 'SUSPENDED', statusLabel: 'Urgent', slaRemaining: '1h 23m', assignee: 'Sarah A.',
    createdAt: '2026-02-09 08:30',
    messages: [
      { id: 'm1', sender: 'Ahmed (Riyadh Fitness Hub)', senderType: 'customer', content: 'Our payment gateway stopped working this morning. Members are unable to renew their subscriptions. This is causing a lot of complaints.', timestamp: '08:30' },
      { id: 'm2', sender: 'Sarah A.', senderType: 'agent', content: 'I can see the issue. It appears the payment API key expired. I am regenerating it now. Should be fixed within 15 minutes.', timestamp: '08:45' },
      { id: 'm3', sender: 'Team Note', senderType: 'internal', content: 'Escalated to payment team. Root cause: auto-rotation failed for this tenant.', timestamp: '08:50' },
    ],
  },
  {
    id: '2', number: 'TKT-002', subject: 'Class scheduling calendar not syncing', tenantName: 'Jeddah Sports Club',
    priority: 'high', status: 'ACTIVE', statusLabel: 'Open', slaRemaining: '4h 10m', assignee: 'Mohammed K.',
    createdAt: '2026-02-09 07:15',
    messages: [
      { id: 'm4', sender: 'Omar (Jeddah Sports Club)', senderType: 'customer', content: 'The class calendar has not updated since yesterday. New classes added by our trainers are not showing up for members.', timestamp: '07:15' },
      { id: 'm5', sender: 'Mohammed K.', senderType: 'agent', content: 'Thank you for reporting this. I am checking the sync service now. Can you confirm which classes were added?', timestamp: '07:30' },
    ],
  },
  {
    id: '3', number: 'TKT-003', subject: 'Request for custom report template', tenantName: 'Dammam Athletic Center',
    priority: 'medium', status: 'TRIAL', statusLabel: 'Pending', slaRemaining: '23h 45m', assignee: 'Sarah A.',
    createdAt: '2026-02-08 14:00',
    messages: [
      { id: 'm6', sender: 'Khalid (Dammam Athletic)', senderType: 'customer', content: 'We need a custom monthly revenue report that includes member retention data alongside revenue. The current template does not support this.', timestamp: '14:00' },
    ],
  },
  {
    id: '4', number: 'TKT-004', subject: 'Mobile app crash on member check-in', tenantName: 'Medina Wellness Studio',
    priority: 'high', status: 'ACTIVE', statusLabel: 'Open', slaRemaining: '6h 30m', assignee: 'Mohammed K.',
    createdAt: '2026-02-08 16:20',
    messages: [
      { id: 'm7', sender: 'Fatima (Medina Wellness)', senderType: 'customer', content: 'The mobile app crashes every time a member tries to check in using QR code. This has been happening since the last app update.', timestamp: '16:20' },
      { id: 'm8', sender: 'Mohammed K.', senderType: 'agent', content: 'We have identified the bug in the QR scanner module. A hotfix is being prepared and should be deployed within 24 hours.', timestamp: '17:00' },
      { id: 'm9', sender: 'Fatima (Medina Wellness)', senderType: 'customer', content: 'Thank you for the quick response. Please let us know once the fix is live.', timestamp: '17:15' },
    ],
  },
  {
    id: '5', number: 'TKT-005', subject: 'Help setting up ZATCA e-invoicing', tenantName: 'Khobar CrossFit Box',
    priority: 'low', status: 'DEACTIVATED', statusLabel: 'Closed', slaRemaining: 'Resolved', assignee: 'Sarah A.',
    createdAt: '2026-02-07 10:00',
    messages: [
      { id: 'm10', sender: 'Tariq (Khobar CrossFit)', senderType: 'customer', content: 'We need help configuring our ZATCA e-invoicing integration. Where can we find the setup guide?', timestamp: '10:00' },
      { id: 'm11', sender: 'Sarah A.', senderType: 'agent', content: 'I have sent you the ZATCA integration guide and configured the initial settings for your account. Please review and let us know if you need further assistance.', timestamp: '10:30' },
      { id: 'm12', sender: 'Tariq (Khobar CrossFit)', senderType: 'customer', content: 'Perfect, everything is working now. Thank you!', timestamp: '11:00' },
    ],
  },
]

const ticketsOverTimeData = [
  { name: 'Mon', tickets: 8 },
  { name: 'Tue', tickets: 12 },
  { name: 'Wed', tickets: 6 },
  { name: 'Thu', tickets: 15 },
  { name: 'Fri', tickets: 9 },
  { name: 'Sat', tickets: 4 },
  { name: 'Sun', tickets: 3 },
]

const categoryData = [
  { name: 'Billing', value: 8 },
  { name: 'Technical', value: 12 },
  { name: 'Feature Request', value: 5 },
  { name: 'Onboarding', value: 3 },
]

const agentStats: AgentStat[] = [
  { name: 'Sarah A.', resolved: 45, avgResponseTime: '12m', satisfaction: 96 },
  { name: 'Mohammed K.', resolved: 38, avgResponseTime: '18m', satisfaction: 92 },
  { name: 'Layla H.', resolved: 22, avgResponseTime: '25m', satisfaction: 88 },
]

/* ------------------------------------------------------------------ */
/*  SLA Gauge component                                                */
/* ------------------------------------------------------------------ */

function SlaGauge({ percentage }: { percentage: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const color = percentage >= 90 ? 'var(--status-success, #22c55e)' : percentage >= 70 ? 'var(--brand-accent, #f59e0b)' : 'var(--status-error, #ef4444)'

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border, #e5e7eb)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="70" y="65" textAnchor="middle" className="fill-foreground text-2xl font-bold" fontSize="24">
          {percentage}%
        </text>
        <text x="70" y="85" textAnchor="middle" className="fill-muted-foreground text-xs" fontSize="12">
          SLA Met
        </text>
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function TicketsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(mockTickets[0] ?? null)
  const [replyText, setReplyText] = useState('')
  const [view, setView] = useState<'tickets' | 'analytics'>('tickets')

  const handleSendReply = () => {
    if (!replyText.trim()) return
    toast.success('Reply sent successfully')
    setReplyText('')
  }

  const agentColumns: ColumnDef<AgentStat, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Agent',
        cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'resolved',
        header: 'Resolved',
        cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'avgResponseTime',
        header: 'Avg Response',
      },
      {
        accessorKey: 'satisfaction',
        header: 'Satisfaction',
        cell: ({ getValue }) => {
          const val = getValue<number>()
          return (
            <span className={cn('font-medium tabular-nums', val >= 90 ? 'text-status-success' : val >= 80 ? 'text-brand-accent' : 'text-status-error')}>
              {val}%
            </span>
          )
        },
      },
    ],
    [],
  )

  /* ------- Tickets view ------- */
  const ticketsView = (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Left panel: ticket list */}
      <div className="w-full space-y-2 lg:w-2/5">
        {mockTickets.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => setSelectedTicket(ticket)}
            className={cn(
              'w-full rounded-lg border-s-4 border border-border bg-card p-3 text-start transition-all hover:shadow-sm',
              priorityColors[ticket.priority],
              selectedTicket?.id === ticket.id && 'ring-1 ring-ring',
            )}
          >
            <div className="flex items-start justify-between">
              <span className="font-mono text-xs text-muted-foreground">{ticket.number}</span>
              <StatusBadge status={ticket.status} label={ticket.statusLabel} />
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">{ticket.subject}</div>
            <div className="mt-1 text-xs text-muted-foreground">{ticket.tenantName}</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{ticket.assignee}</span>
              <span className={cn('flex items-center gap-1 text-xs font-medium', priorityTextColors[ticket.priority])}>
                <Clock className="h-3 w-3" />
                {ticket.slaRemaining}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Right panel: ticket detail (hidden on mobile) */}
      <div className="hidden flex-1 rounded-lg border border-border bg-card lg:block">
        {selectedTicket ? (
          <div className="flex h-full flex-col">
            {/* Meta bar */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{selectedTicket.subject}</h2>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{selectedTicket.number}</span>
                    <span>{selectedTicket.tenantName}</span>
                    <span>Assigned to {selectedTicket.assignee}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedTicket.status} label={selectedTicket.statusLabel} />
                  <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', priorityTextColors[selectedTicket.priority])}>
                    <AlertCircle className="h-3 w-3" />
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Message thread */}
            <div className="flex-1 space-y-3 overflow-auto p-4">
              {selectedTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'max-w-[80%] rounded-lg p-3',
                    msg.senderType === 'customer' && 'self-start bg-muted',
                    msg.senderType === 'agent' && 'ms-auto bg-brand-accent/10',
                    msg.senderType === 'internal' && 'border-2 border-brand-accent/30 bg-brand-accent/5',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">{msg.sender}</span>
                    <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  {msg.senderType === 'internal' && (
                    <span className="mb-1 inline-block rounded-full bg-brand-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-accent">
                      Internal Note
                    </span>
                  )}
                  <p className="mt-1 text-sm text-foreground">{msg.content}</p>
                </div>
              ))}
            </div>

            {/* Reply area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="self-end rounded-lg bg-brand-accent p-2.5 text-bg-inverse transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
              Select a ticket to view details
            </div>
          </div>
        )}
      </div>
    </div>
  )

  /* ------- Analytics view ------- */
  const analyticsView = (
    <div className="space-y-6">
      {/* Top row: SLA gauge + charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6">
          <SlaGauge percentage={87} />
          <p className="mt-3 text-sm text-muted-foreground">Current SLA compliance rate</p>
        </div>
        <AreaChartCard
          title="Tickets Over Time"
          subtitle="Last 7 days"
          data={ticketsOverTimeData}
          dataKeys={['tickets']}
          height={220}
        />
        <PieChartCard
          title="Tickets by Category"
          data={categoryData}
          height={220}
        />
      </div>

      {/* Agent table */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Agent Performance</h3>
        <DataTable<AgentStat>
          data={agentStats}
          columns={agentColumns}
          enableSearch={false}
          enablePagination={false}
        />
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 p-6"
    >
      {/* Header with toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('tickets.title', 'Support Tickets')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('tickets.subtitle', 'Manage support tickets and track team performance')}
          </p>
        </div>
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setView('tickets')}
            className={cn(
              'flex items-center gap-1.5 rounded-s-lg px-3 py-1.5 text-sm',
              view === 'tickets' ? 'bg-brand-accent text-bg-inverse' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Tickets
          </button>
          <button
            onClick={() => setView('analytics')}
            className={cn(
              'flex items-center gap-1.5 rounded-e-lg px-3 py-1.5 text-sm',
              view === 'analytics' ? 'bg-brand-accent text-bg-inverse' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'tickets' ? ticketsView : analyticsView}
    </motion.div>
  )
}
