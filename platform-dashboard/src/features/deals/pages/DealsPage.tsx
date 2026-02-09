import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Kanban, Table, X, Building2, User, Calendar } from 'lucide-react'
import { KPIGrid, type KPIItem } from '@/components/data'
import { useToast } from '@/stores/toast-store'

type DealStage = 'LEAD' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'DEMO_DONE' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST'

interface Deal {
  id: string
  facilityName: string
  contactName: string
  value: number
  source: string
  assignee: string
  stage: DealStage
  daysInStage: number
}

const STAGES: DealStage[] = ['LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST']

const stageLabels: Record<DealStage, string> = {
  LEAD: 'Lead',
  CONTACTED: 'Contacted',
  DEMO_SCHEDULED: 'Demo Scheduled',
  DEMO_DONE: 'Demo Done',
  PROPOSAL_SENT: 'Proposal Sent',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
}

const MOCK_DEALS: Deal[] = [
  { id: '1', facilityName: 'FitZone Riyadh', contactName: 'Ahmed Al-Rashid', value: 45000, source: 'Referral', assignee: 'SA', stage: 'LEAD', daysInStage: 3 },
  { id: '2', facilityName: 'PowerGym Jeddah', contactName: 'Omar Hassan', value: 72000, source: 'Website', assignee: 'MK', stage: 'CONTACTED', daysInStage: 5 },
  { id: '3', facilityName: 'Elite Sports Dammam', contactName: 'Khalid Ibrahim', value: 95000, source: 'Cold Call', assignee: 'SA', stage: 'DEMO_SCHEDULED', daysInStage: 2 },
  { id: '4', facilityName: 'Body Masters', contactName: 'Faisal Al-Otaibi', value: 120000, source: 'Referral', assignee: 'MK', stage: 'PROPOSAL_SENT', daysInStage: 7 },
  { id: '5', facilityName: 'Fitness First KSA', contactName: 'Nora Al-Zahrani', value: 200000, source: 'Event', assignee: 'SA', stage: 'NEGOTIATION', daysInStage: 12 },
  { id: '6', facilityName: 'Gym Nation', contactName: 'Tariq Mahmoud', value: 55000, source: 'Website', assignee: 'MK', stage: 'WON', daysInStage: 0 },
]

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-3 transition-shadow ${isDragging ? 'rotate-2 shadow-lg' : 'hover:shadow-sm'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          {deal.facilityName}
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-bg-inverse">
          {deal.assignee}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <User className="h-3 w-3" />
        {deal.contactName}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-brand-accent">{deal.value.toLocaleString()} SAR</span>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {deal.source}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {deal.daysInStage}d in stage
      </div>
    </div>
  )
}

function SortableDealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} />
    </div>
  )
}

function KanbanColumn({ stage, deals, isOver }: { stage: DealStage; deals: Deal[]; isOver?: boolean }) {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className={`flex w-64 shrink-0 flex-col rounded-lg border bg-muted/30 ${isOver ? 'border-dashed border-brand-accent' : 'border-border'}`}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div>
          <div className="text-xs font-semibold text-foreground">{stageLabels[stage]}</div>
          <div className="text-[10px] text-muted-foreground">{deals.length} deals · {totalValue.toLocaleString()} SAR</div>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

function NewDealSlideOver({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Deal created successfully')
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
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 end-0 z-50 w-96 border-s border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold text-foreground">New Deal</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Facility Name</label>
                <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Contact Name</label>
                <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Value (SAR)</label>
                <input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Source</label>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring">
                  <option>Referral</option>
                  <option>Website</option>
                  <option>Cold Call</option>
                  <option>Event</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
              >
                Create Deal
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function DealsPage() {
  const { t } = useTranslation()
  const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS)
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const toast = useToast()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const kpis: KPIItem[] = [
    { label: 'Total Deals', value: deals.length, change: 12, trend: 'up' },
    { label: 'Pipeline Value', value: `${(deals.reduce((s, d) => s + d.value, 0) / 1000).toFixed(0)}K SAR`, change: 8, trend: 'up' },
    { label: 'Conversion Rate', value: `${((deals.filter((d) => d.stage === 'WON').length / deals.length) * 100).toFixed(0)}%`, change: -2, trend: 'down' },
    { label: 'Avg Cycle Time', value: '23 days', change: -5, trend: 'up' },
  ]

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id)
    if (deal) setActiveDeal(deal)
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDeal(null)
      const { active, over } = event
      if (!over) return

      const dealId = active.id as string
      const deal = deals.find((d) => d.id === dealId)
      if (!deal) return

      const overDeal = deals.find((d) => d.id === over.id)
      if (overDeal && overDeal.stage !== deal.stage) {
        setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: overDeal.stage } : d)))
        toast.success(`Moved ${deal.facilityName} to ${stageLabels[overDeal.stage]}`)
      }
    },
    [deals, toast],
  )

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('nav.deals', 'Deals')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setView('kanban')}
              className={`rounded-s-lg px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-brand-accent text-bg-inverse' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Kanban className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('table')}
              className={`rounded-e-lg px-3 py-1.5 text-sm ${view === 'table' ? 'bg-brand-accent text-bg-inverse' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Table className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setSlideOverOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New Deal
          </button>
        </div>
      </div>

      <KPIGrid items={kpis} columns={4} />

      <div className="mt-6">
        {view === 'kanban' ? (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {STAGES.map((stage) => (
                <KanbanColumn key={stage} stage={stage} deals={deals.filter((d) => d.stage === stage)} />
              ))}
            </div>
            <DragOverlay>
              {activeDeal && <DealCard deal={activeDeal} isDragging />}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
            Table view — use DataTable component with deal data
          </div>
        )}
      </div>

      <NewDealSlideOver open={slideOverOpen} onClose={() => setSlideOverOpen(false)} />
    </div>
  )
}
