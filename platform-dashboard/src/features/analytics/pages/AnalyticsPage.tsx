import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  Download,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  KPIGrid,
  type KPIItem,
  AreaChartCard,
  BarChartCard,
  PieChartCard,
} from '@/components/data'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabKey = 'churn' | 'adoption' | 'benchmarks'

interface AtRiskTenant {
  id: string
  name: string
  plan: string
  churnProbability: number
  lastLogin: string
  riskReason: string
}

/* ------------------------------------------------------------------ */
/*  Mock data — Churn                                                  */
/* ------------------------------------------------------------------ */

const churnKPIs: KPIItem[] = [
  { label: 'Monthly Churn Rate', value: '4.2%', change: -0.8, trend: 'down', icon: TrendingDown },
  { label: 'Annual Churn Rate', value: '18.5%', change: 2.1, trend: 'up', icon: AlertTriangle },
  { label: 'At-Risk Tenants', value: 7, change: 16, trend: 'up', icon: Users },
  { label: 'Revenue at Risk', value: '142K SAR', change: 8, trend: 'up', icon: TrendingDown },
]

const churnByPlan = [
  { name: 'Free Trial', churned: 12, retained: 28 },
  { name: 'Starter', churned: 5, retained: 45 },
  { name: 'Professional', churned: 2, retained: 68 },
  { name: 'Enterprise', churned: 1, retained: 39 },
]

const churnReasons = [
  { name: 'Price too high', value: 35 },
  { name: 'Missing features', value: 25 },
  { name: 'Poor support', value: 15 },
  { name: 'Switched competitor', value: 15 },
  { name: 'Business closed', value: 10 },
]

const churnTrend = [
  { month: 'Aug', rate: 5.8 },
  { month: 'Sep', rate: 5.2 },
  { month: 'Oct', rate: 4.9 },
  { month: 'Nov', rate: 5.1 },
  { month: 'Dec', rate: 4.5 },
  { month: 'Jan', rate: 4.8 },
  { month: 'Feb', rate: 4.2 },
]

const atRiskTenants: AtRiskTenant[] = [
  { id: '1', name: 'Khobar CrossFit Box', plan: 'Starter', churnProbability: 85, lastLogin: '14 days ago', riskReason: 'No activity, low engagement' },
  { id: '2', name: 'Tabuk Training Academy', plan: 'Trial', churnProbability: 92, lastLogin: '7 days ago', riskReason: 'Trial expiring, no conversion' },
  { id: '3', name: 'Abha Mountain Gym', plan: 'Professional', churnProbability: 78, lastLogin: '10 days ago', riskReason: 'Payment failures, support issues' },
  { id: '4', name: 'Najran Fitness Center', plan: 'Starter', churnProbability: 65, lastLogin: '5 days ago', riskReason: 'Declining member count' },
  { id: '5', name: 'Al Baha Sports Hub', plan: 'Trial', churnProbability: 71, lastLogin: '3 days ago', riskReason: 'Slow onboarding progress' },
]

/* ------------------------------------------------------------------ */
/*  Mock data — Feature Adoption                                       */
/* ------------------------------------------------------------------ */

const featureAdoption = [
  { feature: 'Member Management', adoption: 98, trend: 'stable' },
  { feature: 'Class Scheduling', adoption: 85, trend: 'up' },
  { feature: 'Payment Processing', adoption: 82, trend: 'up' },
  { feature: 'QR Check-in', adoption: 67, trend: 'up' },
  { feature: 'Analytics Dashboard', adoption: 58, trend: 'up' },
  { feature: 'SMS Notifications', adoption: 45, trend: 'stable' },
  { feature: 'Custom Reports', adoption: 32, trend: 'down' },
  { feature: 'API Integration', adoption: 18, trend: 'stable' },
  { feature: 'White-label App', adoption: 12, trend: 'up' },
]

const adoptionTrend = [
  { month: 'Aug', avgAdoption: 42, topQuartile: 78 },
  { month: 'Sep', avgAdoption: 45, topQuartile: 80 },
  { month: 'Oct', avgAdoption: 48, topQuartile: 82 },
  { month: 'Nov', avgAdoption: 50, topQuartile: 84 },
  { month: 'Dec', avgAdoption: 52, topQuartile: 85 },
  { month: 'Jan', avgAdoption: 55, topQuartile: 87 },
  { month: 'Feb', avgAdoption: 58, topQuartile: 88 },
]

/* ------------------------------------------------------------------ */
/*  Mock data — Benchmarks                                             */
/* ------------------------------------------------------------------ */

const benchmarkKPIs: KPIItem[] = [
  { label: 'Avg Revenue / Tenant', value: '7.7K SAR', change: 5, trend: 'up', icon: TrendingUp },
  { label: 'Avg Members / Tenant', value: 276, change: 12, trend: 'up', icon: Users },
  { label: 'Avg NPS Score', value: 72, change: 4, trend: 'up', icon: Zap },
  { label: 'Avg Onboarding Days', value: '8.5', change: -15, trend: 'down', icon: BarChart3 },
]

/* ------------------------------------------------------------------ */
/*  HorizontalBar                                                      */
/* ------------------------------------------------------------------ */

function HorizontalBarItem({ label, value, maxValue, trend, index }: {
  label: string
  value: number
  maxValue: number
  trend: string
  index: number
}) {
  const pct = (value / maxValue) * 100

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05 }}
      className="space-y-1"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums text-foreground">{value}%</span>
          {trend === 'up' && <TrendingUp className="h-3 w-3 text-status-success" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 text-status-error" />}
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: index * 0.05, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            value >= 80 ? 'bg-status-success' : value >= 50 ? 'bg-brand-accent' : value >= 30 ? 'bg-status-warning' : 'bg-status-error',
          )}
        />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  ChurnTab                                                           */
/* ------------------------------------------------------------------ */

function ChurnTab() {
  return (
    <div className="space-y-6">
      <KPIGrid items={churnKPIs} columns={4} />

      {/* At-risk tenant list */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">At-Risk Tenants</h3>
        <div className="space-y-3">
          {atRiskTenants.map((tenant, i) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 rounded-lg border border-border p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-error-bg">
                <span className="text-sm font-bold text-status-error">{tenant.churnProbability}%</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{tenant.name}</span>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {tenant.plan}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{tenant.riskReason}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{tenant.lastLogin}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard
          data={churnByPlan}
          dataKeys={['churned', 'retained']}
          xAxisKey="name"
          title="Churn by Plan"
          subtitle="Churned vs retained tenants"
          height={280}
        />
        <PieChartCard
          data={churnReasons}
          title="Churn Reasons"
          centerLabel={`${churnReasons.reduce((s, r) => s + r.value, 0)}`}
          height={280}
        />
      </div>

      <AreaChartCard
        data={churnTrend}
        dataKeys={['rate']}
        xAxisKey="month"
        title="Monthly Churn Rate Trend"
        subtitle="Percentage"
        height={250}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  AdoptionTab                                                        */
/* ------------------------------------------------------------------ */

function AdoptionTab() {
  const maxAdoption = Math.max(...featureAdoption.map((f) => f.adoption))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Horizontal bars */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Feature Adoption Rate</h3>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {featureAdoption.map((item, i) => (
              <HorizontalBarItem
                key={item.feature}
                label={item.feature}
                value={item.adoption}
                maxValue={maxAdoption}
                trend={item.trend}
                index={i}
              />
            ))}
          </motion.div>
        </div>

        {/* Trend line chart */}
        <AreaChartCard
          data={adoptionTrend}
          dataKeys={['avgAdoption', 'topQuartile']}
          xAxisKey="month"
          title="Adoption Trend"
          subtitle="Average vs top quartile"
          height={380}
        />
      </div>

      {/* Adoption KPIs */}
      <KPIGrid
        items={[
          { label: 'Avg Features Used', value: '5.2 / 9', change: 8, trend: 'up', icon: Zap },
          { label: 'Power Users (7+ features)', value: '18%', change: 12, trend: 'up', icon: Users },
          { label: 'Low Adopters (<3)', value: '22%', change: -5, trend: 'down', icon: AlertTriangle },
          { label: 'Most Requested', value: 'Custom Reports', icon: BarChart3 },
        ]}
        columns={4}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  BenchmarksTab                                                      */
/* ------------------------------------------------------------------ */

function BenchmarksTab() {
  const benchmarkComparison = [
    { metric: 'Revenue / Tenant', ours: 7700, industry: 5200 },
    { metric: 'Active Rate', ours: 78, industry: 65 },
    { metric: 'Retention Rate', ours: 82, industry: 74 },
    { metric: 'Feature Adoption', ours: 58, industry: 42 },
    { metric: 'Support Score', ours: 4.2, industry: 3.8 },
  ]

  return (
    <div className="space-y-6">
      <KPIGrid items={benchmarkKPIs} columns={4} />

      {/* Benchmark comparison */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Industry Comparison</h3>
        <div className="space-y-4">
          {benchmarkComparison.map((item, i) => {
            const oursHigher = item.ours > item.industry
            const maxVal = Math.max(item.ours, item.industry)
            return (
              <motion.div
                key={item.metric}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.metric}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Industry: {item.industry}</span>
                    <span className={cn('text-xs font-bold', oursHigher ? 'text-status-success' : 'text-status-error')}>
                      Ours: {item.ours}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="h-2 rounded-full bg-muted/50 flex-1">
                    <div
                      className="h-full rounded-full bg-muted-foreground/40"
                      style={{ width: `${(item.industry / maxVal) * 100}%` }}
                    />
                  </div>
                  <div className="h-2 rounded-full bg-muted/50 flex-1">
                    <div
                      className={cn('h-full rounded-full', oursHigher ? 'bg-status-success' : 'bg-status-error')}
                      style={{ width: `${(item.ours / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <BarChartCard
        data={[
          { metric: 'Q1', Liyaqa: 72, Industry: 58 },
          { metric: 'Q2', Liyaqa: 78, Industry: 60 },
          { metric: 'Q3', Liyaqa: 82, Industry: 62 },
          { metric: 'Q4', Liyaqa: 85, Industry: 65 },
        ]}
        dataKeys={['Liyaqa', 'Industry']}
        xAxisKey="metric"
        title="Quarterly Performance vs Industry"
        subtitle="Composite score"
        height={280}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('churn')

  const tabs: Array<{ key: TabKey; label: string; icon: typeof BarChart3 }> = [
    { key: 'churn', label: t('analytics.churn', 'Churn Analysis'), icon: TrendingDown },
    { key: 'adoption', label: t('analytics.adoption', 'Feature Adoption'), icon: Zap },
    { key: 'benchmarks', label: t('analytics.benchmarks', 'Benchmarks'), icon: BarChart3 },
  ]

  const handleExport = () => {
    toast.success('Report export started. You will be notified when ready.')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('analytics.title', 'Analytics')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('analytics.subtitle', 'Deep dive into platform metrics, churn, adoption, and benchmarks')}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'churn' && <ChurnTab />}
      {activeTab === 'adoption' && <AdoptionTab />}
      {activeTab === 'benchmarks' && <BenchmarksTab />}
    </motion.div>
  )
}
