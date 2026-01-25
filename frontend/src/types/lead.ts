export type LeadStatus = 'NEW' | 'CONTACTED' | 'TOUR_SCHEDULED' | 'TRIAL' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadSource = 'REFERRAL' | 'WALK_IN' | 'SOCIAL_MEDIA' | 'PAID_ADS' | 'WEBSITE' | 'PHONE_CALL' | 'EMAIL' | 'PARTNER' | 'EVENT' | 'OTHER';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type LeadActivityType = 'CALL' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'MEETING' | 'TOUR' | 'NOTE' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'FOLLOW_UP_SCHEDULED' | 'FOLLOW_UP_COMPLETED';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  assignedToUserId?: string;
  notes?: string;
  priority?: LeadPriority;
  score: number;
  contactedAt?: string;
  tourScheduledAt?: string;
  trialStartedAt?: string;
  negotiationStartedAt?: string;
  wonAt?: string;
  lostAt?: string;
  lossReason?: string;
  expectedConversionDate?: string;
  convertedMemberId?: string;
  campaignSource?: string;
  campaignMedium?: string;
  campaignName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  notes?: string;
  performedByUserId?: string;
  contactMethod?: string;
  outcome?: string;
  followUpDate?: string;
  followUpCompleted: boolean;
  durationMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  source: LeadSource;
  assignedToUserId?: string;
  notes?: string;
  priority?: LeadPriority;
  expectedConversionDate?: string;
  campaignSource?: string;
  campaignMedium?: string;
  campaignName?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  assignedToUserId?: string;
  notes?: string;
  priority?: LeadPriority;
  expectedConversionDate?: string;
}

export interface TransitionStatusRequest {
  status: LeadStatus;
  reason?: string;
  memberId?: string;
}

export interface AssignLeadRequest {
  assignToUserId?: string;
}

export interface BulkAssignRequest {
  leadIds: string[];
  assignToUserId: string;
}

export interface ConvertLeadRequest {
  memberId: string;
}

export interface LogActivityRequest {
  type: LeadActivityType;
  notes?: string;
  contactMethod?: string;
  outcome?: string;
  followUpDate?: string;
  durationMinutes?: number;
}

export interface CompleteFollowUpRequest {
  outcome?: string;
  notes?: string;
}

export interface PipelineStats {
  byStatus: Record<LeadStatus, number>;
  total: number;
  active: number;
  conversionRate: number;
}

export interface SourceStats {
  bySource: Record<LeadSource, number>;
  total: number;
}

export interface ActivityStats {
  totalActivities: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  byType: Record<LeadActivityType, number>;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, { en: string; ar: string }> = {
  NEW: { en: 'New', ar: 'جديد' },
  CONTACTED: { en: 'Contacted', ar: 'تم التواصل' },
  TOUR_SCHEDULED: { en: 'Tour Scheduled', ar: 'جولة مجدولة' },
  TRIAL: { en: 'Trial', ar: 'تجربة' },
  NEGOTIATION: { en: 'Negotiation', ar: 'تفاوض' },
  WON: { en: 'Won', ar: 'مكتسب' },
  LOST: { en: 'Lost', ar: 'مفقود' },
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, { en: string; ar: string }> = {
  REFERRAL: { en: 'Referral', ar: 'إحالة' },
  WALK_IN: { en: 'Walk-in', ar: 'زيارة مباشرة' },
  SOCIAL_MEDIA: { en: 'Social Media', ar: 'وسائل التواصل' },
  PAID_ADS: { en: 'Paid Ads', ar: 'إعلانات مدفوعة' },
  WEBSITE: { en: 'Website', ar: 'الموقع الإلكتروني' },
  PHONE_CALL: { en: 'Phone Call', ar: 'مكالمة هاتفية' },
  EMAIL: { en: 'Email', ar: 'بريد إلكتروني' },
  PARTNER: { en: 'Partner', ar: 'شريك' },
  EVENT: { en: 'Event', ar: 'حدث' },
  OTHER: { en: 'Other', ar: 'أخرى' },
};

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, { en: string; ar: string }> = {
  LOW: { en: 'Low', ar: 'منخفض' },
  MEDIUM: { en: 'Medium', ar: 'متوسط' },
  HIGH: { en: 'High', ar: 'عالي' },
  URGENT: { en: 'Urgent', ar: 'عاجل' },
};

export const LEAD_ACTIVITY_TYPE_LABELS: Record<LeadActivityType, { en: string; ar: string }> = {
  CALL: { en: 'Phone Call', ar: 'مكالمة هاتفية' },
  EMAIL: { en: 'Email', ar: 'بريد إلكتروني' },
  SMS: { en: 'SMS', ar: 'رسالة نصية' },
  WHATSAPP: { en: 'WhatsApp', ar: 'واتساب' },
  MEETING: { en: 'Meeting', ar: 'اجتماع' },
  TOUR: { en: 'Tour', ar: 'جولة' },
  NOTE: { en: 'Note', ar: 'ملاحظة' },
  STATUS_CHANGE: { en: 'Status Change', ar: 'تغيير الحالة' },
  ASSIGNMENT: { en: 'Assignment', ar: 'تعيين' },
  FOLLOW_UP_SCHEDULED: { en: 'Follow-up Scheduled', ar: 'متابعة مجدولة' },
  FOLLOW_UP_COMPLETED: { en: 'Follow-up Completed', ar: 'متابعة مكتملة' },
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  TOUR_SCHEDULED: 'bg-yellow-100 text-yellow-800',
  TRIAL: 'bg-orange-100 text-orange-800',
  NEGOTIATION: 'bg-indigo-100 text-indigo-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
};

export const LEAD_PRIORITY_COLORS: Record<LeadPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};
