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
export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "ONLINE"
  | "MADA"
  | "APPLE_PAY"
  | "STC_PAY"
  | "SADAD"
  | "TAMARA"
  | "PAYTABS"
  | "OTHER";

/**
 * Line item type
 */
export type LineItemType =
  | "SUBSCRIPTION"
  | "CLASS_PACKAGE"
  | "GUEST_PASS"
  | "PERSONAL_TRAINING"
  | "MERCHANDISE"
  | "LOCKER_RENTAL"
  | "PENALTY"
  | "DISCOUNT"
  | "OTHER";

/**
 * ZATCA VAT category code
 */
export type VatCategoryCode = "S" | "Z" | "E" | "O";

/**
 * ZATCA invoice type code
 */
export type InvoiceTypeCode = "SIMPLIFIED" | "STANDARD";

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: UUID;
  description: LocalizedText;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  lineTaxAmount: Money;
  lineGrossTotal: Money;
  itemType: LineItemType;
  taxRate: number;
  vatCategoryCode: VatCategoryCode;
}

/**
 * Payment record
 */
export interface Payment {
  id: UUID;
  invoiceId: UUID;
  amount: Money;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  paidAt: string;
  createdBy?: UUID;
  gatewayTransactionId?: string;
  createdAt: string;
}

/**
 * Catalog item for invoice line item picker
 */
export interface CatalogItem {
  id: UUID;
  name: LocalizedText;
  price: Money;
  taxRate: number;
  itemType: LineItemType;
  description?: LocalizedText;
}

/**
 * Invoice summary stats
 */
export interface InvoiceSummary {
  totalInvoices: number;
  draftCount: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
  partiallyPaidCount: number;
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
  invoiceTypeCode: InvoiceTypeCode;
  payments: Payment[];
  tenantId?: UUID;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create invoice line item request
 */
export interface CreateLineItemRequest {
  descriptionEn: string;
  descriptionAr?: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  itemType?: LineItemType;
  taxRate?: number;
  vatCategoryCode?: VatCategoryCode;
}

/**
 * Create invoice request
 */
export interface CreateInvoiceRequest {
  memberId: UUID;
  subscriptionId?: UUID;
  lineItems: CreateLineItemRequest[];
  vatRate?: number;
  notesEn?: string;
  notesAr?: string;
  invoiceTypeCode?: InvoiceTypeCode;
}

/**
 * Update invoice request
 */
export interface UpdateInvoiceRequest {
  notesEn?: string;
  notesAr?: string;
}

/**
 * Pay invoice request
 */
export interface PayInvoiceRequest {
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
}

/**
 * Invoice query params
 */
export interface InvoiceQueryParams extends ListQueryParams {
  memberId?: UUID;
  status?: InvoiceStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
