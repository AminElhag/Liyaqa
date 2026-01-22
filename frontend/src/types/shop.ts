import type { UUID, LocalizedText, Money } from "./api";
import type { ProductType } from "./product";

// ===========================
// ORDER STATUS
// ===========================

export type OrderStatus =
  | "CART"
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

// ===========================
// CART TYPES
// ===========================

export interface CartItem {
  productId: UUID;
  productName: LocalizedText;
  productType: ProductType;
  quantity: number;
  unitPrice: Money;
  taxRate: number;
  lineTotal: Money;
  lineTax: Money;
  lineGross: Money;
}

export interface Cart {
  id: UUID | null;
  memberId: UUID | null;
  memberName: LocalizedText | null;
  memberEmail: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: Money;
  taxTotal: Money;
  grandTotal: Money;
}

// ===========================
// ORDER TYPES
// ===========================

export interface Order {
  id: UUID;
  memberId: UUID;
  memberName: LocalizedText | null;
  memberEmail: string | null;
  status: OrderStatus;
  items: CartItem[];
  itemCount: number;
  subtotal: Money;
  taxTotal: Money;
  grandTotal: Money;
  invoiceId: UUID | null;
  notes: string | null;
  placedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===========================
// CHECKOUT TYPES
// ===========================

export interface CheckoutResult {
  orderId: UUID;
  invoiceId: UUID;
  memberId: UUID | null;
  memberName: LocalizedText | null;
  memberEmail: string | null;
  grandTotal: Money;
}

// ===========================
// REQUEST TYPES
// ===========================

export interface AddToCartRequest {
  productId: UUID;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CheckoutRequest {
  notes?: string;
}

// ===========================
// QUERY PARAMS
// ===========================

export interface OrderQueryParams {
  page?: number;
  size?: number;
}

// ===========================
// HELPER CONSTANTS
// ===========================

export const ORDER_STATUS_LABELS: Record<OrderStatus, { en: string; ar: string }> = {
  CART: { en: "Cart", ar: "سلة التسوق" },
  PENDING: { en: "Pending Payment", ar: "في انتظار الدفع" },
  PAID: { en: "Paid", ar: "مدفوع" },
  PROCESSING: { en: "Processing", ar: "قيد المعالجة" },
  COMPLETED: { en: "Completed", ar: "مكتمل" },
  CANCELLED: { en: "Cancelled", ar: "ملغى" },
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  CART: "bg-slate-100 text-slate-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};
