import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Building2,
  Users,
  Clock,
  ShieldAlert,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIGrid, type KPIItem, DataTable } from '@/components/data'
import { StatusBadge, EmptyState } from '@/components/feedback'
import { SearchInput, FilterBar } from '@/components/forms'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Tenant {
  id: string
  facilityName: string
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'PROVISIONING'
  plan: 'Free Trial' | 'Starter' | 'Professional' | 'Enterprise'
  members: number
  region: string
  onboardingProgress: number
  lastLogin: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockTenants: Tenant[] = [
  {
    id: '1',
    facilityName: 'Riyadh Fitness Hub',
    status: 'ACTIVE',
    plan: 'Professional',
    members: 1240,
    region: 'Riyadh',
    onboardingProgress: 100,
    lastLogin: '2 hours ago',
  },
  {
    id: '2',
    facilityName: 'Jeddah Sports Club',
    status: 'ACTIVE',
    plan: 'Enterprise',
    members: 3400,
    region: 'Jeddah',
    onboardingProgress: 100,
    lastLogin: '30 min ago',
  },
  {
    id: '3',
    facilityName: 'Dammam Athletic Center',
    status: 'TRIAL',
    plan: 'Free Trial',
    members: 85,
    region: 'Dammam',
    onboardingProgress: 60,
    lastLogin: '1 day ago',
  },
  {
    id: '4',
    facilityName: 'Medina Wellness Studio',
    status: 'TRIAL',
    plan: 'Free Trial',
    members: 42,
    region: 'Medina',
    onboardingProgress: 40,
    lastLogin: '3 days ago',
  },
  {
    id: '5',
    facilityName: 'Khobar CrossFit Box',
    status: 'SUSPENDED',
    plan: 'Starter',
    members: 310,
    region: 'Khobar',
    onboardingProgress: 100,
    lastLogin: '14 days ago',
  },
  {
    id: '6',
    facilityName: 'Tabuk Training Academy',
    status: 'PROVISIONING',
    plan: 'Professional',
    members: 0,
    region: 'Tabuk',
    onboardingProgress: 20,
    lastLogin: 'Never',
  },
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
      { label: 'Provisioning', value: 'PROVISIONING' },
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
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Actions menu                                                       */
/* ------------------------------------------------------------------ */

function ActionsMenu({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

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
                navigate(`/tenants/${tenantId}`)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-status-error hover:bg-muted"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function TenantsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: [],
    plan: [],
    region: [],
  })

  /* KPI data */
  const kpis: KPIItem[] = [
    { label: t('tenants.totalTenants', 'Total Tenants'), value: 6, change: 12, trend: 'up', icon: Building2 },
    { label: t('tenants.active', 'Active'), value: 2, change: 0, trend: 'neutral', icon: Users },
    { label: t('tenants.trial', 'Trial'), value: 2, change: 50, trend: 'up', icon: Clock },
    { label: t('tenants.suspended', 'Suspended'), value: 1, change: -25, trend: 'down', icon: ShieldAlert },
  ]

  /* Filtered data */
  const filteredTenants = useMemo(() => {
    let result = mockTenants

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.facilityName.toLowerCase().includes(q) ||
          t.region.toLowerCase().includes(q),
      )
    }

    if (activeFilters.status.length > 0) {
      result = result.filter((t) => activeFilters.status.includes(t.status))
    }
    if (activeFilters.plan.length > 0) {
      result = result.filter((t) => activeFilters.plan.includes(t.plan))
    }
    if (activeFilters.region.length > 0) {
      result = result.filter((t) => activeFilters.region.includes(t.region))
    }

    return result
  }, [search, activeFilters])

  /* Table columns */
  const columns: ColumnDef<Tenant, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'facilityName',
        header: t('tenants.facilityName', 'Facility Name'),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('tenants.status', 'Status'),
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        accessorKey: 'plan',
        header: t('tenants.plan', 'Plan'),
        cell: ({ getValue }) => {
          const plan = getValue<string>()
          return (
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                planColors[plan] ?? 'bg-muted text-muted-foreground',
              )}
            >
              {plan}
            </span>
          )
        },
      },
      {
        accessorKey: 'members',
        header: t('tenants.members', 'Members'),
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>().toLocaleString()}</span>
        ),
      },
      {
        accessorKey: 'region',
        header: t('tenants.region', 'Region'),
      },
      {
        accessorKey: 'onboardingProgress',
        header: t('tenants.onboarding', 'Onboarding Progress'),
        cell: ({ getValue }) => {
          const progress = getValue<number>()
          return (
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    progress === 100
                      ? 'bg-status-success'
                      : progress >= 50
                        ? 'bg-brand-accent'
                        : 'bg-status-warning',
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{progress}%</span>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'lastLogin',
        header: t('tenants.lastLogin', 'Last Login'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <ActionsMenu tenantId={row.original.id} />,
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
          {t('tenants.title', 'Tenants')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('tenants.subtitle', 'Manage all facilities on the platform')}
        </p>
      </div>

      {/* KPIs */}
      <KPIGrid items={kpis} columns={4} />

      {/* Filters + Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <SearchInput
            onChange={setSearch}
            placeholder={t('tenants.searchPlaceholder', 'Search facilities...')}
            className="w-full max-w-sm"
          />
        </div>
        <FilterBar
          filters={filterDefs}
          activeFilters={activeFilters}
          onChange={setActiveFilters}
        />
      </div>

      {/* Table */}
      {filteredTenants.length === 0 && search ? (
        <EmptyState
          icon={Building2}
          title={t('tenants.emptyTitle', 'No tenants found')}
          description={t('tenants.emptyDescription', 'Try adjusting your search or filters.')}
        />
      ) : (
        <DataTable<Tenant>
          data={filteredTenants}
          columns={columns}
          enableSearch={false}
          onRowClick={(row) => navigate(`/tenants/${row.id}`)}
          emptyTitle={t('tenants.emptyTitle', 'No tenants found')}
          emptyDescription={t('tenants.emptyDescription', 'Try adjusting your search or filters.')}
        />
      )}
    </motion.div>
  )
}
