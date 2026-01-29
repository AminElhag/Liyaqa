"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as onboardingApi from "@/lib/api/onboarding";

// Query keys
export const onboardingKeys = {
  all: ["onboarding"] as const,
  member: (memberId: string) => [...onboardingKeys.all, "member", memberId] as const,
  checklist: (memberId: string) => [...onboardingKeys.all, "checklist", memberId] as const,
  status: (memberId: string) => [...onboardingKeys.all, "status", memberId] as const,
  incomplete: () => [...onboardingKeys.all, "incomplete"] as const,
  myIncomplete: () => [...onboardingKeys.all, "my-incomplete"] as const,
  overdue: () => [...onboardingKeys.all, "overdue"] as const,
  recent: () => [...onboardingKeys.all, "recent"] as const,
  stats: () => [...onboardingKeys.all, "stats"] as const,
  steps: () => [...onboardingKeys.all, "steps"] as const,
};

// Queries

export function useMemberOnboarding(memberId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: onboardingKeys.member(memberId),
    queryFn: () => onboardingApi.getMemberOnboarding(memberId),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useOnboardingChecklist(memberId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: onboardingKeys.checklist(memberId),
    queryFn: () => onboardingApi.getMemberOnboardingChecklist(memberId),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useOnboardingStatus(memberId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: onboardingKeys.status(memberId),
    queryFn: () => onboardingApi.getOnboardingStatus(memberId),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useIncompleteOnboardings(
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...onboardingKeys.incomplete(), params],
    queryFn: () => onboardingApi.getIncompleteOnboardings(params),
    enabled: options?.enabled !== false,
  });
}

export function useMyIncompleteOnboardings(
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...onboardingKeys.myIncomplete(), params],
    queryFn: () => onboardingApi.getMyIncompleteOnboardings(params),
    enabled: options?.enabled !== false,
  });
}

export function useOverdueOnboardings(
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...onboardingKeys.overdue(), params],
    queryFn: () => onboardingApi.getOverdueOnboardings(params),
    enabled: options?.enabled !== false,
  });
}

export function useRecentOnboardings(
  params?: { days?: number; page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...onboardingKeys.recent(), params],
    queryFn: () => onboardingApi.getRecentOnboardings(params),
    enabled: options?.enabled !== false,
  });
}

export function useOnboardingStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: onboardingKeys.stats(),
    queryFn: () => onboardingApi.getOnboardingStats(),
    enabled: options?.enabled !== false,
  });
}

export function useOnboardingSteps(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: onboardingKeys.steps(),
    queryFn: () => onboardingApi.getOnboardingSteps(),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Mutations

export function useCreateOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: onboardingApi.CreateOnboardingRequest) =>
      onboardingApi.createOnboarding(request),
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.member(data.memberId), data);
      queryClient.invalidateQueries({ queryKey: onboardingKeys.incomplete() });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.stats() });
    },
  });
}

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      request,
    }: {
      memberId: string;
      request: onboardingApi.CompleteStepRequest;
    }) => onboardingApi.completeOnboardingStep(memberId, request),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(onboardingKeys.member(variables.memberId), data);
      queryClient.invalidateQueries({ queryKey: onboardingKeys.checklist(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.incomplete() });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.stats() });
    },
  });
}

export function useSkipOnboardingStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      request,
    }: {
      memberId: string;
      request: onboardingApi.SkipStepRequest;
    }) => onboardingApi.skipOnboardingStep(memberId, request),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(onboardingKeys.member(variables.memberId), data);
      queryClient.invalidateQueries({ queryKey: onboardingKeys.checklist(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status(variables.memberId) });
    },
  });
}

export function useAssignOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      assigneeUserId,
    }: {
      memberId: string;
      assigneeUserId: string;
    }) => onboardingApi.assignOnboarding(memberId, { assigneeUserId }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(onboardingKeys.member(variables.memberId), data);
      queryClient.invalidateQueries({ queryKey: onboardingKeys.myIncomplete() });
    },
  });
}

export function useUpdateOnboardingNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      notes,
    }: {
      memberId: string;
      notes: string;
    }) => onboardingApi.updateOnboardingNotes(memberId, { notes }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(onboardingKeys.member(variables.memberId), data);
    },
  });
}
