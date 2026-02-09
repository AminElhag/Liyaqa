import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Key,
  Plus,
  Copy,
  Check,
  X,
} from 'lucide-react'
import { DataTable } from '@/components/data'
import { StatusBadge, ConfirmDialog } from '@/components/feedback'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ApiKey {
  id: string
  name: string
  keyMasked: string
  tenant: string
  status: 'ACTIVE' | 'DEACTIVATED'
  statusLabel: string
  created: string
  lastUsed: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockApiKeys: ApiKey[] = [
  { id: '1', name: 'Production Key', keyMasked: '****a1b2', tenant: 'Riyadh Fitness Hub', status: 'ACTIVE', statusLabel: 'Active', created: '2026-01-15', lastUsed: '2 hours ago' },
  { id: '2', name: 'Staging Key', keyMasked: '****c3d4', tenant: 'Jeddah Sports Club', status: 'ACTIVE', statusLabel: 'Active', created: '2026-01-20', lastUsed: '1 day ago' },
  { id: '3', name: 'Integration Test Key', keyMasked: '****e5f6', tenant: 'Dammam Athletic Center', status: 'ACTIVE', statusLabel: 'Active', created: '2026-02-01', lastUsed: '5 min ago' },
  { id: '4', name: 'Legacy Key', keyMasked: '****g7h8', tenant: 'Khobar CrossFit Box', status: 'DEACTIVATED', statusLabel: 'Revoked', created: '2025-11-10', lastUsed: '30 days ago' },
  { id: '5', name: 'Webhook Key', keyMasked: '****i9j0', tenant: 'Tabuk Training Academy', status: 'ACTIVE', statusLabel: 'Active', created: '2026-02-05', lastUsed: '12 hours ago' },
]

const mockTenants = [
  'Riyadh Fitness Hub',
  'Jeddah Sports Club',
  'Dammam Athletic Center',
  'Khobar CrossFit Box',
  'Tabuk Training Academy',
]

/* ------------------------------------------------------------------ */
/*  Generate Key modal                                                 */
/* ------------------------------------------------------------------ */

function GenerateKeyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [step, setStep] = useState<'form' | 'result'>('form')
  const [name, setName] = useState('')
  const [tenant, setTenant] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    const key = `lq_${Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')}`
    setGeneratedKey(key)
    setStep('result')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    toast.success('API key copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDone = () => {
    toast.success(`API key "${name}" created successfully`)
    setStep('form')
    setName('')
    setTenant('')
    setGeneratedKey('')
    setSaved(false)
    onClose()
  }

  const handleClose = () => {
    setStep('form')
    setName('')
    setTenant('')
    setGeneratedKey('')
    setSaved(false)
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
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-4 top-[20%] z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <button onClick={handleClose} className="absolute end-3 top-3 rounded-lg p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            {step === 'form' ? (
              <>
                <h2 className="text-lg font-semibold text-foreground">Generate API Key</h2>
                <p className="mt-1 text-sm text-muted-foreground">Create a new API key for tenant integration.</p>

                <form onSubmit={handleGenerate} className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Key Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Production Key"
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Tenant</label>
                    <select
                      value={tenant}
                      onChange={(e) => setTenant(e.target.value)}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select tenant</option>
                      {mockTenants.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
                    >
                      Generate
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-foreground">Your API Key</h2>
                <p className="mt-1 text-sm text-status-error font-medium">
                  This key will only be shown once. Please save it now.
                </p>

                <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
                  <code className="flex-1 break-all font-mono text-xs text-foreground">{generatedKey}</code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied ? <Check className="h-4 w-4 text-status-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={saved}
                    onChange={(e) => setSaved(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-foreground">I have saved this key in a secure location</span>
                </label>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleDone}
                    disabled={!saved}
                    className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ApiKeysPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [generateOpen, setGenerateOpen] = useState(false)
  const [revokeKey, setRevokeKey] = useState<ApiKey | null>(null)

  const columns: ColumnDef<ApiKey, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('apiKeys.name', 'Name'),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'keyMasked',
        header: t('apiKeys.key', 'Key'),
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'tenant',
        header: t('apiKeys.tenant', 'Tenant'),
      },
      {
        accessorKey: 'status',
        header: t('apiKeys.status', 'Status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} label={row.original.statusLabel} />,
      },
      {
        accessorKey: 'created',
        header: t('apiKeys.created', 'Created'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'lastUsed',
        header: t('apiKeys.lastUsed', 'Last Used'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) =>
          row.original.status === 'ACTIVE' ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setRevokeKey(row.original)
              }}
              className="rounded-lg px-3 py-1 text-xs font-medium text-status-error transition-colors hover:bg-status-error/10"
            >
              Revoke
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Revoked</span>
          ),
        enableSorting: false,
        size: 80,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('apiKeys.title', 'API Keys')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('apiKeys.subtitle', 'Manage API keys for tenant integrations')}
          </p>
        </div>
        <button
          onClick={() => setGenerateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Generate Key
        </button>
      </div>

      {/* Table */}
      <DataTable<ApiKey>
        data={mockApiKeys}
        columns={columns}
        enableSearch
        searchPlaceholder={t('apiKeys.searchPlaceholder', 'Search API keys...')}
        emptyTitle={t('apiKeys.emptyTitle', 'No API keys')}
        emptyDescription={t('apiKeys.emptyDescription', 'Generate your first API key to get started.')}
      />

      {/* Generate Key modal */}
      <GenerateKeyModal open={generateOpen} onClose={() => setGenerateOpen(false)} />

      {/* Revoke confirm */}
      <ConfirmDialog
        open={revokeKey !== null}
        onClose={() => setRevokeKey(null)}
        onConfirm={() => {
          toast.success(`API key "${revokeKey?.name}" has been revoked`)
          setRevokeKey(null)
        }}
        title="Revoke API Key"
        description={`Are you sure you want to revoke the key "${revokeKey?.name}"? This action cannot be undone and will immediately disable the key.`}
        confirmLabel="Revoke Key"
        danger
      />
    </motion.div>
  )
}
