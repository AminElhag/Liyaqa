import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const routeTitles: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/deals': 'nav.deals',
  '/tenants': 'nav.tenants',
  '/subscriptions': 'nav.subscriptions',
  '/subscriptions/plans': 'nav.subscriptions',
  '/billing/invoices': 'nav.invoices',
  '/tickets': 'nav.tickets',
  '/monitoring/health': 'nav.health',
  '/monitoring/audit': 'nav.auditLog',
  '/monitoring/system': 'nav.systemStatus',
  '/announcements': 'nav.announcements',
  '/notifications': 'nav.communication',
  '/settings/team': 'nav.team',
  '/settings/api-keys': 'nav.apiKeys',
  '/settings/config': 'nav.config',
  '/settings/feature-flags': 'nav.featureFlags',
  '/settings/templates': 'nav.templates',
  '/compliance': 'nav.compliance',
  '/knowledge-base': 'nav.knowledgeBase',
  '/analytics': 'nav.analytics',
  '/design-system': 'nav.content',
}

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { t } = useTranslation()

  useEffect(() => {
    const titleKey = routeTitles[location.pathname]
    const pageTitle = titleKey ? t(titleKey) : 'Liyaqa'
    document.title = `${pageTitle} — Liyaqa Platform`
  }, [location.pathname, t])

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
