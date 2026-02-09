import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Calendar,
  Eye,
  Megaphone,
  Plus,
  Rocket,
  ScrollText,
  Send,
  Shield,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIGrid, type KPIItem } from '@/components/data'
import { SearchInput } from '@/components/forms'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AnnouncementType = 'feature' | 'maintenance' | 'promotion' | 'policy'
type AnnouncementStatus = 'active' | 'scheduled' | 'draft' | 'expired'
type AudienceType = 'all' | 'trial' | 'professional' | 'enterprise'

interface Announcement {
  id: string
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  type: AnnouncementType
  status: AnnouncementStatus
  audience: AudienceType[]
  scheduledAt?: string
  createdAt: string
  reach: number
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    titleEn: 'New Member Check-in Feature',
    titleAr: 'ميزة تسجيل الدخول الجديدة للأعضاء',
    contentEn: 'We have launched a new QR-based check-in system for members. Enable it from your facility settings.',
    contentAr: 'أطلقنا نظام تسجيل دخول جديد يعتمد على رمز QR للأعضاء. قم بتفعيله من إعدادات مرفقك.',
    type: 'feature',
    status: 'active',
    audience: ['all'],
    createdAt: '2026-02-08',
    reach: 3200,
  },
  {
    id: '2',
    titleEn: 'Scheduled Maintenance - Feb 15',
    titleAr: 'صيانة مجدولة - 15 فبراير',
    contentEn: 'Database upgrade scheduled for Feb 15, 2:00 AM - 4:00 AM. Expect brief interruptions.',
    contentAr: 'ترقية قاعدة البيانات مجدولة في 15 فبراير من الساعة 2:00 إلى 4:00 صباحاً. توقع انقطاعات قصيرة.',
    type: 'maintenance',
    status: 'scheduled',
    audience: ['all'],
    scheduledAt: '2026-02-14',
    createdAt: '2026-02-07',
    reach: 0,
  },
  {
    id: '3',
    titleEn: 'Ramadan Promotion Package',
    titleAr: 'عروض رمضان',
    contentEn: 'Special Ramadan pricing available for Professional and Enterprise plans. 20% discount on annual subscriptions.',
    contentAr: 'أسعار رمضان الخاصة متاحة لخطط المحترفين والمؤسسات. خصم 20% على الاشتراكات السنوية.',
    type: 'promotion',
    status: 'active',
    audience: ['professional', 'enterprise'],
    createdAt: '2026-02-05',
    reach: 1850,
  },
  {
    id: '4',
    titleEn: 'Updated Privacy Policy',
    titleAr: 'تحديث سياسة الخصوصية',
    contentEn: 'Our privacy policy has been updated to comply with PDPL requirements. Please review the changes.',
    contentAr: 'تم تحديث سياسة الخصوصية لدينا للامتثال لمتطلبات نظام حماية البيانات الشخصية. يرجى مراجعة التغييرات.',
    type: 'policy',
    status: 'active',
    audience: ['all'],
    createdAt: '2026-02-01',
    reach: 4100,
  },
  {
    id: '5',
    titleEn: 'Analytics Dashboard v2',
    titleAr: 'لوحة التحليلات الإصدار 2',
    contentEn: 'Redesigned analytics with real-time insights, new KPIs, and exportable reports.',
    contentAr: 'تحليلات معاد تصميمها مع رؤى في الوقت الفعلي ومؤشرات أداء رئيسية جديدة وتقارير قابلة للتصدير.',
    type: 'feature',
    status: 'draft',
    audience: ['professional', 'enterprise'],
    createdAt: '2026-02-09',
    reach: 0,
  },
  {
    id: '6',
    titleEn: 'Trial Extension Program',
    titleAr: 'برنامج تمديد الفترة التجريبية',
    contentEn: 'Eligible trial accounts can now request a 7-day extension. Share this with onboarding facilities.',
    contentAr: 'يمكن الآن للحسابات التجريبية المؤهلة طلب تمديد لمدة 7 أيام. شارك هذا مع المرافق في مرحلة التأهيل.',
    type: 'promotion',
    status: 'expired',
    audience: ['trial'],
    createdAt: '2026-01-20',
    reach: 420,
  },
]

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const typeConfig: Record<AnnouncementType, { icon: typeof Rocket; color: string; borderColor: string; label: string }> = {
  feature: { icon: Rocket, color: 'text-status-info', borderColor: 'border-s-status-info', label: 'Feature' },
  maintenance: { icon: Wrench, color: 'text-status-warning', borderColor: 'border-s-status-warning', label: 'Maintenance' },
  promotion: { icon: Megaphone, color: 'text-status-success', borderColor: 'border-s-status-success', label: 'Promotion' },
  policy: { icon: Shield, color: 'text-purple-500', borderColor: 'border-s-purple-500', label: 'Policy' },
}

const statusConfig: Record<AnnouncementStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-status-success-bg', text: 'text-status-success', label: 'Active' },
  scheduled: { bg: 'bg-status-info-bg', text: 'text-status-info', label: 'Scheduled' },
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Draft' },
  expired: { bg: 'bg-status-error-bg', text: 'text-status-error', label: 'Expired' },
}

const audienceLabels: Record<AudienceType, string> = {
  all: 'All Tenants',
  trial: 'Trial',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

/* ------------------------------------------------------------------ */
/*  AnnouncementCard                                                   */
/* ------------------------------------------------------------------ */

function AnnouncementCard({ announcement, index }: { announcement: Announcement; index: number }) {
  const typeCfg = typeConfig[announcement.type]
  const statusCfg = statusConfig[announcement.status]
  const TypeIcon = typeCfg.icon

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05 }}
      className={cn('rounded-xl border border-border border-s-4 bg-card p-5 transition-shadow hover:shadow-md', typeCfg.borderColor)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('rounded-lg bg-muted p-2')}>
          <TypeIcon className={cn('h-5 w-5', typeCfg.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{announcement.titleEn}</h3>
            <span className={cn('shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium', statusCfg.bg, statusCfg.text)}>
              {statusCfg.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground/80" dir="rtl">{announcement.titleAr}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{announcement.contentEn}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', typeCfg.color, 'bg-muted')}>
              {typeCfg.label}
            </span>
            {announcement.audience.map((aud) => (
              <span key={aud} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Users className="h-2.5 w-2.5" />
                {audienceLabels[aud]}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {announcement.scheduledAt ? `Scheduled: ${announcement.scheduledAt}` : announcement.createdAt}
            </span>
            {announcement.reach > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {announcement.reach.toLocaleString()} reached
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  NewAnnouncementModal                                               */
/* ------------------------------------------------------------------ */

function NewAnnouncementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [contentEn, setContentEn] = useState('')
  const [contentAr, setContentAr] = useState('')
  const [type, setType] = useState<AnnouncementType>('feature')
  const [audience, setAudience] = useState<AudienceType[]>(['all'])
  const [scheduled, setScheduled] = useState(false)

  const handleAudienceToggle = (aud: AudienceType) => {
    if (audience.includes(aud)) {
      setAudience(audience.filter((a) => a !== aud))
    } else {
      setAudience([...audience, aud])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Announcement created successfully')
    onClose()
  }

  const typeCfg = typeConfig[type]
  const TypeIcon = typeCfg.icon

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-4 z-50 mx-auto my-auto max-h-[90vh] max-w-4xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold text-foreground">New Announcement</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 border-e border-border p-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Title (English)</label>
                  <input
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Enter title in English"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Title (Arabic)</label>
                  <input
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    dir="rtl"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                    placeholder="أدخل العنوان بالعربية"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Content (English)</label>
                  <textarea
                    value={contentEn}
                    onChange={(e) => setContentEn(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Enter content in English"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Content (Arabic)</label>
                  <textarea
                    value={contentAr}
                    onChange={(e) => setContentAr(e.target.value)}
                    rows={3}
                    dir="rtl"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                    placeholder="أدخل المحتوى بالعربية"
                    required
                  />
                </div>

                {/* Type selector */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(typeConfig) as AnnouncementType[]).map((t) => {
                      const cfg = typeConfig[t]
                      const Icon = cfg.icon
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setType(t)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                            type === t
                              ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                              : 'border-border text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Audience */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Audience</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(audienceLabels) as AudienceType[]).map((aud) => (
                      <button
                        type="button"
                        key={aud}
                        onClick={() => handleAudienceToggle(aud)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          audience.includes(aud)
                            ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                            : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {audienceLabels[aud]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduled(!scheduled)}
                    className={cn(
                      'relative h-5 w-9 rounded-full transition-colors',
                      scheduled ? 'bg-brand-accent' : 'bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                        scheduled ? 'translate-x-4' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                  <span className="text-sm text-foreground">Schedule for later</span>
                </div>

                {scheduled && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Schedule Date</label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
                >
                  <Send className="h-4 w-4" />
                  {scheduled ? 'Schedule Announcement' : 'Publish Announcement'}
                </button>
              </form>

              {/* Live Preview */}
              <div className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Live Preview</h3>
                <div className={cn('rounded-xl border border-border border-s-4 bg-card p-5', typeCfg.borderColor)}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <TypeIcon className={cn('h-5 w-5', typeCfg.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground">
                        {titleEn || 'Announcement title...'}
                      </h4>
                      {titleAr && (
                        <p className="mt-0.5 text-xs text-muted-foreground/80" dir="rtl">{titleAr}</p>
                      )}
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {contentEn || 'Content preview will appear here...'}
                      </p>
                      {contentAr && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80" dir="rtl">
                          {contentAr}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', typeCfg.color, 'bg-muted')}>
                          {typeCfg.label}
                        </span>
                        {audience.map((aud) => (
                          <span key={aud} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <Users className="h-2.5 w-2.5" />
                            {audienceLabels[aud]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AnnouncementsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)

  const activeCount = MOCK_ANNOUNCEMENTS.filter((a) => a.status === 'active').length
  const scheduledCount = MOCK_ANNOUNCEMENTS.filter((a) => a.status === 'scheduled').length
  const totalReach = MOCK_ANNOUNCEMENTS.reduce((s, a) => s + a.reach, 0)

  const kpis: KPIItem[] = [
    { label: t('announcements.total', 'Total Announcements'), value: MOCK_ANNOUNCEMENTS.length, icon: ScrollText },
    { label: t('announcements.active', 'Active'), value: activeCount, change: 10, trend: 'up', icon: Bell },
    { label: t('announcements.scheduled', 'Scheduled'), value: scheduledCount, icon: Calendar },
    { label: t('announcements.reach', 'Total Reach'), value: totalReach.toLocaleString(), change: 15, trend: 'up', icon: Users },
  ]

  const filteredAnnouncements = useMemo(() => {
    let result = [...MOCK_ANNOUNCEMENTS]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.titleEn.toLowerCase().includes(q) ||
          a.titleAr.includes(q) ||
          a.contentEn.toLowerCase().includes(q),
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter((a) => a.type === typeFilter)
    }

    return result
  }, [search, typeFilter])

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
            {t('announcements.title', 'Announcements')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('announcements.subtitle', 'Create and manage platform-wide announcements')}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-bg-inverse transition-colors hover:bg-brand-accent-hover"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </button>
      </div>

      {/* KPIs */}
      <KPIGrid items={kpis} columns={4} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          onChange={setSearch}
          placeholder={t('announcements.search', 'Search announcements...')}
          className="w-full max-w-sm"
        />
        <div className="flex gap-1.5">
          {(['all', 'feature', 'maintenance', 'promotion', 'policy'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                typeFilter === type
                  ? 'bg-brand-accent text-bg-inverse'
                  : 'border border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {type === 'all' ? 'All' : typeConfig[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcement cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {filteredAnnouncements.map((announcement, i) => (
          <AnnouncementCard key={announcement.id} announcement={announcement} index={i} />
        ))}
      </motion.div>

      {filteredAnnouncements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="mb-4 h-16 w-16 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">No announcements found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* New Announcement Modal */}
      <NewAnnouncementModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </motion.div>
  )
}
