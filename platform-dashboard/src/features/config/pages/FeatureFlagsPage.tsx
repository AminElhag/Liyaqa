import { useState, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flag,
  Search,
  RotateCcw,
  Zap,
  Layers,
  X,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeatureFlag {
  id: string
  name: string
  description: string
  category: string
}

interface Tenant {
  id: string
  name: string
  plan: 'Free Trial' | 'Starter' | 'Professional' | 'Enterprise'
}

interface FlagOverride {
  tenantId: string
  flagId: string
  enabled: boolean
  isOverride: boolean
  updatedBy?: string
  updatedAt?: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const featureCategories = ['Core', 'Billing', 'Communication', 'Analytics'] as const

const mockFeatures: FeatureFlag[] = [
  { id: 'f1', name: 'Multi-branch', description: 'Allow tenants to manage multiple branches', category: 'Core' },
  { id: 'f2', name: 'API Access', description: 'Enable REST API access for tenant', category: 'Core' },
  { id: 'f3', name: 'Auto-invoice', description: 'Automatic invoice generation on renewal', category: 'Billing' },
  { id: 'f4', name: 'ZATCA E-Invoice', description: 'ZATCA e-invoicing integration', category: 'Billing' },
  { id: 'f5', name: 'SMS Notify', description: 'Send SMS notifications to members', category: 'Communication' },
  { id: 'f6', name: 'Push Notify', description: 'Mobile push notifications', category: 'Communication' },
  { id: 'f7', name: 'Adv. Analytics', description: 'Advanced analytics dashboard', category: 'Analytics' },
  { id: 'f8', name: 'Custom Reports', description: 'Custom report builder', category: 'Analytics' },
]

const mockTenants: Tenant[] = [
  { id: 't1', name: 'Riyadh Fitness Hub', plan: 'Professional' },
  { id: 't2', name: 'Jeddah Sports Club', plan: 'Enterprise' },
  { id: 't3', name: 'Dammam Athletic Center', plan: 'Free Trial' },
  { id: 't4', name: 'Medina Wellness Studio', plan: 'Starter' },
  { id: 't5', name: 'Khobar CrossFit Box', plan: 'Professional' },
  { id: 't6', name: 'Tabuk Training Academy', plan: 'Starter' },
  { id: 't7', name: 'Abha Yoga Studio', plan: 'Enterprise' },
  { id: 't8', name: 'Mecca Marathon Club', plan: 'Free Trial' },
]

function buildInitialOverrides(): FlagOverride[] {
  const overrides: FlagOverride[] = []
  for (const tenant of mockTenants) {
    for (const feature of mockFeatures) {
      const defaultEnabled =
        (tenant.plan === 'Enterprise') ||
        (tenant.plan === 'Professional' && feature.category !== 'Analytics') ||
        (tenant.plan === 'Starter' && feature.category === 'Core')

      // A few explicit overrides
      const isSpecialOverride =
        (tenant.id === 't3' && feature.id === 'f7') || // trial with analytics override enabled
        (tenant.id === 't2' && feature.id === 'f5') || // enterprise with SMS disabled
        (tenant.id === 't4' && feature.id === 'f1')    // starter with multi-branch enabled

      if (isSpecialOverride) {
        const overrideEnabled = tenant.id === 't2' ? false : true
        overrides.push({
          tenantId: tenant.id,
          flagId: feature.id,
          enabled: overrideEnabled,
          isOverride: true,
          updatedBy: 'admin@liyaqa.com',
          updatedAt: '2026-02-08',
        })
      } else {
        overrides.push({
          tenantId: tenant.id,
          flagId: feature.id,
          enabled: defaultEnabled,
          isOverride: false,
        })
      }
    }
  }
  return overrides
}

/* ------------------------------------------------------------------ */
/*  Tooltip component                                                  */
/* ------------------------------------------------------------------ */

function CellTooltip({ override }: { override: FlagOverride }) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShow(true), 400)
  }, [])

  const handleLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShow(false)
  }, [])

  if (!override.isOverride) return null

  return (
    <div
      className="absolute -top-1 -end-1 z-10"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Info className="h-3 w-3 text-amber-500" />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute end-0 top-full z-30 mt-1 w-48 rounded-lg border border-border bg-card p-2 shadow-lg"
          >
            <div className="text-xs font-medium text-foreground">Override Active</div>
            {override.updatedBy && (
              <div className="mt-1 text-[10px] text-muted-foreground">By: {override.updatedBy}</div>
            )}
            {override.updatedAt && (
              <div className="text-[10px] text-muted-foreground">On: {override.updatedAt}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Bulk action modal                                                  */
/* ------------------------------------------------------------------ */

function BulkActionModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean
  onClose: () => void
  onApply: (action: string, plan?: string) => void
}) {
  const [action, setAction] = useState<'enable-plan' | 'reset'>('enable-plan')
  const [selectedPlan, setSelectedPlan] = useState('Professional')

  return (
    <AnimatePresence>
      {open && (
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
            className="fixed inset-x-4 top-[25%] z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Bulk Action</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="action"
                    checked={action === 'enable-plan'}
                    onChange={() => setAction('enable-plan')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-foreground">Enable all features for plan tier</span>
                </label>
                {action === 'enable-plan' && (
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="ms-6 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                  >
                    <option>Free Trial</option>
                    <option>Starter</option>
                    <option>Professional</option>
                    <option>Enterprise</option>
                  </select>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="action"
                    checked={action === 'reset'}
                    onChange={() => setAction('reset')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-foreground">Reset all overrides</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onApply(action, action === 'enable-plan' ? selectedPlan : undefined)
                  onClose()
                }}
                className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Rollout slider                                                     */
/* ------------------------------------------------------------------ */

function RolloutSlider({
  featureId,
  value,
  onChange,
}: {
  featureId: string
  value: number
  onChange: (featureId: string, pct: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(featureId, Number(e.target.value))}
        className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-muted accent-brand-accent"
      />
      <span className="w-8 text-end text-xs tabular-nums text-muted-foreground">{value}%</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function FeatureFlagsPage() {
  const { t } = useTranslation()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [overrides, setOverrides] = useState<FlagOverride[]>(buildInitialOverrides)
  const [showBulk, setShowBulk] = useState(false)
  const [rolloutPct, setRolloutPct] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const f of mockFeatures) initial[f.id] = 100
    return initial
  })

  const filteredTenants = useMemo(() => {
    if (!search) return mockTenants
    const q = search.toLowerCase()
    return mockTenants.filter((t) => t.name.toLowerCase().includes(q))
  }, [search])

  const grouped = useMemo(() => {
    const map: Record<string, FeatureFlag[]> = {}
    for (const cat of featureCategories) {
      map[cat] = mockFeatures.filter((f) => f.category === cat)
    }
    return map
  }, [])

  const getOverride = useCallback(
    (tenantId: string, flagId: string) =>
      overrides.find((o) => o.tenantId === tenantId && o.flagId === flagId),
    [overrides],
  )

  const handleToggle = useCallback(
    (tenantId: string, flagId: string) => {
      setOverrides((prev) =>
        prev.map((o) => {
          if (o.tenantId !== tenantId || o.flagId !== flagId) return o
          return {
            ...o,
            enabled: !o.enabled,
            isOverride: true,
            updatedBy: 'admin@liyaqa.com',
            updatedAt: new Date().toISOString().slice(0, 10),
          }
        }),
      )
    },
    [],
  )

  const handleBulkApply = useCallback(
    (action: string, plan?: string) => {
      if (action === 'enable-plan' && plan) {
        const tenantIds = mockTenants.filter((t) => t.plan === plan).map((t) => t.id)
        setOverrides((prev) =>
          prev.map((o) =>
            tenantIds.includes(o.tenantId)
              ? { ...o, enabled: true, isOverride: false }
              : o,
          ),
        )
        toast.success(`Enabled all features for ${plan} tenants`)
      } else if (action === 'reset') {
        setOverrides(buildInitialOverrides())
        toast.info('All overrides have been reset')
      }
    },
    [toast],
  )

  const handleRolloutChange = useCallback(
    (featureId: string, pct: number) => {
      setRolloutPct((prev) => ({ ...prev, [featureId]: pct }))
      toast.info(`Rollout for feature set to ${pct}%`)
    },
    [toast],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('featureFlags.title', 'Feature Flags')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('featureFlags.subtitle', 'Manage feature availability per tenant')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Layers className="h-4 w-4" />
            Bulk Actions
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('featureFlags.searchTenants', 'Search tenants...')}
          className="w-full rounded-lg border border-border bg-background py-2 pe-3 ps-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Matrix */}
      <div className="overflow-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky start-0 z-20 min-w-[200px] bg-muted/90 px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                Tenant
              </th>
              {featureCategories.map((cat) =>
                grouped[cat].map((feature) => (
                  <th
                    key={feature.id}
                    className="sticky top-0 z-10 min-w-[110px] border-s border-border bg-muted/90 px-3 py-3 text-center backdrop-blur-sm"
                  >
                    <div className="text-xs font-semibold text-foreground">{feature.name}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{feature.category}</div>
                  </th>
                )),
              )}
            </tr>
            {/* Rollout row */}
            <tr className="border-b border-border bg-muted/30">
              <td className="sticky start-0 z-20 bg-muted/70 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Rollout %
                </div>
              </td>
              {featureCategories.map((cat) =>
                grouped[cat].map((feature) => (
                  <td key={feature.id} className="border-s border-border px-2 py-2 text-center">
                    <RolloutSlider
                      featureId={feature.id}
                      value={rolloutPct[feature.id] ?? 100}
                      onChange={handleRolloutChange}
                    />
                  </td>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map((tenant) => (
              <tr key={tenant.id} className="border-b border-border transition-colors hover:bg-muted/30">
                <td className="sticky start-0 z-20 bg-card px-4 py-3 backdrop-blur-sm">
                  <div className="text-sm font-medium text-foreground">{tenant.name}</div>
                  <div className="text-xs text-muted-foreground">{tenant.plan}</div>
                </td>
                {featureCategories.map((cat) =>
                  grouped[cat].map((feature) => {
                    const override = getOverride(tenant.id, feature.id)
                    const isEnabled = override?.enabled ?? false
                    const isOverride = override?.isOverride ?? false

                    return (
                      <td
                        key={feature.id}
                        className={cn(
                          'border-s border-border px-3 py-3 text-center',
                          isOverride && isEnabled && 'bg-amber-500/10',
                          isOverride && !isEnabled && 'ring-1 ring-inset ring-status-error/40',
                        )}
                      >
                        <div className="relative inline-flex">
                          <button
                            onClick={() => handleToggle(tenant.id, feature.id)}
                            className={cn(
                              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                              isEnabled ? 'bg-brand-accent' : 'bg-muted',
                            )}
                            role="switch"
                            aria-checked={isEnabled}
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform',
                                isEnabled ? 'translate-x-4' : 'translate-x-0',
                              )}
                            />
                          </button>
                          {override && <CellTooltip override={override} />}
                        </div>
                      </td>
                    )
                  }),
                )}
              </tr>
            ))}
            {filteredTenants.length === 0 && (
              <tr>
                <td colSpan={1 + mockFeatures.length} className="px-4 py-12 text-center">
                  <Flag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <div className="text-sm text-muted-foreground">No tenants match your search</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded-sm bg-amber-500/10 ring-1 ring-amber-500/30" />
          Enabled override
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded-sm bg-background ring-1 ring-status-error/40" />
          Disabled override
        </div>
        <div className="flex items-center gap-1.5">
          <RotateCcw className="h-3 w-3" />
          Default (plan-based)
        </div>
      </div>

      <BulkActionModal
        open={showBulk}
        onClose={() => setShowBulk(false)}
        onApply={handleBulkApply}
      />
    </motion.div>
  )
}
