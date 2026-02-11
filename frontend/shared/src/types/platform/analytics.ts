// --- Churn Analysis ---

export interface AtRiskTenant {
  tenantId: string;
  name: string;
  riskScore: number;
  riskFactors: string[];
}

export interface ChurnReasonEntry {
  reason: string;
  count: number;
  percentage: number;
}

export interface ChurnByPlanEntry {
  planName: string;
  churnRate: number;
}

export interface ChurnAnalysisResponse {
  churnRate30d: number;
  churnRate90d: number;
  churnRateYTD: number;
  atRiskTenants: AtRiskTenant[];
  churnReasons: ChurnReasonEntry[];
  churnByPlan: ChurnByPlanEntry[];
}

// --- Feature Adoption ---

export interface FeatureAdoptionEntry {
  featureKey: string;
  name: string;
  adoptionRate: number;
  activeTenantsUsing: number;
  totalAvailable: number;
  trend: string;
}

export interface FeatureAdoptionResponse {
  features: FeatureAdoptionEntry[];
}

// --- Comparative / Platform Metrics ---

export interface ComparativeResponse {
  averageMembersPerFacility: number;
  medianMembersPerFacility: number;
  averageMonthlyRevenue: number;
  averageStaffCount: number;
  topFeaturesByUsage: FeatureAdoptionEntry[];
  averageLoginFrequency: number;
}

// --- Export ---

export type ReportType = "REVENUE" | "CHURN" | "GROWTH" | "FULL";
export type ExportFormat = "PDF" | "CSV";
