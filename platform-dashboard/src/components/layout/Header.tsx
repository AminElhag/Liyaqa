import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Menu, ChevronRight, LogOut, User, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'
import { useAuthStore } from '@/stores/auth-store'
import { NotificationCenter } from './NotificationCenter'

const routeLabels: Record<string, string> = {
  dashboard: 'nav.dashboard',
  deals: 'nav.deals',
  tenants: 'nav.tenants',
  subscriptions: 'nav.subscriptions',
  billing: 'nav.subscriptions',
  invoices: 'nav.invoices',
  tickets: 'nav.tickets',
  monitoring: 'nav.monitoring',
  health: 'nav.health',
  audit: 'nav.auditLog',
  system: 'nav.systemStatus',
  announcements: 'nav.announcements',
  notifications: 'nav.communication',
  settings: 'nav.settings',
  team: 'nav.team',
  'api-keys': 'nav.apiKeys',
  config: 'nav.config',
  'feature-flags': 'nav.featureFlags',
  templates: 'nav.templates',
  compliance: 'nav.compliance',
  'knowledge-base': 'nav.knowledgeBase',
  analytics: 'nav.analytics',
  'design-system': 'nav.content',
  onboarding: 'nav.tenants',
}

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const { setMobileOpen } = useSidebarStore()
  const { user, logout } = useAuthStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/')
    const i18nKey = routeLabels[segment]
    const label = i18nKey ? t(i18nKey, segment) : segment
    return { label, path }
  })

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground md:hidden"
        aria-label={t('common.menu', 'Open menu')}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="text-muted-foreground hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="ms-auto flex items-center gap-2">
        {/* Search trigger */}
        <button
          aria-label={t('common.search', 'Search')}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('common.search', 'Search...')}</span>
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-xs font-medium sm:inline">
            {navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl+'}K
          </kbd>
        </button>

        {/* Notification center */}
        <NotificationCenter />

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label={t('common.userMenu', 'User menu')}
            aria-expanded={userMenuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-bg-inverse transition-opacity hover:opacity-90"
          >
            {user?.displayName.en.charAt(0).toUpperCase() ?? 'U'}
          </button>

          {userMenuOpen && (
            <div className={cn(
              'absolute end-0 top-full mt-2 w-48 rounded-lg border border-border bg-card py-1 shadow-lg',
            )}>
              <div className="border-b border-border px-3 py-2">
                <div className="text-sm font-medium text-foreground">{user?.displayName.en ?? 'User'}</div>
                <div className="text-xs text-muted-foreground">{user?.email ?? ''}</div>
              </div>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <User className="h-4 w-4" />
                Profile
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <Settings className="h-4 w-4" />
                Preferences
              </button>
              <div className="border-t border-border" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                {t('nav.logout', 'Logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
