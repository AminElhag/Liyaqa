import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  CreditCard,
  Bell,
  Shield,
  Plug,
  ChevronDown,
  Save,
  X,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/stores/toast-store'
import { ConfirmDialog } from '@/components/feedback'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SettingType = 'text' | 'number' | 'boolean' | 'json'

interface ConfigSetting {
  id: string
  key: string
  label: string
  description: string
  type: SettingType
  value: string | number | boolean
  lastUpdated: string
}

interface ConfigCategory {
  id: string
  label: string
  icon: typeof Settings
  settings: ConfigSetting[]
}

interface MaintenanceWindow {
  id: string
  titleEn: string
  titleAr: string
  description: string
  startDate: string
  endDate: string
  active: boolean
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const initialCategories: ConfigCategory[] = [
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    settings: [
      { id: 'g1', key: 'platform.name', label: 'Platform Name', description: 'The display name of the platform', type: 'text', value: 'Liyaqa', lastUpdated: '2 hours ago' },
      { id: 'g2', key: 'platform.maxTenants', label: 'Max Tenants', description: 'Maximum number of tenants allowed', type: 'number', value: 500, lastUpdated: '3 days ago' },
      { id: 'g3', key: 'platform.debugMode', label: 'Debug Mode', description: 'Enable debug logging across the platform', type: 'boolean', value: false, lastUpdated: '1 week ago' },
      { id: 'g4', key: 'platform.supportEmail', label: 'Support Email', description: 'Contact email for support inquiries', type: 'text', value: 'support@liyaqa.com', lastUpdated: '5 days ago' },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    settings: [
      { id: 'b1', key: 'billing.currency', label: 'Default Currency', description: 'Default currency for all invoices', type: 'text', value: 'SAR', lastUpdated: '1 month ago' },
      { id: 'b2', key: 'billing.taxRate', label: 'VAT Rate (%)', description: 'Value-added tax rate applied to invoices', type: 'number', value: 15, lastUpdated: '2 months ago' },
      { id: 'b3', key: 'billing.autoInvoice', label: 'Auto Invoice', description: 'Automatically generate invoices on subscription renewal', type: 'boolean', value: true, lastUpdated: '2 weeks ago' },
      { id: 'b4', key: 'billing.gracePeriodDays', label: 'Grace Period (days)', description: 'Days before suspending unpaid subscriptions', type: 'number', value: 7, lastUpdated: '1 week ago' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    settings: [
      { id: 'n1', key: 'notifications.email', label: 'Email Notifications', description: 'Send email notifications for system events', type: 'boolean', value: true, lastUpdated: '3 days ago' },
      { id: 'n2', key: 'notifications.sms', label: 'SMS Notifications', description: 'Send SMS notifications (additional charges apply)', type: 'boolean', value: false, lastUpdated: '1 month ago' },
      { id: 'n3', key: 'notifications.webhookUrl', label: 'Webhook URL', description: 'URL for outgoing webhook notifications', type: 'text', value: 'https://hooks.slack.com/services/...', lastUpdated: '2 weeks ago' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    settings: [
      { id: 's1', key: 'security.mfa', label: 'Require MFA', description: 'Require multi-factor authentication for all platform users', type: 'boolean', value: true, lastUpdated: '1 week ago' },
      { id: 's2', key: 'security.sessionTimeout', label: 'Session Timeout (min)', description: 'Minutes of inactivity before automatic logout', type: 'number', value: 30, lastUpdated: '2 weeks ago' },
      { id: 's3', key: 'security.ipWhitelist', label: 'IP Whitelist', description: 'JSON array of whitelisted IP addresses', type: 'json', value: '["10.0.0.0/8", "192.168.1.0/24"]', lastUpdated: '3 days ago' },
      { id: 's4', key: 'security.maxLoginAttempts', label: 'Max Login Attempts', description: 'Number of failed login attempts before lockout', type: 'number', value: 5, lastUpdated: '1 month ago' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Plug,
    settings: [
      { id: 'i1', key: 'integrations.zatca', label: 'ZATCA Integration', description: 'Enable ZATCA e-invoicing integration', type: 'boolean', value: true, lastUpdated: '1 week ago' },
      { id: 'i2', key: 'integrations.paymentGateway', label: 'Payment Gateway', description: 'Active payment gateway provider', type: 'text', value: 'HyperPay', lastUpdated: '2 months ago' },
      { id: 'i3', key: 'integrations.apiConfig', label: 'API Configuration', description: 'JSON configuration for external API integrations', type: 'json', value: '{"rateLimit": 1000, "timeout": 30}', lastUpdated: '5 days ago' },
    ],
  },
]

const initialMaintenance: MaintenanceWindow[] = [
  {
    id: 'm1',
    titleEn: 'Database Upgrade',
    titleAr: 'ترقية قاعدة البيانات',
    description: 'Scheduled PostgreSQL upgrade to version 16',
    startDate: '2026-02-15T02:00',
    endDate: '2026-02-15T04:00',
    active: false,
  },
  {
    id: 'm2',
    titleEn: 'Security Patch',
    titleAr: 'تصحيح أمني',
    description: 'Applying critical security patches to all services',
    startDate: '2026-02-10T01:00',
    endDate: '2026-02-10T02:00',
    active: true,
  },
]

/* ------------------------------------------------------------------ */
/*  Inline editor component                                            */
/* ------------------------------------------------------------------ */

function InlineEditor({
  setting,
  onSave,
}: {
  setting: ConfigSetting
  onSave: (id: string, newValue: string | number | boolean) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>(String(setting.value))

  const handleStartEdit = useCallback(() => {
    setDraft(String(setting.value))
    setEditing(true)
  }, [setting.value])

  const handleCancel = useCallback(() => {
    setEditing(false)
    setDraft(String(setting.value))
  }, [setting.value])

  const handleSave = useCallback(() => {
    let parsed: string | number | boolean = draft
    if (setting.type === 'number') parsed = Number(draft)
    if (setting.type === 'boolean') parsed = draft === 'true'
    onSave(setting.id, parsed)
    setEditing(false)
  }, [draft, setting.id, setting.type, onSave])

  if (setting.type === 'boolean') {
    return (
      <button
        onClick={() => onSave(setting.id, !setting.value)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          setting.value ? 'bg-brand-accent' : 'bg-muted',
        )}
        role="switch"
        aria-checked={Boolean(setting.value)}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform',
            setting.value ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={handleStartEdit}
        className="max-w-md truncate rounded-lg border border-transparent px-3 py-1.5 text-start text-sm text-foreground transition-colors hover:border-border hover:bg-muted"
      >
        {String(setting.value)}
      </button>
    )
  }

  if (setting.type === 'json') {
    return (
      <div className="flex w-full max-w-md flex-col gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-background p-2 font-mono text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="rounded-lg bg-brand-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-accent-hover"
          >
            Apply
          </button>
          <button
            onClick={handleCancel}
            className="rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type={setting.type === 'number' ? 'number' : 'text'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') handleCancel()
        }}
        autoFocus
        className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        onClick={handleSave}
        className="rounded-lg bg-brand-accent p-1.5 text-white transition-colors hover:bg-brand-accent-hover"
      >
        <Save className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handleCancel}
        className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Collapsible category section                                       */
/* ------------------------------------------------------------------ */

function CategorySection({
  category,
  expanded,
  onToggle,
  onSettingChange,
}: {
  category: ConfigCategory
  expanded: boolean
  onToggle: () => void
  onSettingChange: (settingId: string, value: string | number | boolean) => void
}) {
  const Icon = category.icon

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-start"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">{category.label}</span>
            <span className="ms-2 text-xs text-muted-foreground">
              ({category.settings.length} settings)
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {category.settings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex flex-col gap-2 border-b border-border px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{setting.label}</div>
                    <div className="text-xs text-muted-foreground">{setting.description}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
                      <Clock className="h-3 w-3" />
                      Last updated: {setting.lastUpdated}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <InlineEditor
                      setting={setting}
                      onSave={onSettingChange}
                    />
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
/*  Schedule maintenance modal                                         */
/* ------------------------------------------------------------------ */

function ScheduleMaintenanceModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (mw: Omit<MaintenanceWindow, 'id' | 'active'>) => void
}) {
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSubmit = () => {
    if (!titleEn || !startDate || !endDate) return
    onSubmit({ titleEn, titleAr, description, startDate, endDate })
    setTitleEn('')
    setTitleAr('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    onClose()
  }

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
            transition={{ duration: 0.25 }}
            className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Schedule Maintenance</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Title (EN)</label>
                <input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Database Maintenance"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Title (AR)</label>
                <input
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  dir="rtl"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                  placeholder="صيانة قاعدة البيانات"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Details about the maintenance..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Start</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">End</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
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
                onClick={handleSubmit}
                disabled={!titleEn || !startDate || !endDate}
                className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ConfigPage() {
  const { t } = useTranslation()
  const toast = useToast()

  const [categories, setCategories] = useState(initialCategories)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ general: true })
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())
  const [maintenanceWindows, setMaintenanceWindows] = useState(initialMaintenance)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)

  const hasChanges = dirtyIds.size > 0

  const activeMaintenance = useMemo(
    () => maintenanceWindows.find((m) => m.active),
    [maintenanceWindows],
  )

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleSettingChange = useCallback(
    (settingId: string, newValue: string | number | boolean) => {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          settings: cat.settings.map((s) =>
            s.id === settingId ? { ...s, value: newValue, lastUpdated: 'Just now' } : s,
          ),
        })),
      )
      setDirtyIds((prev) => new Set(prev).add(settingId))
    },
    [],
  )

  const handleSaveAll = useCallback(() => {
    setDirtyIds(new Set())
    toast.success(t('config.saved', 'All settings saved successfully'))
  }, [toast, t])

  const handleScheduleMaintenance = useCallback(
    (mw: Omit<MaintenanceWindow, 'id' | 'active'>) => {
      const newMw: MaintenanceWindow = {
        ...mw,
        id: `m${Date.now()}`,
        active: false,
      }
      setMaintenanceWindows((prev) => [...prev, newMw])
      toast.success(t('config.maintenanceScheduled', 'Maintenance window scheduled'))
    },
    [toast, t],
  )

  const handleCancelMaintenance = useCallback(
    (id: string) => {
      setMaintenanceWindows((prev) => prev.filter((m) => m.id !== id))
      setCancelTarget(null)
      toast.info(t('config.maintenanceCancelled', 'Maintenance window cancelled'))
    },
    [toast, t],
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
          {t('config.title', 'Configuration')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('config.subtitle', 'Manage platform settings and maintenance')}
        </p>
      </div>

      {/* Active maintenance banner */}
      {activeMaintenance && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1">
            <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Active Maintenance: {activeMaintenance.titleEn}
            </div>
            <div className="text-xs text-amber-600/70 dark:text-amber-400/70">
              {activeMaintenance.description}
            </div>
          </div>
        </motion.div>
      )}

      {/* Setting categories */}
      <div className="space-y-3">
        {categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            expanded={expanded[category.id] ?? false}
            onToggle={() => handleToggle(category.id)}
            onSettingChange={handleSettingChange}
          />
        ))}
      </div>

      {/* Maintenance section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {t('config.maintenance', 'Maintenance Windows')}
            </span>
          </div>
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover"
          >
            <Plus className="h-4 w-4" />
            {t('config.scheduleMaintenance', 'Schedule Maintenance')}
          </button>
        </div>
        <div className="border-t border-border">
          {maintenanceWindows.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No scheduled maintenance windows
            </div>
          ) : (
            maintenanceWindows.map((mw) => (
              <div
                key={mw.id}
                className={cn(
                  'flex items-center justify-between border-b border-border px-5 py-3 last:border-b-0',
                  mw.active && 'bg-amber-500/5',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{mw.titleEn}</span>
                    {mw.active && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(mw.startDate).toLocaleString()} - {new Date(mw.endDate).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => setCancelTarget(mw.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-status-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating save button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-3 rounded-xl border border-border bg-card px-6 py-3 shadow-xl"
          >
            <span className="text-sm text-muted-foreground">
              {dirtyIds.size} unsaved change{dirtyIds.size !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover"
            >
              <Save className="h-4 w-4" />
              Save All
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ScheduleMaintenanceModal
        open={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        onSubmit={handleScheduleMaintenance}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && handleCancelMaintenance(cancelTarget)}
        title="Cancel Maintenance"
        description="Are you sure you want to cancel this maintenance window? This action cannot be undone."
        danger
        confirmLabel="Cancel Maintenance"
      />
    </motion.div>
  )
}
