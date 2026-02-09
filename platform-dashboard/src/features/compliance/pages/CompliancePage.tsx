import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  FileCheck,
  Clock,
  XCircle,
  CheckCircle,
  RotateCw,
  Shield,
  Receipt,
  UserCheck,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIGrid, DataTable, BarChartCard } from '@/components/data'
import type { KPIItem } from '@/components/data'
import { StatusBadge, ConfirmDialog, EmptyState } from '@/components/feedback'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ContractStatus = 'active' | 'expiring' | 'expired'
type ZatcaIssueStatus = 'pending' | 'failed'
type DataRequestStatus = 'pending' | 'approved' | 'denied'

interface Contract {
  id: string
  tenantName: string
  type: string
  startDate: string
  endDate: string
  status: ContractStatus
  value: string
}

interface ZatcaIssue {
  id: string
  invoiceId: string
  tenantName: string
  errorCode: string
  description: string
  status: ZatcaIssueStatus
  createdAt: string
}

interface DataRequest {
  id: string
  requesterName: string
  requesterEmail: string
  type: 'export' | 'deletion' | 'access'
  description: string
  status: DataRequestStatus
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockContracts: Contract[] = [
  { id: 'c1', tenantName: 'Riyadh Fitness Hub', type: 'Enterprise SLA', startDate: '2025-06-01', endDate: '2026-06-01', status: 'active', value: 'SAR 120,000' },
  { id: 'c2', tenantName: 'Jeddah Sports Club', type: 'Enterprise SLA', startDate: '2025-03-15', endDate: '2026-03-15', status: 'expiring', value: 'SAR 95,000' },
  { id: 'c3', tenantName: 'Dammam Athletic Center', type: 'Standard', startDate: '2025-01-01', endDate: '2026-01-01', status: 'expired', value: 'SAR 45,000' },
  { id: 'c4', tenantName: 'Medina Wellness Studio', type: 'Standard', startDate: '2025-09-01', endDate: '2026-09-01', status: 'active', value: 'SAR 35,000' },
  { id: 'c5', tenantName: 'Khobar CrossFit Box', type: 'Professional', startDate: '2025-04-01', endDate: '2026-02-28', status: 'expiring', value: 'SAR 60,000' },
  { id: 'c6', tenantName: 'Tabuk Training Academy', type: 'Standard', startDate: '2024-10-01', endDate: '2025-10-01', status: 'expired', value: 'SAR 28,000' },
]

const mockZatcaIssues: ZatcaIssue[] = [
  { id: 'z1', invoiceId: 'INV-2026-0042', tenantName: 'Riyadh Fitness Hub', errorCode: 'ZATCA-001', description: 'Missing seller VAT number', status: 'pending', createdAt: '2026-02-08' },
  { id: 'z2', invoiceId: 'INV-2026-0038', tenantName: 'Jeddah Sports Club', errorCode: 'ZATCA-003', description: 'Invalid QR code format', status: 'failed', createdAt: '2026-02-07' },
  { id: 'z3', invoiceId: 'INV-2026-0035', tenantName: 'Khobar CrossFit Box', errorCode: 'ZATCA-002', description: 'XML schema validation error', status: 'pending', createdAt: '2026-02-06' },
]

const mockDataRequests: DataRequest[] = [
  { id: 'd1', requesterName: 'Ahmed Al-Rashid', requesterEmail: 'ahmed@example.com', type: 'export', description: 'Request to export all personal data', status: 'pending', createdAt: '2026-02-08' },
  { id: 'd2', requesterName: 'Fatima Hassan', requesterEmail: 'fatima@example.com', type: 'deletion', description: 'Request to delete account and all associated data', status: 'pending', createdAt: '2026-02-07' },
  { id: 'd3', requesterName: 'Mohammed Ali', requesterEmail: 'mohammed@example.com', type: 'access', description: 'Request to access stored personal information', status: 'approved', createdAt: '2026-02-05' },
]

const mockComplianceChart = [
  { name: 'Sep', compliant: 85, pending: 10, failed: 5 },
  { name: 'Oct', compliant: 88, pending: 8, failed: 4 },
  { name: 'Nov', compliant: 91, pending: 6, failed: 3 },
  { name: 'Dec', compliant: 87, pending: 9, failed: 4 },
  { name: 'Jan', compliant: 93, pending: 5, failed: 2 },
  { name: 'Feb', compliant: 96, pending: 3, failed: 1 },
]

/* ------------------------------------------------------------------ */
/*  Animated circular gauge                                            */
/* ------------------------------------------------------------------ */

function ComplianceGauge({ percentage }: { percentage: number }) {
  const radius = 70
  const stroke = 10
  const normalizedRadius = radius - stroke
  const circumference = normalizedRadius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference
  const gaugeColor = percentage >= 90 ? 'var(--status-success)' : percentage >= 70 ? 'var(--brand-accent)' : 'var(--status-error)'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={radius * 2} height={radius * 2} className="-rotate-90">
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="transparent"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="transparent"
          stroke={gaugeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-3xl font-bold text-foreground"
        >
          {percentage}%
        </motion.span>
        <span className="text-xs text-muted-foreground">Compliance</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Contracts tab                                                      */
/* ------------------------------------------------------------------ */

const contractStatusMap: Record<ContractStatus, string> = {
  active: 'ACTIVE',
  expiring: 'SUSPENDED',
  expired: 'DEACTIVATED',
}

function ContractsTab() {
  const { t } = useTranslation()

  const active = mockContracts.filter((c) => c.status === 'active').length
  const expiring = mockContracts.filter((c) => c.status === 'expiring').length
  const expired = mockContracts.filter((c) => c.status === 'expired').length

  const kpis: KPIItem[] = [
    { label: t('compliance.totalContracts', 'Total Contracts'), value: mockContracts.length, icon: FileCheck },
    { label: t('compliance.active', 'Active'), value: active, trend: 'up', change: 8, icon: CheckCircle },
    { label: t('compliance.expiringSoon', 'Expiring Soon'), value: expiring, trend: 'down', change: -15, icon: Clock },
    { label: t('compliance.expired', 'Expired'), value: expired, icon: XCircle },
  ]

  const columns: ColumnDef<Contract, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'tenantName',
        header: t('compliance.tenant', 'Tenant'),
        cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'type',
        header: t('compliance.contractType', 'Type'),
      },
      {
        accessorKey: 'startDate',
        header: t('compliance.startDate', 'Start'),
      },
      {
        accessorKey: 'endDate',
        header: t('compliance.endDate', 'End'),
      },
      {
        accessorKey: 'value',
        header: t('compliance.value', 'Value'),
        cell: ({ getValue }) => <span className="tabular-nums">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'status',
        header: t('compliance.status', 'Status'),
        cell: ({ getValue }) => {
          const status = getValue<ContractStatus>()
          return (
            <StatusBadge
              status={contractStatusMap[status]}
              label={status === 'expiring' ? 'Expiring Soon' : status.charAt(0).toUpperCase() + status.slice(1)}
            />
          )
        },
      },
    ],
    [t],
  )

  return (
    <div className="space-y-6">
      <KPIGrid items={kpis} columns={4} />
      <DataTable<Contract>
        data={mockContracts}
        columns={columns}
        enableSearch
        searchPlaceholder={t('compliance.searchContracts', 'Search contracts...')}
        onRowClick={() => {}}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ZATCA tab                                                          */
/* ------------------------------------------------------------------ */

function ZatcaTab() {
  const { t } = useTranslation()
  const toast = useToast()

  const handleRetry = useCallback(
    (id: string) => {
      toast.info(`Retrying ZATCA submission for ${id}...`)
    },
    [toast],
  )

  const issueColumns: ColumnDef<ZatcaIssue, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'invoiceId',
        header: t('compliance.invoiceId', 'Invoice'),
        cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-foreground">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'tenantName',
        header: t('compliance.tenant', 'Tenant'),
      },
      {
        accessorKey: 'errorCode',
        header: t('compliance.errorCode', 'Error Code'),
        cell: ({ getValue }) => (
          <span className="rounded bg-status-error-bg px-2 py-0.5 font-mono text-xs text-status-error">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: t('compliance.description', 'Description'),
      },
      {
        accessorKey: 'status',
        header: t('compliance.status', 'Status'),
        cell: ({ getValue }) => {
          const s = getValue<ZatcaIssueStatus>()
          return <StatusBadge status={s === 'pending' ? 'SUSPENDED' : 'DEACTIVATED'} label={s} />
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRetry(row.original.invoiceId)
            }}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RotateCw className="h-3 w-3" />
            Retry
          </button>
        ),
        enableSorting: false,
        size: 80,
      },
    ],
    [t, handleRetry],
  )

  const compliancePct = 96
  const totalInvoices = 1420
  const compliant = 1363
  const pending = 42
  const failed = 15

  return (
    <div className="space-y-6">
      {/* Gauge + stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-6">
          <div className="relative flex items-center justify-center">
            <ComplianceGauge percentage={compliancePct} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Invoices</div>
            <div className="mt-1 text-2xl font-bold text-foreground">{totalInvoices.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Compliant</div>
            <div className="mt-1 text-2xl font-bold text-status-success">{compliant.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</div>
            <div className="mt-1 text-2xl font-bold text-brand-accent">{pending}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Failed</div>
            <div className="mt-1 text-2xl font-bold text-status-error">{failed}</div>
          </div>
        </div>
      </div>

      {/* Issues table */}
      <DataTable<ZatcaIssue>
        data={mockZatcaIssues}
        columns={issueColumns}
        enableSearch
        searchPlaceholder={t('compliance.searchIssues', 'Search issues...')}
        emptyTitle="No issues"
        emptyDescription="All invoices are compliant."
      />

      {/* Monthly chart */}
      <BarChartCard
        title={t('compliance.monthlyCompliance', 'Monthly Compliance Activity')}
        data={mockComplianceChart}
        dataKeys={['compliant', 'pending', 'failed']}
        xAxisKey="name"
        height={280}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Data Requests tab                                                  */
/* ------------------------------------------------------------------ */

function DataRequestsTab() {
  const { t } = useTranslation()
  const toast = useToast()

  const [requests, setRequests] = useState(mockDataRequests)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'deny' } | null>(null)

  const handleConfirm = useCallback(() => {
    if (!confirmAction) return
    const { id, action } = confirmAction
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: (action === 'approve' ? 'approved' : 'denied') as DataRequestStatus } : r,
      ),
    )
    toast.success(`Request ${action === 'approve' ? 'approved' : 'denied'} successfully`)
    setConfirmAction(null)
  }, [confirmAction, toast])

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const processedRequests = requests.filter((r) => r.status !== 'pending')

  const typeIcons: Record<string, typeof FileText> = {
    export: FileText,
    deletion: XCircle,
    access: UserCheck,
  }

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          {t('compliance.pendingRequests', 'Pending Requests')} ({pendingRequests.length})
        </h3>
        {pendingRequests.length === 0 ? (
          <EmptyState
            icon={Shield}
            title={t('compliance.noPending', 'No pending requests')}
            description={t('compliance.noPendingDescription', 'All data requests have been processed.')}
          />
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const TypeIcon = typeIcons[req.type] ?? FileText
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div className="rounded-lg bg-muted p-2.5">
                    <TypeIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{req.requesterName}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                        {req.type}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{req.requesterEmail}</div>
                    <div className="mt-1 text-sm text-foreground">{req.description}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Submitted: {req.createdAt}</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setConfirmAction({ id: req.id, action: 'approve' })}
                      className="flex items-center gap-1 rounded-lg bg-status-success/10 px-3 py-1.5 text-xs font-medium text-status-success transition-colors hover:bg-status-success/20"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => setConfirmAction({ id: req.id, action: 'deny' })}
                      className="flex items-center gap-1 rounded-lg bg-status-error/10 px-3 py-1.5 text-xs font-medium text-status-error transition-colors hover:bg-status-error/20"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Deny
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Processed requests */}
      {processedRequests.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            {t('compliance.processedRequests', 'Processed Requests')} ({processedRequests.length})
          </h3>
          <div className="space-y-2">
            {processedRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card/50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{req.requesterName}</span>
                    <span className="text-xs text-muted-foreground">({req.type})</span>
                  </div>
                </div>
                <StatusBadge
                  status={req.status === 'approved' ? 'ACTIVE' : 'DEACTIVATED'}
                  label={req.status}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction?.action === 'approve' ? 'Approve Request' : 'Deny Request'}
        description={
          confirmAction?.action === 'approve'
            ? 'Are you sure you want to approve this data request? The requester will be notified.'
            : 'Are you sure you want to deny this data request? The requester will be notified.'
        }
        danger={confirmAction?.action === 'deny'}
        confirmLabel={confirmAction?.action === 'approve' ? 'Approve' : 'Deny'}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

type TabId = 'contracts' | 'zatca' | 'data-requests'

const tabs: Array<{ id: TabId; label: string; icon: typeof FileCheck }> = [
  { id: 'contracts', label: 'Contracts', icon: FileCheck },
  { id: 'zatca', label: 'ZATCA', icon: Receipt },
  { id: 'data-requests', label: 'Data Requests', icon: Shield },
]

export default function CompliancePage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>('contracts')

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
          {t('compliance.title', 'Compliance')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('compliance.subtitle', 'Contracts, ZATCA compliance, and data governance')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-brand-accent'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="compliance-tab-indicator"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-accent"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'contracts' && <ContractsTab />}
      {activeTab === 'zatca' && <ZatcaTab />}
      {activeTab === 'data-requests' && <DataRequestsTab />}
    </motion.div>
  )
}
