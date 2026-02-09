import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'
import {
  UserPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShieldCheck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataTable } from '@/components/data'
import { StatusBadge, ConfirmDialog } from '@/components/feedback'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'
  statusLabel: string
  lastLogin: string
  isCurrentUser: boolean
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const roleColors: Record<string, string> = {
  'Super Admin': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  Admin: 'bg-brand-accent/15 text-brand-accent',
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Support: 'bg-status-info-bg text-status-info',
  Viewer: 'bg-muted text-muted-foreground',
}

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Abdulaziz Al-Rashidi', email: 'abdulaziz@liyaqa.com', role: 'Super Admin', status: 'ACTIVE', statusLabel: 'Active', lastLogin: '2 min ago', isCurrentUser: true },
  { id: '2', name: 'Sarah Al-Otaibi', email: 'sarah@liyaqa.com', role: 'Admin', status: 'ACTIVE', statusLabel: 'Active', lastLogin: '1 hour ago', isCurrentUser: false },
  { id: '3', name: 'Mohammed Khan', email: 'mohammed@liyaqa.com', role: 'Support', status: 'ACTIVE', statusLabel: 'Active', lastLogin: '30 min ago', isCurrentUser: false },
  { id: '4', name: 'Layla Hassan', email: 'layla@liyaqa.com', role: 'Manager', status: 'TRIAL', statusLabel: 'Invited', lastLogin: 'Never', isCurrentUser: false },
  { id: '5', name: 'Omar Zayed', email: 'omar@liyaqa.com', role: 'Viewer', status: 'SUSPENDED', statusLabel: 'Disabled', lastLogin: '14 days ago', isCurrentUser: false },
]

/* ------------------------------------------------------------------ */
/*  Actions menu                                                       */
/* ------------------------------------------------------------------ */

function ActionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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
                onEdit()
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
                onDelete()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-status-error hover:bg-muted"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Invite modal                                                       */
/* ------------------------------------------------------------------ */

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Viewer')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Invitation sent to ${email}`)
    setEmail('')
    setRole('Viewer')
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
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-4 top-[25%] z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <button onClick={onClose} className="absolute end-3 top-3 rounded-lg p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-foreground">Invite Team Member</h2>
            <p className="mt-1 text-sm text-muted-foreground">Send an invitation to join the platform team.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@liyaqa.com"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>Viewer</option>
                  <option>Support</option>
                  <option>Manager</option>
                  <option>Admin</option>
                </select>
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
                  Send Invite
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
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function TeamPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<TeamMember | null>(null)

  const columns: ColumnDef<TeamMember, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('team.name', 'Name'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-bg-inverse">
              {row.original.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{row.original.name}</span>
                {row.original.isCurrentUser && (
                  <span className="rounded-full bg-brand-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-accent">You</span>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: t('team.email', 'Email'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: t('team.role', 'Role'),
        cell: ({ getValue }) => {
          const role = getValue<string>()
          return (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', roleColors[role] ?? 'bg-muted text-muted-foreground')}>
              {role === 'Super Admin' && <ShieldCheck className="h-3 w-3" />}
              {role}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: t('team.status', 'Status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} label={row.original.statusLabel} />,
      },
      {
        accessorKey: 'lastLogin',
        header: t('team.lastLogin', 'Last Login'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) =>
          row.original.isCurrentUser ? null : (
            <ActionsMenu
              onEdit={() => toast.info(`Edit ${row.original.name}`)}
              onDelete={() => setDeleteConfirm(row.original)}
            />
          ),
        enableSorting: false,
        size: 50,
      },
    ],
    [t, toast],
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
            {t('team.title', 'Team')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('team.subtitle', 'Manage team members and their roles')}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Table */}
      <DataTable<TeamMember>
        data={mockTeam}
        columns={columns}
        enableSearch
        searchPlaceholder={t('team.searchPlaceholder', 'Search team members...')}
        emptyTitle={t('team.emptyTitle', 'No team members')}
        emptyDescription={t('team.emptyDescription', 'Invite your first team member to get started.')}
      />

      {/* Invite modal */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          toast.success(`${deleteConfirm?.name} has been removed`)
          setDeleteConfirm(null)
        }}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${deleteConfirm?.name}? They will lose access to the platform.`}
        confirmLabel="Remove"
        danger
      />
    </motion.div>
  )
}
