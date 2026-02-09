import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/features/analytics/pages/DashboardPage'))
const DealsPage = lazy(() => import('@/features/deals/pages/DealsPage'))
const TenantsPage = lazy(() => import('@/features/tenants/pages/TenantsPage'))
const TenantDetailPage = lazy(() => import('@/features/tenants/pages/TenantDetailPage'))
const OnboardingPage = lazy(() => import('@/features/tenants/pages/OnboardingPage'))
const SubscriptionsPage = lazy(() => import('@/features/subscriptions/pages/SubscriptionsPage'))
const PlansPage = lazy(() => import('@/features/subscriptions/pages/PlansPage'))
const InvoicesPage = lazy(() => import('@/features/subscriptions/pages/InvoicesPage'))
const TicketsPage = lazy(() => import('@/features/tickets/pages/TicketsPage'))
const TicketDetailPage = lazy(() => import('@/features/tickets/pages/TicketDetailPage'))
const HealthPage = lazy(() => import('@/features/monitoring/pages/HealthPage'))
const AuditLogPage = lazy(() => import('@/features/monitoring/pages/AuditLogPage'))
const SystemStatusPage = lazy(() => import('@/features/monitoring/pages/SystemStatusPage'))
const AnnouncementsPage = lazy(() => import('@/features/communication/pages/AnnouncementsPage'))
const NotificationsPage = lazy(() => import('@/features/communication/pages/NotificationsPage'))
const TeamPage = lazy(() => import('@/features/access/pages/TeamPage'))
const ApiKeysPage = lazy(() => import('@/features/access/pages/ApiKeysPage'))
const ConfigPage = lazy(() => import('@/features/config/pages/ConfigPage'))
const FeatureFlagsPage = lazy(() => import('@/features/config/pages/FeatureFlagsPage'))
const TemplatesPage = lazy(() => import('@/features/config/pages/TemplatesPage'))
const CompliancePage = lazy(() => import('@/features/compliance/pages/CompliancePage'))
const KnowledgeBasePage = lazy(() => import('@/features/content/pages/KnowledgeBasePage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const DesignSystemPage = lazy(() => import('@/features/content/pages/DesignSystemPage'))

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-brand-accent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/tenants/:id" element={<TenantDetailPage />} />
              <Route path="/tenants/:id/onboarding" element={<OnboardingPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/subscriptions/plans" element={<PlansPage />} />
              <Route path="/billing/invoices" element={<InvoicesPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/monitoring/health" element={<HealthPage />} />
              <Route path="/monitoring/audit" element={<AuditLogPage />} />
              <Route path="/monitoring/system" element={<SystemStatusPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings/team" element={<TeamPage />} />
              <Route path="/settings/api-keys" element={<ApiKeysPage />} />
              <Route path="/settings/config" element={<ConfigPage />} />
              <Route path="/settings/feature-flags" element={<FeatureFlagsPage />} />
              <Route path="/settings/templates" element={<TemplatesPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/design-system" element={<DesignSystemPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
