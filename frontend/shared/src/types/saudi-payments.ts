/**
 * Types for Saudi Arabia payment methods: STC Pay, SADAD, and Tamara BNPL
 */

// ==================== STC Pay ====================

export interface STCPayInitiateRequest {
  mobileNumber: string;
}

export interface STCPayConfirmRequest {
  otp: string;
}

export interface STCPayInitiationResponse {
  success: boolean;
  otpReference?: string;
  transactionId?: string;
  expiresIn?: number;
  error?: string;
  messageEn: string;
  messageAr: string;
}

export interface STCPayConfirmationResponse {
  success: boolean;
  paymentReference?: string;
  transactionId?: string;
  error?: string;
  messageEn: string;
  messageAr: string;
}

export interface STCPayStatusResponse {
  transactionId: string;
  status: string;
  paymentReference?: string;
  amount?: number;
  error?: string;
}

// ==================== SADAD ====================

export interface SadadBillResponse {
  success: boolean;
  billNumber?: string;
  billAccount?: string;
  billerCode?: string;
  amount?: number;
  dueDate?: string;
  alreadyGenerated: boolean;
  error?: string;
  messageEn: string;
  messageAr: string;
  instructionsEn?: string;
  instructionsAr?: string;
}

export interface SadadStatusResponse {
  billNumber: string;
  status: string;
  statusEn: string;
  statusAr: string;
  paidAmount?: number;
  paidAt?: string;
  paymentReference?: string;
  error?: string;
}

export interface SadadCancelResponse {
  success: boolean;
  error?: string;
  messageEn: string;
  messageAr: string;
}

// ==================== Tamara BNPL ====================

export interface TamaraCheckoutRequest {
  instalments?: number;
}

export interface TamaraCheckoutResponse {
  success: boolean;
  checkoutId?: string;
  checkoutUrl?: string;
  instalments?: number;
  instalmentsAmount?: number;
  error?: string;
  messageEn: string;
  messageAr: string;
}

export interface TamaraInstalmentOption {
  instalments: number;
  instalmentsAmount: number;
  labelEn: string;
  labelAr: string;
}

export interface TamaraOptionsResponse {
  available: boolean;
  minAmount?: number;
  maxAmount?: number;
  payIn3?: TamaraInstalmentOption;
  payIn4?: TamaraInstalmentOption;
  payIn30Available: boolean;
  error?: string;
  messageEn: string;
  messageAr: string;
}

export interface TamaraOrderStatusResponse {
  orderId: string;
  status: string;
  statusEn: string;
  statusAr: string;
  totalAmount?: number;
  paymentType?: string;
  instalments?: number;
  error?: string;
}

export interface TamaraAuthorizeResponse {
  success: boolean;
  orderId?: string;
  status?: string;
  error?: string;
  messageEn: string;
  messageAr: string;
}

export interface TamaraCaptureResponse {
  success: boolean;
  orderId?: string;
  captureId?: string;
  error?: string;
  messageEn: string;
  messageAr: string;
}

// ==================== Common ====================

export interface CallbackResponse {
  success: boolean;
}

export type SaudiPaymentMethod = "STC_PAY" | "SADAD" | "TAMARA";

export interface PaymentMethodInfo {
  id: SaudiPaymentMethod;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  enabled: boolean;
}

// Bilingual texts for UI
export const saudiPaymentTexts = {
  en: {
    selectPaymentMethod: "Select Payment Method",
    stcPay: {
      name: "STC Pay",
      description: "Pay with your STC Pay mobile wallet",
      enterMobile: "Enter your STC Pay mobile number",
      mobileNumber: "Mobile Number",
      mobilePlaceholder: "05XXXXXXXX",
      initiatePayment: "Send OTP",
      enterOtp: "Enter the OTP sent to your STC Pay app",
      otp: "One-Time Password",
      otpPlaceholder: "Enter 6-digit OTP",
      confirmPayment: "Confirm Payment",
      paymentSuccess: "Payment completed successfully!",
      otpSent: "OTP sent to your STC Pay app",
      expiresIn: "OTP expires in",
      seconds: "seconds",
    },
    sadad: {
      name: "SADAD",
      description: "Pay via any Saudi bank using SADAD",
      generateBill: "Generate SADAD Bill",
      billGenerated: "SADAD Bill Generated",
      billNumber: "Bill Number",
      billerCode: "Biller Code",
      amount: "Amount",
      dueDate: "Due Date",
      instructions: "How to Pay",
      checkStatus: "Check Payment Status",
      cancelBill: "Cancel Bill",
      paymentReceived: "Payment Received",
      billExpired: "Bill Expired",
      billCancelled: "Bill Cancelled",
    },
    tamara: {
      name: "Tamara",
      description: "Buy now, pay later in interest-free installments",
      payIn3: "Pay in 3",
      payIn4: "Pay in 4",
      payIn30: "Pay in 30 days",
      instalmentsOf: "installments of",
      sar: "SAR",
      noInterest: "No interest or fees",
      checkout: "Continue with Tamara",
      minAmount: "Minimum amount",
      maxAmount: "Maximum amount",
      notEligible: "Amount not eligible for Tamara",
      processing: "Processing your order...",
      approved: "Order Approved",
      declined: "Order Declined",
    },
    common: {
      processing: "Processing...",
      error: "An error occurred",
      tryAgain: "Please try again",
      cancel: "Cancel",
      close: "Close",
      back: "Back",
    },
  },
  ar: {
    selectPaymentMethod: "اختر طريقة الدفع",
    stcPay: {
      name: "STC Pay",
      description: "ادفع بمحفظة STC Pay",
      enterMobile: "أدخل رقم جوال STC Pay",
      mobileNumber: "رقم الجوال",
      mobilePlaceholder: "05XXXXXXXX",
      initiatePayment: "إرسال رمز التحقق",
      enterOtp: "أدخل رمز التحقق المرسل لتطبيق STC Pay",
      otp: "رمز التحقق",
      otpPlaceholder: "أدخل الرمز المكون من 6 أرقام",
      confirmPayment: "تأكيد الدفع",
      paymentSuccess: "تم الدفع بنجاح!",
      otpSent: "تم إرسال رمز التحقق لتطبيق STC Pay",
      expiresIn: "ينتهي رمز التحقق خلال",
      seconds: "ثانية",
    },
    sadad: {
      name: "سداد",
      description: "ادفع عبر أي بنك سعودي باستخدام سداد",
      generateBill: "إنشاء فاتورة سداد",
      billGenerated: "تم إنشاء فاتورة سداد",
      billNumber: "رقم الفاتورة",
      billerCode: "رمز المفوتر",
      amount: "المبلغ",
      dueDate: "تاريخ الاستحقاق",
      instructions: "طريقة الدفع",
      checkStatus: "التحقق من حالة الدفع",
      cancelBill: "إلغاء الفاتورة",
      paymentReceived: "تم استلام الدفع",
      billExpired: "انتهت صلاحية الفاتورة",
      billCancelled: "تم إلغاء الفاتورة",
    },
    tamara: {
      name: "تمارا",
      description: "اشترِ الآن وادفع لاحقاً بأقساط بدون فوائد",
      payIn3: "ادفع على 3",
      payIn4: "ادفع على 4",
      payIn30: "ادفع خلال 30 يوم",
      instalmentsOf: "أقساط بقيمة",
      sar: "ريال",
      noInterest: "بدون فوائد أو رسوم",
      checkout: "المتابعة مع تمارا",
      minAmount: "الحد الأدنى",
      maxAmount: "الحد الأقصى",
      notEligible: "المبلغ غير مؤهل لتمارا",
      processing: "جاري معالجة طلبك...",
      approved: "تمت الموافقة على الطلب",
      declined: "تم رفض الطلب",
    },
    common: {
      processing: "جاري المعالجة...",
      error: "حدث خطأ",
      tryAgain: "يرجى المحاولة مرة أخرى",
      cancel: "إلغاء",
      close: "إغلاق",
      back: "رجوع",
    },
  },
};

export type SaudiPaymentTextsType = typeof saudiPaymentTexts;
