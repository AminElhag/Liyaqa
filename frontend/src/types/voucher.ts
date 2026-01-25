export type DiscountType = 'FIXED_AMOUNT' | 'PERCENTAGE' | 'FREE_TRIAL' | 'GIFT_CARD';
export type UsageType = 'SUBSCRIPTION' | 'SHOP_ORDER' | 'WALLET_REDEMPTION';

export interface Voucher {
  id: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  discountType: DiscountType;
  discountAmount?: number;
  discountCurrency: string;
  discountPercent?: number;
  freeTrialDays?: number;
  giftCardBalance?: number;
  maxUses?: number;
  maxUsesPerMember: number;
  currentUseCount: number;
  validFrom?: string;
  validUntil?: string;
  firstTimeMemberOnly: boolean;
  minimumPurchase?: number;
  applicablePlanIds: string[];
  applicableProductIds: string[];
  isActive: boolean;
  isValidForUse: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherUsage {
  id: string;
  voucherId: string;
  memberId: string;
  usedForType: UsageType;
  usedForId?: string;
  discountApplied?: number;
  discountCurrency: string;
  invoiceId?: string;
  usedAt: string;
  createdAt: string;
}

export interface CreateVoucherRequest {
  code: string;
  nameEn: string;
  nameAr?: string;
  discountType: DiscountType;
  discountAmount?: number;
  discountCurrency?: string;
  discountPercent?: number;
  freeTrialDays?: number;
  giftCardBalance?: number;
  maxUses?: number;
  maxUsesPerMember?: number;
  validFrom?: string;
  validUntil?: string;
  firstTimeMemberOnly?: boolean;
  minimumPurchase?: number;
  applicablePlanIds?: string[];
  applicableProductIds?: string[];
}

export interface UpdateVoucherRequest {
  nameEn?: string;
  nameAr?: string;
  discountAmount?: number;
  discountCurrency?: string;
  discountPercent?: number;
  freeTrialDays?: number;
  maxUses?: number;
  maxUsesPerMember?: number;
  validFrom?: string;
  validUntil?: string;
  firstTimeMemberOnly?: boolean;
  minimumPurchase?: number;
  applicablePlanIds?: string[];
  applicableProductIds?: string[];
  isActive?: boolean;
}

export interface ValidateVoucherRequest {
  code: string;
  memberId: string;
  purchaseAmount: number;
  planId?: string;
  productIds?: string[];
  isFirstTimeMember?: boolean;
}

export interface VoucherValidationResponse {
  valid: boolean;
  discountAmount: number;
  freeTrialDays: number;
  errorCode?: string;
  errorMessage?: string;
  voucher?: Voucher;
}

export interface RedeemVoucherRequest {
  code: string;
  memberId: string;
  purchaseAmount: number;
  usedForType: string;
  usedForId?: string;
  invoiceId?: string;
}

export interface RedeemGiftCardRequest {
  code: string;
  memberId: string;
  amount?: number;
}

export interface VoucherRedemptionResponse {
  success: boolean;
  discountApplied: number;
  freeTrialDays: number;
  errorCode?: string;
  errorMessage?: string;
  voucher?: Voucher;
  usage?: VoucherUsage;
}

export interface VoucherCheckResponse {
  valid: boolean;
  code: string;
  discountType: string;
  discountAmount: number;
  discountPercent: number;
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, { en: string; ar: string }> = {
  FIXED_AMOUNT: { en: 'Fixed Amount', ar: 'مبلغ ثابت' },
  PERCENTAGE: { en: 'Percentage', ar: 'نسبة مئوية' },
  FREE_TRIAL: { en: 'Free Trial', ar: 'تجربة مجانية' },
  GIFT_CARD: { en: 'Gift Card', ar: 'بطاقة هدية' },
};

export const USAGE_TYPE_LABELS: Record<UsageType, { en: string; ar: string }> = {
  SUBSCRIPTION: { en: 'Subscription', ar: 'اشتراك' },
  SHOP_ORDER: { en: 'Shop Order', ar: 'طلب متجر' },
  WALLET_REDEMPTION: { en: 'Wallet Redemption', ar: 'استبدال محفظة' },
};
