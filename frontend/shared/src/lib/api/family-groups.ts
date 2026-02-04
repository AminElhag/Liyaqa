import { api } from './client';
import type {
  FamilyGroup,
  FamilyGroupSummary,
  CreateFamilyGroupRequest,
  UpdateFamilyGroupRequest,
  AddFamilyMemberRequest,
} from '../../types/accounts';
import type { Page, PageParams } from '../../types/common';

const BASE_URL = 'family-groups';

export async function getFamilyGroups(params?: PageParams): Promise<Page<FamilyGroupSummary>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set('page', params.page.toString());
  if (params?.size !== undefined) searchParams.set('size', params.size.toString());
  if (params?.sort) searchParams.set('sort', params.sort);

  return api.get(`${BASE_URL}?${searchParams.toString()}`).json();
}

export async function getFamilyGroup(id: string): Promise<FamilyGroup> {
  return api.get(`${BASE_URL}/${id}`).json();
}

export async function getMemberFamilyGroup(memberId: string): Promise<FamilyGroup> {
  return api.get(`${BASE_URL}/member/${memberId}`).json();
}

export async function createFamilyGroup(data: CreateFamilyGroupRequest): Promise<FamilyGroup> {
  return api.post(BASE_URL, { json: data }).json();
}

export async function updateFamilyGroup(id: string, data: UpdateFamilyGroupRequest): Promise<FamilyGroup> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json();
}

export async function addFamilyMember(groupId: string, data: AddFamilyMemberRequest): Promise<FamilyGroup> {
  return api.post(`${BASE_URL}/${groupId}/members`, { json: data }).json();
}

export async function removeFamilyMember(groupId: string, memberId: string): Promise<FamilyGroup> {
  return api.delete(`${BASE_URL}/${groupId}/members/${memberId}`).json();
}

export async function activateFamilyGroup(id: string): Promise<FamilyGroup> {
  return api.post(`${BASE_URL}/${id}/activate`).json();
}

export async function suspendFamilyGroup(id: string): Promise<FamilyGroup> {
  return api.post(`${BASE_URL}/${id}/suspend`).json();
}

export async function deleteFamilyGroup(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}
