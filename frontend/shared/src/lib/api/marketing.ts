import { api } from './client';
import type { PaginatedResponse, UUID } from '../../types/api';
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
  CampaignStatus,
  CampaignType,
} from '../../types/marketing';

// ==================== QUERY PARAMS ====================

export interface CampaignQueryParams {
  search?: string;
  status?: CampaignStatus;
  campaignType?: CampaignType;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface SegmentQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface EnrollmentQueryParams {
  page?: number;
  size?: number;
}

// ==================== CAMPAIGNS ====================

export async function getCampaigns(
  params: CampaignQueryParams = {}
): Promise<PaginatedResponse<Campaign>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.campaignType) searchParams.set('campaignType', params.campaignType);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir);

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/marketing/campaigns?${queryString}`
    : 'api/marketing/campaigns';

  return api.get(url).json();
}

export async function getCampaign(id: UUID): Promise<CampaignDetail> {
  return api.get(`api/marketing/campaigns/${id}`).json();
}

export async function createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
  return api.post('api/marketing/campaigns', { json: data }).json();
}

export async function updateCampaign(
  id: UUID,
  data: UpdateCampaignRequest
): Promise<Campaign> {
  return api.put(`api/marketing/campaigns/${id}`, { json: data }).json();
}

export async function deleteCampaign(id: UUID): Promise<void> {
  await api.delete(`api/marketing/campaigns/${id}`);
}

export async function activateCampaign(id: UUID): Promise<Campaign> {
  return api.post(`api/marketing/campaigns/${id}/activate`).json();
}

export async function pauseCampaign(id: UUID): Promise<Campaign> {
  return api.post(`api/marketing/campaigns/${id}/pause`).json();
}

export async function archiveCampaign(id: UUID): Promise<Campaign> {
  return api.post(`api/marketing/campaigns/${id}/archive`).json();
}

export async function duplicateCampaign(
  id: UUID,
  newName: string
): Promise<Campaign> {
  return api.post(`api/marketing/campaigns/${id}/duplicate`, { json: { newName } }).json();
}

// ==================== CAMPAIGN STEPS ====================

export async function getCampaignSteps(campaignId: UUID): Promise<CampaignStep[]> {
  return api.get(`api/marketing/campaigns/${campaignId}/steps`).json();
}

export async function addCampaignStep(
  campaignId: UUID,
  data: CreateCampaignStepRequest
): Promise<CampaignStep> {
  return api.post(`api/marketing/campaigns/${campaignId}/steps`, { json: data }).json();
}

export async function updateCampaignStep(
  campaignId: UUID,
  stepId: UUID,
  data: UpdateCampaignStepRequest
): Promise<CampaignStep> {
  return api
    .put(`api/marketing/campaigns/${campaignId}/steps/${stepId}`, { json: data })
    .json();
}

export async function deleteCampaignStep(
  campaignId: UUID,
  stepId: UUID
): Promise<void> {
  await api.delete(`api/marketing/campaigns/${campaignId}/steps/${stepId}`);
}

// ==================== ENROLLMENTS ====================

export async function getCampaignEnrollments(
  campaignId: UUID,
  params: EnrollmentQueryParams = {}
): Promise<PaginatedResponse<Enrollment>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/marketing/campaigns/${campaignId}/enrollments?${queryString}`
    : `api/marketing/campaigns/${campaignId}/enrollments`;

  return api.get(url).json();
}

export async function enrollMembers(
  campaignId: UUID,
  memberIds: UUID[]
): Promise<{ enrolled: number }> {
  return api
    .post(`api/marketing/campaigns/${campaignId}/enrollments`, { json: { memberIds } })
    .json();
}

export async function cancelEnrollment(
  campaignId: UUID,
  enrollmentId: UUID
): Promise<void> {
  await api.delete(`api/marketing/campaigns/${campaignId}/enrollments/${enrollmentId}`);
}

// ==================== SEGMENTS ====================

export async function getSegments(
  params: SegmentQueryParams = {}
): Promise<PaginatedResponse<Segment>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir);

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/marketing/segments?${queryString}`
    : 'api/marketing/segments';

  return api.get(url).json();
}

export async function getSegment(id: UUID): Promise<Segment> {
  return api.get(`api/marketing/segments/${id}`).json();
}

export async function createSegment(data: CreateSegmentRequest): Promise<Segment> {
  return api.post('api/marketing/segments', { json: data }).json();
}

export async function updateSegment(
  id: UUID,
  data: UpdateSegmentRequest
): Promise<Segment> {
  return api.put(`api/marketing/segments/${id}`, { json: data }).json();
}

export async function deleteSegment(id: UUID): Promise<void> {
  await api.delete(`api/marketing/segments/${id}`);
}

export async function activateSegment(id: UUID): Promise<Segment> {
  return api.post(`api/marketing/segments/${id}/activate`).json();
}

export async function deactivateSegment(id: UUID): Promise<Segment> {
  return api.post(`api/marketing/segments/${id}/deactivate`).json();
}

export async function previewSegmentMembers(
  id: UUID,
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<MemberPreview>> {
  return api.get(`api/marketing/segments/${id}/preview?page=${page}&size=${size}`).json();
}

export async function addSegmentMembers(
  id: UUID,
  memberIds: UUID[]
): Promise<{ added: number }> {
  return api.post(`api/marketing/segments/${id}/members`, { json: { memberIds } }).json();
}

export async function removeSegmentMember(id: UUID, memberId: UUID): Promise<void> {
  await api.delete(`api/marketing/segments/${id}/members/${memberId}`);
}

export async function recalculateSegment(id: UUID): Promise<{ memberCount: number }> {
  return api.post(`api/marketing/segments/${id}/recalculate`).json();
}

// ==================== TEMPLATES ====================

export async function getCampaignTemplates(
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<Campaign>> {
  return api.get(`api/marketing/campaigns/templates?page=${page}&size=${size}`).json();
}

export async function createCampaignFromTemplate(
  templateId: UUID,
  name: string
): Promise<Campaign> {
  return api
    .post(`api/marketing/campaigns/templates/${templateId}/create`, { json: { name } })
    .json();
}

// ==================== ANALYTICS ====================

export async function getMarketingOverview(): Promise<MarketingOverview> {
  return api.get('api/marketing/analytics/overview').json();
}

export async function getCampaignAnalytics(id: UUID): Promise<CampaignAnalytics> {
  return api.get(`api/marketing/analytics/campaigns/${id}`).json();
}

export async function getCampaignAbTestResults(id: UUID): Promise<AbTestResult[]> {
  return api.get(`api/marketing/analytics/campaigns/${id}/ab-test`).json();
}

export async function getCampaignTimeline(
  id: UUID,
  days: number = 30
): Promise<TimelineDataPoint[]> {
  return api.get(`api/marketing/analytics/campaigns/${id}/timeline?days=${days}`).json();
}
