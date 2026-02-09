import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Pencil,
  Pause,
  Download,
  Users,
  CreditCard,
  Calendar,
  TrendingUp,
  Settings,
  FileText,
  Headphones,
  Activity,
  BarChart3,
  Globe,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatCard, Timeline } from '@/components/data'
import { StatusBadge } from '@/components/feedback'

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockTenant = {
  id: '1',
  facilityName: 'Riyadh Fitness Hub',
  status: 'ACTIVE' as const,
  plan: 'Professional',
  members: 1240,
  region: 'Riyadh',
  email: 'admin@riyadhfitness.sa',
  phone: '+966 11 234 5678',
  address: 'King Fahd Road, Riyadh 12345',
  onboardingProgress: 100,
  monthlyRevenue: 'SAR 45,200',
  createdAt: 'Jan 15, 2025',
  lastLogin: '2 hours ago',
}

const overviewTimeline = [
  { id: '1', timestamp: 'Feb 8, 2026', title: 'Monthly report generated', description: 'January 2026 analytics report auto-generated', type: 'create' as const },
  { id: '2', timestamp: 'Feb 5, 2026', title: 'Plan upgraded to Professional', description: 'Changed from Starter to Professional plan', type: 'update' as const },
  { id: '3', timestamp: 'Jan 28, 2026', title: 'Support ticket resolved', description: 'Ticket #1042 — Payment gateway issue', type: 'update' as const },
  { id: '4', timestamp: 'Jan 15, 2026', title: 'Facility onboarded', description: 'Completed all onboarding steps', type: 'create' as const },
]

const activityTimeline = [
  { id: 'a1', timestamp: '2 hours ago', title: 'Admin logged in', description: 'admin@riyadhfitness.sa accessed the dashboard', type: 'access' as const },
  { id: 'a2', timestamp: '5 hours ago', title: 'Member record updated', description: 'Updated 3 member profiles', type: 'update' as const },
  { id: 'a3', timestamp: '1 day ago', title: 'New class created', description: 'Added "Morning Yoga" to the schedule', type: 'create' as const },
  { id: 'a4', timestamp: '2 days ago', title: 'Invoice generated', description: 'February 2026 invoice — SAR 2,500', type: 'create' as const },
  { id: 'a5', timestamp: '3 days ago', title: 'Settings changed', description: 'Updated notification preferences', type: 'update' as const },
  { id: 'a6', timestamp: '5 days ago', title: 'Admin logged in', description: 'admin@riyadhfitness.sa accessed the dashboard', type: 'access' as const },
]

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'onboarding', label: 'Onboarding', icon: FileText },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

type TabId = (typeof tabs)[number]['id']

/* ------------------------------------------------------------------ */
/*  Tab content components                                             */
/* ------------------------------------------------------------------ */

function OverviewTab() {
  const { t } = useTranslation()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Facility Info */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">
          {t('tenantDetail.facilityInfo', 'Facility Information')}
        </h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('tenantDetail.region', 'Region')}:</span>
            <span className="text-foreground">{mockTenant.region}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('tenantDetail.email', 'Email')}:</span>
            <span className="text-foreground">{mockTenant.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('tenantDetail.phone', 'Phone')}:</span>
            <span className="text-foreground">{mockTenant.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('tenantDetail.address', 'Address')}:</span>
            <span className="text-foreground">{mockTenant.address}</span>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">
          {t('tenantDetail.subscription', 'Subscription')}
        </h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tenantDetail.currentPlan', 'Current Plan')}</span>
            <span className="rounded-full bg-brand-accent/15 px-2.5 py-0.5 text-xs font-medium text-brand-accent">
              {mockTenant.plan}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tenantDetail.monthlyRevenue', 'Monthly Revenue')}</span>
            <span className="font-semibold text-foreground">{mockTenant.monthlyRevenue}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tenantDetail.memberSince', 'Member Since')}</span>
            <span className="text-foreground">{mockTenant.createdAt}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tenantDetail.lastLogin', 'Last Login')}</span>
            <span className="text-foreground">{mockTenant.lastLogin}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          {t('tenantDetail.recentActivity', 'Recent Activity')}
        </h3>
        <Timeline items={overviewTimeline} />
      </div>
    </div>
  )
}

function OnboardingTab() {
  const { t } = useTranslation()

  const steps = [
    { label: 'Facility Details', completed: true },
    { label: 'Admin Account', completed: true },
    { label: 'Plan Selection', completed: true },
    { label: 'Configuration', completed: true },
    { label: 'Launch', completed: true },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground">
        {t('tenantDetail.onboardingProgress', 'Onboarding Progress')}
      </h3>
      <div className="mt-6 flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                  step.completed
                    ? 'bg-status-success text-white'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {step.completed ? '\u2713' : i + 1}
              </div>
              <span className="mt-2 text-xs text-muted-foreground">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-px w-12 sm:w-20',
                  step.completed ? 'bg-status-success' : 'bg-border',
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-status-success">
        {t('tenantDetail.onboardingComplete', 'All onboarding steps completed successfully.')}
      </p>
    </div>
  )
}

function BillingTab() {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground">
        {t('tenantDetail.billingHistory', 'Billing History')}
      </h3>
      <div className="mt-4 space-y-3">
        {[
          { month: 'February 2026', amount: 'SAR 2,500', status: 'Pending' },
          { month: 'January 2026', amount: 'SAR 2,500', status: 'Paid' },
          { month: 'December 2025', amount: 'SAR 2,500', status: 'Paid' },
        ].map((invoice) => (
          <div key={invoice.month} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <span className="text-sm font-medium text-foreground">{invoice.month}</span>
              <span className="ms-3 text-sm text-muted-foreground">{invoice.amount}</span>
            </div>
            <StatusBadge
              status={invoice.status === 'Paid' ? 'ACTIVE' : 'TRIAL'}
              label={invoice.status}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function SupportTab() {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground">
        {t('tenantDetail.supportTickets', 'Support Tickets')}
      </h3>
      <div className="mt-4 space-y-3">
        {[
          { id: '#1042', subject: 'Payment gateway issue', status: 'ACTIVE', date: 'Jan 28, 2026' },
          { id: '#1038', subject: 'Member import failing', status: 'ACTIVE', date: 'Jan 20, 2026' },
          { id: '#1015', subject: 'Schedule display bug', status: 'ARCHIVED', date: 'Jan 5, 2026' },
        ].map((ticket) => (
          <div key={ticket.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <span className="text-sm font-medium text-foreground">{ticket.id}</span>
              <span className="ms-2 text-sm text-muted-foreground">{ticket.subject}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{ticket.date}</span>
              <StatusBadge status={ticket.status} label={ticket.status === 'ACTIVE' ? 'Resolved' : 'Closed'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityTab() {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {t('tenantDetail.activityLog', 'Activity Log')}
      </h3>
      <Timeline items={activityTimeline} />
    </div>
  )
}

function SettingsTab() {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground">
        {t('tenantDetail.tenantSettings', 'Tenant Settings')}
      </h3>
      <div className="mt-4 space-y-4">
        {[
          { label: 'Auto-renewal', enabled: true },
          { label: 'Email notifications', enabled: true },
          { label: 'SMS alerts', enabled: false },
          { label: 'API access', enabled: true },
        ].map((setting) => (
          <div key={setting.label} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{setting.label}</span>
            <div
              className={cn(
                'h-5 w-9 rounded-full transition-colors',
                setting.enabled ? 'bg-brand-accent' : 'bg-muted',
              )}
            >
              <div
                className={cn(
                  'h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform',
                  setting.enabled ? 'translate-x-4.5' : 'translate-x-0.5',
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const tabComponents: Record<TabId, () => JSX.Element> = {
  overview: OverviewTab,
  onboarding: OnboardingTab,
  billing: BillingTab,
  support: SupportTab,
  activity: ActivityTab,
  settings: SettingsTab,
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function TenantDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Suppress unused warning — id is used for routing context
  void id

  const ActiveTabContent = tabComponents[activeTab]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 p-6"
    >
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/tenants')}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('tenantDetail.backToTenants', 'Back to Tenants')}
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{mockTenant.facilityName}</h1>
            <StatusBadge status={mockTenant.status} />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              <Pencil className="h-3.5 w-3.5" />
              {t('tenantDetail.edit', 'Edit')}
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-status-warning px-3 py-2 text-sm font-medium text-status-warning transition-colors hover:bg-status-warning-bg">
              <Pause className="h-3.5 w-3.5" />
              {t('tenantDetail.suspend', 'Suspend')}
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover">
              <Download className="h-3.5 w-3.5" />
              {t('tenantDetail.export', 'Export')}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('tenantDetail.members', 'Members')} value={mockTenant.members.toLocaleString()} change={8} trend="up" icon={Users} />
        <StatCard label={t('tenantDetail.revenue', 'Monthly Revenue')} value={mockTenant.monthlyRevenue} change={12} trend="up" icon={CreditCard} />
        <StatCard label={t('tenantDetail.memberSince', 'Member Since')} value={mockTenant.createdAt} icon={Calendar} />
        <StatCard label={t('tenantDetail.growth', 'Growth Rate')} value="15%" change={3} trend="up" icon={TrendingUp} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-lg bg-muted/50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(`tenantDetail.tab.${tab.id}`, tab.label)}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <ActiveTabContent />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
