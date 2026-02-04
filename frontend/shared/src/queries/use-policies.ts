"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPolicies,
  getPolicy,
  getPoliciesByType,
  getPublishedPolicy,
  getPoliciesRequiringAcknowledgement,
  getPoliciesDueForReview,
  getPendingAcknowledgements,
  createPolicy,
  updatePolicy,
  createNewVersion,
  submitForReview,
  approvePolicy,
  publishPolicy,
  returnToDraft,
  archivePolicy,
  completeReview,
  getPolicyAcknowledgements,
  getAcknowledgementCount,
  hasAcknowledged,
  acknowledgePolicy,
  getMyAcknowledgements,
} from "../lib/api/policies";
import type { UUID } from "../types/api";
import type {
  PolicyParams,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  AcknowledgePolicyRequest,
  PolicyType,
} from "../types/policy";

// ===== Query Keys =====

export const policyKeys = {
  all: ["policies"] as const,
  lists: () => [...policyKeys.all, "list"] as const,
  list: (params: PolicyParams) =>
    [...policyKeys.lists(), params] as const,
  detail: (id: UUID) =>
    [...policyKeys.all, "detail", id] as const,
  byType: (type: PolicyType) =>
    [...policyKeys.all, "type", type] as const,
  published: (type: PolicyType) =>
    [...policyKeys.all, "published", type] as const,
  requiringAcknowledgement: () =>
    [...policyKeys.all, "requiringAcknowledgement"] as const,
  dueForReview: () =>
    [...policyKeys.all, "dueForReview"] as const,
  pendingAcknowledgements: () =>
    [...policyKeys.all, "pendingAcknowledgements"] as const,
  acknowledgements: (policyId: UUID) =>
    [...policyKeys.all, "acknowledgements", policyId] as const,
  acknowledgementCount: (policyId: UUID) =>
    [...policyKeys.all, "acknowledgementCount", policyId] as const,
  hasAcknowledged: (policyId: UUID) =>
    [...policyKeys.all, "hasAcknowledged", policyId] as const,
  myAcknowledgements: () =>
    [...policyKeys.all, "myAcknowledgements"] as const,
};

// ===== Policy Hooks =====

export function usePolicies(params: PolicyParams = {}) {
  return useQuery({
    queryKey: policyKeys.list(params),
    queryFn: () => getPolicies(params),
  });
}

export function usePolicy(id: UUID) {
  return useQuery({
    queryKey: policyKeys.detail(id),
    queryFn: () => getPolicy(id),
    enabled: !!id,
  });
}

export function usePoliciesByType(type: PolicyType) {
  return useQuery({
    queryKey: policyKeys.byType(type),
    queryFn: () => getPoliciesByType(type),
    enabled: !!type,
  });
}

export function usePublishedPolicy(type: PolicyType) {
  return useQuery({
    queryKey: policyKeys.published(type),
    queryFn: () => getPublishedPolicy(type),
    enabled: !!type,
  });
}

export function usePoliciesRequiringAcknowledgement() {
  return useQuery({
    queryKey: policyKeys.requiringAcknowledgement(),
    queryFn: () => getPoliciesRequiringAcknowledgement(),
  });
}

export function usePoliciesDueForReview() {
  return useQuery({
    queryKey: policyKeys.dueForReview(),
    queryFn: () => getPoliciesDueForReview(),
  });
}

export function usePendingAcknowledgements() {
  return useQuery({
    queryKey: policyKeys.pendingAcknowledgements(),
    queryFn: () => getPendingAcknowledgements(),
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreatePolicyRequest) => createPolicy(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: UpdatePolicyRequest }) =>
      updatePolicy(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

export function useCreateNewVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => createNewVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => submitForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

export function useApprovePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => approvePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

export function usePublishPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, effectiveDate }: { id: UUID; effectiveDate?: string }) =>
      publishPolicy(id, effectiveDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

export function useReturnToDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => returnToDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

export function useArchivePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => archivePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

export function useCompleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nextReviewDate }: { id: UUID; nextReviewDate: string }) =>
      completeReview(id, nextReviewDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

// ===== Acknowledgement Hooks =====

export function usePolicyAcknowledgements(policyId: UUID) {
  return useQuery({
    queryKey: policyKeys.acknowledgements(policyId),
    queryFn: () => getPolicyAcknowledgements(policyId),
    enabled: !!policyId,
  });
}

export function useAcknowledgementCount(policyId: UUID) {
  return useQuery({
    queryKey: policyKeys.acknowledgementCount(policyId),
    queryFn: () => getAcknowledgementCount(policyId),
    enabled: !!policyId,
  });
}

export function useHasAcknowledged(policyId: UUID) {
  return useQuery({
    queryKey: policyKeys.hasAcknowledged(policyId),
    queryFn: () => hasAcknowledged(policyId),
    enabled: !!policyId,
  });
}

export function useAcknowledgePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, request }: { policyId: UUID; request: AcknowledgePolicyRequest }) =>
      acknowledgePolicy(policyId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}

export function useMyAcknowledgements() {
  return useQuery({
    queryKey: policyKeys.myAcknowledgements(),
    queryFn: () => getMyAcknowledgements(),
  });
}
