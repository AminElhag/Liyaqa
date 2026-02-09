import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  List,
  Table,
  ChevronDown,
  ChevronRight,
  Trash2,
  Eye,
  Plus,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataTable, BarChartCard } from '@/components/data'
import { FilterBar } from '@/components/forms'
import { DateRangePicker } from '@/components/forms'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AuditAction = 'create' | 'update' | 'delete' | 'access'

interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  actorAvatar: string
  action: AuditAction
  actionLabel: string
  resource: string
  description: string
  tenant: string
  details: Record<string, unknown>
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const actionConfig: Record<AuditAction, { color: string; bg: string; icon: typeof Plus }> = {
  create: { color: 'text-status-success', bg: 'bg-status-success-bg', icon: Plus },
  update: { color: 'text-status-info', bg: 'bg-status-info-bg', icon: Pencil },
  delete: { color: 'text-status-error', bg: 'bg-status-error-bg', icon: Trash2 },
  access: { color: 'text-brand-accent', bg: 'bg-brand-accent/10', icon: Eye },
}

const mockEntries: AuditEntry[] = [
  {
    id: '1', timestamp: '2026-02-09 14:32:01', actor: 'Abdulaziz Al-Rashidi', actorAvatar: 'AA',
    action: 'update', actionLabel: 'Updated', resource: 'Tenant Settings',
    description: 'Changed billing cycle to annual for Riyadh Fitness Hub',
    tenant: 'Riyadh Fitness Hub',
    details: { field: 'billingCycle', oldValue: 'monthly', newValue: 'annual' },
  },
  {
    id: '2', timestamp: '2026-02-09 14:15:44', actor: 'Sarah Al-Otaibi', actorAvatar: 'SA',
    action: 'create', actionLabel: 'Created', resource: 'Support Ticket',
    description: 'Created ticket TKT-006 for Jeddah Sports Club',
    tenant: 'Jeddah Sports Club',
    details: { ticketId: 'TKT-006', priority: 'high', subject: 'Billing inquiry' },
  },
  {
    id: '3', timestamp: '2026-02-09 13:48:22', actor: 'Mohammed Khan', actorAvatar: 'MK',
    action: 'access', actionLabel: 'Accessed', resource: 'Member Data',
    description: 'Exported member list for Dammam Athletic Center',
    tenant: 'Dammam Athletic Center',
    details: { exportFormat: 'CSV', recordCount: 85, ipAddress: '10.0.1.45' },
  },
  {
    id: '4', timestamp: '2026-02-09 12:30:10', actor: 'Abdulaziz Al-Rashidi', actorAvatar: 'AA',
    action: 'delete', actionLabel: 'Deleted', resource: 'API Key',
    description: 'Revoked legacy API key for Khobar CrossFit Box',
    tenant: 'Khobar CrossFit Box',
    details: { keyName: 'Legacy Key', keyMasked: '****g7h8', reason: 'Security rotation' },
  },
  {
    id: '5', timestamp: '2026-02-09 11:05:33', actor: 'Sarah Al-Otaibi', actorAvatar: 'SA',
    action: 'update', actionLabel: 'Updated', resource: 'Subscription',
    description: 'Upgraded Tabuk Training Academy from Starter to Professional',
    tenant: 'Tabuk Training Academy',
    details: { oldPlan: 'Starter', newPlan: 'Professional', effectiveDate: '2026-02-10' },
  },
  {
    id: '6', timestamp: '2026-02-09 10:22:15', actor: 'System', actorAvatar: 'SY',
    action: 'create', actionLabel: 'Generated', resource: 'Invoice',
    description: 'Auto-generated invoice INV-2026-007 for Medina Wellness Studio',
    tenant: 'Medina Wellness Studio',
    details: { invoiceNumber: 'INV-2026-007', amount: 4500, currency: 'SAR' },
  },
  {
    id: '7', timestamp: '2026-02-08 16:45:00', actor: 'Abdulaziz Al-Rashidi', actorAvatar: 'AA',
    action: 'access', actionLabel: 'Impersonated', resource: 'Tenant',
    description: 'Started impersonation session for Jeddah Sports Club',
    tenant: 'Jeddah Sports Club',
    details: { sessionDuration: '15 min', readOnly: true, ipAddress: '10.0.1.12' },
  },
  {
    id: '8', timestamp: '2026-02-08 15:10:30', actor: 'Mohammed Khan', actorAvatar: 'MK',
    action: 'update', actionLabel: 'Resolved', resource: 'Support Ticket',
    description: 'Closed ticket TKT-005 — ZATCA e-invoicing setup',
    tenant: 'Khobar CrossFit Box',
    details: { ticketId: 'TKT-005', resolution: 'Guided customer through ZATCA setup', timeToResolve: '1h 30m' },
  },
  {
    id: '9', timestamp: '2026-02-08 11:30:00', actor: 'Layla Hassan', actorAvatar: 'LH',
    action: 'create', actionLabel: 'Invited', resource: 'Team Member',
    description: 'Invited omar@liyaqa.com to join as Viewer',
    tenant: 'Platform',
    details: { invitedEmail: 'omar@liyaqa.com', role: 'Viewer' },
  },
  {
    id: '10', timestamp: '2026-02-08 09:00:00', actor: 'System', actorAvatar: 'SY',
    action: 'create', actionLabel: 'Provisioned', resource: 'Tenant',
    description: 'Auto-provisioned new tenant: Al Baha Fitness Center',
    tenant: 'Al Baha Fitness Center',
    details: { plan: 'Free Trial', region: 'Al Baha', expiresAt: '2026-03-10' },
  },
]

const activityByHour = [
  { name: '6am', actions: 2 },
  { name: '8am', actions: 5 },
  { name: '10am', actions: 12 },
  { name: '12pm', actions: 8 },
  { name: '2pm', actions: 15 },
  { name: '4pm', actions: 10 },
  { name: '6pm', actions: 4 },
  { name: '8pm', actions: 1 },
]

const filterDefs = [
  {
    id: 'actor',
    label: 'Actor',
    options: [
      { label: 'Abdulaziz Al-Rashidi', value: 'Abdulaziz Al-Rashidi' },
      { label: 'Sarah Al-Otaibi', value: 'Sarah Al-Otaibi' },
      { label: 'Mohammed Khan', value: 'Mohammed Khan' },
      { label: 'Layla Hassan', value: 'Layla Hassan' },
      { label: 'System', value: 'System' },
    ],
  },
  {
    id: 'action',
    label: 'Action',
    options: [
      { label: 'Create', value: 'create' },
      { label: 'Update', value: 'update' },
      { label: 'Delete', value: 'delete' },
      { label: 'Access', value: 'access' },
    ],
  },
  {
    id: 'resource',
    label: 'Resource',
    options: [
      { label: 'Tenant', value: 'Tenant' },
      { label: 'Subscription', value: 'Subscription' },
      { label: 'Invoice', value: 'Invoice' },
      { label: 'Support Ticket', value: 'Support Ticket' },
      { label: 'API Key', value: 'API Key' },
      { label: 'Team Member', value: 'Team Member' },
      { label: 'Member Data', value: 'Member Data' },
      { label: 'Tenant Settings', value: 'Tenant Settings' },
    ],
  },
  {
    id: 'tenant',
    label: 'Tenant',
    options: [
      { label: 'Riyadh Fitness Hub', value: 'Riyadh Fitness Hub' },
      { label: 'Jeddah Sports Club', value: 'Jeddah Sports Club' },
      { label: 'Dammam Athletic Center', value: 'Dammam Athletic Center' },
      { label: 'Khobar CrossFit Box', value: 'Khobar CrossFit Box' },
      { label: 'Platform', value: 'Platform' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Expandable JSON                                                    */
/* ------------------------------------------------------------------ */

function ExpandableDetails({ details }: { details: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Details
      </button>
      <AnimatePresence>
        {open && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 overflow-hidden rounded-lg bg-muted p-2 font-mono text-xs text-foreground"
          >
            {JSON.stringify(details, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AuditLogPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<'timeline' | 'table'>('timeline')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    actor: [],
    action: [],
    resource: [],
    tenant: [],
  })
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined)

  const filteredEntries = useMemo(() => {
    let result = mockEntries
    if (activeFilters.actor.length > 0) {
      result = result.filter((e) => activeFilters.actor.includes(e.actor))
    }
    if (activeFilters.action.length > 0) {
      result = result.filter((e) => activeFilters.action.includes(e.action))
    }
    if (activeFilters.resource.length > 0) {
      result = result.filter((e) => activeFilters.resource.includes(e.resource))
    }
    if (activeFilters.tenant.length > 0) {
      result = result.filter((e) => activeFilters.tenant.includes(e.tenant))
    }
    if (dateRange) {
      const from = dateRange.from.toISOString().slice(0, 10)
      const to = dateRange.to.toISOString().slice(0, 10)
      result = result.filter((e) => {
        const entryDate = e.timestamp.slice(0, 10)
        return entryDate >= from && entryDate <= to
      })
    }
    return result
  }, [activeFilters, dateRange])

  const tableColumns: ColumnDef<AuditEntry, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'actor',
        header: 'Actor',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-bg-inverse">
              {row.original.actorAvatar}
            </div>
            <span className="text-sm text-foreground">{row.original.actor}</span>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const config = actionConfig[row.original.action]
          return (
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', config.bg, config.color)}>
              {row.original.actionLabel}
            </span>
          )
        },
      },
      {
        accessorKey: 'resource',
        header: 'Resource',
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'tenant',
        header: 'Tenant',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
    ],
    [],
  )

  /* ------- Timeline view ------- */
  const timelineView = (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute start-5 top-0 h-full w-px bg-border" />

      <div className="space-y-1">
        {filteredEntries.map((entry, i) => {
          const config = actionConfig[entry.action]
          const Icon = config.icon

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="relative flex gap-4 py-3 ps-0"
            >
              {/* Icon */}
              <div className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.bg)}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Actor avatar */}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-bg-inverse">
                      {entry.actorAvatar}
                    </div>
                    <span className="text-sm font-medium text-foreground">{entry.actor}</span>
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', config.bg, config.color)}>
                      {entry.actionLabel}
                    </span>
                    <span className="text-sm text-muted-foreground">{entry.resource}</span>
                  </div>
                  <time className="shrink-0 font-mono text-xs text-muted-foreground">{entry.timestamp}</time>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{entry.description}</p>
                <div className="mt-1">
                  <ExpandableDetails details={entry.details} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  /* ------- Table view ------- */
  const tableView = (
    <DataTable<AuditEntry>
      data={filteredEntries}
      columns={tableColumns}
      enableSearch
      searchPlaceholder="Search audit logs..."
      emptyTitle="No audit entries found"
      emptyDescription="Try adjusting your filters."
    />
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('auditLog.title', 'Audit Log')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('auditLog.subtitle', 'Track all platform activity and changes')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker onChange={setDateRange} />
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setView('timeline')}
              className={cn(
                'flex items-center gap-1.5 rounded-s-lg px-3 py-1.5 text-sm',
                view === 'timeline' ? 'bg-brand-accent text-bg-inverse' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="h-4 w-4" />
              Timeline
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-e-lg px-3 py-1.5 text-sm',
                view === 'table' ? 'bg-brand-accent text-bg-inverse' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Table className="h-4 w-4" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Activity chart */}
      <BarChartCard
        title="Activity by Hour"
        subtitle="Today"
        data={activityByHour}
        dataKeys={['actions']}
        height={180}
      />

      {/* Filters */}
      <FilterBar
        filters={filterDefs}
        activeFilters={activeFilters}
        onChange={setActiveFilters}
      />

      {/* Content */}
      {view === 'timeline' ? timelineView : tableView}
    </motion.div>
  )
}
