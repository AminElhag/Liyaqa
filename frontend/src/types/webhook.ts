export type DeliveryStatus = 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'FAILED' | 'EXHAUSTED';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  headers?: Record<string, string>;
  rateLimitPerMinute: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookWithSecret extends Webhook {
  secret: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  eventId: string;
  status: DeliveryStatus;
  attemptCount: number;
  nextRetryAt?: string;
  lastResponseCode?: number;
  lastResponseBody?: string;
  lastError?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface WebhookDeliveryDetail extends WebhookDelivery {
  payload: Record<string, unknown>;
}

export interface WebhookStats {
  total: number;
  delivered: number;
  pending: number;
  failed: number;
  exhausted: number;
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  rateLimitPerMinute?: number;
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  headers?: Record<string, string>;
  rateLimitPerMinute?: number;
  isActive?: boolean;
}

export interface TestWebhookRequest {
  eventType?: string;
}

export interface EventTypesResponse {
  eventTypes: string[];
}

// Event type categories for UI grouping
export const EVENT_TYPE_CATEGORIES = {
  member: {
    label: 'Member Events',
    labelAr: 'أحداث الأعضاء',
    events: ['member.created', 'member.updated', 'member.deleted'],
  },
  subscription: {
    label: 'Subscription Events',
    labelAr: 'أحداث الاشتراكات',
    events: [
      'subscription.created',
      'subscription.activated',
      'subscription.renewed',
      'subscription.expired',
      'subscription.cancelled',
      'subscription.frozen',
      'subscription.unfrozen',
    ],
  },
  invoice: {
    label: 'Invoice Events',
    labelAr: 'أحداث الفواتير',
    events: [
      'invoice.created',
      'invoice.issued',
      'invoice.paid',
      'invoice.voided',
      'invoice.overdue',
    ],
  },
  attendance: {
    label: 'Attendance Events',
    labelAr: 'أحداث الحضور',
    events: ['attendance.checkin', 'attendance.checkout'],
  },
  booking: {
    label: 'Booking Events',
    labelAr: 'أحداث الحجوزات',
    events: [
      'booking.created',
      'booking.confirmed',
      'booking.cancelled',
      'booking.completed',
      'booking.no_show',
    ],
  },
  class: {
    label: 'Class Events',
    labelAr: 'أحداث الفصول',
    events: ['class_session.created', 'class_session.cancelled'],
  },
  shop: {
    label: 'Shop Events',
    labelAr: 'أحداث المتجر',
    events: ['order.created', 'order.paid', 'order.completed'],
  },
  wallet: {
    label: 'Wallet Events',
    labelAr: 'أحداث المحفظة',
    events: ['wallet.credited', 'wallet.debited'],
  },
} as const;

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, { en: string; ar: string; color: string }> = {
  PENDING: { en: 'Pending', ar: 'قيد الانتظار', color: 'yellow' },
  IN_PROGRESS: { en: 'In Progress', ar: 'قيد التنفيذ', color: 'blue' },
  DELIVERED: { en: 'Delivered', ar: 'تم التسليم', color: 'green' },
  FAILED: { en: 'Failed', ar: 'فشل', color: 'red' },
  EXHAUSTED: { en: 'Exhausted', ar: 'استنفذ المحاولات', color: 'gray' },
};
