"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getTrainers,
  getTrainer,
  createTrainer,
  updateTrainerProfile,
  updateTrainerBasicInfo,
  deleteTrainer,
  activateTrainer,
  deactivateTrainer,
  setTrainerOnLeave,
  terminateTrainer,
  getTrainerAvailability,
  updateTrainerAvailability,
  updateTrainerSkills,
  getTrainerClubs,
  assignTrainerToClub,
  removeTrainerFromClub,
  resetTrainerPassword,
  sendTrainerResetEmail,
  getMyTrainerProfile,
  getTrainersByClub,
  getTrainerAvailableSlots,
  getAvailableTrainersForPT,
} from "../lib/api/trainers";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  Trainer,
  TrainerSummary,
  TrainerClubAssignment,
  CreateTrainerRequest,
  ResetTrainerPasswordRequest,
  UpdateTrainerProfileRequest,
  UpdateTrainerBasicInfoRequest,
  UpdateAvailabilityRequest,
  UpdateTrainerSkillsRequest,
  AssignTrainerToClubRequest,
  TrainerQueryParams,
  Availability,
  AvailableTimeSlot,
} from "../types/trainer";

// Query keys
export const trainerKeys = {
  all: ["trainers"] as const,
  lists: () => [...trainerKeys.all, "list"] as const,
  list: (params: TrainerQueryParams) => [...trainerKeys.lists(), params] as const,
  details: () => [...trainerKeys.all, "detail"] as const,
  detail: (id: UUID) => [...trainerKeys.details(), id] as const,
  availability: (id: UUID) => [...trainerKeys.all, "availability", id] as const,
  availableSlots: (id: UUID, date: string, duration: number) =>
    [...trainerKeys.all, "availableSlots", id, date, duration] as const,
  clubs: (id: UUID) => [...trainerKeys.all, "clubs", id] as const,
  byClub: (clubId: UUID) => [...trainerKeys.all, "byClub", clubId] as const,
  me: () => [...trainerKeys.all, "me"] as const,
};

// ==================== Query Hooks ====================

/**
 * Hook to fetch paginated trainers list
 */
export function useTrainers(
  params: TrainerQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<TrainerSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerKeys.list(params),
    queryFn: () => getTrainers(params),
    ...options,
  });
}

/**
 * Hook to fetch a single trainer by ID
 */
export function useTrainer(
  id: UUID,
  options?: Omit<UseQueryOptions<Trainer>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerKeys.detail(id),
    queryFn: () => getTrainer(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch trainer availability
 */
export function useTrainerAvailability(
  id: UUID,
  options?: Omit<UseQueryOptions<Availability | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerKeys.availability(id),
    queryFn: () => getTrainerAvailability(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch available time slots for booking
 */
export function useTrainerAvailableSlots(
  id: UUID,
  date: string,
  slotDurationMinutes: number = 60,
  options?: Omit<UseQueryOptions<AvailableTimeSlot[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerKeys.availableSlots(id, date, slotDurationMinutes),
    queryFn: () => getTrainerAvailableSlots(id, date, slotDurationMinutes),
    enabled: !!id && !!date,
    ...options,
  });
}

/**
 * Hook to fetch trainer's club assignments
 */
export function useTrainerClubs(
  id: UUID,
  options?: Omit<UseQueryOptions<TrainerClubAssignment[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerKeys.clubs(id),
    queryFn: () => getTrainerClubs(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch trainers by club
 */
export function useTrainersByClub(
  clubId: UUID,
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<TrainerSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerKeys.byClub(clubId),
    queryFn: () => getTrainersByClub(clubId, params),
    enabled: !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch current user's trainer profile
 */
export function useMyTrainerProfile(
  options?: Omit<UseQueryOptions<Trainer>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerKeys.me(),
    queryFn: () => getMyTrainerProfile(),
    ...options,
  });
}

/**
 * Hook to fetch trainers available for PT booking (member view)
 */
export function useAvailableTrainersForPT(
  params: TrainerQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<TrainerSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...trainerKeys.lists(), "availableForPT", params],
    queryFn: () => getAvailableTrainersForPT(params),
    ...options,
  });
}

// ==================== Mutation Hooks ====================

/**
 * Hook to create a new trainer
 */
export function useCreateTrainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrainerRequest) => createTrainer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

/**
 * Hook to update a trainer profile
 */
export function useUpdateTrainerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateTrainerProfileRequest }) =>
      updateTrainerProfile(id, data),
    onSuccess: (updatedTrainer) => {
      queryClient.setQueryData(trainerKeys.detail(updatedTrainer.id), updatedTrainer);
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

/**
 * Hook to update trainer basic info (display name, date of birth, gender)
 */
export function useUpdateTrainerBasicInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateTrainerBasicInfoRequest }) =>
      updateTrainerBasicInfo(id, data),
    onSuccess: (updatedTrainer) => {
      queryClient.setQueryData(trainerKeys.detail(updatedTrainer.id), updatedTrainer);
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

/**
 * Hook to delete a trainer
 */
export function useDeleteTrainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteTrainer(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: trainerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

/**
 * Hook to activate a trainer
 */
export function useActivateTrainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateTrainer(id),
    onSuccess: (updatedTrainer) => {
      queryClient.setQueryData(trainerKeys.detail(updatedTrainer.id), updatedTrainer);
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

/**
 * Hook to deactivate a trainer
 */
export function useDeactivateTrainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateTrainer(id),
    onSuccess: (updatedTrainer) => {
      queryClient.setQueryData(trainerKeys.detail(updatedTrainer.id), updatedTrainer);
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

/**
 * Hook to set trainer on leave
 */
export function useSetTrainerOnLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => setTrainerOnLeave(id),
    onSuccess: (updatedTrainer) => {
      queryClient.setQueryData(trainerKeys.detail(updatedTrainer.id), updatedTrainer);
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

/**
 * Hook to terminate a trainer
 */
export function useTerminateTrainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => terminateTrainer(id),
    onSuccess: (updatedTrainer) => {
      queryClient.setQueryData(trainerKeys.detail(updatedTrainer.id), updatedTrainer);
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

/**
 * Hook to update trainer availability
 */
export function useUpdateTrainerAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateAvailabilityRequest }) =>
      updateTrainerAvailability(id, data),
    onSuccess: (updatedTrainer) => {
      queryClient.setQueryData(trainerKeys.detail(updatedTrainer.id), updatedTrainer);
      queryClient.invalidateQueries({ queryKey: trainerKeys.availability(updatedTrainer.id) });
    },
  });
}

/**
 * Hook to assign trainer to club
 */
export function useAssignTrainerToClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: AssignTrainerToClubRequest }) =>
      assignTrainerToClub(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: trainerKeys.clubs(id) });
      queryClient.invalidateQueries({ queryKey: trainerKeys.detail(id) });
    },
  });
}

/**
 * Hook to remove trainer from club
 */
export function useRemoveTrainerFromClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trainerId, clubId }: { trainerId: UUID; clubId: UUID }) =>
      removeTrainerFromClub(trainerId, clubId),
    onSuccess: (_, { trainerId }) => {
      queryClient.invalidateQueries({ queryKey: trainerKeys.clubs(trainerId) });
      queryClient.invalidateQueries({ queryKey: trainerKeys.detail(trainerId) });
    },
  });
}

/**
 * Hook to update trainer skills (class categories)
 */
export function useUpdateTrainerSkills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateTrainerSkillsRequest }) =>
      updateTrainerSkills(id, data),
    onSuccess: (updatedTrainer) => {
      queryClient.setQueryData(trainerKeys.detail(updatedTrainer.id), updatedTrainer);
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

/**
 * Hook to reset a trainer's password (admin action)
 */
export function useResetTrainerPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: ResetTrainerPasswordRequest }) =>
      resetTrainerPassword(id, data),
  });
}

/**
 * Hook to send password reset email to trainer (admin action)
 */
export function useSendTrainerResetEmail() {
  return useMutation({
    mutationFn: (id: UUID) => sendTrainerResetEmail(id),
  });
}
