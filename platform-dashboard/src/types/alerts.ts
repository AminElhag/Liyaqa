import type { UUID } from "./api";

/**
 * Alert severity levels
 */
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";

/**
 * Alert status
 */
export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";

/**
 * Alert types
 */
export type AlertType =
  | "USAGE_LIMIT_WARNING"
  | "USAGE_LIMIT_CRITICAL"
  | "PAYMENT_FAILED"
  | "TRIAL_ENDING"
  | "CHURN_RISK"
  | "INACTIVITY_WARNING"
  | "MILESTONE_REACHED"
  | "ONBOARDING_STALLED"
  | "SUBSCRIPTION_EXPIRING"
  | "HEALTH_SCORE_DROP"
  | "NEW_CONVERSION"
  | "UPGRADE_COMPLETED"
  | "MEMBER_MILESTONE";

/**
 * Platform alert
 */
export interface PlatformAlert {
  id: UUID;
  organizationId: UUID;
  organizationNameEn?: string;
  organizationNameAr?: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  actionUrl?: string;
  actionLabel?: string;
  actionLabelAr?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: UUID;
  resolvedAt?: string;
  resolvedBy?: UUID;
}

/**
 * Alert statistics
 */
export interface AlertStatistics {
  totalActive: number;
  unacknowledged: number;
  critical: number;
  warning: number;
  info: number;
  success: number;
  resolvedToday: number;
  averageResolutionTime: number; // in hours
}

/**
 * Alert filter parameters
 */
export interface AlertFilters {
  severity?: AlertSeverity[];
  type?: AlertType[];
  status?: AlertStatus[];
  organizationId?: UUID;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Playbook action type
 */
export type PlaybookActionType =
  | "SEND_EMAIL"
  | "SEND_SMS"
  | "SCHEDULE_CALL"
  | "CREATE_TICKET"
  | "SHOW_UPGRADE_OPTIONS"
  | "VIEW_DETAILS"
  | "ASSIGN_CSM"
  | "SEND_PAYMENT_LINK"
  | "OFFER_DISCOUNT"
  | "SEND_TIPS";

/**
 * Playbook action
 */
export interface PlaybookAction {
  type: PlaybookActionType;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  isPrimary: boolean;
  actionUrl?: string;
}

/**
 * Alert playbook
 */
export interface AlertPlaybook {
  alertType: AlertType;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  recommendedActions: PlaybookAction[];
}

/**
 * Alert playbook configurations
 */
export const ALERT_PLAYBOOKS: Record<AlertType, AlertPlaybook> = {
  USAGE_LIMIT_WARNING: {
    alertType: "USAGE_LIMIT_WARNING",
    titleEn: "Usage Limit Warning",
    titleAr: "تحذير حد الاستخدام",
    descriptionEn: "Client is approaching their plan limits",
    descriptionAr: "العميل يقترب من حدود خطته",
    recommendedActions: [
      {
        type: "SHOW_UPGRADE_OPTIONS",
        labelEn: "Show Upgrade Options",
        labelAr: "عرض خيارات الترقية",
        descriptionEn: "Present available upgrade plans with comparison",
        descriptionAr: "عرض خطط الترقية المتاحة مع المقارنة",
        isPrimary: true,
      },
      {
        type: "SCHEDULE_CALL",
        labelEn: "Schedule Call",
        labelAr: "جدولة مكالمة",
        descriptionEn: "Book a call to discuss expansion",
        descriptionAr: "حجز مكالمة لمناقشة التوسع",
        isPrimary: false,
      },
    ],
  },
  USAGE_LIMIT_CRITICAL: {
    alertType: "USAGE_LIMIT_CRITICAL",
    titleEn: "Usage Limit Critical",
    titleAr: "حد الاستخدام حرج",
    descriptionEn: "Client has exceeded their plan limits",
    descriptionAr: "العميل تجاوز حدود خطته",
    recommendedActions: [
      {
        type: "SEND_EMAIL",
        labelEn: "Send Upgrade Reminder",
        labelAr: "إرسال تذكير بالترقية",
        descriptionEn: "Send email with urgent upgrade options",
        descriptionAr: "إرسال بريد إلكتروني مع خيارات الترقية العاجلة",
        isPrimary: true,
      },
      {
        type: "ASSIGN_CSM",
        labelEn: "Assign CSM",
        labelAr: "تعيين مدير نجاح العميل",
        descriptionEn: "Assign a customer success manager",
        descriptionAr: "تعيين مدير لنجاح العميل",
        isPrimary: false,
      },
    ],
  },
  PAYMENT_FAILED: {
    alertType: "PAYMENT_FAILED",
    titleEn: "Payment Failed",
    titleAr: "فشل الدفع",
    descriptionEn: "Client's payment method failed",
    descriptionAr: "فشلت طريقة الدفع للعميل",
    recommendedActions: [
      {
        type: "SEND_PAYMENT_LINK",
        labelEn: "Send Payment Link",
        labelAr: "إرسال رابط الدفع",
        descriptionEn: "Send a direct payment link to update card",
        descriptionAr: "إرسال رابط مباشر لتحديث البطاقة",
        isPrimary: true,
      },
      {
        type: "VIEW_DETAILS",
        labelEn: "View Dunning Timeline",
        labelAr: "عرض جدول المتابعة",
        descriptionEn: "Check the dunning sequence status",
        descriptionAr: "التحقق من حالة تسلسل المتابعة",
        isPrimary: false,
      },
    ],
  },
  TRIAL_ENDING: {
    alertType: "TRIAL_ENDING",
    titleEn: "Trial Ending",
    titleAr: "انتهاء التجربة",
    descriptionEn: "Client's trial period is ending soon",
    descriptionAr: "فترة تجربة العميل تنتهي قريباً",
    recommendedActions: [
      {
        type: "OFFER_DISCOUNT",
        labelEn: "Send Conversion Offer",
        labelAr: "إرسال عرض التحويل",
        descriptionEn: "Send a special offer to convert",
        descriptionAr: "إرسال عرض خاص للتحويل",
        isPrimary: true,
      },
      {
        type: "SCHEDULE_CALL",
        labelEn: "Schedule Demo",
        labelAr: "جدولة عرض توضيحي",
        descriptionEn: "Book a demo to showcase features",
        descriptionAr: "حجز عرض توضيحي لعرض المميزات",
        isPrimary: false,
      },
    ],
  },
  CHURN_RISK: {
    alertType: "CHURN_RISK",
    titleEn: "Churn Risk",
    titleAr: "خطر المغادرة",
    descriptionEn: "Client shows signs of potential churn",
    descriptionAr: "العميل يظهر علامات مغادرة محتملة",
    recommendedActions: [
      {
        type: "ASSIGN_CSM",
        labelEn: "Assign CSM",
        labelAr: "تعيين مدير نجاح العميل",
        descriptionEn: "Assign a dedicated success manager",
        descriptionAr: "تعيين مدير نجاح مخصص",
        isPrimary: true,
      },
      {
        type: "SCHEDULE_CALL",
        labelEn: "Schedule Health Check",
        labelAr: "جدولة فحص صحي",
        descriptionEn: "Book a call to understand concerns",
        descriptionAr: "حجز مكالمة لفهم المخاوف",
        isPrimary: false,
      },
    ],
  },
  INACTIVITY_WARNING: {
    alertType: "INACTIVITY_WARNING",
    titleEn: "Inactivity Warning",
    titleAr: "تحذير عدم النشاط",
    descriptionEn: "Client has been inactive for an extended period",
    descriptionAr: "العميل غير نشط لفترة طويلة",
    recommendedActions: [
      {
        type: "SEND_EMAIL",
        labelEn: "Send Re-engagement Email",
        labelAr: "إرسال بريد إعادة التفاعل",
        descriptionEn: "Send tips and feature highlights",
        descriptionAr: "إرسال نصائح وأبرز المميزات",
        isPrimary: true,
      },
      {
        type: "SEND_TIPS",
        labelEn: "Send Usage Tips",
        labelAr: "إرسال نصائح الاستخدام",
        descriptionEn: "Send helpful tips to increase engagement",
        descriptionAr: "إرسال نصائح مفيدة لزيادة التفاعل",
        isPrimary: false,
      },
    ],
  },
  ONBOARDING_STALLED: {
    alertType: "ONBOARDING_STALLED",
    titleEn: "Onboarding Stalled",
    titleAr: "التأهيل متوقف",
    descriptionEn: "Client has stopped progressing in onboarding",
    descriptionAr: "العميل توقف عن التقدم في التأهيل",
    recommendedActions: [
      {
        type: "SEND_EMAIL",
        labelEn: "Send Reminder",
        labelAr: "إرسال تذكير",
        descriptionEn: "Send a friendly onboarding reminder",
        descriptionAr: "إرسال تذكير ودي بالتأهيل",
        isPrimary: true,
      },
      {
        type: "SCHEDULE_CALL",
        labelEn: "Offer Onboarding Call",
        labelAr: "عرض مكالمة تأهيل",
        descriptionEn: "Offer a guided onboarding session",
        descriptionAr: "عرض جلسة تأهيل موجهة",
        isPrimary: false,
      },
    ],
  },
  SUBSCRIPTION_EXPIRING: {
    alertType: "SUBSCRIPTION_EXPIRING",
    titleEn: "Subscription Expiring",
    titleAr: "انتهاء الاشتراك",
    descriptionEn: "Client's subscription is expiring soon",
    descriptionAr: "اشتراك العميل ينتهي قريباً",
    recommendedActions: [
      {
        type: "SEND_EMAIL",
        labelEn: "Send Renewal Reminder",
        labelAr: "إرسال تذكير التجديد",
        descriptionEn: "Send subscription renewal reminder",
        descriptionAr: "إرسال تذكير بتجديد الاشتراك",
        isPrimary: true,
      },
      {
        type: "SCHEDULE_CALL",
        labelEn: "Schedule Renewal Call",
        labelAr: "جدولة مكالمة التجديد",
        descriptionEn: "Book a call to discuss renewal",
        descriptionAr: "حجز مكالمة لمناقشة التجديد",
        isPrimary: false,
      },
    ],
  },
  HEALTH_SCORE_DROP: {
    alertType: "HEALTH_SCORE_DROP",
    titleEn: "Health Score Drop",
    titleAr: "انخفاض درجة الصحة",
    descriptionEn: "Client's health score has dropped significantly",
    descriptionAr: "انخفضت درجة صحة العميل بشكل ملحوظ",
    recommendedActions: [
      {
        type: "VIEW_DETAILS",
        labelEn: "View Health Details",
        labelAr: "عرض تفاصيل الصحة",
        descriptionEn: "Check health score breakdown",
        descriptionAr: "التحقق من تفصيل درجة الصحة",
        isPrimary: true,
      },
      {
        type: "ASSIGN_CSM",
        labelEn: "Assign CSM",
        labelAr: "تعيين مدير نجاح العميل",
        descriptionEn: "Get proactive support assigned",
        descriptionAr: "تعيين دعم استباقي",
        isPrimary: false,
      },
    ],
  },
  MILESTONE_REACHED: {
    alertType: "MILESTONE_REACHED",
    titleEn: "Milestone Reached",
    titleAr: "تم الوصول لهدف",
    descriptionEn: "Client has reached a success milestone",
    descriptionAr: "العميل وصل لهدف نجاح",
    recommendedActions: [
      {
        type: "SEND_EMAIL",
        labelEn: "Send Congratulations",
        labelAr: "إرسال تهنئة",
        descriptionEn: "Celebrate their achievement",
        descriptionAr: "الاحتفال بإنجازهم",
        isPrimary: true,
      },
    ],
  },
  NEW_CONVERSION: {
    alertType: "NEW_CONVERSION",
    titleEn: "New Conversion",
    titleAr: "تحويل جديد",
    descriptionEn: "A trial client has converted to paid",
    descriptionAr: "عميل تجريبي تحول إلى مدفوع",
    recommendedActions: [
      {
        type: "SEND_EMAIL",
        labelEn: "Send Welcome Email",
        labelAr: "إرسال بريد ترحيبي",
        descriptionEn: "Welcome them as a paying customer",
        descriptionAr: "الترحيب بهم كعميل مدفوع",
        isPrimary: true,
      },
    ],
  },
  UPGRADE_COMPLETED: {
    alertType: "UPGRADE_COMPLETED",
    titleEn: "Upgrade Completed",
    titleAr: "اكتملت الترقية",
    descriptionEn: "Client has upgraded their plan",
    descriptionAr: "العميل رقّى خطته",
    recommendedActions: [
      {
        type: "SEND_EMAIL",
        labelEn: "Send Feature Guide",
        labelAr: "إرسال دليل المميزات",
        descriptionEn: "Guide them through new features",
        descriptionAr: "توجيههم عبر المميزات الجديدة",
        isPrimary: true,
      },
    ],
  },
  MEMBER_MILESTONE: {
    alertType: "MEMBER_MILESTONE",
    titleEn: "Member Milestone",
    titleAr: "هدف الأعضاء",
    descriptionEn: "Client reached a member count milestone",
    descriptionAr: "العميل وصل لهدف عدد الأعضاء",
    recommendedActions: [
      {
        type: "SEND_EMAIL",
        labelEn: "Send Congratulations",
        labelAr: "إرسال تهنئة",
        descriptionEn: "Celebrate their growth",
        descriptionAr: "الاحتفال بنموهم",
        isPrimary: true,
      },
    ],
  },
};

/**
 * Alert severity configuration
 */
export const ALERT_SEVERITY_CONFIG: Record<
  AlertSeverity,
  { labelEn: string; labelAr: string; color: string; bgColor: string }
> = {
  CRITICAL: {
    labelEn: "Critical",
    labelAr: "حرج",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  WARNING: {
    labelEn: "Warning",
    labelAr: "تحذير",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  INFO: {
    labelEn: "Info",
    labelAr: "معلومات",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  SUCCESS: {
    labelEn: "Success",
    labelAr: "نجاح",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
};

/**
 * Alert status configuration
 */
export const ALERT_STATUS_CONFIG: Record<
  AlertStatus,
  { labelEn: string; labelAr: string }
> = {
  ACTIVE: { labelEn: "Active", labelAr: "نشط" },
  ACKNOWLEDGED: { labelEn: "Acknowledged", labelAr: "تم الاطلاع" },
  RESOLVED: { labelEn: "Resolved", labelAr: "تم الحل" },
  DISMISSED: { labelEn: "Dismissed", labelAr: "تم التجاهل" },
};
