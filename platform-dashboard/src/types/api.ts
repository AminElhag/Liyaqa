/**
 * Bilingual text type matching backend LocalizedText
 */
export interface LocalizedText {
  en: string;
  ar?: string | null;
}

/**
 * Paginated response from backend
 */
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

/**
 * API error response (bilingual)
 */
export interface ApiError {
  status: number;
  error: string;
  errorAr: string;
  message: string;
  messageAr: string;
  path?: string;
  timestamp?: string;
}

/**
 * Sort direction for API queries
 */
export type SortDirection = "asc" | "desc";

/**
 * Common query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: SortDirection;
}

/**
 * Generic ID type (UUID string)
 */
export type UUID = string;

/**
 * Money value object
 */
export interface Money {
  amount: number;
  currency: string;
}

/**
 * Taxable fee with computed tax amounts
 */
export interface TaxableFee {
  amount: number;
  currency: string;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
}

/**
 * Localized address object
 */
export interface LocalizedAddress {
  street?: LocalizedText;
  building?: LocalizedText;
  city?: LocalizedText;
  district?: LocalizedText;
  postalCode?: string;
  countryCode?: string;
  formatted: string;
}

/**
 * Date range filter
 */
export interface DateRange {
  from?: string;
  to?: string;
}

/**
 * PageResponse alias for compatibility with platform modules
 */
export type PageResponse<T> = PaginatedResponse<T>;
