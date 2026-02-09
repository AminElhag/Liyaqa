import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  AlertTriangle,
  Clock,
  RefreshCw,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIGrid, type KPIItem, DataTable, AreaChartCard, PieChartCard } from '@/components/data'
import { StatusBadge } from '@/components/feedback'
import { SearchInput, FilterBar } from '@/components/forms'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Subscription {
  id: string
  tenantName: string
  plan: string
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'DEACTIVATED'
  billingCycle: 'Monthly' | 'Annual'
  nextBilling: string
  mrr: number
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockSubscriptions: Subscription[] = [
  { id: '1', tenantName: 'Riyadh Fitness Hub', plan: 'Professional', status: 'ACTIVE', billingCycle: 'Monthly', nextBilling: '2026-03-01', mrr: 4500 },
  { id: '2', tenantName: 'Jeddah Sports Club', plan: 'Enterprise', status: 'ACTIVE', billingCycle: 'Annual', nextBilling: '2026-12-15', mrr: 8200 },
  { id: '3', tenantName: 'Dammam Athletic Center', plan: 'Free Trial', status: 'TRIAL', billingCycle: 'Monthly', nextBilling: '2026-02-28', mrr: 0 },
  { id: '4', tenantName: 'Medina Wellness Studio', plan: 'Free Trial', status: 'TRIAL', billingCycle: 'Monthly', nextBilling: '2026-02-20', mrr: 0 },
  { id: '5', tenantName: 'Khobar CrossFit Box', plan: 'Starter', status: 'SUSPENDED', billingCycle: 'Monthly', nextBilling: '2026-02-10', mrr: 1500 },
  { id: '6', tenantName: 'Tabuk Training Academy', plan: 'Professional', status: 'ACTIVE', billingCycle: 'Annual', nextBilling: '2026-08-01', mrr: 4500 },
  { id: '7', tenantName: 'Al Khobar Gym Nation', plan: 'Starter', status: 'ACTIVE', billingCycle: 'Monthly', nextBilling: '2026-03-15', mrr: 1500 },
  { id: '8', tenantName: 'Abha Peak Fitness', plan: 'Enterprise', status: 'DEACTIVATED', billingCycle: 'Annual', nextBilling: '—', mrr: 0 },
]

const revenueData = [
  { name: 'Sep', revenue: 16200 },
  { name: 'Oct', revenue: 17800 },
  { name: 'Nov', revenue: 19500 },
  { name: 'Dec', revenue: 18700 },
  { name: 'Jan', revenue: 20200 },
  { name: 'Feb', revenue: 20700 },
]

const planDistribution = [
  { name: 'Enterprise', value: 2 },
  { name: 'Professional', value: 2 },
  { name: 'Starter', value: 2 },
  { name: 'Free Trial', value: 2 },
]

const planColors: Record<string, string> = {
  'Free Trial': 'bg-muted text-muted-foreground',
  Starter: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Professional: 'bg-brand-accent/15 text-brand-accent',
  Enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
}

const filterDefs = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Trial', value: 'TRIAL' },
      { label: 'Suspended', value: 'SUSPENDED' },
      { label: 'Deactivated', value: 'DEACTIVATED' },
    ],
  },
  {
    id: 'plan',
    label: 'Plan',
    options: [
      { label: 'Free Trial', value: 'Free Trial' },
      { label: 'Starter', value: 'Starter' },
      { label: 'Professional', value: 'Professional' },
      { label: 'Enterprise', value: 'Enterprise' },
    ],
  },
  {
    id: 'billingCycle',
    label: 'Billing Cycle',
    options: [
      { label: 'Monthly', value: 'Monthly' },
      { label: 'Annual', value: 'Annual' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Actions menu                                                       */
/* ------------------------------------------------------------------ */

function ActionsMenu({ onChangePlan }: { onChangePlan: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-card p-1 shadow-lg">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onChangePlan()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Change Plan
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Change Plan modal                                                  */
/* ------------------------------------------------------------------ */

function ChangePlanModal({ open, onClose, subscription }: { open: boolean; onClose: () => void; subscription: Subscription | null }) {
  const toast = useToast()
  const [selectedPlan, setSelectedPlan] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Plan changed to ${selectedPlan} for ${subscription?.tenantName}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && subscription && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-4 top-[25%] z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={onClose}
              className="absolute end-3 top-3 rounded-lg p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-foreground">Change Plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update the subscription plan for {subscription.tenantName}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Current Plan</label>
                <input
                  value={subscription.plan}
                  disabled
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">New Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select a plan</option>
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
                >
                  Change Plan
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function SubscriptionsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: [],
    plan: [],
    billingCycle: [],
  })
  const [changePlanSub, setChangePlanSub] = useState<Subscription | null>(null)

  const kpis: KPIItem[] = [
    { label: t('subscriptions.mrr', 'MRR'), value: 'SAR 20,700', change: 8.3, trend: 'up', icon: DollarSign },
    { label: t('subscriptions.arr', 'ARR'), value: 'SAR 248,400', change: 8.3, trend: 'up', icon: TrendingUp },
    { label: t('subscriptions.arpa', 'Avg Revenue Per Account'), value: 'SAR 3,450', change: 2.1, trend: 'up', icon: BarChart3 },
    { label: t('subscriptions.active', 'Active Subscriptions'), value: 5, change: 12, trend: 'up', icon: Users },
  ]

  const filteredSubscriptions = useMemo(() => {
    let result = mockSubscriptions
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((s) => s.tenantName.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q))
    }
    if (activeFilters.status.length > 0) {
      result = result.filter((s) => activeFilters.status.includes(s.status))
    }
    if (activeFilters.plan.length > 0) {
      result = result.filter((s) => activeFilters.plan.includes(s.plan))
    }
    if (activeFilters.billingCycle.length > 0) {
      result = result.filter((s) => activeFilters.billingCycle.includes(s.billingCycle))
    }
    return result
  }, [search, activeFilters])

  const expiringTrials = mockSubscriptions.filter((s) => s.status === 'TRIAL').length
  const overdueCount = mockSubscriptions.filter((s) => s.status === 'SUSPENDED').length
  const renewalCount = mockSubscriptions.filter((s) => s.status === 'ACTIVE' && s.billingCycle === 'Monthly').length

  const columns: ColumnDef<Subscription, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'tenantName',
        header: t('subscriptions.tenant', 'Tenant'),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'plan',
        header: t('subscriptions.plan', 'Plan'),
        cell: ({ getValue }) => {
          const plan = getValue<string>()
          return (
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', planColors[plan] ?? 'bg-muted text-muted-foreground')}>
              {plan}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: t('subscriptions.status', 'Status'),
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        accessorKey: 'billingCycle',
        header: t('subscriptions.billingCycle', 'Billing Cycle'),
      },
      {
        accessorKey: 'nextBilling',
        header: t('subscriptions.nextBilling', 'Next Billing'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'mrr',
        header: t('subscriptions.mrr', 'MRR'),
        cell: ({ getValue }) => (
          <span className="text-end font-medium tabular-nums">
            SAR {getValue<number>().toLocaleString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <ActionsMenu onChangePlan={() => setChangePlanSub(row.original)} />
        ),
        enableSorting: false,
        size: 50,
      },
    ],
    [t],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('subscriptions.title', 'Subscriptions')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subscriptions.subtitle', 'Manage subscriptions, revenue, and billing')}
        </p>
      </div>

      {/* KPIs */}
      <KPIGrid items={kpis} columns={4} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreaChartCard
            title={t('subscriptions.revenueChart', 'Monthly Revenue')}
            subtitle="Last 6 months"
            data={revenueData}
            dataKeys={['revenue']}
            height={280}
          />
        </div>
        <PieChartCard
          title={t('subscriptions.planDistribution', 'Subscriptions by Plan')}
          data={planDistribution}
          centerLabel={String(mockSubscriptions.length)}
          height={280}
        />
      </div>

      {/* Alert bars */}
      <div className="space-y-2">
        {expiringTrials > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-4 py-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-brand-accent" />
            <span className="text-sm text-brand-accent">
              {expiringTrials} trial{expiringTrials > 1 ? 's' : ''} expiring soon
            </span>
          </div>
        )}
        {overdueCount > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-status-error" />
            <span className="text-sm text-status-error">
              {overdueCount} subscription{overdueCount > 1 ? 's' : ''} overdue
            </span>
          </div>
        )}
        {renewalCount > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-status-info/30 bg-status-info/10 px-4 py-2.5">
            <Clock className="h-4 w-4 shrink-0 text-status-info" />
            <span className="text-sm text-status-info">
              {renewalCount} upcoming monthly renewal{renewalCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Filters + Search */}
      <div className="space-y-3">
        <SearchInput
          onChange={setSearch}
          placeholder={t('subscriptions.searchPlaceholder', 'Search subscriptions...')}
          className="w-full max-w-sm"
        />
        <FilterBar
          filters={filterDefs}
          activeFilters={activeFilters}
          onChange={setActiveFilters}
        />
      </div>

      {/* Table */}
      <DataTable<Subscription>
        data={filteredSubscriptions}
        columns={columns}
        enableSearch={false}
        emptyTitle={t('subscriptions.emptyTitle', 'No subscriptions found')}
        emptyDescription={t('subscriptions.emptyDescription', 'Try adjusting your search or filters.')}
      />

      {/* Change Plan modal */}
      <ChangePlanModal
        open={changePlanSub !== null}
        onClose={() => setChangePlanSub(null)}
        subscription={changePlanSub}
      />
    </motion.div>
  )
}
