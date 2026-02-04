"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActivities,
  getActivity,
  createActivity,
  activateActivity,
  archiveActivity,
  getActivityStats,
  getConsents,
  getMemberConsents,
  getActiveConsents,
  recordConsent,
  withdrawConsent,
  getDSRs,
  getDSR,
  getOverdueDSRs,
  createDSR,
  verifyDSRIdentity,
  assignDSR,
  startDSRProcessing,
  completeDSR,
  rejectDSR,
  extendDSRDeadline,
  getDSRStats,
  getBreaches,
  getBreach,
  reportBreach,
  startBreachInvestigation,
  containBreach,
  resolveBreach,
  recordSdaiaNotification,
  getBreachStats,
} from "../lib/api/data-protection";
import type { UUID } from "../types/api";
import type {
  DataProcessingActivityParams,
  ConsentParams,
  DSRParams,
  BreachParams,
  CreateActivityRequest,
  RecordConsentRequest,
  WithdrawConsentRequest,
  CreateDSRRequest,
  VerifyIdentityRequest,
  CompleteDSRRequest,
  ExtendDSRRequest,
  ReportBreachRequest,
  ResolveBreachRequest,
} from "../types/data-protection";

// ===== Query Keys =====

export const dataProtectionKeys = {
  all: ["dataProtection"] as const,
  activities: () => [...dataProtectionKeys.all, "activities"] as const,
  activitiesList: (params: DataProcessingActivityParams) =>
    [...dataProtectionKeys.activities(), "list", params] as const,
  activityDetail: (id: UUID) =>
    [...dataProtectionKeys.activities(), "detail", id] as const,
  activityStats: () =>
    [...dataProtectionKeys.activities(), "stats"] as const,
  consents: () => [...dataProtectionKeys.all, "consents"] as const,
  consentsList: (params: ConsentParams) =>
    [...dataProtectionKeys.consents(), "list", params] as const,
  memberConsents: (memberId: UUID) =>
    [...dataProtectionKeys.consents(), "member", memberId] as const,
  activeConsents: (memberId: UUID) =>
    [...dataProtectionKeys.consents(), "active", memberId] as const,
  dsrs: () => [...dataProtectionKeys.all, "dsrs"] as const,
  dsrsList: (params: DSRParams) =>
    [...dataProtectionKeys.dsrs(), "list", params] as const,
  dsrDetail: (id: UUID) =>
    [...dataProtectionKeys.dsrs(), "detail", id] as const,
  overdueDsrs: () =>
    [...dataProtectionKeys.dsrs(), "overdue"] as const,
  dsrStats: () =>
    [...dataProtectionKeys.dsrs(), "stats"] as const,
  breaches: () => [...dataProtectionKeys.all, "breaches"] as const,
  breachesList: (params: BreachParams) =>
    [...dataProtectionKeys.breaches(), "list", params] as const,
  breachDetail: (id: UUID) =>
    [...dataProtectionKeys.breaches(), "detail", id] as const,
  breachStats: () =>
    [...dataProtectionKeys.breaches(), "stats"] as const,
};

// ===== Activity Hooks =====

export function useDataProcessingActivities(params: DataProcessingActivityParams = {}) {
  return useQuery({
    queryKey: dataProtectionKeys.activitiesList(params),
    queryFn: () => getActivities(params),
  });
}

export function useDataProcessingActivity(id: UUID) {
  return useQuery({
    queryKey: dataProtectionKeys.activityDetail(id),
    queryFn: () => getActivity(id),
    enabled: !!id,
  });
}

export function useActivityStats() {
  return useQuery({
    queryKey: dataProtectionKeys.activityStats(),
    queryFn: () => getActivityStats(),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateActivityRequest) => createActivity(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.activities() });
    },
  });
}

export function useActivateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => activateActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.activities() });
    },
  });
}

export function useArchiveActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => archiveActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.activities() });
    },
  });
}

// ===== Consent Hooks =====

export function useConsents(params: ConsentParams = {}) {
  return useQuery({
    queryKey: dataProtectionKeys.consentsList(params),
    queryFn: () => getConsents(params),
  });
}

export function useMemberConsents(memberId: UUID) {
  return useQuery({
    queryKey: dataProtectionKeys.memberConsents(memberId),
    queryFn: () => getMemberConsents(memberId),
    enabled: !!memberId,
  });
}

export function useActiveConsents(memberId: UUID) {
  return useQuery({
    queryKey: dataProtectionKeys.activeConsents(memberId),
    queryFn: () => getActiveConsents(memberId),
    enabled: !!memberId,
  });
}

export function useRecordConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: RecordConsentRequest) => recordConsent(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.consents() });
    },
  });
}

export function useWithdrawConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: WithdrawConsentRequest }) =>
      withdrawConsent(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.consents() });
    },
  });
}

// ===== DSR Hooks =====

export function useDSRs(params: DSRParams = {}) {
  return useQuery({
    queryKey: dataProtectionKeys.dsrsList(params),
    queryFn: () => getDSRs(params),
  });
}

export function useDSR(id: UUID) {
  return useQuery({
    queryKey: dataProtectionKeys.dsrDetail(id),
    queryFn: () => getDSR(id),
    enabled: !!id,
  });
}

export function useOverdueDSRs() {
  return useQuery({
    queryKey: dataProtectionKeys.overdueDsrs(),
    queryFn: () => getOverdueDSRs(),
  });
}

export function useDSRStats() {
  return useQuery({
    queryKey: dataProtectionKeys.dsrStats(),
    queryFn: () => getDSRStats(),
  });
}

export function useCreateDSR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateDSRRequest) => createDSR(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.dsrs() });
    },
  });
}

export function useVerifyDSRIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: VerifyIdentityRequest }) =>
      verifyDSRIdentity(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.dsrs() });
    },
  });
}

export function useAssignDSR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: UUID; userId: UUID }) =>
      assignDSR(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.dsrs() });
    },
  });
}

export function useStartDSRProcessing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => startDSRProcessing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.dsrs() });
    },
  });
}

export function useCompleteDSR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: CompleteDSRRequest }) =>
      completeDSR(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.dsrs() });
    },
  });
}

export function useRejectDSR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: UUID; reason: string }) =>
      rejectDSR(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.dsrs() });
    },
  });
}

export function useExtendDSRDeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: ExtendDSRRequest }) =>
      extendDSRDeadline(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.dsrs() });
    },
  });
}

// ===== Breach Hooks =====

export function useBreaches(params: BreachParams = {}) {
  return useQuery({
    queryKey: dataProtectionKeys.breachesList(params),
    queryFn: () => getBreaches(params),
  });
}

export function useBreach(id: UUID) {
  return useQuery({
    queryKey: dataProtectionKeys.breachDetail(id),
    queryFn: () => getBreach(id),
    enabled: !!id,
  });
}

export function useBreachStats() {
  return useQuery({
    queryKey: dataProtectionKeys.breachStats(),
    queryFn: () => getBreachStats(),
  });
}

export function useReportBreach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ReportBreachRequest) => reportBreach(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.breaches() });
    },
  });
}

export function useStartBreachInvestigation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => startBreachInvestigation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.breaches() });
    },
  });
}

export function useContainBreach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => containBreach(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.breaches() });
    },
  });
}

export function useResolveBreach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: ResolveBreachRequest }) =>
      resolveBreach(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.breaches() });
    },
  });
}

export function useRecordSdaiaNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reference }: { id: UUID; reference: string }) =>
      recordSdaiaNotification(id, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataProtectionKeys.breaches() });
    },
  });
}
