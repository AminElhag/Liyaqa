// ==================== ENUMS ====================

export type CampaignType =
  | 'WELCOME_SEQUENCE'
  | 'EXPIRY_REMINDER'
  | 'WIN_BACK'
  | 'BIRTHDAY'
  | 'INACTIVITY_ALERT'
  | 'PAYMENT_FOLLOWUP'
  | 'CUSTOM';

export type TriggerType =
  | 'MEMBER_CREATED'
  | 'DAYS_BEFORE_EXPIRY'
  | 'DAYS_AFTER_EXPIRY'
  | 'BIRTHDAY'
  | 'DAYS_INACTIVE'
  | 'PAYMENT_FAILED'
  | 'MANUAL';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'UNSUBSCRIBED';

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';

export type SegmentType = 'DYNAMIC' | 'STATIC';

export type MarketingChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

// ==================== CAMPAIGN TYPES ====================

export interface TriggerConfig {
  days?: number;
  time?: string;
  excludeWeekends?: boolean;
  planIds?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  triggerType: TriggerType;
  triggerConfig?: TriggerConfig;
  segmentId?: string;
  startDate?: string;
  endDate?: string;
  totalEnrolled: number;
  totalCompleted: number;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStep {
  id: string;
  campaignId: string;
  stepNumber: number;
  name: string;
  channel: MarketingChannel;
  subjectEn?: string;
  subjectAr?: string;
  bodyEn: string;
  bodyAr: string;
  delayDays: number;
  delayHours: number;
  isAbTest: boolean;
  abVariant?: string;
  abSplitPercentage?: number;
  isActive: boolean;
  createdAt: string;
}

export interface CampaignDetail {
  campaign: Campaign;
  steps: CampaignStep[];
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  campaignType: CampaignType;
  triggerType: TriggerType;
  triggerConfig?: TriggerConfig;
  segmentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  triggerConfig?: TriggerConfig;
  segmentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateCampaignStepRequest {
  name: string;
  channel: MarketingChannel;
  subjectEn?: string;
  subjectAr?: string;
  bodyEn: string;
  bodyAr: string;
  delayDays?: number;
  delayHours?: number;
  isAbTest?: boolean;
  abVariant?: string;
  abSplitPercentage?: number;
}

export interface UpdateCampaignStepRequest {
  name?: string;
  channel?: MarketingChannel;
  subjectEn?: string;
  subjectAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  delayDays?: number;
  delayHours?: number;
}

// ==================== SEGMENT TYPES ====================

export interface SegmentCriteria {
  memberStatuses?: string[];
  subscriptionStatuses?: string[];
  planIds?: string[];
  inactiveDays?: number;
  joinedAfterDays?: number;
  expiringWithinDays?: number;
  expiredWithinDays?: number;
  hasActiveSubscription?: boolean;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  tags?: string[];
  excludeMemberIds?: string[];
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  segmentType: SegmentType;
  criteria?: SegmentCriteria;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSegmentRequest {
  name: string;
  description?: string;
  segmentType: SegmentType;
  criteria?: SegmentCriteria;
}

export interface UpdateSegmentRequest {
  name?: string;
  description?: string;
  criteria?: SegmentCriteria;
}

export interface MemberPreview {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: string;
}

// ==================== ENROLLMENT TYPES ====================

export interface Enrollment {
  id: string;
  campaignId: string;
  memberId: string;
  status: EnrollmentStatus;
  currentStep: number;
  enrolledAt: string;
  completedAt?: string;
  cancelledAt?: string;
  nextStepDueAt?: string;
  abGroup?: string;
}

// ==================== MESSAGE LOG TYPES ====================

export interface MessageLog {
  id: string;
  campaignId: string;
  stepId: string;
  memberId: string;
  channel: MarketingChannel;
  status: MessageStatus;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

// ==================== ANALYTICS TYPES ====================

export interface MarketingOverview {
  activeCampaigns: number;
  draftCampaigns: number;
  pausedCampaigns: number;
  messagesSentLast30Days: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  totalEnrolled: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  totalMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  openedMessages: number;
  clickedMessages: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface AbTestVariant {
  variant: string;
  stepId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface AbTestResult {
  stepNumber: number;
  stepName: string;
  variants: AbTestVariant[];
  winner?: string;
}

export interface TimelineDataPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

// ==================== UI LABELS ====================

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, { en: string; ar: string }> = {
  WELCOME_SEQUENCE: { en: 'Welcome Sequence', ar: 'رسائل الترحيب' },
  EXPIRY_REMINDER: { en: 'Expiry Reminder', ar: 'تذكير بانتهاء الاشتراك' },
  WIN_BACK: { en: 'Win Back', ar: 'استعادة العملاء' },
  BIRTHDAY: { en: 'Birthday', ar: 'عيد الميلاد' },
  INACTIVITY_ALERT: { en: 'Inactivity Alert', ar: 'تنبيه عدم النشاط' },
  PAYMENT_FOLLOWUP: { en: 'Payment Follow-up', ar: 'متابعة الدفع' },
  CUSTOM: { en: 'Custom', ar: 'مخصص' },
};

export const TRIGGER_TYPE_LABELS: Record<TriggerType, { en: string; ar: string }> = {
  MEMBER_CREATED: { en: 'Member Created', ar: 'إنشاء عضو' },
  DAYS_BEFORE_EXPIRY: { en: 'Days Before Expiry', ar: 'أيام قبل الانتهاء' },
  DAYS_AFTER_EXPIRY: { en: 'Days After Expiry', ar: 'أيام بعد الانتهاء' },
  BIRTHDAY: { en: 'Birthday', ar: 'عيد الميلاد' },
  DAYS_INACTIVE: { en: 'Days Inactive', ar: 'أيام عدم النشاط' },
  PAYMENT_FAILED: { en: 'Payment Failed', ar: 'فشل الدفع' },
  MANUAL: { en: 'Manual', ar: 'يدوي' },
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, { en: string; ar: string; color: string }> = {
  DRAFT: { en: 'Draft', ar: 'مسودة', color: 'gray' },
  ACTIVE: { en: 'Active', ar: 'نشط', color: 'green' },
  PAUSED: { en: 'Paused', ar: 'متوقف', color: 'yellow' },
  COMPLETED: { en: 'Completed', ar: 'مكتمل', color: 'blue' },
  ARCHIVED: { en: 'Archived', ar: 'مؤرشف', color: 'gray' },
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, { en: string; ar: string; color: string }> = {
  ACTIVE: { en: 'Active', ar: 'نشط', color: 'green' },
  COMPLETED: { en: 'Completed', ar: 'مكتمل', color: 'blue' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغى', color: 'red' },
  UNSUBSCRIBED: { en: 'Unsubscribed', ar: 'إلغاء الاشتراك', color: 'gray' },
};

export const SEGMENT_TYPE_LABELS: Record<SegmentType, { en: string; ar: string }> = {
  DYNAMIC: { en: 'Dynamic', ar: 'ديناميكي' },
  STATIC: { en: 'Static', ar: 'ثابت' },
};

export const CHANNEL_LABELS: Record<MarketingChannel, { en: string; ar: string }> = {
  EMAIL: { en: 'Email', ar: 'البريد الإلكتروني' },
  SMS: { en: 'SMS', ar: 'رسالة نصية' },
  WHATSAPP: { en: 'WhatsApp', ar: 'واتساب' },
  PUSH: { en: 'Push Notification', ar: 'إشعار فوري' },
};
