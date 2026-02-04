import type { UUID, LocalizedText, Money } from "../api";

/**
 * Status of a client invoice.
 */
export type ClientInvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PAID"
  | "PARTIALLY_PAID"
  | "OVERDUE"
  | "CANCELLED";

/**
 * Type of line item on a client invoice.
 */
export type ClientInvoiceLineItemType =
  | "SUBSCRIPTION"
  | "SETUP_FEE"
  | "SERVICE"
  | "INTEGRATION"
  | "DISCOUNT"
  | "OTHER";

/**
 * Payment method for client invoices.
 */
export type ClientPaymentMethod =
  | "BANK_TRANSFER"
  | "CREDIT_CARD"
  | "CASH"
  | "CHECK"
  | "OTHER";

/**
 * Line item response.
 */
export interface ClientInvoiceLineItem {
  id: UUID;
  description: LocalizedText;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  itemType: ClientInvoiceLineItemType;
  sortOrder: number;
}

/**
 * Full invoice response with all details.
 */
export interface ClientInvoice {
  id: UUID;
  invoiceNumber: string;
  organizationId: UUID;
  subscriptionId?: UUID;
  status: ClientInvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  paidDate?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  subtotal: Money;
  vatRate: number;
  vatAmount: Money;
  totalAmount: Money;
  paidAmount?: Money;
  remainingBalance: Money;
  notes?: LocalizedText;
  paymentMethod?: ClientPaymentMethod;
  paymentReference?: string;
  salesRepId?: UUID;
  lineItems: ClientInvoiceLineItem[];

  // Calculated fields
  isFullyPaid: boolean;
  isOverdue: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified invoice response for listings.
 */
export interface ClientInvoiceSummary {
  id: UUID;
  invoiceNumber: string;
  organizationId: UUID;
  status: ClientInvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  totalAmount: Money;
  isOverdue: boolean;
}

/**
 * Response for invoice statistics.
 */
export interface ClientInvoiceStats {
  total: number;
  draft: number;
  issued: number;
  paid: number;
  partiallyPaid: number;
  overdue: number;
  cancelled: number;
}

// ============================================
// Request Types
// ============================================

export interface CreateLineItemRequest {
  descriptionEn: string;
  descriptionAr?: string;
  quantity?: number;
  unitPriceAmount: number;
  unitPriceCurrency?: string;
  itemType?: ClientInvoiceLineItemType;
}

export interface CreateClientInvoiceRequest {
  organizationId: UUID;
  subscriptionId?: UUID;
  lineItems: CreateLineItemRequest[];
  vatRate?: number;
  notesEn?: string;
  notesAr?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  salesRepId?: UUID;
}

export interface GenerateFromSubscriptionRequest {
  subscriptionId: UUID;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

export interface IssueClientInvoiceRequest {
  issueDate?: string;
  paymentDueDays?: number;
}

export interface RecordClientPaymentRequest {
  amountValue: number;
  amountCurrency?: string;
  paymentMethod: ClientPaymentMethod;
  reference?: string;
}

export interface UpdateClientInvoiceRequest {
  notesEn?: string;
  notesAr?: string;
}

// Query params
export interface ClientInvoiceQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  status?: ClientInvoiceStatus;
  organizationId?: UUID;
}
