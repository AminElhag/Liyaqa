export type RewardType = 'WALLET_CREDIT' | 'FREE_DAYS' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT';
export type ReferralStatus = 'CLICKED' | 'SIGNED_UP' | 'CONVERTED' | 'EXPIRED';
export type RewardStatus = 'PENDING' | 'DISTRIBUTED' | 'FAILED' | 'CANCELLED';

export interface ReferralConfig {
  id: string;
  isEnabled: boolean;
  codePrefix: string;
  referrerRewardType: RewardType;
  referrerRewardAmount?: number;
  referrerRewardCurrency: string;
  referrerFreeDays?: number;
  minSubscriptionDays: number;
  maxReferralsPerMember?: number;
  totalReferrals?: number;
  totalConversions?: number;
  totalRewardsDistributed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralCode {
  id: string;
  memberId: string;
  code: string;
  isActive: boolean;
  clickCount: number;
  conversionCount: number;
  createdAt: string;
}

export interface Referral {
  id: string;
  referralCodeId: string;
  referrerMemberId: string;
  refereeMemberId?: string;
  status: ReferralStatus;
  clickedAt?: string;
  convertedAt?: string;
  subscriptionId?: string;
  createdAt: string;
}

export interface ReferralReward {
  id: string;
  referralId: string;
  memberId: string;
  rewardType: RewardType;
  amount?: number;
  currency: string;
  status: RewardStatus;
  distributedAt?: string;
  walletTransactionId?: string;
  createdAt: string;
}

export interface ReferralStats {
  code?: string;
  clickCount: number;
  totalReferrals: number;
  conversions: number;
  conversionRate: number;
}

export interface ReferralAnalytics {
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  overallConversionRate: number;
  conversionRate: number;
  totalRewardsDistributed: number;
  pendingRewards: number;
  activeReferrers: number;
  topReferrers: ReferralCode[];
}

export interface UpdateReferralConfigRequest {
  isEnabled: boolean;
  codePrefix?: string;
  referrerRewardType: RewardType;
  referrerRewardAmount?: number;
  referrerRewardCurrency?: string;
  referrerFreeDays?: number;
  minSubscriptionDays?: number;
  maxReferralsPerMember?: number;
}

export interface ReferralCodeValidation {
  valid: boolean;
  code?: string;
  referrerName?: string;
}

export interface ReferralTrackResponse {
  referralId?: string;
  success: boolean;
  message?: string;
}

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, { en: string; ar: string; color: string }> = {
  CLICKED: { en: 'Clicked', ar: 'تم النقر', color: 'blue' },
  SIGNED_UP: { en: 'Signed Up', ar: 'مسجل', color: 'yellow' },
  CONVERTED: { en: 'Converted', ar: 'تم التحويل', color: 'green' },
  EXPIRED: { en: 'Expired', ar: 'منتهي', color: 'gray' },
};

export const REWARD_STATUS_LABELS: Record<RewardStatus, { en: string; ar: string; color: string }> = {
  PENDING: { en: 'Pending', ar: 'قيد الانتظار', color: 'yellow' },
  DISTRIBUTED: { en: 'Distributed', ar: 'تم التوزيع', color: 'green' },
  FAILED: { en: 'Failed', ar: 'فشل', color: 'red' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغي', color: 'gray' },
};

export const REWARD_TYPE_LABELS: Record<RewardType, { en: string; ar: string }> = {
  WALLET_CREDIT: { en: 'Wallet Credit', ar: 'رصيد المحفظة' },
  FREE_DAYS: { en: 'Free Days', ar: 'أيام مجانية' },
  DISCOUNT_PERCENT: { en: 'Percentage Discount', ar: 'خصم نسبي' },
  DISCOUNT_AMOUNT: { en: 'Fixed Discount', ar: 'خصم ثابت' },
};
