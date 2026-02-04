// Platform dashboard components (legacy)
export { SummaryCards } from "./summary-cards";
export { RevenueChart } from "./revenue-chart";
export { DealPipelineStats } from "./deal-pipeline-stats";
export { ClientGrowthChart } from "./client-growth-chart";
export { TopClientsTable } from "./top-clients-table";
export { RecentActivityFeed } from "./recent-activity-feed";
export { HealthIndicators } from "./health-indicators";

// New premium dashboard components
export { PlatformHeroStats, PlatformHeroStatsSkeleton } from "./platform-hero-stats";
export { PlatformRevenueDashboard, PlatformRevenueDashboardSkeleton } from "./platform-revenue-dashboard";
export { DealPipelinePreview, DealPipelinePreviewSkeleton } from "./deal-pipeline-preview";
export { ClientHealthMatrix, ClientHealthMatrixSkeleton } from "./client-health-matrix";
export { TopClientsLeaderboard, TopClientsLeaderboardSkeleton } from "./top-clients-leaderboard";
export { PlatformActivityFeed, PlatformActivityFeedSkeleton } from "./platform-activity-feed";

// Command palette and notifications
export { PlatformCommandPalette, useCommandPalette } from "./platform-command-palette";
export {
  PlatformNotificationCenter,
  demoNotifications,
  type PlatformNotification,
} from "./platform-notification-center";

// Role-based dashboards
export { AdminDashboard, SalesDashboard, SupportDashboard } from "./role-dashboards";

// Dashboard utilities
export { DashboardExportMenu } from "./dashboard-export-menu";
export { DateRangePicker, type DateRange } from "./date-range-picker";

// Convert deal wizard components
export { WizardStepper, type WizardStep } from "./wizard-stepper";
export { ConvertDealWizard } from "./convert-deal-wizard";
export {
  OrganizationStep,
  ClubStep,
  AdminStep,
  SubscriptionStep,
  ReviewStep,
  convertDealSchema,
  STEP_REQUIRED_FIELDS,
  WIZARD_STEPS,
  type ConvertDealFormValues,
  type StepConfig,
} from "./convert-deal-steps";

// Client onboarding wizard components
export { ClientOnboardingWizard } from "./client-onboarding-wizard";
export {
  OrganizationStep as OnboardingOrganizationStep,
  ClubStep as OnboardingClubStep,
  AdminStep as OnboardingAdminStep,
  SubscriptionStep as OnboardingSubscriptionStep,
  ReviewStep as OnboardingReviewStep,
  onboardingSchema,
  STEP_REQUIRED_FIELDS as ONBOARDING_STEP_REQUIRED_FIELDS,
  WIZARD_STEPS as ONBOARDING_WIZARD_STEPS,
  type OnboardingFormValues,
  type StepConfig as OnboardingStepConfig,
} from "./client-onboarding-steps";
