/**
 * WhatsApp Integration Types
 * For WhatsApp Business API integration - primary channel in Saudi Arabia
 */

export interface WhatsAppSettings {
  enabled: boolean;
  phoneNumberId?: string;
  businessId?: string;
}

export interface WhatsAppOptInStatus {
  optedIn: boolean;
  whatsappNumber?: string;
}

export interface UpdateWhatsAppOptInRequest {
  optedIn: boolean;
  whatsappNumber?: string;
}

// Notification channel preference including WhatsApp
export interface NotificationChannelPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
}

// WhatsApp message templates for display
export interface WhatsAppTemplate {
  name: string;
  language: "ar" | "en";
  category: WhatsAppTemplateCategory;
  status: WhatsAppTemplateStatus;
}

export type WhatsAppTemplateCategory =
  | "subscription"
  | "invoice"
  | "class"
  | "account"
  | "marketing";

export type WhatsAppTemplateStatus = "APPROVED" | "PENDING" | "REJECTED";

// Texts for components
export const WHATSAPP_TEXTS = {
  en: {
    title: "WhatsApp Notifications",
    description: "Receive notifications via WhatsApp",
    optIn: "Enable WhatsApp Notifications",
    optOut: "Disable WhatsApp Notifications",
    phoneNumber: "WhatsApp Number",
    phonePlaceholder: "+966 5X XXX XXXX",
    phoneHint: "Enter your WhatsApp number with country code",
    enabled: "WhatsApp notifications are enabled",
    disabled: "WhatsApp notifications are disabled",
    verify: "Verify Number",
    verified: "Verified",
    notVerified: "Not Verified",
    save: "Save",
    cancel: "Cancel",
    success: "WhatsApp settings updated successfully",
    error: "Failed to update WhatsApp settings",
    benefits: {
      title: "Why WhatsApp?",
      fast: "Instant notifications",
      reliable: "99.9% delivery rate",
      popular: "Most popular messaging app in Saudi Arabia",
      secure: "End-to-end encrypted",
    },
    notificationTypes: {
      title: "You will receive:",
      subscription: "Subscription reminders & updates",
      invoice: "Invoice & payment notifications",
      class: "Class booking confirmations & reminders",
      account: "Important account updates",
    },
  },
  ar: {
    title: "إشعارات واتساب",
    description: "استلم الإشعارات عبر واتساب",
    optIn: "تفعيل إشعارات واتساب",
    optOut: "إلغاء إشعارات واتساب",
    phoneNumber: "رقم واتساب",
    phonePlaceholder: "+966 5X XXX XXXX",
    phoneHint: "أدخل رقم واتساب مع رمز الدولة",
    enabled: "إشعارات واتساب مفعّلة",
    disabled: "إشعارات واتساب معطّلة",
    verify: "تأكيد الرقم",
    verified: "تم التحقق",
    notVerified: "لم يتم التحقق",
    save: "حفظ",
    cancel: "إلغاء",
    success: "تم تحديث إعدادات واتساب بنجاح",
    error: "فشل تحديث إعدادات واتساب",
    benefits: {
      title: "لماذا واتساب؟",
      fast: "إشعارات فورية",
      reliable: "نسبة توصيل 99.9%",
      popular: "أكثر تطبيق مراسلة شيوعاً في السعودية",
      secure: "تشفير من طرف لطرف",
    },
    notificationTypes: {
      title: "ستستلم:",
      subscription: "تذكيرات وتحديثات الاشتراك",
      invoice: "إشعارات الفواتير والدفع",
      class: "تأكيدات وتذكيرات الحجوزات",
      account: "تحديثات الحساب المهمة",
    },
  },
};
