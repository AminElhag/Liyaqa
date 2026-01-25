// ==================== ENUMS ====================

export type PaymentMethodType = "CARD" | "MADA" | "STCPAY" | "APPLE_PAY";

export type PaymentProviderType = "STRIPE" | "MOYASAR" | "HYPERPAY" | "MANUAL";

// ==================== TYPES ====================

export interface PaymentMethod {
  id: string;
  paymentType: PaymentMethodType;
  providerType: PaymentProviderType;
  cardLastFour?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  nickname?: string;
  displayName: string;
  isDefault: boolean;
  isExpired: boolean;
  createdAt: string;
}

// ==================== REQUESTS ====================

export interface AddPaymentMethodRequest {
  paymentType: PaymentMethodType;
  providerType: PaymentProviderType;
  providerToken?: string;
  providerCustomerId?: string;
  cardLastFour?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  nickname?: string;
  setAsDefault?: boolean;
  billingName?: string;
  billingCountry?: string;
  billingCity?: string;
}

export interface UpdatePaymentMethodRequest {
  nickname?: string;
}

// ==================== UI LABELS ====================

export const PAYMENT_TYPE_LABELS: Record<PaymentMethodType, { en: string; ar: string }> = {
  CARD: { en: "Credit/Debit Card", ar: "بطاقة ائتمان/خصم" },
  MADA: { en: "Mada Card", ar: "بطاقة مدى" },
  STCPAY: { en: "STC Pay", ar: "STC Pay" },
  APPLE_PAY: { en: "Apple Pay", ar: "Apple Pay" },
};

export const CARD_BRAND_LABELS: Record<string, { en: string; ar: string }> = {
  VISA: { en: "Visa", ar: "فيزا" },
  MASTERCARD: { en: "Mastercard", ar: "ماستركارد" },
  MADA: { en: "Mada", ar: "مدى" },
  AMEX: { en: "American Express", ar: "أمريكان إكسبريس" },
};

export const CARD_BRAND_COLORS: Record<string, string> = {
  VISA: "#1A1F71",
  MASTERCARD: "#EB001B",
  MADA: "#004B87",
  AMEX: "#006FCF",
};
