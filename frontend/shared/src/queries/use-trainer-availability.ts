"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  setTrainerAvailability,
  getTrainerAvailabilitySlots,
  getAvailableSlots,
  blockTrainerSlot,
} from "../lib/api/trainer-availability";
import type { UUID } from "../types/api";
import type {
  TrainerAvailabilitySlot,
  SetTrainerAvailabilityRequest,
  BlockSlotRequest,
} from "../types/scheduling";
import { trainerKeys } from "./use-trainers";

// Query keys
export const trainerAvailabilityKeys = {
  all: ["trainer-availability"] as const,
  slots: (trainerId: UUID) =>
    [...trainerAvailabilityKeys.all, "slots", trainerId] as const,
  slotsRange: (trainerId: UUID, startDate?: string, endDate?: string) =>
    [...trainerAvailabilityKeys.slots(trainerId), startDate, endDate] as const,
  available: (trainerId: UUID, date: string) =>
    [...trainerAvailabilityKeys.all, "available", trainerId, date] as const,
};

/**
 * Hook to fetch trainer availability slots
 */
export function useTrainerAvailabilitySlots(
  trainerId: UUID,
  params: { startDate?: string; endDate?: string } = {},
  options?: Omit<
    UseQueryOptions<TrainerAvailabilitySlot[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerAvailabilityKeys.slotsRange(
      trainerId,
      params.startDate,
      params.endDate
    ),
    queryFn: () => getTrainerAvailabilitySlots(trainerId, params),
    enabled: !!trainerId,
    ...options,
  });
}

/**
 * Hook to fetch available (unbooked) slots for a trainer on a date
 */
export function useAvailableSlots(
  trainerId: UUID,
  date: string,
  options?: Omit<
    UseQueryOptions<TrainerAvailabilitySlot[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerAvailabilityKeys.available(trainerId, date),
    queryFn: () => getAvailableSlots(trainerId, date),
    enabled: !!trainerId && !!date,
    ...options,
  });
}

/**
 * Hook to set trainer availability (bulk upsert)
 */
export function useSetTrainerAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trainerId,
      data,
    }: {
      trainerId: UUID;
      data: SetTrainerAvailabilityRequest;
    }) => setTrainerAvailability(trainerId, data),
    onSuccess: (_, { trainerId }) => {
      queryClient.invalidateQueries({
        queryKey: trainerAvailabilityKeys.slots(trainerId),
      });
      queryClient.invalidateQueries({
        queryKey: trainerKeys.availability(trainerId),
      });
    },
  });
}

/**
 * Hook to block a trainer's time slot
 */
export function useBlockTrainerSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trainerId,
      data,
    }: {
      trainerId: UUID;
      data: BlockSlotRequest;
    }) => blockTrainerSlot(trainerId, data),
    onSuccess: (_, { trainerId }) => {
      queryClient.invalidateQueries({
        queryKey: trainerAvailabilityKeys.slots(trainerId),
      });
      queryClient.invalidateQueries({
        queryKey: trainerKeys.availability(trainerId),
      });
    },
  });
}
