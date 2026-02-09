import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Clock,
  CreditCard,
  DollarSign,
  Handshake,
  LifeBuoy,
  TrendingUp,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  KPIGrid,
  type KPIItem,
  AreaChartCard,
  BarChartCard,
  PieChartCard,
  DataTable,
} from '@/components/data'
import { LoadingSkeleton } from '@/components/feedback'
import { staggerContainer, staggerItem } from '@/lib/motion'

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const revenueData = [
  { month: 'Aug', revenue: 185000, target: 200000 },
  { month: 'Sep', revenue: 210000, target: 220000 },
  { month: 'Oct', revenue: 245000, target: 240000 },
  { month: 'Nov', revenue: 270000, target: 260000 },
  { month: 'Dec', revenue: 290000, target: 280000 },
  { month: 'Jan', revenue: 320000, target: 310000 },
  { month: 'Feb', revenue: 345000, target: 330000 },
]

const tenantGrowthData = [
  { month: 'Aug', newTenants: 5, churned: 1 },
  { month: 'Sep', newTenants: 8, churned: 2 },
  { month: 'Oct', newTenants: 12, churned: 1 },
  { month: 'Nov', newTenants: 9, churned: 3 },
  { month: 'Dec', newTenants: 15, churned: 2 },
  { month: 'Jan', newTenants: 11, churned: 1 },
  { month: 'Feb', newTenants: 14, churned: 2 },
]

const planDistribution = [
  { name: 'Enterprise', value: 8 },
  { name: 'Professional', value: 18 },
  { name: 'Starter', value: 12 },
  { name: 'Trial', value: 7 },
]

const regionDistribution = [
  { name: 'Riyadh', value: 15 },
  { name: 'Jeddah', value: 10 },
  { name: 'Dammam', value: 8 },
  { name: 'Others', value: 12 },
]

const healthDistribution = [
  { name: 'Healthy', value: 28 },
  { name: 'Warning', value: 10 },
  { name: 'Critical', value: 7 },
]

interface RecentDeal {
  id: string
  facility: string
  value: number
  stage: string
  daysInStage: number
}

const recentDeals: RecentDeal[] = [
  { id: '1', facility: 'FitZone Riyadh', value: 45000, stage: 'Proposal', daysInStage: 3 },
  { id: '2', facility: 'PowerGym Jeddah', value: 72000, stage: 'Demo Done', daysInStage: 5 },
  { id: '3', facility: 'Elite Sports', value: 95000, stage: 'Negotiation', daysInStage: 2 },
  { id: '4', facility: 'Body Masters', value: 120000, stage: 'Won', daysInStage: 0 },
  { id: '5', facility: 'Fitness First KSA', value: 200000, stage: 'Lead', daysInStage: 1 },
]

interface RecentTicket {
  id: string
  subject: string
  facility: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'resolved'
  createdAt: string
}

const recentTickets: RecentTicket[] = [
  { id: 'T-001', subject: 'Payment integration issue', facility: 'Riyadh Fitness Hub', priority: 'high', status: 'open', createdAt: '2 hours ago' },
  { id: 'T-002', subject: 'Member import failing', facility: 'Jeddah Sports Club', priority: 'medium', status: 'in-progress', createdAt: '5 hours ago' },
  { id: 'T-003', subject: 'Custom report request', facility: 'Dammam Athletic', priority: 'low', status: 'open', createdAt: '1 day ago' },
  { id: 'T-004', subject: 'SMS notifications delay', facility: 'Medina Wellness', priority: 'critical', status: 'in-progress', createdAt: '3 hours ago' },
  { id: 'T-005', subject: 'Dashboard not loading', facility: 'Khobar CrossFit', priority: 'high', status: 'resolved', createdAt: '2 days ago' },
]

const healthAlerts = [
  { id: '1', facility: 'Khobar CrossFit Box', score: 45, issue: 'High churn rate and low feature adoption' },
  { id: '2', facility: 'Tabuk Training Academy', score: 32, issue: 'Trial expiring, only 19% onboarding complete' },
  { id: '3', facility: 'Abha Mountain Gym', score: 28, issue: '84% member inactivity, payment failures' },
]

/* ------------------------------------------------------------------ */
/*  QuickActionCard                                                    */
/* ------------------------------------------------------------------ */

function QuickActionCard({ icon: Icon, label, count, color, index }: {
  icon: typeof Handshake
  label: string
  count: number
  color: string
  index: number
}) {
  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.08 }}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-brand-accent/30"
    >
      <div className={cn('rounded-lg p-2.5', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold text-foreground">{count}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Priority / Status helpers                                          */
/* ------------------------------------------------------------------ */

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical': return 'bg-status-error-bg text-status-error'
    case 'high': return 'bg-status-warning-bg text-status-warning'
    case 'medium': return 'bg-status-info-bg text-status-info'
    case 'low': return 'bg-muted text-muted-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

function getTicketStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-status-error-bg text-status-error'
    case 'in-progress': return 'bg-status-warning-bg text-status-warning'
    case 'resolved': return 'bg-status-success-bg text-status-success'
    default: return 'bg-muted text-muted-foreground'
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { t } = useTranslation()
  const [chartsLoaded, setChartsLoaded] = useState(false)

  // Simulate chart loading
  useState(() => {
    const timeout = setTimeout(() => setChartsLoaded(true), 800)
    return () => clearTimeout(timeout)
  })

  const kpis: KPIItem[] = [
    { label: t('dashboard.totalTenants', 'Total Tenants'), value: 45, change: 12, trend: 'up', icon: Building2 },
    { label: t('dashboard.mrr', 'Monthly Revenue'), value: '345K SAR', change: 8.5, trend: 'up', icon: DollarSign },
    { label: t('dashboard.activeMembers', 'Active Members'), value: '12.4K', change: 5.2, trend: 'up', icon: Users },
    { label: t('dashboard.avgHealth', 'Avg Health Score'), value: 72, change: 3, trend: 'up', icon: Activity },
  ]

  const dealColumns: ColumnDef<RecentDeal, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'facility',
        header: 'Facility',
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-brand-accent font-medium">
            {(getValue<number>() / 1000).toFixed(0)}K SAR
          </span>
        ),
      },
      {
        accessorKey: 'stage',
        header: 'Stage',
        cell: ({ getValue }) => {
          const stage = getValue<string>()
          const color = stage === 'Won' ? 'bg-status-success-bg text-status-success' : 'bg-muted text-muted-foreground'
          return (
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', color)}>
              {stage}
            </span>
          )
        },
      },
      {
        accessorKey: 'daysInStage',
        header: 'Days',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground">{getValue<number>()}d</span>
        ),
      },
    ],
    [],
  )

  const ticketColumns: ColumnDef<RecentTicket, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'subject',
        header: 'Subject',
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ getValue }) => {
          const priority = getValue<string>()
          return (
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', getPriorityColor(priority))}>
              {priority}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue<string>()
          return (
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', getTicketStatusColor(status))}>
              {status}
            </span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">{getValue<string>()}</span>
        ),
      },
    ],
    [],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 p-6"
    >
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('dashboard.greeting', 'Good morning, Admin')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('dashboard.subtitle', 'Here is what is happening across the platform today.')}
        </p>
      </div>

      {/* Quick Action Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <QuickActionCard icon={Handshake} label="New Deals" count={14} color="bg-status-info" index={0} />
        <QuickActionCard icon={LifeBuoy} label="Active Tickets" count={8} color="bg-status-warning" index={1} />
        <QuickActionCard icon={Clock} label="Expiring Trials" count={3} color="bg-brand-accent" index={2} />
        <QuickActionCard icon={AlertTriangle} label="SLA Breaches" count={2} color="bg-status-error" index={3} />
      </motion.div>

      {/* KPIs with staggered fadeInUp */}
      <KPIGrid items={kpis} columns={4} />

      {/* Charts Row — Revenue + Tenant Growth */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {!chartsLoaded ? (
          <>
            <LoadingSkeleton variant="chart" />
            <LoadingSkeleton variant="chart" />
          </>
        ) : (
          <>
            <AreaChartCard
              data={revenueData}
              dataKeys={['revenue', 'target']}
              xAxisKey="month"
              title={t('dashboard.revenueChart', 'Monthly Revenue')}
              subtitle="SAR"
              height={280}
            />
            <BarChartCard
              data={tenantGrowthData}
              dataKeys={['newTenants', 'churned']}
              xAxisKey="month"
              title={t('dashboard.tenantGrowth', 'Tenant Growth')}
              subtitle="New vs churned"
              height={280}
            />
          </>
        )}
      </div>

      {/* Distribution Row — 3 pies */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {!chartsLoaded ? (
          <>
            <LoadingSkeleton variant="chart" />
            <LoadingSkeleton variant="chart" />
            <LoadingSkeleton variant="chart" />
          </>
        ) : (
          <>
            <PieChartCard
              data={planDistribution}
              title={t('dashboard.planDistribution', 'Plan Distribution')}
              centerLabel="45"
              height={220}
            />
            <PieChartCard
              data={regionDistribution}
              title={t('dashboard.regionDistribution', 'Region Distribution')}
              centerLabel="45"
              height={220}
            />
            <PieChartCard
              data={healthDistribution}
              title={t('dashboard.healthDistribution', 'Health Distribution')}
              centerLabel="45"
              height={220}
            />
          </>
        )}
      </div>

      {/* Recent Deals + Tickets — 2 column */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('dashboard.recentDeals', 'Recent Deals')}
              </h3>
            </div>
            <button className="text-xs text-brand-accent hover:underline">View all</button>
          </div>
          <DataTable<RecentDeal>
            data={recentDeals}
            columns={dealColumns}
            enableSearch={false}
            enablePagination={false}
            pageSize={5}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('dashboard.recentTickets', 'Recent Tickets')}
              </h3>
            </div>
            <button className="text-xs text-brand-accent hover:underline">View all</button>
          </div>
          <DataTable<RecentTicket>
            data={recentTickets}
            columns={ticketColumns}
            enableSearch={false}
            enablePagination={false}
            pageSize={5}
          />
        </div>
      </div>

      {/* Health Alert Cards */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-error" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('dashboard.healthAlerts', 'Health Alerts')}
          </h3>
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {healthAlerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              variants={staggerItem}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-status-error/30 bg-status-error-bg/30 p-4"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-semibold text-foreground">{alert.facility}</h4>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 rotate-180 text-status-error" />
                  <span className="text-sm font-bold text-status-error">{alert.score}</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{alert.issue}</p>
              <button className="mt-3 text-xs font-medium text-brand-accent hover:underline">
                View Details
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
