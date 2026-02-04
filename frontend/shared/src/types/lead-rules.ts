// Scoring trigger types (match backend enums)
export type ScoringTriggerType = "SOURCE" | "ACTIVITY" | "ENGAGEMENT" | "ATTRIBUTE";

// Assignment rule types
export type AssignmentRuleType = "ROUND_ROBIN" | "LOCATION_BASED" | "SOURCE_BASED" | "MANUAL";

// Lead source values (for SOURCE trigger type)
export type LeadSource =
  | "REFERRAL"
  | "WALK_IN"
  | "SOCIAL_MEDIA"
  | "PAID_ADS"
  | "WEBSITE"
  | "PHONE_CALL"
  | "EMAIL"
  | "PARTNER"
  | "EVENT"
  | "OTHER";

// Lead activity types (for ACTIVITY trigger type)
export type LeadActivityType =
  | "CALL"
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "MEETING"
  | "TOUR"
  | "NOTE"
  | "STATUS_CHANGE"
  | "ASSIGNMENT"
  | "FOLLOW_UP_SCHEDULED"
  | "FOLLOW_UP_COMPLETED";

// ===== Scoring Rules =====

export interface ScoringRule {
  id: string;
  name: string;
  triggerType: ScoringTriggerType;
  triggerValue: string | null;
  scoreChange: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScoringRuleRequest {
  name: string;
  triggerType: ScoringTriggerType;
  triggerValue?: string | null;
  scoreChange: number;
  isActive?: boolean;
}

export interface UpdateScoringRuleRequest {
  name?: string;
  triggerValue?: string | null;
  scoreChange?: number;
  isActive?: boolean;
}

export interface ScoringStats {
  totalRules: number;
  activeRules: number;
  rulesByTriggerType: Record<ScoringTriggerType, number>;
}

// ===== Assignment Rules =====

export interface LocationMapping {
  location: string;
  userId: string;
}

export interface SourceMapping {
  source: string;
  userId: string;
}

export interface AssignmentRuleConfig {
  // For ROUND_ROBIN
  userIds?: string[];
  lastAssignedIndex?: number;

  // For LOCATION_BASED
  locationMappings?: LocationMapping[];

  // For SOURCE_BASED
  sourceMappings?: SourceMapping[];

  // For LOCATION_BASED and SOURCE_BASED
  defaultUserId?: string | null;
}

export interface AssignmentRule {
  id: string;
  name: string;
  ruleType: AssignmentRuleType;
  priority: number;
  isActive: boolean;
  config: AssignmentRuleConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentRuleConfigRequest {
  userIds?: string[];
  locationMappings?: { location: string; userId: string }[];
  sourceMappings?: { source: string; userId: string }[];
  defaultUserId?: string | null;
}

export interface CreateAssignmentRuleRequest {
  name: string;
  ruleType: AssignmentRuleType;
  priority?: number;
  isActive?: boolean;
  config: AssignmentRuleConfigRequest;
}

export interface UpdateAssignmentRuleRequest {
  name?: string;
  priority?: number;
  isActive?: boolean;
  config?: AssignmentRuleConfigRequest;
}

export interface AssignmentStats {
  totalRules: number;
  activeRules: number;
  rulesByType: Record<AssignmentRuleType, number>;
}

// ===== Constants for UI =====

export const TRIGGER_TYPE_LABELS: Record<ScoringTriggerType, { en: string; ar: string }> = {
  SOURCE: { en: "Source", ar: "المصدر" },
  ACTIVITY: { en: "Activity", ar: "النشاط" },
  ENGAGEMENT: { en: "Engagement", ar: "التفاعل" },
  ATTRIBUTE: { en: "Attribute", ar: "السمة" },
};

export const ASSIGNMENT_TYPE_LABELS: Record<AssignmentRuleType, { en: string; ar: string }> = {
  ROUND_ROBIN: { en: "Round Robin", ar: "التوزيع الدوري" },
  LOCATION_BASED: { en: "Location Based", ar: "حسب الموقع" },
  SOURCE_BASED: { en: "Source Based", ar: "حسب المصدر" },
  MANUAL: { en: "Manual", ar: "يدوي" },
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, { en: string; ar: string }> = {
  REFERRAL: { en: "Referral", ar: "إحالة" },
  WALK_IN: { en: "Walk-in", ar: "حضور شخصي" },
  SOCIAL_MEDIA: { en: "Social Media", ar: "وسائل التواصل" },
  PAID_ADS: { en: "Paid Ads", ar: "إعلانات مدفوعة" },
  WEBSITE: { en: "Website", ar: "الموقع الإلكتروني" },
  PHONE_CALL: { en: "Phone Call", ar: "مكالمة هاتفية" },
  EMAIL: { en: "Email", ar: "بريد إلكتروني" },
  PARTNER: { en: "Partner", ar: "شريك" },
  EVENT: { en: "Event", ar: "حدث" },
  OTHER: { en: "Other", ar: "أخرى" },
};

export const LEAD_ACTIVITY_LABELS: Record<LeadActivityType, { en: string; ar: string }> = {
  CALL: { en: "Call", ar: "مكالمة" },
  EMAIL: { en: "Email", ar: "بريد إلكتروني" },
  SMS: { en: "SMS", ar: "رسالة نصية" },
  WHATSAPP: { en: "WhatsApp", ar: "واتساب" },
  MEETING: { en: "Meeting", ar: "اجتماع" },
  TOUR: { en: "Tour", ar: "جولة" },
  NOTE: { en: "Note", ar: "ملاحظة" },
  STATUS_CHANGE: { en: "Status Change", ar: "تغيير الحالة" },
  ASSIGNMENT: { en: "Assignment", ar: "تعيين" },
  FOLLOW_UP_SCHEDULED: { en: "Follow-up Scheduled", ar: "متابعة مجدولة" },
  FOLLOW_UP_COMPLETED: { en: "Follow-up Completed", ar: "متابعة مكتملة" },
};
