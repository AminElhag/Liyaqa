import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Search,
  Plus,
  Eye,
  ThumbsUp,
  ArrowUpDown,
  X,
  FileText,
  Tag,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/stores/toast-store'
import { StatusBadge, EmptyState } from '@/components/feedback'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ArticleStatus = 'published' | 'draft'
type SortMode = 'newest' | 'views' | 'helpful'

interface Article {
  id: string
  titleEn: string
  titleAr: string
  bodyEn: string
  bodyAr: string
  category: string
  tags: string[]
  status: ArticleStatus
  views: number
  helpfulYes: number
  helpfulNo: number
  createdAt: string
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockCategories = [
  { id: 'getting-started', label: 'Getting Started', count: 4 },
  { id: 'billing', label: 'Billing & Payments', count: 3 },
  { id: 'members', label: 'Member Management', count: 3 },
  { id: 'scheduling', label: 'Scheduling', count: 2 },
  { id: 'integrations', label: 'Integrations', count: 2 },
  { id: 'troubleshooting', label: 'Troubleshooting', count: 1 },
]

const mockArticles: Article[] = [
  {
    id: 'a1',
    titleEn: 'How to Set Up Your Facility',
    titleAr: 'كيفية إعداد منشأتك',
    bodyEn: '# Getting Started\n\nWelcome to Liyaqa! Follow these steps to set up your facility:\n\n1. Navigate to **Settings** > **General**\n2. Enter your facility details\n3. Upload your logo\n4. Configure operating hours\n\n## Adding Staff\n\nGo to **Team** and click **Invite Member** to add staff.',
    bodyAr: '# البدء\n\nمرحبا بك في لياقة! اتبع هذه الخطوات لإعداد منشأتك.',
    category: 'getting-started',
    tags: ['setup', 'onboarding'],
    status: 'published',
    views: 1245,
    helpfulYes: 89,
    helpfulNo: 12,
    createdAt: '2026-01-15',
    updatedAt: '2026-02-01',
  },
  {
    id: 'a2',
    titleEn: 'Understanding Subscription Plans',
    titleAr: 'فهم خطط الاشتراك',
    bodyEn: '# Subscription Plans\n\nLiyaqa offers three subscription tiers:\n\n- **Starter**: For small facilities\n- **Professional**: For growing businesses\n- **Enterprise**: For large chains\n\nEach plan includes different features and member limits.',
    bodyAr: '# خطط الاشتراك\n\nتقدم لياقة ثلاث مستويات اشتراك.',
    category: 'billing',
    tags: ['billing', 'plans'],
    status: 'published',
    views: 892,
    helpfulYes: 67,
    helpfulNo: 5,
    createdAt: '2026-01-20',
    updatedAt: '2026-01-28',
  },
  {
    id: 'a3',
    titleEn: 'Managing Member Check-ins',
    titleAr: 'إدارة تسجيل دخول الأعضاء',
    bodyEn: '# Member Check-ins\n\nTrack member visits with the check-in system.\n\n## QR Code Check-in\n\nMembers can scan their unique QR code at the facility entrance.\n\n## Manual Check-in\n\nStaff can manually check in members from the dashboard.',
    bodyAr: '# تسجيل دخول الأعضاء\n\nتتبع زيارات الأعضاء باستخدام نظام تسجيل الدخول.',
    category: 'members',
    tags: ['check-in', 'members'],
    status: 'published',
    views: 654,
    helpfulYes: 45,
    helpfulNo: 8,
    createdAt: '2026-01-25',
    updatedAt: '2026-02-05',
  },
  {
    id: 'a4',
    titleEn: 'Setting Up Class Schedules',
    titleAr: 'إعداد جداول الحصص',
    bodyEn: '# Class Schedules\n\nCreate and manage your class timetable.\n\n1. Go to **Scheduling** > **Classes**\n2. Click **New Class**\n3. Set the schedule, capacity, and trainer\n4. Publish the class',
    bodyAr: '# جداول الحصص\n\nإنشاء وإدارة جدول الحصص الخاص بك.',
    category: 'scheduling',
    tags: ['classes', 'scheduling'],
    status: 'published',
    views: 478,
    helpfulYes: 34,
    helpfulNo: 3,
    createdAt: '2026-02-01',
    updatedAt: '2026-02-07',
  },
  {
    id: 'a5',
    titleEn: 'ZATCA E-Invoicing Integration',
    titleAr: 'تكامل الفوترة الإلكترونية ZATCA',
    bodyEn: '# ZATCA Integration\n\nEnable ZATCA-compliant e-invoicing for your facility.\n\n## Prerequisites\n\n- Active ZATCA account\n- Compliance certificate\n- API credentials',
    bodyAr: '# تكامل ZATCA\n\nتمكين الفوترة الإلكترونية المتوافقة مع ZATCA.',
    category: 'integrations',
    tags: ['zatca', 'invoicing'],
    status: 'published',
    views: 321,
    helpfulYes: 28,
    helpfulNo: 2,
    createdAt: '2026-02-03',
    updatedAt: '2026-02-08',
  },
  {
    id: 'a6',
    titleEn: 'Automated Payment Recovery',
    titleAr: 'استرداد المدفوعات التلقائي',
    bodyEn: '# Payment Recovery\n\nAutomate dunning for failed payments with retry schedules and member notifications.',
    bodyAr: '# استرداد المدفوعات\n\nأتمتة المطالبة بالمدفوعات الفاشلة.',
    category: 'billing',
    tags: ['payments', 'dunning'],
    status: 'draft',
    views: 0,
    helpfulYes: 0,
    helpfulNo: 0,
    createdAt: '2026-02-08',
    updatedAt: '2026-02-08',
  },
  {
    id: 'a7',
    titleEn: 'Troubleshooting Login Issues',
    titleAr: 'استكشاف مشكلات تسجيل الدخول',
    bodyEn: '# Login Issues\n\nCommon login problems and solutions:\n\n- Clear browser cache\n- Check credentials\n- Reset password\n- Contact support',
    bodyAr: '# مشكلات تسجيل الدخول\n\nالمشكلات الشائعة في تسجيل الدخول وحلولها.',
    category: 'troubleshooting',
    tags: ['login', 'support'],
    status: 'published',
    views: 189,
    helpfulYes: 15,
    helpfulNo: 4,
    createdAt: '2026-01-18',
    updatedAt: '2026-02-02',
  },
]

/* ------------------------------------------------------------------ */
/*  Simple Markdown-ish renderer                                       */
/* ------------------------------------------------------------------ */

function renderMarkdownPreview(md: string): string {
  return md
    .replace(/^### (.+)/gm, '<h3 class="text-base font-semibold text-foreground mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)/gm, '<h2 class="text-lg font-semibold text-foreground mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)/gm, '<h1 class="text-xl font-bold text-foreground mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)/gm, '<li class="ms-4 list-disc text-sm text-foreground">$1</li>')
    .replace(/^\d+\. (.+)/gm, '<li class="ms-4 list-decimal text-sm text-foreground">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

/* ------------------------------------------------------------------ */
/*  Article editor                                                     */
/* ------------------------------------------------------------------ */

function ArticleEditor({
  article,
  onClose,
  onSave,
}: {
  article?: Article | null
  onClose: () => void
  onSave: (article: Article) => void
}) {
  const { t } = useTranslation()
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const [titleEn, setTitleEn] = useState(article?.titleEn ?? '')
  const [titleAr, setTitleAr] = useState(article?.titleAr ?? '')
  const [bodyEn, setBodyEn] = useState(article?.bodyEn ?? '')
  const [bodyAr, setBodyAr] = useState(article?.bodyAr ?? '')
  const [category, setCategory] = useState(article?.category ?? 'getting-started')
  const [tagsInput, setTagsInput] = useState(article?.tags.join(', ') ?? '')
  const [status, setStatus] = useState<ArticleStatus>(article?.status ?? 'draft')

  const currentTitle = lang === 'en' ? titleEn : titleAr
  const currentBody = lang === 'en' ? bodyEn : bodyAr
  const setCurrentTitle = lang === 'en' ? setTitleEn : setTitleAr
  const setCurrentBody = lang === 'en' ? setBodyEn : setBodyAr
  const previewHtml = renderMarkdownPreview(currentBody)

  const handleSave = useCallback(() => {
    const now = new Date().toISOString().slice(0, 10)
    const saved: Article = {
      id: article?.id ?? `a${Date.now()}`,
      titleEn,
      titleAr,
      bodyEn,
      bodyAr,
      category,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      status,
      views: article?.views ?? 0,
      helpfulYes: article?.helpfulYes ?? 0,
      helpfulNo: article?.helpfulNo ?? 0,
      createdAt: article?.createdAt ?? now,
      updatedAt: now,
    }
    onSave(saved)
  }, [article, titleEn, titleAr, bodyEn, bodyAr, category, tagsInput, status, onSave])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">
            {article ? t('kb.editArticle', 'Edit Article') : t('kb.newArticle', 'New Article')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Language tabs */}
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setLang('en')}
              className={cn(
                'px-3 py-1 text-xs font-medium transition-colors',
                lang === 'en' ? 'bg-brand-accent text-white' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ar')}
              className={cn(
                'px-3 py-1 text-xs font-medium transition-colors',
                lang === 'ar' ? 'bg-brand-accent text-white' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              AR
            </button>
          </div>
          <button
            onClick={handleSave}
            className="rounded-lg bg-brand-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover"
          >
            {t('common.save', 'Save')}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor pane */}
        <div className="flex flex-1 flex-col border-e border-border" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="border-b border-border px-4 py-3">
            <input
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder={lang === 'en' ? 'Article title...' : 'عنوان المقال...'}
              className="w-full bg-transparent text-lg font-bold text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <textarea
            value={currentBody}
            onChange={(e) => setCurrentBody(e.target.value)}
            placeholder={lang === 'en' ? 'Write your article in markdown...' : 'اكتب مقالتك بتنسيق markdown...'}
            className="flex-1 resize-none bg-transparent p-4 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Preview pane */}
        <div className="hidden flex-1 flex-col lg:flex">
          <div className="border-b border-border px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</span>
          </div>
          <div
            className="flex-1 overflow-y-auto p-4 text-sm"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        {/* Metadata sidebar */}
        <div className="hidden w-64 flex-col border-s border-border xl:flex">
          <div className="border-b border-border px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metadata</span>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                {mockCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tags</label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="tag1, tag2"
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function KnowledgeBasePage() {
  const { t } = useTranslation()
  const toast = useToast()

  const [articles, setArticles] = useState(mockArticles)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [editingArticle, setEditingArticle] = useState<Article | null | undefined>(undefined) // undefined = closed, null = new
  const [sortOpen, setSortOpen] = useState(false)

  const filteredArticles = useMemo(() => {
    let result = articles

    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.titleEn.toLowerCase().includes(q) ||
          a.titleAr.toLowerCase().includes(q) ||
          a.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
    }

    switch (sortMode) {
      case 'newest':
        return [...result].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      case 'views':
        return [...result].sort((a, b) => b.views - a.views)
      case 'helpful': {
        const ratio = (art: Article) => {
          const total = art.helpfulYes + art.helpfulNo
          return total === 0 ? 0 : art.helpfulYes / total
        }
        return [...result].sort((a, b) => ratio(b) - ratio(a))
      }
    }
  }, [articles, search, selectedCategory, sortMode])

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of articles) {
      map[a.category] = (map[a.category] ?? 0) + 1
    }
    return map
  }, [articles])

  const handleSaveArticle = useCallback(
    (saved: Article) => {
      setArticles((prev) => {
        const existing = prev.find((a) => a.id === saved.id)
        if (existing) return prev.map((a) => (a.id === saved.id ? saved : a))
        return [saved, ...prev]
      })
      setEditingArticle(undefined)
      toast.success(t('kb.articleSaved', 'Article saved successfully'))
    },
    [toast, t],
  )

  const helpfulRatio = (a: Article) => {
    const total = a.helpfulYes + a.helpfulNo
    if (total === 0) return 'N/A'
    return `${Math.round((a.helpfulYes / total) * 100)}%`
  }

  const sortLabels: Record<SortMode, string> = {
    newest: 'Newest',
    views: 'Most Viewed',
    helpful: 'Most Helpful',
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex h-full"
      >
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-e border-border bg-card p-4 lg:block">
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('kb.categories', 'Categories')}
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
              !selectedCategory
                ? 'bg-brand-accent/10 font-medium text-brand-accent'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span>All Articles</span>
            <span className="text-xs">{articles.length}</span>
          </button>
          {mockCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                selectedCategory === cat.id
                  ? 'bg-brand-accent/10 font-medium text-brand-accent'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span>{cat.label}</span>
              <span className="text-xs">{categoryCounts[cat.id] ?? 0}</span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('kb.title', 'Knowledge Base')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('kb.subtitle', 'Manage help articles and documentation')}
              </p>
            </div>
            <button
              onClick={() => setEditingArticle(null)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover"
            >
              <Plus className="h-4 w-4" />
              {t('kb.newArticle', 'New Article')}
            </button>
          </div>

          {/* Search + Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('kb.search', 'Search articles...')}
                className="w-full rounded-lg border border-border bg-background py-2 pe-3 ps-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortLabels[sortMode]}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute end-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-card p-1 shadow-lg">
                    {(Object.keys(sortLabels) as SortMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setSortMode(mode)
                          setSortOpen(false)
                        }}
                        className={cn(
                          'flex w-full items-center rounded-md px-3 py-1.5 text-sm transition-colors',
                          sortMode === mode ? 'bg-brand-accent/10 text-brand-accent' : 'text-foreground hover:bg-muted',
                        )}
                      >
                        {sortLabels[mode]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Article list */}
          {filteredArticles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t('kb.emptyTitle', 'No articles found')}
              description={t('kb.emptyDescription', 'Try adjusting your search or filters.')}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => {
                const catLabel = mockCategories.find((c) => c.id === article.category)?.label ?? article.category
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                    onClick={() => setEditingArticle(article)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-accent">
                        {article.titleEn}
                      </h3>
                      <StatusBadge
                        status={article.status === 'published' ? 'ACTIVE' : 'ARCHIVED'}
                        label={article.status}
                      />
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {article.bodyEn.replace(/[#*\-\d.]/g, '').trim().slice(0, 120)}...
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <Tag className="h-2.5 w-2.5" />
                        {catLabel}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {helpfulRatio(article)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {article.updatedAt}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Editor overlay */}
      <AnimatePresence>
        {editingArticle !== undefined && (
          <ArticleEditor
            article={editingArticle}
            onClose={() => setEditingArticle(undefined)}
            onSave={handleSaveArticle}
          />
        )}
      </AnimatePresence>
    </>
  )
}
