import { api } from "../client";
import type {
  DunningSequence,
  DunningStatistics,
  DunningFilters,
  DunningSequenceStatus,
} from "@/types/platform/dunning";

const BASE_URL = "api/platform/dunning";

/**
 * Paginated dunning response
 */
export interface PaginatedDunning {
  content: DunningSequence[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

/**
 * Get active dunning sequences
 */
export async function getActiveDunning(
  limit: number = 50
): Promise<DunningSequence[]> {
  return api
    .get(`${BASE_URL}/active`, { searchParams: { limit: String(limit) } })
    .json<DunningSequence[]>();
}

/**
 * Get dunning sequences with filters
 */
export async function getDunningSequences(
  filters?: DunningFilters
): Promise<PaginatedDunning> {
  const searchParams: Record<string, string> = {};

  if (filters?.status?.length) {
    searchParams.status = filters.status.join(",");
  }
  if (filters?.organizationId) {
    searchParams.organizationId = filters.organizationId;
  }
  if (filters?.minAmount !== undefined) {
    searchParams.minAmount = String(filters.minAmount);
  }
  if (filters?.maxAmount !== undefined) {
    searchParams.maxAmount = String(filters.maxAmount);
  }
  if (filters?.startDate) {
    searchParams.startDate = filters.startDate;
  }
  if (filters?.endDate) {
    searchParams.endDate = filters.endDate;
  }
  if (filters?.page !== undefined) {
    searchParams.page = String(filters.page);
  }
  if (filters?.pageSize !== undefined) {
    searchParams.pageSize = String(filters.pageSize);
  }

  return api.get(BASE_URL, { searchParams }).json<PaginatedDunning>();
}

/**
 * Get dunning statistics
 */
export async function getDunningStatistics(): Promise<DunningStatistics> {
  return api.get(`${BASE_URL}/statistics`).json<DunningStatistics>();
}

/**
 * Get dunning sequence detail
 */
export async function getDunningDetail(
  dunningId: string
): Promise<DunningSequence> {
  return api.get(`${BASE_URL}/${dunningId}`).json<DunningSequence>();
}

/**
 * Get dunning sequences for organization
 */
export async function getOrganizationDunning(
  organizationId: string
): Promise<DunningSequence[]> {
  return api
    .get(`${BASE_URL}/organization/${organizationId}`)
    .json<DunningSequence[]>();
}

/**
 * Retry payment manually
 */
export async function retryPayment(
  dunningId: string
): Promise<{ success: boolean; message: string; sequence: DunningSequence }> {
  return api
    .post(`${BASE_URL}/${dunningId}/retry`)
    .json<{ success: boolean; message: string; sequence: DunningSequence }>();
}

/**
 * Send payment link to client
 */
export async function sendPaymentLink(
  dunningId: string
): Promise<{ success: boolean; message: string }> {
  return api
    .post(`${BASE_URL}/${dunningId}/send-payment-link`)
    .json<{ success: boolean; message: string }>();
}

/**
 * Escalate to CSM
 */
export async function escalateToCsm(
  dunningId: string,
  csmId?: string,
  notes?: string
): Promise<DunningSequence> {
  return api
    .post(`${BASE_URL}/${dunningId}/escalate`, {
      json: { csmId, notes },
    })
    .json<DunningSequence>();
}

/**
 * Pause dunning sequence
 */
export async function pauseDunning(
  dunningId: string,
  reason?: string
): Promise<DunningSequence> {
  return api
    .post(`${BASE_URL}/${dunningId}/pause`, {
      json: reason ? { reason } : undefined,
    })
    .json<DunningSequence>();
}

/**
 * Resume dunning sequence
 */
export async function resumeDunning(dunningId: string): Promise<DunningSequence> {
  return api.post(`${BASE_URL}/${dunningId}/resume`).json<DunningSequence>();
}

/**
 * Cancel dunning sequence
 */
export async function cancelDunning(
  dunningId: string,
  reason?: string
): Promise<DunningSequence> {
  return api
    .post(`${BASE_URL}/${dunningId}/cancel`, {
      json: reason ? { reason } : undefined,
    })
    .json<DunningSequence>();
}

/**
 * Mark dunning as recovered manually
 */
export async function markAsRecovered(
  dunningId: string,
  notes?: string
): Promise<DunningSequence> {
  return api
    .post(`${BASE_URL}/${dunningId}/mark-recovered`, {
      json: notes ? { notes } : undefined,
    })
    .json<DunningSequence>();
}

/**
 * Add note to dunning sequence
 */
export async function addDunningNote(
  dunningId: string,
  note: string
): Promise<DunningSequence> {
  return api
    .post(`${BASE_URL}/${dunningId}/add-note`, {
      json: { note },
    })
    .json<DunningSequence>();
}

/**
 * Get dunning sequences by status
 */
export async function getDunningByStatus(
  status: DunningSequenceStatus,
  limit: number = 50
): Promise<DunningSequence[]> {
  return api
    .get(`${BASE_URL}/by-status/${status}`, {
      searchParams: { limit: String(limit) },
    })
    .json<DunningSequence[]>();
}

/**
 * Export dunning report to CSV
 */
export async function exportDunningToCsv(
  filters?: DunningFilters
): Promise<Blob> {
  const searchParams: Record<string, string> = {};

  if (filters?.status?.length) {
    searchParams.status = filters.status.join(",");
  }
  if (filters?.startDate) {
    searchParams.startDate = filters.startDate;
  }
  if (filters?.endDate) {
    searchParams.endDate = filters.endDate;
  }

  const response = await api.get(`${BASE_URL}/export/csv`, { searchParams });
  return response.blob();
}

/**
 * Get revenue at risk summary
 */
export async function getRevenueAtRisk(): Promise<{
  total: number;
  byDay: { day: number; amount: number }[];
  currency: string;
}> {
  return api.get(`${BASE_URL}/revenue-at-risk`).json();
}
