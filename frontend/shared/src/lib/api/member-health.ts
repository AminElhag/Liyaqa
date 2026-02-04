import { api } from "./client";
import type { UUID } from "../../types/api";
import type {
  MemberHealth,
  CreateHealthRequest,
  UpdateHealthRequest,
} from "../../types/health";

// ==========================================
// MEMBER HEALTH API
// ==========================================

/**
 * Get member's health information
 */
export async function getMemberHealth(memberId: UUID): Promise<MemberHealth | null> {
  try {
    return await api.get(`api/members/${memberId}/health`).json();
  } catch (error) {
    // Return null if health info doesn't exist (404)
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Create health information for a member
 */
export async function createMemberHealth(
  memberId: UUID,
  data: CreateHealthRequest
): Promise<MemberHealth> {
  return api.post(`api/members/${memberId}/health`, { json: data }).json();
}

/**
 * Update health information for a member
 */
export async function updateMemberHealth(
  memberId: UUID,
  data: UpdateHealthRequest
): Promise<MemberHealth> {
  return api.put(`api/members/${memberId}/health`, { json: data }).json();
}

/**
 * Create or update health information (upsert)
 * Tries to get existing health, then creates or updates accordingly
 */
export async function upsertMemberHealth(
  memberId: UUID,
  data: CreateHealthRequest
): Promise<MemberHealth> {
  const existing = await getMemberHealth(memberId);
  if (existing) {
    return updateMemberHealth(memberId, data);
  }
  return createMemberHealth(memberId, data);
}

/**
 * Check if member needs medical clearance based on PAR-Q answers
 */
export function needsMedicalClearance(data: CreateHealthRequest): boolean {
  return !!(
    data.hasHeartCondition ||
    data.hasChestPainDuringActivity ||
    data.hasChestPainAtRest ||
    data.hasDizzinessOrBalance ||
    data.hasBoneJointProblem ||
    data.takesBloodPressureMedication ||
    data.hasOtherReasonNotToExercise
  );
}
