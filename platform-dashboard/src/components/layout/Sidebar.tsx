import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelLeftClose, PanelLeftOpen, Sun, Moon, Languages, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navigation } from '@/lib/navigation'
import { useSidebarStore } from '@/stores/sidebar-store'
import { useThemeContext } from '@/hooks/use-theme-context'
import { useDirectionContext } from '@/hooks/use-direction-context'
import { useAuthStore } from '@/stores/auth-store'

function SidebarContent() {
  const { t } = useTranslation()
  const { collapsed } = useSidebarStore()
  const { theme, toggleTheme } = useThemeContext()
  const { isRtl, toggleDirection } = useDirectionContext()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-sm font-bold text-bg-inverse">
          L
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden whitespace-nowrap text-lg font-bold text-foreground"
            >
              Liyaqa
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navigation.map((group) => (
          <div key={group.section} className="mb-4">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {group.section}
                </motion.div>
              )}
            </AnimatePresence>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? t(item.i18nKey, item.label) : undefined}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? cn(
                          'bg-brand-accent/10 text-brand-accent',
                          isRtl ? 'border-e-[3px] border-brand-accent' : 'border-s-[3px] border-brand-accent',
                        )
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2',
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {t(item.i18nKey, item.label)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-3 space-y-2">
        {/* Toggle buttons */}
        <div className={cn('flex gap-1', collapsed ? 'flex-col items-center' : 'items-center')}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t('common.lightMode', 'Light Mode') : t('common.darkMode', 'Dark Mode')}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={toggleDirection}
            title={t('common.language', 'Language')}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Languages className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-bg-inverse">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="min-w-0 overflow-hidden"
                >
                  <div className="truncate text-sm font-medium text-foreground">{user.displayName}</div>
                  <div className="truncate text-xs text-muted-foreground">{user.role}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebarStore()

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="relative hidden h-screen border-e border-border bg-card md:block"
      >
        <SidebarContent />

        {/* Collapse toggle button */}
        <button
          onClick={toggle}
          className="absolute -end-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed inset-y-0 start-0 z-50 w-72 border-e border-border bg-card md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute end-3 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
