import type { LocalizedText } from "./api";

// ==================== FORM FIELD TYPES ====================

export type FormFieldType =
  | "TEXT"
  | "EMAIL"
  | "TEL"
  | "NUMBER"
  | "TEXTAREA"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "DATE";

export type FormTheme = "LIGHT" | "DARK" | "SYSTEM";

// ==================== FORM CONFIGURATION ====================

export interface FormFieldOption {
  value: string;
  label: LocalizedText;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  errorMessage?: LocalizedText;
}

export interface FormField {
  name: string;
  type: FormFieldType;
  required: boolean;
  label: LocalizedText;
  placeholder?: LocalizedText;
  options?: FormFieldOption[];
  validation?: FieldValidation;
}

export interface LeadCaptureFormConfig {
  fields: FormField[];
  defaultSource: string;
  autoAssign: boolean;
  assignToUserId?: string;
  notifyOnSubmission: boolean;
  notifyUserIds: string[];
  submitButtonText: LocalizedText;
  privacyPolicyUrl?: string;
  showPrivacyConsent: boolean;
}

export interface LeadCaptureFormStyling {
  theme: FormTheme;
  primaryColor: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius: string;
  fontFamily: string;
  showLogo: boolean;
  customCss?: string;
}

// ==================== FORM ENTITY ====================

export interface LeadCaptureForm {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  config: LeadCaptureFormConfig;
  styling: LeadCaptureFormStyling;
  redirectUrl?: string;
  thankYouMessageEn: string;
  thankYouMessageAr: string;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== PUBLIC FORM (simplified for embedding) ====================

export interface PublicFormField {
  name: string;
  type: string;
  required: boolean;
  label: LocalizedText;
  placeholder?: LocalizedText;
  options?: FormFieldOption[];
}

export interface PublicFormStyling {
  theme: string;
  primaryColor: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius: string;
  fontFamily: string;
}

export interface PublicForm {
  slug: string;
  fields: PublicFormField[];
  styling: PublicFormStyling;
  submitButtonText: LocalizedText;
  showPrivacyConsent: boolean;
  privacyPolicyUrl?: string;
}

// ==================== REQUESTS ====================

export interface CreateLeadCaptureFormRequest {
  name: string;
  slug: string;
  description?: string;
  config?: Partial<LeadCaptureFormConfig>;
  styling?: Partial<LeadCaptureFormStyling>;
  redirectUrl?: string;
  thankYouMessageEn?: string;
  thankYouMessageAr?: string;
}

export interface UpdateLeadCaptureFormRequest {
  name?: string;
  description?: string;
  config?: Partial<LeadCaptureFormConfig>;
  styling?: Partial<LeadCaptureFormStyling>;
  redirectUrl?: string;
  thankYouMessageEn?: string;
  thankYouMessageAr?: string;
}

export interface SubmitFormRequest {
  data: Record<string, unknown>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ==================== RESPONSES ====================

export interface FormSubmissionResponse {
  success: boolean;
  leadId: string;
  redirectUrl?: string;
  thankYouMessageEn: string;
  thankYouMessageAr: string;
}

export interface EmbedCodeResponse {
  embedCode: string;
}

// ==================== QUERY PARAMS ====================

export interface LeadCaptureFormQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

// ==================== DEFAULT VALUES ====================

export const DEFAULT_FORM_CONFIG: LeadCaptureFormConfig = {
  fields: [
    { name: "firstName", type: "TEXT", required: true, label: { en: "First Name", ar: "الاسم الأول" } },
    { name: "lastName", type: "TEXT", required: true, label: { en: "Last Name", ar: "اسم العائلة" } },
    { name: "email", type: "EMAIL", required: true, label: { en: "Email", ar: "البريد الإلكتروني" } },
    { name: "phone", type: "TEL", required: false, label: { en: "Phone", ar: "رقم الهاتف" } },
  ],
  defaultSource: "WEBSITE",
  autoAssign: false,
  notifyOnSubmission: true,
  notifyUserIds: [],
  submitButtonText: { en: "Submit", ar: "إرسال" },
  showPrivacyConsent: false,
};

export const DEFAULT_FORM_STYLING: LeadCaptureFormStyling = {
  theme: "LIGHT",
  primaryColor: "#0ea5e9",
  borderRadius: "8px",
  fontFamily: "system-ui",
  showLogo: true,
};

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, { en: string; ar: string }> = {
  TEXT: { en: "Text", ar: "نص" },
  EMAIL: { en: "Email", ar: "بريد إلكتروني" },
  TEL: { en: "Phone", ar: "هاتف" },
  NUMBER: { en: "Number", ar: "رقم" },
  TEXTAREA: { en: "Long Text", ar: "نص طويل" },
  SELECT: { en: "Dropdown", ar: "قائمة منسدلة" },
  RADIO: { en: "Radio Buttons", ar: "أزرار اختيار" },
  CHECKBOX: { en: "Checkbox", ar: "مربع اختيار" },
  DATE: { en: "Date", ar: "تاريخ" },
};
