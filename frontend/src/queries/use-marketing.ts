'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  activateCampaign,
  pauseCampaign,
  archiveCampaign,
  duplicateCampaign,
  getCampaignSteps,
  addCampaignStep,
  updateCampaignStep,
  deleteCampaignStep,
  getCampaignEnrollments,
  enrollMembers,
  cancelEnrollment,
  getSegments,
  getSegment,
  createSegment,
  updateSegment,
  deleteSegment,
  activateSegment,
  deactivateSegment,
  previewSegmentMembers,
  addSegmentMembers,
  removeSegmentMember,
  recalculateSegment,
  getMarketingOverview,
  getCampaignAnalytics,
  getCampaignAbTestResults,
  getCampaignTimeline,
  getCampaignTemplates,
  createCampaignFromTemplate,
  type CampaignQueryParams,
  type SegmentQueryParams,
  type EnrollmentQueryParams,
} from '@/lib/api/marketing';
import type { PaginatedResponse, UUID } from '@/types/api';
import type {
  Campaign,
  CampaignDetail,
  CampaignStep,
  Segment,
  Enrollment,
  MarketingOverview,
  CampaignAnalytics,
  AbTestResult,
  TimelineDataPoint,
  MemberPreview,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CreateCampaignStepRequest,
  UpdateCampaignStepRequest,
  CreateSegmentRequest,
  UpdateSegmentRequest,
} from '@/types/marketing';

// ==================== QUERY KEYS ====================

export const marketingKeys = {
  all: ['marketing'] as const,
  campaigns: () => [...marketingKeys.all, 'campaigns'] as const,
  campaignList: (params: CampaignQueryParams) =>
    [...marketingKeys.campaigns(), 'list', params] as const,
  campaignDetail: (id: UUID) => [...marketingKeys.campaigns(), 'detail', id] as const,
  campaignSteps: (id: UUID) => [...marketingKeys.campaigns(), 'steps', id] as const,
  campaignEnrollments: (id: UUID, params: EnrollmentQueryParams) =>
    [...marketingKeys.campaigns(), 'enrollments', id, params] as const,
  templates: () => [...marketingKeys.campaigns(), 'templates'] as const,
  templateList: (page: number, size: number) =>
    [...marketingKeys.templates(), 'list', page, size] as const,
  segments: () => [...marketingKeys.all, 'segments'] as const,
  segmentList: (params: SegmentQueryParams) =>
    [...marketingKeys.segments(), 'list', params] as const,
  segmentDetail: (id: UUID) => [...marketingKeys.segments(), 'detail', id] as const,
  segmentPreview: (id: UUID, page: number, size: number) =>
    [...marketingKeys.segments(), 'preview', id, page, size] as const,
  analytics: () => [...marketingKeys.all, 'analytics'] as const,
  overview: () => [...marketingKeys.analytics(), 'overview'] as const,
  campaignAnalytics: (id: UUID) =>
    [...marketingKeys.analytics(), 'campaign', id] as const,
  abTestResults: (id: UUID) =>
    [...marketingKeys.analytics(), 'ab-test', id] as const,
  timeline: (id: UUID, days: number) =>
    [...marketingKeys.analytics(), 'timeline', id, days] as const,
};

// ==================== CAMPAIGN HOOKS ====================

export function useCampaigns(
  params: CampaignQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Campaign>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: marketingKeys.campaignList(params),
    queryFn: () => getCampaigns(params),
    ...options,
  });
}

export function useCampaign(
  id: UUID,
  options?: Omit<UseQueryOptions<CampaignDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: marketingKeys.campaignDetail(id),
    queryFn: () => getCampaign(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateCampaignRequest }) =>
      updateCampaign(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaignDetail(id) });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
    },
  });
}

export function useActivateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateCampaign(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaignDetail(id) });
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => pauseCampaign(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaignDetail(id) });
    },
  });
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => archiveCampaign(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaignDetail(id) });
    },
  });
}

export function useDuplicateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newName }: { id: UUID; newName: string }) =>
      duplicateCampaign(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
    },
  });
}

// ==================== TEMPLATE HOOKS ====================

export function useCampaignTemplates(
  page: number = 0,
  size: number = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<Campaign>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: marketingKeys.templateList(page, size),
    queryFn: () => getCampaignTemplates(page, size),
    ...options,
  });
}

export function useCreateCampaignFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: UUID; name: string }) =>
      createCampaignFromTemplate(templateId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
    },
  });
}

// ==================== CAMPAIGN STEP HOOKS ====================

export function useCampaignSteps(
  campaignId: UUID,
  options?: Omit<UseQueryOptions<CampaignStep[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: marketingKeys.campaignSteps(campaignId),
    queryFn: () => getCampaignSteps(campaignId),
    enabled: !!campaignId,
    ...options,
  });
}

export function useAddCampaignStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: UUID;
      data: CreateCampaignStepRequest;
    }) => addCampaignStep(campaignId, data),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaignSteps(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaignDetail(campaignId),
      });
    },
  });
}

export function useUpdateCampaignStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      stepId,
      data,
    }: {
      campaignId: UUID;
      stepId: UUID;
      data: UpdateCampaignStepRequest;
    }) => updateCampaignStep(campaignId, stepId, data),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaignSteps(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaignDetail(campaignId),
      });
    },
  });
}

export function useDeleteCampaignStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, stepId }: { campaignId: UUID; stepId: UUID }) =>
      deleteCampaignStep(campaignId, stepId),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaignSteps(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaignDetail(campaignId),
      });
    },
  });
}

// ==================== ENROLLMENT HOOKS ====================

export function useCampaignEnrollments(
  campaignId: UUID,
  params: EnrollmentQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Enrollment>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: marketingKeys.campaignEnrollments(campaignId, params),
    queryFn: () => getCampaignEnrollments(campaignId, params),
    enabled: !!campaignId,
    ...options,
  });
}

export function useEnrollMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      memberIds,
    }: {
      campaignId: UUID;
      memberIds: UUID[];
    }) => enrollMembers(campaignId, memberIds),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaigns(),
      });
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaignDetail(campaignId),
      });
    },
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      enrollmentId,
    }: {
      campaignId: UUID;
      enrollmentId: UUID;
    }) => cancelEnrollment(campaignId, enrollmentId),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaigns(),
      });
      queryClient.invalidateQueries({
        queryKey: marketingKeys.campaignDetail(campaignId),
      });
    },
  });
}

// ==================== SEGMENT HOOKS ====================

export function useSegments(
  params: SegmentQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Segment>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: marketingKeys.segmentList(params),
    queryFn: () => getSegments(params),
    ...options,
  });
}

export function useSegment(
  id: UUID,
  options?: Omit<UseQueryOptions<Segment>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: marketingKeys.segmentDetail(id),
    queryFn: () => getSegment(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSegmentRequest) => createSegment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
    },
  });
}

export function useUpdateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateSegmentRequest }) =>
      updateSegment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.segmentDetail(id) });
    },
  });
}

export function useDeleteSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteSegment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
    },
  });
}

export function useActivateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateSegment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.segmentDetail(id) });
    },
  });
}

export function useDeactivateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateSegment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.segmentDetail(id) });
    },
  });
}

export function useSegmentPreview(
  id: UUID,
  page: number = 0,
  size: number = 20,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<MemberPreview>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: marketingKeys.segmentPreview(id, page, size),
    queryFn: () => previewSegmentMembers(id, page, size),
    enabled: !!id,
    ...options,
  });
}

export function useAddSegmentMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, memberIds }: { id: UUID; memberIds: UUID[] }) =>
      addSegmentMembers(id, memberIds),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.segmentDetail(id) });
    },
  });
}

export function useRemoveSegmentMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, memberId }: { id: UUID; memberId: UUID }) =>
      removeSegmentMember(id, memberId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.segmentDetail(id) });
    },
  });
}

export function useRecalculateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => recalculateSegment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.segmentDetail(id) });
    },
  });
}

// ==================== ANALYTICS HOOKS ====================

export function useMarketingOverview(
  options?: Omit<UseQueryOptions<MarketingOverview>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: marketingKeys.overview(),
    queryFn: () => getMarketingOverview(),
    ...options,
  });
}

export function useCampaignAnalytics(
  id: UUID,
  options?: Omit<UseQueryOptions<CampaignAnalytics>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: marketingKeys.campaignAnalytics(id),
    queryFn: () => getCampaignAnalytics(id),
    enabled: !!id,
    ...options,
  });
}

export function useAbTestResults(
  id: UUID,
  options?: Omit<UseQueryOptions<AbTestResult[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: marketingKeys.abTestResults(id),
    queryFn: () => getCampaignAbTestResults(id),
    enabled: !!id,
    ...options,
  });
}

export function useCampaignTimeline(
  id: UUID,
  days: number = 30,
  options?: Omit<UseQueryOptions<TimelineDataPoint[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: marketingKeys.timeline(id, days),
    queryFn: () => getCampaignTimeline(id, days),
    enabled: !!id,
    ...options,
  });
}
