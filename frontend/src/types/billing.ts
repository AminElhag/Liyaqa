import type { UUID, LocalizedText, ListQueryParams, Money } from "./api";

/**
 * Invoice status
 */
export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PAID"
  | "PARTIALLY_PAID"
  | "OVERDUE"
  | "CANCELLED";

/**
 * Payment method
 */
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE";

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: UUID;
  description: LocalizedText;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

/**
 * Invoice
 */
export interface Invoice {
  id: UUID;
  invoiceNumber: string;
  memberId: UUID;
  memberName?: LocalizedText;
  memberEmail?: string;
  subscriptionId?: UUID;
  lineItems: InvoiceLineItem[];
  subtotal: Money;
  vatAmount: Money;
  vatRate: number;
  totalAmount: Money;
  paidAmount?: Money;
  remainingBalance: Money;
  status: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  paidDate?: string;
  notes?: LocalizedText;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  tenantId?: UUID;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create invoice line item request
 */
export interface CreateLineItemRequest {
  description: LocalizedText;
  quantity: number;
  unitPrice: number;
}

/**
 * Create invoice request
 */
export interface CreateInvoiceRequest {
  memberId: UUID;
  subscriptionId?: UUID;
  lineItems: CreateLineItemRequest[];
  dueDate?: string;
  notes?: LocalizedText;
}

/**
 * Update invoice request
 */
export interface UpdateInvoiceRequest {
  lineItems?: CreateLineItemRequest[];
  dueDate?: string;
  notes?: LocalizedText;
}

/**
 * Pay invoice request
 */
export interface PayInvoiceRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
}

/**
 * Invoice query params
 */
export interface InvoiceQueryParams extends ListQueryParams {
  memberId?: UUID;
  status?: InvoiceStatus;
  issuedAfter?: string;
  issuedBefore?: string;
  dueAfter?: string;
  dueBefore?: string;
}

