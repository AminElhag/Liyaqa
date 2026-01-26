import type { UUID } from "./api";

// Enums
export type KioskStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type SessionStatus = "ACTIVE" | "COMPLETED" | "ABANDONED" | "TIMED_OUT";
export type IdentificationMethod = "QR_CODE" | "PHONE" | "CARD" | "BIOMETRIC" | "MEMBER_ID";
export type TransactionType = "CHECK_IN" | "CLASS_BOOKING" | "PAYMENT" | "MEMBERSHIP_RENEWAL" | "FREEZE" | "AGREEMENT_SIGN";
export type ReferenceType = "ATTENDANCE" | "CLASS_BOOKING" | "INVOICE" | "MEMBERSHIP" | "AGREEMENT";
export type PaymentMethod = "CARD" | "APPLE_PAY" | "MADA" | "CASH" | "WALLET";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type KioskAction = "CHECK_IN" | "CLASS_BOOKING" | "PAYMENT" | "MEMBERSHIP_VIEW" | "AGREEMENT_SIGN" | "PROFILE_UPDATE" | "RECEIPT_PRINT";

// ========== Request Types ==========

export interface CreateKioskDeviceRequest {
  locationId: UUID;
  deviceName: string;
  deviceNameAr?: string;
  deviceCode: string;
  hardwareId?: string;
  config?: Record<string, unknown>;
  allowedActions?: KioskAction[];
}

export interface UpdateKioskDeviceRequest {
  deviceName?: string;
  deviceNameAr?: string;
  status?: KioskStatus;
  config?: Record<string, unknown>;
  allowedActions?: KioskAction[];
}

export interface StartSessionRequest {
  kioskId: UUID;
}

export interface IdentifyMemberRequest {
  method: IdentificationMethod;
  value: string;
}

export interface EndSessionRequest {
  status: SessionStatus;
  feedbackRating?: number;
  feedbackComment?: string;
}

export interface CreateTransactionRequest {
  transactionType: TransactionType;
  referenceType?: ReferenceType;
  referenceId?: UUID;
  amount?: number;
  paymentMethod?: PaymentMethod;
}

export interface CompleteTransactionRequest {
  paymentReference?: string;
}

export interface FailTransactionRequest {
  errorMessage: string;
}

export interface CreateSignatureRequest {
  memberId: UUID;
  agreementId: UUID;
  signatureData: string;
}

export interface CheckInRequest {
  memberId: UUID;
}

// ========== Response Types ==========

export interface KioskDevice {
  id: UUID;
  locationId: UUID;
  deviceName: string;
  deviceNameAr: string | null;
  deviceCode: string;
  status: KioskStatus;
  isOnline: boolean;
  lastHeartbeat: string | null;
  hardwareId: string | null;
  config: Record<string, unknown> | null;
  allowedActions: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface KioskSession {
  id: UUID;
  kioskId: UUID;
  memberId: UUID | null;
  startedAt: string;
  endedAt: string | null;
  identificationMethod: IdentificationMethod | null;
  sessionStatus: SessionStatus;
  durationSeconds: number | null;
  feedbackRating: number | null;
  feedbackComment: string | null;
  createdAt: string;
}

export interface KioskTransaction {
  id: UUID;
  sessionId: UUID;
  transactionType: TransactionType;
  referenceType: ReferenceType | null;
  referenceId: UUID | null;
  amount: number | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  status: TransactionStatus;
  errorMessage: string | null;
  receiptPrinted: boolean;
  receiptSentEmail: boolean;
  receiptSentSms: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface KioskSignature {
  id: UUID;
  sessionId: UUID;
  memberId: UUID;
  agreementId: UUID;
  signedAt: string;
  createdAt: string;
}

// Labels
export const KIOSK_STATUS_LABELS: Record<KioskStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  MAINTENANCE: "Maintenance",
};

export const KIOSK_STATUS_LABELS_AR: Record<KioskStatus, string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  MAINTENANCE: "صيانة",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
  TIMED_OUT: "Timed Out",
};

export const SESSION_STATUS_LABELS_AR: Record<SessionStatus, string> = {
  ACTIVE: "نشط",
  COMPLETED: "مكتمل",
  ABANDONED: "متروك",
  TIMED_OUT: "انتهى الوقت",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  CHECK_IN: "Check-in",
  CLASS_BOOKING: "Class Booking",
  PAYMENT: "Payment",
  MEMBERSHIP_RENEWAL: "Membership Renewal",
  FREEZE: "Freeze",
  AGREEMENT_SIGN: "Agreement Sign",
};

export const TRANSACTION_TYPE_LABELS_AR: Record<TransactionType, string> = {
  CHECK_IN: "تسجيل دخول",
  CLASS_BOOKING: "حجز حصة",
  PAYMENT: "دفع",
  MEMBERSHIP_RENEWAL: "تجديد عضوية",
  FREEZE: "تجميد",
  AGREEMENT_SIGN: "توقيع اتفاقية",
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const TRANSACTION_STATUS_LABELS_AR: Record<TransactionStatus, string> = {
  PENDING: "في الانتظار",
  COMPLETED: "مكتمل",
  FAILED: "فاشل",
  CANCELLED: "ملغي",
};

export const IDENTIFICATION_METHOD_LABELS: Record<IdentificationMethod, string> = {
  QR_CODE: "QR Code",
  PHONE: "Phone Number",
  CARD: "Access Card",
  BIOMETRIC: "Biometric",
  MEMBER_ID: "Member ID",
};

export const IDENTIFICATION_METHOD_LABELS_AR: Record<IdentificationMethod, string> = {
  QR_CODE: "رمز QR",
  PHONE: "رقم الهاتف",
  CARD: "بطاقة الدخول",
  BIOMETRIC: "بيومتري",
  MEMBER_ID: "رقم العضوية",
};

export const KIOSK_ACTION_LABELS: Record<KioskAction, string> = {
  CHECK_IN: "Check-in",
  CLASS_BOOKING: "Book Classes",
  PAYMENT: "Make Payment",
  MEMBERSHIP_VIEW: "View Membership",
  AGREEMENT_SIGN: "Sign Agreement",
  PROFILE_UPDATE: "Update Profile",
  RECEIPT_PRINT: "Print Receipt",
};

export const KIOSK_ACTION_LABELS_AR: Record<KioskAction, string> = {
  CHECK_IN: "تسجيل الدخول",
  CLASS_BOOKING: "حجز الحصص",
  PAYMENT: "الدفع",
  MEMBERSHIP_VIEW: "عرض العضوية",
  AGREEMENT_SIGN: "توقيع الاتفاقية",
  PROFILE_UPDATE: "تحديث الملف",
  RECEIPT_PRINT: "طباعة الإيصال",
};
