// Platform Query Hooks - Export barrel
export * from "./use-deals";
export * from "./use-platform-clients";
export * from "./use-client-plans";
// Client subscriptions — useExpiringSubscriptions already exported from ./use-platform-dashboard
export {
  clientSubscriptionKeys,
  useClientSubscriptions,
  useSubscriptionsByOrganization,
  useClientSubscription,
  useSubscriptionStats,
  useCreateClientSubscription,
  useUpdateClientSubscription,
  useActivateClientSubscription,
  useSuspendClientSubscription,
  useCancelClientSubscription,
  useChangeSubscriptionPlan,
  useRenewSubscription,
  useTenantSubscription,
  useSubscribeTenant,
  useChangeTenantPlan,
  useCancelTenantSubscription,
  useRenewTenantSubscription,
} from "./use-client-subscriptions";
export * from "./use-client-invoices";
export * from "./use-client-notes";
export * from "./use-client-audit";
export * from "./use-club-detail";
export * from "./use-club-agreements";
export * from "./use-platform-dashboard";
export * from "./use-platform-support";
export * from "./use-support-tickets";
export * from "./use-platform-users";
export * from "./use-onboarding";
export * from "./use-health";
export * from "./use-alerts";
export * from "./use-dunning";
export * from "./use-analytics";
export * from "./use-announcements";
export * from "./use-knowledge-base";
export * from "./use-feature-flags";
export * from "./use-templates";
// Tenants — useCompleteOnboardingStep already exported from ./use-onboarding
export {
  tenantKeys,
  useTenants,
  useTenantById,
  useProvisionTenant,
  useUpdateTenant,
  useChangeTenantStatus,
  useSuspendTenant,
  useDeactivateTenant,
  useArchiveTenant,
  useOnboardingChecklist,
  useDataExports,
  useRequestDataExport,
  useDeactivationHistory,
} from "./use-tenants";
export * from "./use-billing";
// Impersonation — useActiveSessions, useEndImpersonation, useForceEndSession already exported from ./use-platform-support
export {
  impersonationKeys,
  useSessionHistory,
  useStartImpersonation,
} from "./use-impersonation";
export * from "./use-facility-monitoring";
export * from "./use-ticket-analytics";
