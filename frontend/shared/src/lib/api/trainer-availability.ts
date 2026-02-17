import { api } from "./client";
import type { UUID } from "../../types/api";
import type {
  TrainerAvailabilitySlot,
  SetTrainerAvailabilityRequest,
  BlockSlotRequest,
} from "../../types/scheduling";

const ENDPOINT = "api/trainer-availability";

/**
 * Set trainer availability (bulk upsert).
 * Replaces all recurring slots for the trainer.
 */
export async function setTrainerAvailability(
  trainerId: UUID,
  data: SetTrainerAvailabilityRequest
): Promise<TrainerAvailabilitySlot[]> {
  return api.put(`${ENDPOINT}/${trainerId}`, { json: data }).json();
}

/**
 * Get trainer availability slots.
 * Optionally filter by date range.
 */
export async function getTrainerAvailabilitySlots(
  trainerId: UUID,
  params: { startDate?: string; endDate?: string } = {}
): Promise<TrainerAvailabilitySlot[]> {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  const query = searchParams.toString();
  const url = query
    ? `${ENDPOINT}/${trainerId}?${query}`
    : `${ENDPOINT}/${trainerId}`;
  return api.get(url).json();
}

/**
 * Get available (not booked/blocked) slots for a trainer on a specific date.
 */
export async function getAvailableSlots(
  trainerId: UUID,
  date: string
): Promise<TrainerAvailabilitySlot[]> {
  const params = new URLSearchParams({ date });
  return api.get(`${ENDPOINT}/${trainerId}/slots?${params}`).json();
}

/**
 * Block a specific time slot on a trainer's calendar.
 */
export async function blockTrainerSlot(
  trainerId: UUID,
  data: BlockSlotRequest
): Promise<TrainerAvailabilitySlot> {
  return api.post(`${ENDPOINT}/${trainerId}/block`, { json: data }).json();
}
