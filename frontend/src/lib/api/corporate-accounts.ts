import { api } from './client';
import type {
  CorporateAccount,
  CorporateAccountSummary,
  CreateCorporateAccountRequest,
  UpdateCorporateAccountRequest,
  AddCorporateMemberRequest,
} from '@/types/accounts';
import type { Page, PageParams } from '@/types/common';

const BASE_URL = 'corporate-accounts';

export async function getCorporateAccounts(params?: PageParams): Promise<Page<CorporateAccountSummary>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set('page', params.page.toString());
  if (params?.size !== undefined) searchParams.set('size', params.size.toString());
  if (params?.sort) searchParams.set('sort', params.sort);

  return api.get(`${BASE_URL}?${searchParams.toString()}`).json();
}

export async function searchCorporateAccounts(query: string, params?: PageParams): Promise<Page<CorporateAccountSummary>> {
  const searchParams = new URLSearchParams();
  searchParams.set('query', query);
  if (params?.page !== undefined) searchParams.set('page', params.page.toString());
  if (params?.size !== undefined) searchParams.set('size', params.size.toString());
  if (params?.sort) searchParams.set('sort', params.sort);

  return api.get(`${BASE_URL}/search?${searchParams.toString()}`).json();
}

export async function getCorporateAccount(id: string): Promise<CorporateAccount> {
  return api.get(`${BASE_URL}/${id}`).json();
}

export async function getMemberCorporateAccount(memberId: string): Promise<CorporateAccount> {
  return api.get(`${BASE_URL}/member/${memberId}`).json();
}

export async function getExpiringContracts(withinDays: number = 30, params?: PageParams): Promise<Page<CorporateAccountSummary>> {
  const searchParams = new URLSearchParams();
  searchParams.set('withinDays', withinDays.toString());
  if (params?.page !== undefined) searchParams.set('page', params.page.toString());
  if (params?.size !== undefined) searchParams.set('size', params.size.toString());
  if (params?.sort) searchParams.set('sort', params.sort);

  return api.get(`${BASE_URL}/expiring?${searchParams.toString()}`).json();
}

export async function createCorporateAccount(data: CreateCorporateAccountRequest): Promise<CorporateAccount> {
  return api.post(BASE_URL, { json: data }).json();
}

export async function updateCorporateAccount(id: string, data: UpdateCorporateAccountRequest): Promise<CorporateAccount> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json();
}

export async function addCorporateMember(accountId: string, data: AddCorporateMemberRequest): Promise<CorporateAccount> {
  return api.post(`${BASE_URL}/${accountId}/members`, { json: data }).json();
}

export async function removeCorporateMember(accountId: string, memberId: string): Promise<CorporateAccount> {
  return api.delete(`${BASE_URL}/${accountId}/members/${memberId}`).json();
}

export async function activateCorporateAccount(id: string): Promise<CorporateAccount> {
  return api.post(`${BASE_URL}/${id}/activate`).json();
}

export async function suspendCorporateAccount(id: string): Promise<CorporateAccount> {
  return api.post(`${BASE_URL}/${id}/suspend`).json();
}

export async function terminateCorporateAccount(id: string): Promise<CorporateAccount> {
  return api.post(`${BASE_URL}/${id}/terminate`).json();
}

export async function deleteCorporateAccount(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}
