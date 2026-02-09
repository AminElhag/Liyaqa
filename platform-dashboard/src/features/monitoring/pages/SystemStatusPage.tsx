import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Server,
  Database,
  HardDrive,
  Cpu,
  Wifi,
  Clock,
  RefreshCw,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AreaChartCard } from '@/components/data'
import { staggerContainer, staggerItem } from '@/lib/motion'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ComponentStatus = 'operational' | 'degraded' | 'down'

interface SystemComponent {
  id: string
  name: string
  status: ComponentStatus
  icon: typeof Server
  uptime: number
  responseTime: number
  errorRate: number
  description: string
  lastChecked: string
}

interface MaintenanceWindow {
  id: string
  title: string
  description: string
  scheduledStart: string
  scheduledEnd: string
  active: boolean
}

interface Incident {
  id: string
  title: string
  status: 'resolved' | 'investigating' | 'monitoring'
  severity: 'minor' | 'major' | 'critical'
  timestamp: string
  description: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_COMPONENTS: SystemComponent[] = [
  {
    id: 'api',
    name: 'API Server',
    status: 'operational',
    icon: Server,
    uptime: 99.98,
    responseTime: 45,
    errorRate: 0.02,
    description: 'Main REST API endpoints',
    lastChecked: '30 seconds ago',
  },
  {
    id: 'database',
    name: 'Database',
    status: 'operational',
    icon: Database,
    uptime: 99.99,
    responseTime: 12,
    errorRate: 0.0,
    description: 'PostgreSQL primary and replicas',
    lastChecked: '30 seconds ago',
  },
  {
    id: 'cache',
    name: 'Cache',
    status: 'degraded',
    icon: Cpu,
    uptime: 99.85,
    responseTime: 8,
    errorRate: 0.15,
    description: 'Redis cache cluster',
    lastChecked: '30 seconds ago',
  },
  {
    id: 'jobs',
    name: 'Background Jobs',
    status: 'operational',
    icon: Clock,
    uptime: 99.95,
    responseTime: 230,
    errorRate: 0.05,
    description: 'Scheduled tasks and async workers',
    lastChecked: '1 minute ago',
  },
  {
    id: 'storage',
    name: 'Storage',
    status: 'operational',
    icon: HardDrive,
    uptime: 100.0,
    responseTime: 85,
    errorRate: 0.0,
    description: 'Object storage for media files',
    lastChecked: '30 seconds ago',
  },
  {
    id: 'cdn',
    name: 'CDN',
    status: 'operational',
    icon: Wifi,
    uptime: 99.99,
    responseTime: 18,
    errorRate: 0.01,
    description: 'Content delivery network',
    lastChecked: '1 minute ago',
  },
]

const MOCK_MAINTENANCE: MaintenanceWindow[] = [
  {
    id: 'm1',
    title: 'Redis Cluster Upgrade',
    description: 'Upgrading Redis cluster to v7.4 for improved performance. Minor latency increase expected during migration.',
    scheduledStart: '2026-02-09T02:00:00',
    scheduledEnd: '2026-02-09T04:00:00',
    active: true,
  },
]

const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    title: 'Elevated cache latency',
    status: 'monitoring',
    severity: 'minor',
    timestamp: '2 hours ago',
    description: 'Redis cache cluster showing elevated response times during maintenance window.',
  },
  {
    id: 'inc-2',
    title: 'API rate limiting triggered',
    status: 'resolved',
    severity: 'minor',
    timestamp: '1 day ago',
    description: 'Brief spike in API requests triggered rate limiting for 3 tenants. Issue self-resolved.',
  },
  {
    id: 'inc-3',
    title: 'Database failover event',
    status: 'resolved',
    severity: 'major',
    timestamp: '5 days ago',
    description: 'Automated failover to replica completed in 12 seconds. No data loss.',
  },
]

const responseTimeHistory = [
  { time: '00:00', API: 42, Database: 10, Cache: 5 },
  { time: '04:00', API: 38, Database: 9, Cache: 4 },
  { time: '08:00', API: 52, Database: 14, Cache: 7 },
  { time: '12:00', API: 65, Database: 18, Cache: 12 },
  { time: '16:00', API: 48, Database: 12, Cache: 15 },
  { time: '20:00', API: 44, Database: 11, Cache: 8 },
  { time: 'Now', API: 45, Database: 12, Cache: 8 },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getStatusConfig(status: ComponentStatus) {
  switch (status) {
    case 'operational':
      return { icon: CheckCircle2, color: 'text-status-success', bg: 'bg-status-success', label: 'Operational' }
    case 'degraded':
      return { icon: AlertTriangle, color: 'text-status-warning', bg: 'bg-status-warning', label: 'Degraded' }
    case 'down':
      return { icon: XCircle, color: 'text-status-error', bg: 'bg-status-error', label: 'Down' }
  }
}

function getOverallStatus(components: SystemComponent[]): { status: ComponentStatus; message: string; color: string; bg: string } {
  const hasDown = components.some((c) => c.status === 'down')
  const hasDegraded = components.some((c) => c.status === 'degraded')

  if (hasDown) return { status: 'down', message: 'Major System Outage', color: 'text-status-error', bg: 'bg-status-error-bg border-status-error/30' }
  if (hasDegraded) return { status: 'degraded', message: 'Partial System Degradation', color: 'text-status-warning', bg: 'bg-status-warning-bg border-status-warning/30' }
  return { status: 'operational', message: 'All Systems Operational', color: 'text-status-success', bg: 'bg-status-success-bg border-status-success/30' }
}

function getIncidentStatusColor(status: string) {
  switch (status) {
    case 'resolved':
      return 'bg-status-success-bg text-status-success'
    case 'investigating':
      return 'bg-status-error-bg text-status-error'
    case 'monitoring':
      return 'bg-status-warning-bg text-status-warning'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-status-error-bg text-status-error'
    case 'major':
      return 'bg-status-warning-bg text-status-warning'
    case 'minor':
      return 'bg-status-info-bg text-status-info'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

/* ------------------------------------------------------------------ */
/*  ComponentCard                                                      */
/* ------------------------------------------------------------------ */

function ComponentCard({ component, index }: { component: SystemComponent; index: number }) {
  const statusCfg = getStatusConfig(component.status)
  const StatusIcon = statusCfg.icon
  const CompIcon = component.icon

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <CompIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{component.name}</h3>
            <p className="text-xs text-muted-foreground">{component.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('h-2.5 w-2.5 rounded-full', statusCfg.bg, component.status === 'degraded' && 'animate-pulse')} />
          <StatusIcon className={cn('h-4 w-4', statusCfg.color)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Uptime</div>
          <div className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{component.uptime}%</div>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Latency</div>
          <div className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{component.responseTime}ms</div>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Errors</div>
          <div className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{component.errorRate}%</div>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-muted-foreground">
        Last checked: {component.lastChecked}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SystemStatusPage() {
  const { t } = useTranslation()
  const [refreshing, setRefreshing] = useState(false)
  const overall = getOverallStatus(MOCK_COMPONENTS)
  const activeMaintenance = MOCK_MAINTENANCE.filter((m) => m.active)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
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
            {t('systemStatus.title', 'System Status')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('systemStatus.subtitle', 'Real-time platform infrastructure monitoring')}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Overall Status Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn('flex items-center gap-3 rounded-xl border p-5', overall.bg)}
      >
        {overall.status === 'operational' ? (
          <CheckCircle2 className="h-6 w-6 text-status-success" />
        ) : overall.status === 'degraded' ? (
          <AlertTriangle className="h-6 w-6 text-status-warning" />
        ) : (
          <XCircle className="h-6 w-6 text-status-error" />
        )}
        <div>
          <h2 className={cn('text-lg font-bold', overall.color)}>{overall.message}</h2>
          <p className="text-xs text-muted-foreground">
            {MOCK_COMPONENTS.filter((c) => c.status === 'operational').length} of {MOCK_COMPONENTS.length} components operational
          </p>
        </div>
      </motion.div>

      {/* Active Maintenance Banner */}
      {activeMaintenance.map((maint) => (
        <motion.div
          key={maint.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-status-info/30 bg-status-info-bg p-4"
        >
          <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-status-info" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{maint.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{maint.description}</p>
            <p className="mt-1 text-xs text-status-info">
              Scheduled: {new Date(maint.scheduledStart).toLocaleString()} - {new Date(maint.scheduledEnd).toLocaleString()}
            </p>
          </div>
        </motion.div>
      ))}

      {/* Component Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {MOCK_COMPONENTS.map((component, i) => (
          <ComponentCard key={component.id} component={component} index={i} />
        ))}
      </motion.div>

      {/* Response Time Chart */}
      <AreaChartCard
        data={responseTimeHistory}
        dataKeys={['API', 'Database', 'Cache']}
        xAxisKey="time"
        title={t('systemStatus.responseTime', 'Response Time (ms)')}
        subtitle="Last 24 hours"
        height={250}
      />

      {/* Recent Incidents */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          {t('systemStatus.incidents', 'Recent Incidents')}
        </h3>
        <div className="space-y-3">
          {MOCK_INCIDENTS.map((incident) => (
            <div
              key={incident.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <div className="mt-1">
                {incident.status === 'resolved' ? (
                  <CheckCircle2 className="h-4 w-4 text-status-success" />
                ) : incident.status === 'investigating' ? (
                  <XCircle className="h-4 w-4 text-status-error" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-status-warning" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{incident.title}</span>
                  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', getIncidentStatusColor(incident.status))}>
                    {incident.status}
                  </span>
                  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', getSeverityColor(incident.severity))}>
                    {incident.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{incident.description}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{incident.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
