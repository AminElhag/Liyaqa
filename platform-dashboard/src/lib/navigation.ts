import {
  LayoutDashboard,
  Handshake,
  Building2,
  CreditCard,
  FileText,
  LifeBuoy,
  Activity,
  ScrollText,
  Server,
  Megaphone,
  Users,
  Key,
  Settings,
  ToggleLeft,
  FileCode,
  Shield,
  BookOpen,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  i18nKey: string
  path: string
  icon: LucideIcon
}

export interface NavGroup {
  section: string
  i18nKey: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    section: 'OVERVIEW',
    i18nKey: 'nav.dashboard',
    items: [
      { label: 'Dashboard', i18nKey: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', i18nKey: 'nav.analytics', path: '/analytics', icon: BarChart3 },
    ],
  },
  {
    section: 'SALES',
    i18nKey: 'nav.deals',
    items: [
      { label: 'Deals', i18nKey: 'nav.deals', path: '/deals', icon: Handshake },
    ],
  },
  {
    section: 'TENANTS',
    i18nKey: 'nav.tenants',
    items: [
      { label: 'Tenants', i18nKey: 'nav.tenants', path: '/tenants', icon: Building2 },
    ],
  },
  {
    section: 'BILLING',
    i18nKey: 'nav.subscriptions',
    items: [
      { label: 'Subscriptions', i18nKey: 'nav.subscriptions', path: '/subscriptions', icon: CreditCard },
      { label: 'Invoices', i18nKey: 'nav.invoices', path: '/billing/invoices', icon: FileText },
    ],
  },
  {
    section: 'SUPPORT',
    i18nKey: 'nav.tickets',
    items: [
      { label: 'Tickets', i18nKey: 'nav.tickets', path: '/tickets', icon: LifeBuoy },
    ],
  },
  {
    section: 'MONITORING',
    i18nKey: 'nav.monitoring',
    items: [
      { label: 'Health', i18nKey: 'nav.health', path: '/monitoring/health', icon: Activity },
      { label: 'Audit Log', i18nKey: 'nav.auditLog', path: '/monitoring/audit', icon: ScrollText },
      { label: 'System Status', i18nKey: 'nav.systemStatus', path: '/monitoring/system', icon: Server },
    ],
  },
  {
    section: 'COMMUNICATION',
    i18nKey: 'nav.communication',
    items: [
      { label: 'Announcements', i18nKey: 'nav.announcements', path: '/announcements', icon: Megaphone },
    ],
  },
  {
    section: 'SETTINGS',
    i18nKey: 'nav.settings',
    items: [
      { label: 'Team', i18nKey: 'nav.team', path: '/settings/team', icon: Users },
      { label: 'API Keys', i18nKey: 'nav.apiKeys', path: '/settings/api-keys', icon: Key },
      { label: 'Config', i18nKey: 'nav.config', path: '/settings/config', icon: Settings },
      { label: 'Feature Flags', i18nKey: 'nav.featureFlags', path: '/settings/feature-flags', icon: ToggleLeft },
      { label: 'Templates', i18nKey: 'nav.templates', path: '/settings/templates', icon: FileCode },
      { label: 'Compliance', i18nKey: 'nav.compliance', path: '/compliance', icon: Shield },
      { label: 'Knowledge Base', i18nKey: 'nav.knowledgeBase', path: '/knowledge-base', icon: BookOpen },
    ],
  },
]
