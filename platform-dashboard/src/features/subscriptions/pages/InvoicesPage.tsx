import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  MoreHorizontal,
  X,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIGrid, type KPIItem, DataTable } from '@/components/data'
import { StatusBadge } from '@/components/feedback'
import { FilterBar } from '@/components/forms'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  tenantName: string
  amount: number
  vatAmount: number
  totalAmount: number
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'TRIAL'
  statusLabel: string
  zatcaStatus: 'Compliant' | 'Pending' | 'Failed'
  date: string
  dueDate: string
  fromCompany: string
  toCompany: string
  lineItems: InvoiceLineItem[]
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockInvoices: Invoice[] = [
  {
    id: '1', invoiceNumber: 'INV-2026-001', tenantName: 'Riyadh Fitness Hub', amount: 4500, vatAmount: 675, totalAmount: 5175,
    status: 'ACTIVE', statusLabel: 'Paid', zatcaStatus: 'Compliant', date: '2026-02-01', dueDate: '2026-02-15',
    fromCompany: 'Liyaqa SaaS LLC', toCompany: 'Riyadh Fitness Hub Co.',
    lineItems: [{ description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 4500, total: 4500 }],
  },
  {
    id: '2', invoiceNumber: 'INV-2026-002', tenantName: 'Jeddah Sports Club', amount: 8200, vatAmount: 1230, totalAmount: 9430,
    status: 'ACTIVE', statusLabel: 'Paid', zatcaStatus: 'Compliant', date: '2026-01-15', dueDate: '2026-01-30',
    fromCompany: 'Liyaqa SaaS LLC', toCompany: 'Jeddah Sports Club Co.',
    lineItems: [{ description: 'Enterprise Plan - Monthly', quantity: 1, unitPrice: 8200, total: 8200 }],
  },
  {
    id: '3', invoiceNumber: 'INV-2026-003', tenantName: 'Khobar CrossFit Box', amount: 1500, vatAmount: 225, totalAmount: 1725,
    status: 'SUSPENDED', statusLabel: 'Overdue', zatcaStatus: 'Pending', date: '2026-01-01', dueDate: '2026-01-15',
    fromCompany: 'Liyaqa SaaS LLC', toCompany: 'Khobar CrossFit Box LLC',
    lineItems: [{ description: 'Starter Plan - Monthly', quantity: 1, unitPrice: 1500, total: 1500 }],
  },
  {
    id: '4', invoiceNumber: 'INV-2026-004', tenantName: 'Tabuk Training Academy', amount: 4500, vatAmount: 675, totalAmount: 5175,
    status: 'TRIAL', statusLabel: 'Pending', zatcaStatus: 'Pending', date: '2026-02-05', dueDate: '2026-02-20',
    fromCompany: 'Liyaqa SaaS LLC', toCompany: 'Tabuk Training Academy Co.',
    lineItems: [{ description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 4500, total: 4500 }],
  },
  {
    id: '5', invoiceNumber: 'INV-2026-005', tenantName: 'Al Khobar Gym Nation', amount: 1500, vatAmount: 225, totalAmount: 1725,
    status: 'ACTIVE', statusLabel: 'Paid', zatcaStatus: 'Compliant', date: '2026-02-01', dueDate: '2026-02-15',
    fromCompany: 'Liyaqa SaaS LLC', toCompany: 'Al Khobar Gym Nation LLC',
    lineItems: [{ description: 'Starter Plan - Monthly', quantity: 1, unitPrice: 1500, total: 1500 }],
  },
  {
    id: '6', invoiceNumber: 'INV-2026-006', tenantName: 'Abha Peak Fitness', amount: 8200, vatAmount: 1230, totalAmount: 9430,
    status: 'DEACTIVATED', statusLabel: 'Void', zatcaStatus: 'Failed', date: '2025-12-01', dueDate: '2025-12-15',
    fromCompany: 'Liyaqa SaaS LLC', toCompany: 'Abha Peak Fitness Co.',
    lineItems: [{ description: 'Enterprise Plan - Monthly', quantity: 1, unitPrice: 8200, total: 8200 }],
  },
]

const filterDefs = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { label: 'Paid', value: 'ACTIVE' },
      { label: 'Overdue', value: 'SUSPENDED' },
      { label: 'Pending', value: 'TRIAL' },
      { label: 'Void', value: 'DEACTIVATED' },
    ],
  },
  {
    id: 'zatca',
    label: 'ZATCA Status',
    options: [
      { label: 'Compliant', value: 'Compliant' },
      { label: 'Pending', value: 'Pending' },
      { label: 'Failed', value: 'Failed' },
    ],
  },
]

const zatcaColors: Record<string, string> = {
  Compliant: 'text-status-success',
  Pending: 'text-brand-accent',
  Failed: 'text-status-error',
}

/* ------------------------------------------------------------------ */
/*  Actions menu                                                       */
/* ------------------------------------------------------------------ */

function ActionsMenu({ onMarkPaid }: { onMarkPaid: () => void }) {
  const [open, setOpen] = useState(false)

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
                onMarkPaid()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Paid
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Mark Paid modal                                                    */
/* ------------------------------------------------------------------ */

function MarkPaidModal({ open, onClose, invoice }: { open: boolean; onClose: () => void; invoice: Invoice | null }) {
  const toast = useToast()
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
  const [reference, setReference] = useState('')
  const [paymentDate, setPaymentDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Invoice ${invoice?.invoiceNumber} marked as paid`)
    onClose()
    setPaymentMethod('Bank Transfer')
    setReference('')
    setPaymentDate('')
  }

  return (
    <AnimatePresence>
      {open && invoice && (
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
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-4 top-[20%] z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <button onClick={onClose} className="absolute end-3 top-3 rounded-lg p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-foreground">Mark as Paid</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Record payment for {invoice.invoiceNumber} — SAR {invoice.totalAmount.toLocaleString()}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>Bank Transfer</option>
                  <option>Credit Card</option>
                  <option>Cash</option>
                  <option>Mada</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Reference Number</label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g., TXN-12345"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Invoice slide-over detail                                          */
/* ------------------------------------------------------------------ */

function InvoiceSlideOver({ open, onClose, invoice }: { open: boolean; onClose: () => void; invoice: Invoice | null }) {
  return (
    <AnimatePresence>
      {open && invoice && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 end-0 z-50 w-full max-w-lg border-s border-border bg-card shadow-xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="font-mono text-lg font-semibold text-foreground">{invoice.invoiceNumber}</h2>
                  <StatusBadge status={invoice.status} label={invoice.statusLabel} />
                </div>
                <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4 space-y-6">
                {/* From / To */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">From</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{invoice.fromCompany}</div>
                    <div className="text-xs text-muted-foreground">Riyadh, Saudi Arabia</div>
                    <div className="text-xs text-muted-foreground">VAT: 300000000000003</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">To</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{invoice.toCompany}</div>
                    <div className="text-xs text-muted-foreground">{invoice.tenantName}</div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Issue Date</div>
                    <div className="mt-1 text-sm text-foreground">{invoice.date}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Due Date</div>
                    <div className="mt-1 text-sm text-foreground">{invoice.dueDate}</div>
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Line Items</div>
                  <table className="mt-2 w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="pb-2 text-start font-medium">Description</th>
                        <th className="pb-2 text-end font-medium">Qty</th>
                        <th className="pb-2 text-end font-medium">Unit Price</th>
                        <th className="pb-2 text-end font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((item, i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-2 text-foreground">{item.description}</td>
                          <td className="py-2 text-end tabular-nums text-foreground">{item.quantity}</td>
                          <td className="py-2 text-end tabular-nums text-foreground">SAR {item.unitPrice.toLocaleString()}</td>
                          <td className="py-2 text-end tabular-nums text-foreground">SAR {item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="space-y-1 border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums text-foreground">SAR {invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT (15%)</span>
                    <span className="tabular-nums text-foreground">SAR {invoice.vatAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="tabular-nums text-foreground">SAR {invoice.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* ZATCA */}
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                  <ShieldCheck className={cn('h-4 w-4', zatcaColors[invoice.zatcaStatus])} />
                  <span className="text-sm text-foreground">ZATCA Status:</span>
                  <span className={cn('text-sm font-medium', zatcaColors[invoice.zatcaStatus])}>
                    {invoice.zatcaStatus}
                  </span>
                </div>

                {/* Copy invoice number */}
                <button
                  onClick={() => navigator.clipboard.writeText(invoice.invoiceNumber)}
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy invoice number
                </button>
              </div>
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

export default function InvoicesPage() {
  const { t } = useTranslation()
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: [],
    zatca: [],
  })
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null)
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null)

  const outstanding = mockInvoices
    .filter((inv) => inv.status === 'TRIAL' || inv.status === 'SUSPENDED')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const overdueAmount = mockInvoices
    .filter((inv) => inv.status === 'SUSPENDED')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const paidThisMonth = mockInvoices
    .filter((inv) => inv.status === 'ACTIVE' && inv.date.startsWith('2026-02'))
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const compliantCount = mockInvoices.filter((inv) => inv.zatcaStatus === 'Compliant').length
  const zatcaPercent = Math.round((compliantCount / mockInvoices.length) * 100)

  const kpis: KPIItem[] = [
    { label: t('invoices.outstanding', 'Outstanding Amount'), value: `SAR ${outstanding.toLocaleString()}`, change: -12, trend: 'down', icon: DollarSign },
    { label: t('invoices.overdue', 'Overdue'), value: `SAR ${overdueAmount.toLocaleString()}`, change: 5, trend: 'up', icon: AlertTriangle },
    { label: t('invoices.paidThisMonth', 'Paid This Month'), value: `SAR ${paidThisMonth.toLocaleString()}`, change: 18, trend: 'up', icon: CheckCircle2 },
    { label: t('invoices.zatca', 'ZATCA Compliance'), value: `${zatcaPercent}%`, change: 3, trend: 'up', icon: ShieldCheck },
  ]

  const filteredInvoices = useMemo(() => {
    let result = mockInvoices
    if (activeFilters.status.length > 0) {
      result = result.filter((inv) => activeFilters.status.includes(inv.status))
    }
    if (activeFilters.zatca.length > 0) {
      result = result.filter((inv) => activeFilters.zatca.includes(inv.zatcaStatus))
    }
    return result
  }, [activeFilters])

  const columns: ColumnDef<Invoice, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: t('invoices.invoiceNumber', 'Invoice #'),
        cell: ({ getValue }) => (
          <span className="font-mono text-sm font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'tenantName',
        header: t('invoices.tenant', 'Tenant'),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('invoices.amount', 'Amount'),
        cell: ({ getValue }) => (
          <span className="text-end font-medium tabular-nums text-foreground">
            SAR {getValue<number>().toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('invoices.status', 'Status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} label={row.original.statusLabel} />,
      },
      {
        accessorKey: 'zatcaStatus',
        header: t('invoices.zatcaStatus', 'ZATCA'),
        cell: ({ getValue }) => {
          const status = getValue<string>()
          return <span className={cn('text-sm font-medium', zatcaColors[status])}>{status}</span>
        },
      },
      {
        accessorKey: 'date',
        header: t('invoices.date', 'Date'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <ActionsMenu onMarkPaid={() => setMarkPaidInvoice(row.original)} />
        ),
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
          {t('invoices.title', 'Invoices')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('invoices.subtitle', 'Manage billing, invoices, and ZATCA compliance')}
        </p>
      </div>

      {/* KPIs */}
      <KPIGrid items={kpis} columns={4} />

      {/* Filters */}
      <FilterBar
        filters={filterDefs}
        activeFilters={activeFilters}
        onChange={setActiveFilters}
      />

      {/* Table — wrap for overdue row styling */}
      <div className="[&_tr]:relative">
        <DataTable<Invoice>
          data={filteredInvoices}
          columns={columns}
          enableSearch
          searchPlaceholder={t('invoices.searchPlaceholder', 'Search invoices...')}
          onRowClick={(row) => setDetailInvoice(row)}
          emptyTitle={t('invoices.emptyTitle', 'No invoices found')}
          emptyDescription={t('invoices.emptyDescription', 'Try adjusting your filters.')}
        />
      </div>

      {/* Overdue row style — conditionally add red border via per-row check in the rendered list */}
      {filteredInvoices.some((inv) => inv.status === 'SUSPENDED') && (
        <style>{`
          tr:has(td .text-status-error) {
            border-inline-start: 4px solid var(--status-error, #ef4444);
          }
        `}</style>
      )}

      {/* Mark Paid modal */}
      <MarkPaidModal
        open={markPaidInvoice !== null}
        onClose={() => setMarkPaidInvoice(null)}
        invoice={markPaidInvoice}
      />

      {/* Invoice detail slide-over */}
      <InvoiceSlideOver
        open={detailInvoice !== null}
        onClose={() => setDetailInvoice(null)}
        invoice={detailInvoice}
      />
    </motion.div>
  )
}
