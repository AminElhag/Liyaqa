import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  LayoutList,
  Mail,
  Phone,
  TrendingDown,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIGrid, type KPIItem, DataTable, PieChartCard } from '@/components/data'
import { SearchInput, FilterBar } from '@/components/forms'
import { staggerContainer, staggerItem } from '@/lib/motion'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Facility {
  id: string
  name: string
  plan: string
  region: string
  healthScore: number
  members: number
  activeMembers: number
  revenue: number
  trend: number[]
  status: 'healthy' | 'warning' | 'critical'
  riskFactors?: string[]
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_FACILITIES: Facility[] = [
  { id: '1', name: 'Riyadh Fitness Hub', plan: 'Professional', region: 'Riyadh', healthScore: 92, members: 1240, activeMembers: 1050, revenue: 186000, trend: [75, 78, 82, 85, 88, 92], status: 'healthy' },
  { id: '2', name: 'Jeddah Sports Club', plan: 'Enterprise', region: 'Jeddah', healthScore: 88, members: 3400, activeMembers: 2800, revenue: 510000, trend: [80, 82, 84, 86, 87, 88], status: 'healthy' },
  { id: '3', name: 'Dammam Athletic Center', plan: 'Starter', region: 'Dammam', healthScore: 74, members: 310, activeMembers: 220, revenue: 46500, trend: [70, 72, 73, 74, 74, 74], status: 'warning' },
  { id: '4', name: 'Medina Wellness Studio', plan: 'Professional', region: 'Medina', healthScore: 65, members: 520, activeMembers: 310, revenue: 78000, trend: [80, 78, 75, 70, 67, 65], status: 'warning' },
  { id: '5', name: 'Khobar CrossFit Box', plan: 'Starter', region: 'Khobar', healthScore: 45, members: 180, activeMembers: 72, revenue: 27000, trend: [65, 60, 55, 50, 47, 45], status: 'critical', riskFactors: ['High churn rate (18%)', 'Low feature adoption', 'No logins in 5 days'] },
  { id: '6', name: 'Tabuk Training Academy', plan: 'Free Trial', region: 'Tabuk', healthScore: 32, members: 42, activeMembers: 8, revenue: 0, trend: [50, 45, 40, 38, 35, 32], status: 'critical', riskFactors: ['Trial expiring in 3 days', 'Only 19% onboarding complete', 'Zero revenue'] },
  { id: '7', name: 'Abha Mountain Gym', plan: 'Professional', region: 'Abha', healthScore: 28, members: 290, activeMembers: 45, revenue: 43500, trend: [60, 52, 45, 38, 32, 28], status: 'critical', riskFactors: ['84% member inactivity', 'Payment failed 2x', 'Support tickets unresolved (7)'] },
  { id: '8', name: 'Hail Sports Complex', plan: 'Enterprise', region: 'Hail', healthScore: 81, members: 890, activeMembers: 710, revenue: 133500, trend: [76, 77, 78, 79, 80, 81], status: 'healthy' },
  { id: '9', name: 'Najran Fitness Center', plan: 'Starter', region: 'Najran', healthScore: 56, members: 150, activeMembers: 85, revenue: 22500, trend: [62, 60, 59, 58, 57, 56], status: 'warning' },
  { id: '10', name: 'Yanbu Active Life', plan: 'Professional', region: 'Yanbu', healthScore: 85, members: 670, activeMembers: 540, revenue: 100500, trend: [78, 80, 82, 83, 84, 85], status: 'healthy' },
]

const filterDefs = [
  {
    id: 'status',
    label: 'Health Tier',
    options: [
      { label: 'Healthy (70+)', value: 'healthy' },
      { label: 'Warning (40-69)', value: 'warning' },
      { label: 'Critical (<40)', value: 'critical' },
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
    id: 'region',
    label: 'Region',
    options: [
      { label: 'Riyadh', value: 'Riyadh' },
      { label: 'Jeddah', value: 'Jeddah' },
      { label: 'Dammam', value: 'Dammam' },
      { label: 'Medina', value: 'Medina' },
      { label: 'Khobar', value: 'Khobar' },
      { label: 'Tabuk', value: 'Tabuk' },
      { label: 'Abha', value: 'Abha' },
      { label: 'Hail', value: 'Hail' },
    ],
  },
]

type SortKey = 'score' | 'members' | 'activity'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-status-success'
  if (score >= 40) return 'text-status-warning'
  return 'text-status-error'
}

function getScoreRingColor(score: number): string {
  if (score >= 70) return 'stroke-status-success'
  if (score >= 40) return 'stroke-status-warning'
  return 'stroke-status-error'
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-status-success-bg'
  if (score >= 40) return 'bg-status-warning-bg'
  return 'bg-status-error-bg'
}

/* ------------------------------------------------------------------ */
/*  CircularProgress                                                   */
/* ------------------------------------------------------------------ */

function CircularProgress({ score, size = 56 }: { score: number; size?: number }) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={getScoreRingColor(score)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className={cn('absolute inset-0 flex items-center justify-center text-sm font-bold', getScoreColor(score))}>
        {score}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MiniSparkline                                                      */
/* ------------------------------------------------------------------ */

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 80
  const height = 24
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`)
    .join(' ')

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={color}
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  FacilityCard                                                       */
/* ------------------------------------------------------------------ */

function FacilityCard({ facility, index }: { facility: Facility; index: number }) {
  const activityRate = Math.round((facility.activeMembers / facility.members) * 100)

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <CircularProgress score={facility.healthScore} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{facility.name}</h3>
            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', getScoreBgColor(facility.healthScore), getScoreColor(facility.healthScore))}>
              {facility.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{facility.plan} · {facility.region}</p>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="tabular-nums">{facility.members.toLocaleString()}</span>
              <span>members</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span className="tabular-nums">{activityRate}%</span>
              <span>active</span>
            </div>
            <MiniSparkline data={facility.trend} color={getScoreRingColor(facility.healthScore)} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  AtRiskSection                                                      */
/* ------------------------------------------------------------------ */

function AtRiskSection({ facilities }: { facilities: Facility[] }) {
  const [expanded, setExpanded] = useState(true)
  const atRisk = facilities.filter((f) => f.healthScore < 40)

  if (atRisk.length === 0) return null

  return (
    <div className="rounded-xl border border-status-error/30 bg-status-error-bg/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-error" />
          <span className="text-sm font-semibold text-foreground">
            At Risk Facilities ({atRisk.length})
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-5 pb-4">
              {atRisk.map((facility) => (
                <div
                  key={facility.id}
                  className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <CircularProgress score={facility.healthScore} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{facility.name}</h4>
                      <span className="text-xs text-muted-foreground">{facility.plan} · {facility.region}</span>
                    </div>
                    {facility.riskFactors && (
                      <ul className="mt-2 space-y-1">
                        {facility.riskFactors.map((factor, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs text-status-error">
                            <TrendingDown className="h-3 w-3 shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button className="flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover">
                        <Phone className="h-3 w-3" />
                        Contact
                      </button>
                      <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                        <Mail className="h-3 w-3" />
                        Send Email
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HealthPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('score')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: [],
    plan: [],
    region: [],
  })

  const avgScore = Math.round(MOCK_FACILITIES.reduce((s, f) => s + f.healthScore, 0) / MOCK_FACILITIES.length)
  const healthyCount = MOCK_FACILITIES.filter((f) => f.healthScore >= 70).length
  const warningCount = MOCK_FACILITIES.filter((f) => f.healthScore >= 40 && f.healthScore < 70).length
  const criticalCount = MOCK_FACILITIES.filter((f) => f.healthScore < 40).length

  const healthDistribution = [
    { name: 'Healthy (70+)', value: healthyCount },
    { name: 'Warning (40-69)', value: warningCount },
    { name: 'Critical (<40)', value: criticalCount },
  ]

  const kpis: KPIItem[] = [
    { label: t('health.avgScore', 'Average Health Score'), value: avgScore, change: 3, trend: 'up', icon: Activity },
    { label: t('health.healthy', 'Healthy Facilities'), value: healthyCount, change: 8, trend: 'up', icon: Building2 },
    { label: t('health.warning', 'Needs Attention'), value: warningCount, change: -5, trend: 'down', icon: AlertTriangle },
    { label: t('health.critical', 'Critical'), value: criticalCount, change: 12, trend: 'up', icon: AlertTriangle },
  ]

  const filteredFacilities = useMemo(() => {
    let result = [...MOCK_FACILITIES]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (f) => f.name.toLowerCase().includes(q) || f.region.toLowerCase().includes(q),
      )
    }

    if (activeFilters.status.length > 0) {
      result = result.filter((f) => activeFilters.status.includes(f.status))
    }
    if (activeFilters.plan.length > 0) {
      result = result.filter((f) => activeFilters.plan.includes(f.plan))
    }
    if (activeFilters.region.length > 0) {
      result = result.filter((f) => activeFilters.region.includes(f.region))
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.healthScore - a.healthScore
        case 'members':
          return b.members - a.members
        case 'activity':
          return (b.activeMembers / b.members) - (a.activeMembers / a.members)
        default:
          return 0
      }
    })

    return result
  }, [search, activeFilters, sortBy])

  const columns: ColumnDef<Facility, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Facility',
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-foreground">{row.original.name}</span>
            <span className="ms-2 text-xs text-muted-foreground">{row.original.plan}</span>
          </div>
        ),
      },
      {
        accessorKey: 'healthScore',
        header: 'Health Score',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CircularProgress score={row.original.healthScore} size={36} />
            <span className={cn('text-sm font-bold', getScoreColor(row.original.healthScore))}>
              {row.original.healthScore}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'members',
        header: 'Members',
        cell: ({ getValue }) => (
          <span className="tabular-nums">{(getValue() as number).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: 'activeMembers',
        header: 'Active',
        cell: ({ row }) => {
          const rate = Math.round((row.original.activeMembers / row.original.members) * 100)
          return <span className="tabular-nums">{rate}%</span>
        },
      },
      {
        accessorKey: 'region',
        header: 'Region',
      },
      {
        id: 'trend',
        header: 'Trend',
        cell: ({ row }) => (
          <MiniSparkline data={row.original.trend} color={getScoreRingColor(row.original.healthScore)} />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', getScoreBgColor(row.original.healthScore), getScoreColor(row.original.healthScore))}>
            {row.original.status}
          </span>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('health.title', 'Facility Health Dashboard')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('health.subtitle', 'Monitor facility performance and identify at-risk accounts')}
          </p>
        </div>
        <div className={cn('flex items-center justify-center rounded-2xl p-4', avgScore >= 70 ? 'bg-status-success-bg' : avgScore >= 40 ? 'bg-status-warning-bg' : 'bg-status-error-bg')}>
          <div className="text-center">
            <div className={cn('text-3xl font-bold', getScoreColor(avgScore))}>{avgScore}</div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </div>
        </div>
      </div>

      {/* KPIs + Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <KPIGrid items={kpis} columns={4} />
        </div>
        <PieChartCard
          data={healthDistribution}
          title={t('health.distribution', 'Health Distribution')}
          centerLabel={`${MOCK_FACILITIES.length}`}
          height={200}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <SearchInput
          onChange={setSearch}
          placeholder={t('health.search', 'Search facilities...')}
          className="w-full max-w-sm"
        />
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="score">Sort by Score</option>
            <option value="members">Sort by Members</option>
            <option value="activity">Sort by Activity</option>
          </select>
        </div>
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setView('grid')}
            className={cn('rounded-s-lg px-3 py-1.5 text-sm', view === 'grid' ? 'bg-brand-accent text-bg-inverse' : 'text-muted-foreground hover:text-foreground')}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={cn('rounded-e-lg px-3 py-1.5 text-sm', view === 'table' ? 'bg-brand-accent text-bg-inverse' : 'text-muted-foreground hover:text-foreground')}
          >
            <LayoutList className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FilterBar
        filters={filterDefs}
        activeFilters={activeFilters}
        onChange={setActiveFilters}
      />

      {/* At Risk Section */}
      <AtRiskSection facilities={filteredFacilities} />

      {/* Card Grid or Table */}
      {view === 'grid' ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredFacilities.map((facility, i) => (
            <FacilityCard key={facility.id} facility={facility} index={i} />
          ))}
        </motion.div>
      ) : (
        <DataTable<Facility>
          data={filteredFacilities}
          columns={columns}
          enableSearch={false}
          emptyTitle="No facilities found"
          emptyDescription="Try adjusting your search or filters."
        />
      )}
    </motion.div>
  )
}
