import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Palette, Type, Box, BarChart3, Bell, FormInput, Clock, AlertTriangle,
  Users, Activity, Zap, TrendingUp, CheckCircle, Search, Filter as FilterIcon,
} from 'lucide-react'
import { StatCard } from '@/components/data/StatCard'
import { KPIGrid, type KPIItem } from '@/components/data/KPIGrid'
import { AreaChartCard, BarChartCard, PieChartCard } from '@/components/data/Chart'
import { Timeline } from '@/components/data/Timeline'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { SearchInput } from '@/components/forms/SearchInput'
import { useToast } from '@/stores/toast-store'
import { staggerContainer, staggerItem } from '@/lib/motion'

const COLORS = [
  { name: 'Primary Dark', var: '--bg-inverse', value: '#0A1628' },
  { name: 'Accent Amber', var: '--brand-accent', value: '#F59E0B' },
  { name: 'Accent Hover', var: '--brand-accent-hover', value: '#D97706' },
  { name: 'Success', var: '--status-success', value: '#10B981' },
  { name: 'Warning', var: '--status-warning', value: '#F59E0B' },
  { name: 'Error', var: '--status-error', value: '#EF4444' },
  { name: 'Info', var: '--status-info', value: '#3B82F6' },
  { name: 'Text Primary', var: '--text-primary', value: '#0A1628' },
  { name: 'Text Secondary', var: '--text-secondary', value: '#495057' },
  { name: 'Text Tertiary', var: '--text-tertiary', value: '#868E96' },
]

const CHART_DATA = [
  { name: 'Jan', revenue: 4000, growth: 2400 },
  { name: 'Feb', revenue: 3000, growth: 1398 },
  { name: 'Mar', revenue: 2000, growth: 9800 },
  { name: 'Apr', revenue: 2780, growth: 3908 },
  { name: 'May', revenue: 1890, growth: 4800 },
  { name: 'Jun', revenue: 2390, growth: 3800 },
]

const PIE_DATA = [
  { name: 'Active', value: 400 },
  { name: 'Trial', value: 300 },
  { name: 'Suspended', value: 100 },
  { name: 'Deactivated', value: 50 },
]

const TIMELINE_ITEMS = [
  { id: '1', timestamp: '2 min ago', title: 'User created account', description: 'New tenant registered via self-serve', type: 'create' as const },
  { id: '2', timestamp: '15 min ago', title: 'Plan upgraded to Pro', description: 'Billing updated automatically', type: 'update' as const },
  { id: '3', timestamp: '1 hour ago', title: 'API key revoked', description: 'Security audit triggered', type: 'delete' as const },
  { id: '4', timestamp: '3 hours ago', title: 'Dashboard accessed', description: 'Admin login from new IP', type: 'access' as const },
]

const KPIS: KPIItem[] = [
  { label: 'Total Revenue', value: '245K SAR', change: 12, trend: 'up', icon: TrendingUp },
  { label: 'Active Tenants', value: 156, change: 8, trend: 'up', icon: Users },
  { label: 'Uptime', value: '99.97%', change: 0.1, trend: 'up', icon: Activity },
  { label: 'Avg Response', value: '145ms', change: -5, trend: 'up', icon: Zap },
]

const SECTIONS = [
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'spacing', label: 'Spacing', icon: Box },
  { id: 'kpis', label: 'KPI Cards', icon: BarChart3 },
  { id: 'charts', label: 'Charts', icon: BarChart3 },
  { id: 'badges', label: 'Status Badges', icon: CheckCircle },
  { id: 'feedback', label: 'Feedback', icon: AlertTriangle },
  { id: 'forms', label: 'Form Controls', icon: FormInput },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'toasts', label: 'Toasts', icon: Bell },
  { id: 'skeletons', label: 'Skeletons', icon: Box },
]

function SectionHeading({ title, id }: { title: string; id: string }) {
  return (
    <h2 id={id} className="mb-4 mt-8 border-b border-border pb-2 text-lg font-bold text-foreground first:mt-0">
      {title}
    </h2>
  )
}

export default function DesignSystemPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('colors')

  return (
    <div className="flex gap-6 p-6">
      {/* Sticky sidebar nav */}
      <nav className="hidden w-48 shrink-0 lg:block">
        <div className="sticky top-20 space-y-1">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sections</div>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                activeSection === s.id
                  ? 'bg-brand-accent/10 font-medium text-brand-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Content */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="min-w-0 flex-1">
        <h1 className="mb-2 text-2xl font-bold text-foreground">{t('nav.content', 'Design System')}</h1>
        <p className="mb-6 text-sm text-muted-foreground">Interactive showcase of all platform dashboard components.</p>

        {/* Colors */}
        <SectionHeading title="Color Palette" id="colors" />
        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {COLORS.map((c) => (
            <div key={c.var} className="overflow-hidden rounded-lg border border-border">
              <div className="h-16" style={{ backgroundColor: c.value }} />
              <div className="bg-card p-2">
                <div className="text-xs font-semibold text-foreground">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">{c.value}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Typography */}
        <SectionHeading title="Typography" id="typography" />
        <motion.div variants={staggerItem} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div>
            <span className="text-xs text-muted-foreground">Plus Jakarta Sans (EN)</span>
            <p className="text-2xl font-bold text-foreground">The quick brown fox jumps over the lazy dog</p>
          </div>
          <div dir="rtl">
            <span className="text-xs text-muted-foreground">IBM Plex Sans Arabic (AR)</span>
            <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-arabic)' }}>
              الثعلب البني السريع يقفز فوق الكلب الكسول
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">JetBrains Mono (Code)</span>
            <pre className="rounded-lg bg-muted p-3 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
              {'const greeting = "Hello, Liyaqa!"'}
            </pre>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground">Heading XL — 30px</p>
            <p className="text-2xl font-bold text-foreground">Heading LG — 24px</p>
            <p className="text-xl font-semibold text-foreground">Heading MD — 20px</p>
            <p className="text-lg font-semibold text-foreground">Heading SM — 18px</p>
            <p className="text-base text-foreground">Body — 16px</p>
            <p className="text-sm text-muted-foreground">Small — 14px</p>
            <p className="text-xs text-muted-foreground">Caption — 12px</p>
          </div>
        </motion.div>

        {/* Spacing */}
        <SectionHeading title="Spacing Scale" id="spacing" />
        <motion.div variants={staggerItem} className="flex flex-wrap items-end gap-3">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="rounded bg-brand-accent" style={{ width: `${s * 4}px`, height: `${s * 4}px` }} />
              <span className="text-[10px] text-muted-foreground">{s * 4}px</span>
            </div>
          ))}
        </motion.div>

        {/* KPI Cards */}
        <SectionHeading title="KPI Cards & Grid" id="kpis" />
        <motion.div variants={staggerItem} className="space-y-4">
          <KPIGrid items={KPIS} columns={4} />
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Loading State" value="" loading />
            <StatCard label="Custom Icon" value="42" change={-3} trend="down" icon={Users} />
          </div>
        </motion.div>

        {/* Charts */}
        <SectionHeading title="Charts" id="charts" />
        <motion.div variants={staggerItem} className="grid gap-4 lg:grid-cols-2">
          <AreaChartCard title="Area Chart" subtitle="Revenue over time" data={CHART_DATA} dataKeys={['revenue', 'growth']} />
          <BarChartCard title="Bar Chart" subtitle="Monthly comparison" data={CHART_DATA} dataKeys={['revenue']} />
        </motion.div>
        <motion.div variants={staggerItem} className="mt-4 grid gap-4 lg:grid-cols-2">
          <PieChartCard title="Pie Chart" subtitle="Tenant distribution" data={PIE_DATA} centerLabel="850" />
          <AreaChartCard title="Loading Chart" data={[]} dataKeys={[]} loading />
        </motion.div>

        {/* Status Badges */}
        <SectionHeading title="Status Badges" id="badges" />
        <motion.div variants={staggerItem} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Pill variant (default)</div>
            <div className="flex flex-wrap gap-2">
              {['ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'TRIAL', 'PROVISIONING', 'ARCHIVED'].map((s) => (
                <StatusBadge key={s} status={s} variant="pill" />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Dot variant</div>
            <div className="flex flex-wrap gap-4">
              {['ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'TRIAL', 'PROVISIONING', 'ARCHIVED'].map((s) => (
                <StatusBadge key={s} status={s} variant="dot" />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Outline variant</div>
            <div className="flex flex-wrap gap-2">
              {['ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'TRIAL', 'PROVISIONING', 'ARCHIVED'].map((s) => (
                <StatusBadge key={s} status={s} variant="outline" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Feedback */}
        <SectionHeading title="Feedback Components" id="feedback" />
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Empty State</div>
            <EmptyState
              icon={Search}
              title="No results found"
              description="Try adjusting your search or filters to find what you're looking for."
              action={
                <button className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse">
                  Clear Filters
                </button>
              }
            />
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 text-xs font-medium text-muted-foreground">Confirm Dialog</div>
            <button
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg bg-status-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              Open Danger Dialog
            </button>
            <ConfirmDialog
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={() => {
                setConfirmOpen(false)
                toast.success('Action confirmed!')
              }}
              title="Delete this item?"
              description="This action cannot be undone. This will permanently delete the resource."
              confirmLabel="Delete"
              danger
            />
          </div>
        </motion.div>

        {/* Form Controls */}
        <SectionHeading title="Form Controls" id="forms" />
        <motion.div variants={staggerItem} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Search Input</div>
            <SearchInput onChange={() => {}} placeholder="Search components..." className="max-w-sm" />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Search Input (loading)</div>
            <SearchInput onChange={() => {}} placeholder="Searching..." loading className="max-w-sm" />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Filter Bar</div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                <FilterIcon className="h-4 w-4" />
                Status
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                <FilterIcon className="h-4 w-4" />
                Plan
              </button>
              <span className="rounded-full bg-brand-accent-light px-2.5 py-0.5 text-xs font-medium text-brand-accent">
                Active
              </span>
              <span className="rounded-full bg-brand-accent-light px-2.5 py-0.5 text-xs font-medium text-brand-accent">
                Pro Plan
              </span>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <SectionHeading title="Timeline" id="timeline" />
        <motion.div variants={staggerItem} className="rounded-xl border border-border bg-card p-6">
          <Timeline items={TIMELINE_ITEMS} />
        </motion.div>

        {/* Toasts */}
        <SectionHeading title="Toast Notifications" id="toasts" />
        <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
          <button
            onClick={() => toast.success('Operation completed successfully')}
            className="rounded-lg bg-status-success px-4 py-2 text-sm font-medium text-white"
          >
            Success Toast
          </button>
          <button
            onClick={() => toast.error('Something went wrong')}
            className="rounded-lg bg-status-error px-4 py-2 text-sm font-medium text-white"
          >
            Error Toast
          </button>
          <button
            onClick={() => toast.warning('Please review before proceeding')}
            className="rounded-lg bg-status-warning px-4 py-2 text-sm font-medium text-white"
          >
            Warning Toast
          </button>
          <button
            onClick={() => toast.info('New update available')}
            className="rounded-lg bg-status-info px-4 py-2 text-sm font-medium text-white"
          >
            Info Toast
          </button>
        </motion.div>

        {/* Skeletons */}
        <SectionHeading title="Loading Skeletons" id="skeletons" />
        <motion.div variants={staggerItem} className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Text Skeleton</div>
            <LoadingSkeleton variant="text" rows={3} />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Card Skeleton</div>
            <LoadingSkeleton variant="card" />
          </div>
          <div className="lg:col-span-2">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Table Skeleton</div>
            <LoadingSkeleton variant="table" rows={3} columns={4} />
          </div>
          <div className="lg:col-span-2">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Chart Skeleton</div>
            <LoadingSkeleton variant="chart" />
          </div>
        </motion.div>

        <div className="mt-12 pb-8 text-center text-xs text-muted-foreground">
          Liyaqa Design System v1.0 — Platform Dashboard
        </div>
      </motion.div>
    </div>
  )
}
