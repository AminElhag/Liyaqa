"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getActiveLeads,
  getUnassignedLeads,
  getMyLeads,
  transitionLeadStatus,
  markLeadContacted,
  scheduleLeadTour,
  startLeadTrial,
  convertLead,
  markLeadLost,
  reopenLead,
  assignLead,
  bulkAssignLeads,
  logLeadActivity,
  getLeadActivities,
  completeFollowUp,
  deleteLeadActivity,
  getPendingFollowUps,
  getOverdueFollowUps,
  getPipelineStats,
  getSourceStats,
  getActivityStats,
  type LeadQueryParams,
} from "@/lib/api/leads";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Lead,
  LeadActivity,
  CreateLeadRequest,
  UpdateLeadRequest,
  TransitionStatusRequest,
  AssignLeadRequest,
  BulkAssignRequest,
  ConvertLeadRequest,
  LogActivityRequest,
  CompleteFollowUpRequest,
  PipelineStats,
  SourceStats,
  ActivityStats,
} from "@/types/lead";

// Query keys
export const leadKeys = {
  all: ["leads"] as const,
  lists: () => [...leadKeys.all, "list"] as const,
  list: (params: LeadQueryParams) => [...leadKeys.lists(), params] as const,
  details: () => [...leadKeys.all, "detail"] as const,
  detail: (id: UUID) => [...leadKeys.details(), id] as const,
  active: (params?: { page?: number; size?: number }) => [...leadKeys.all, "active", params] as const,
  unassigned: (params?: { page?: number; size?: number }) => [...leadKeys.all, "unassigned", params] as const,
  my: (params?: { page?: number; size?: number }) => [...leadKeys.all, "my", params] as const,
  activities: (leadId: UUID) => [...leadKeys.all, "activities", leadId] as const,
  activityList: (leadId: UUID, params?: { page?: number; size?: number }) =>
    [...leadKeys.activities(leadId), params] as const,
  pendingFollowUps: (params?: { page?: number; size?: number }) =>
    [...leadKeys.all, "follow-ups", "pending", params] as const,
  overdueFollowUps: (params?: { page?: number; size?: number }) =>
    [...leadKeys.all, "follow-ups", "overdue", params] as const,
  stats: () => [...leadKeys.all, "stats"] as const,
  pipelineStats: () => [...leadKeys.stats(), "pipeline"] as const,
  sourceStats: () => [...leadKeys.stats(), "sources"] as const,
  activityStats: () => [...leadKeys.stats(), "activities"] as const,
};

// ============ Query Hooks ============

/**
 * Hook to fetch paginated leads
 */
export function useLeads(
  params: LeadQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Lead>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => getLeads(params),
    ...options,
  });
}

/**
 * Hook to fetch a single lead by ID
 */
export function useLead(
  id: UUID,
  options?: Omit<UseQueryOptions<Lead>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => getLead(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch active leads
 */
export function useActiveLeads(
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Lead>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.active(params),
    queryFn: () => getActiveLeads(params),
    ...options,
  });
}

/**
 * Hook to fetch unassigned leads
 */
export function useUnassignedLeads(
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Lead>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.unassigned(params),
    queryFn: () => getUnassignedLeads(params),
    ...options,
  });
}

/**
 * Hook to fetch leads assigned to current user
 */
export function useMyLeads(
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Lead>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.my(params),
    queryFn: () => getMyLeads(params),
    ...options,
  });
}

/**
 * Hook to fetch lead activities
 */
export function useLeadActivities(
  leadId: UUID,
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<LeadActivity>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.activityList(leadId, params),
    queryFn: () => getLeadActivities(leadId, params),
    enabled: !!leadId,
    ...options,
  });
}

/**
 * Hook to fetch pending follow-ups
 */
export function usePendingFollowUps(
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<LeadActivity>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.pendingFollowUps(params),
    queryFn: () => getPendingFollowUps(params),
    ...options,
  });
}

/**
 * Hook to fetch overdue follow-ups
 */
export function useOverdueFollowUps(
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<LeadActivity>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.overdueFollowUps(params),
    queryFn: () => getOverdueFollowUps(params),
    ...options,
  });
}

/**
 * Hook to fetch pipeline statistics
 */
export function usePipelineStats(
  options?: Omit<UseQueryOptions<PipelineStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.pipelineStats(),
    queryFn: getPipelineStats,
    ...options,
  });
}

/**
 * Hook to fetch source statistics
 */
export function useSourceStats(
  options?: Omit<UseQueryOptions<SourceStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.sourceStats(),
    queryFn: getSourceStats,
    ...options,
  });
}

/**
 * Hook to fetch activity statistics
 */
export function useActivityStats(
  options?: Omit<UseQueryOptions<ActivityStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadKeys.activityStats(),
    queryFn: getActivityStats,
    ...options,
  });
}

// ============ Mutation Hooks ============

/**
 * Hook to create a lead
 */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadRequest) => createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
    },
  });
}

/**
 * Hook to update a lead
 */
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateLeadRequest }) =>
      updateLead(id, data),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/**
 * Hook to delete a lead
 */
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
    },
  });
}

/**
 * Hook to transition lead status
 */
export function useTransitionLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: TransitionStatusRequest }) =>
      transitionLeadStatus(id, data),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/**
 * Hook to mark lead as contacted
 */
export function useMarkLeadContacted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => markLeadContacted(id),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/**
 * Hook to schedule tour
 */
export function useScheduleLeadTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => scheduleLeadTour(id),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/**
 * Hook to start trial
 */
export function useStartLeadTrial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => startLeadTrial(id),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/**
 * Hook to convert lead to member
 */
export function useConvertLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: ConvertLeadRequest }) =>
      convertLead(id, data),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/**
 * Hook to mark lead as lost
 */
export function useMarkLeadLost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: UUID; reason?: string }) =>
      markLeadLost(id, reason),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/**
 * Hook to reopen a lost lead
 */
export function useReopenLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => reopenLead(id),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/**
 * Hook to assign lead
 */
export function useAssignLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: AssignLeadRequest }) =>
      assignLead(id, data),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/**
 * Hook to bulk assign leads
 */
export function useBulkAssignLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkAssignRequest) => bulkAssignLeads(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

/**
 * Hook to log lead activity
 */
export function useLogLeadActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: UUID; data: LogActivityRequest }) =>
      logLeadActivity(leadId, data),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.activities(leadId) });
      queryClient.invalidateQueries({ queryKey: leadKeys.activityStats() });
    },
  });
}

/**
 * Hook to complete follow-up
 */
export function useCompleteFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, data }: { activityId: UUID; data: CompleteFollowUpRequest }) =>
      completeFollowUp(activityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

/**
 * Hook to delete activity
 */
export function useDeleteLeadActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: UUID) => deleteLeadActivity(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}
