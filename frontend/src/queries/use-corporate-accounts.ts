import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCorporateAccounts,
  searchCorporateAccounts,
  getCorporateAccount,
  getMemberCorporateAccount,
  getExpiringContracts,
  createCorporateAccount,
  updateCorporateAccount,
  addCorporateMember,
  removeCorporateMember,
  activateCorporateAccount,
  suspendCorporateAccount,
  terminateCorporateAccount,
  deleteCorporateAccount,
} from '@/lib/api/corporate-accounts';
import type {
  CreateCorporateAccountRequest,
  UpdateCorporateAccountRequest,
  AddCorporateMemberRequest,
} from '@/types/accounts';
import type { PageParams } from '@/types/common';

export const corporateAccountKeys = {
  all: ['corporate-accounts'] as const,
  lists: () => [...corporateAccountKeys.all, 'list'] as const,
  list: (params?: PageParams) => [...corporateAccountKeys.lists(), params] as const,
  search: (query: string, params?: PageParams) => [...corporateAccountKeys.lists(), 'search', query, params] as const,
  expiring: (withinDays: number, params?: PageParams) => [...corporateAccountKeys.lists(), 'expiring', withinDays, params] as const,
  details: () => [...corporateAccountKeys.all, 'detail'] as const,
  detail: (id: string) => [...corporateAccountKeys.details(), id] as const,
  byMember: (memberId: string) => [...corporateAccountKeys.all, 'by-member', memberId] as const,
};

export function useCorporateAccounts(params?: PageParams) {
  return useQuery({
    queryKey: corporateAccountKeys.list(params),
    queryFn: () => getCorporateAccounts(params),
  });
}

export function useSearchCorporateAccounts(query: string, params?: PageParams) {
  return useQuery({
    queryKey: corporateAccountKeys.search(query, params),
    queryFn: () => searchCorporateAccounts(query, params),
    enabled: !!query,
  });
}

export function useCorporateAccount(id: string) {
  return useQuery({
    queryKey: corporateAccountKeys.detail(id),
    queryFn: () => getCorporateAccount(id),
    enabled: !!id,
  });
}

export function useMemberCorporateAccount(memberId: string) {
  return useQuery({
    queryKey: corporateAccountKeys.byMember(memberId),
    queryFn: () => getMemberCorporateAccount(memberId),
    enabled: !!memberId,
  });
}

export function useExpiringContracts(withinDays: number = 30, params?: PageParams) {
  return useQuery({
    queryKey: corporateAccountKeys.expiring(withinDays, params),
    queryFn: () => getExpiringContracts(withinDays, params),
  });
}

export function useCreateCorporateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCorporateAccountRequest) => createCorporateAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: corporateAccountKeys.lists() });
    },
  });
}

export function useUpdateCorporateAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCorporateAccountRequest) => updateCorporateAccount(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(corporateAccountKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: corporateAccountKeys.lists() });
    },
  });
}

export function useAddCorporateMember(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddCorporateMemberRequest) => addCorporateMember(accountId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(corporateAccountKeys.detail(accountId), data);
      queryClient.invalidateQueries({ queryKey: corporateAccountKeys.lists() });
    },
  });
}

export function useRemoveCorporateMember(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeCorporateMember(accountId, memberId),
    onSuccess: (data) => {
      queryClient.setQueryData(corporateAccountKeys.detail(accountId), data);
      queryClient.invalidateQueries({ queryKey: corporateAccountKeys.lists() });
    },
  });
}

export function useActivateCorporateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateCorporateAccount(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(corporateAccountKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: corporateAccountKeys.lists() });
    },
  });
}

export function useSuspendCorporateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suspendCorporateAccount(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(corporateAccountKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: corporateAccountKeys.lists() });
    },
  });
}

export function useTerminateCorporateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => terminateCorporateAccount(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(corporateAccountKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: corporateAccountKeys.lists() });
    },
  });
}

export function useDeleteCorporateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCorporateAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: corporateAccountKeys.all });
    },
  });
}
