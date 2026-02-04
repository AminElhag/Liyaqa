import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getFamilyGroups,
  getFamilyGroup,
  getMemberFamilyGroup,
  createFamilyGroup,
  updateFamilyGroup,
  addFamilyMember,
  removeFamilyMember,
  activateFamilyGroup,
  suspendFamilyGroup,
  deleteFamilyGroup,
} from '../lib/api/family-groups';
import type {
  CreateFamilyGroupRequest,
  UpdateFamilyGroupRequest,
  AddFamilyMemberRequest,
} from '../types/accounts';
import type { PageParams } from '../types/common';

export const familyGroupKeys = {
  all: ['family-groups'] as const,
  lists: () => [...familyGroupKeys.all, 'list'] as const,
  list: (params?: PageParams) => [...familyGroupKeys.lists(), params] as const,
  details: () => [...familyGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...familyGroupKeys.details(), id] as const,
  byMember: (memberId: string) => [...familyGroupKeys.all, 'by-member', memberId] as const,
};

export function useFamilyGroups(params?: PageParams) {
  return useQuery({
    queryKey: familyGroupKeys.list(params),
    queryFn: () => getFamilyGroups(params),
  });
}

export function useFamilyGroup(id: string) {
  return useQuery({
    queryKey: familyGroupKeys.detail(id),
    queryFn: () => getFamilyGroup(id),
    enabled: !!id,
  });
}

export function useMemberFamilyGroup(memberId: string) {
  return useQuery({
    queryKey: familyGroupKeys.byMember(memberId),
    queryFn: () => getMemberFamilyGroup(memberId),
    enabled: !!memberId,
  });
}

export function useCreateFamilyGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFamilyGroupRequest) => createFamilyGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyGroupKeys.lists() });
    },
  });
}

export function useUpdateFamilyGroup(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFamilyGroupRequest) => updateFamilyGroup(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(familyGroupKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: familyGroupKeys.lists() });
    },
  });
}

export function useAddFamilyMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddFamilyMemberRequest) => addFamilyMember(groupId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(familyGroupKeys.detail(groupId), data);
      queryClient.invalidateQueries({ queryKey: familyGroupKeys.lists() });
    },
  });
}

export function useRemoveFamilyMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeFamilyMember(groupId, memberId),
    onSuccess: (data) => {
      queryClient.setQueryData(familyGroupKeys.detail(groupId), data);
      queryClient.invalidateQueries({ queryKey: familyGroupKeys.lists() });
    },
  });
}

export function useActivateFamilyGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateFamilyGroup(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(familyGroupKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: familyGroupKeys.lists() });
    },
  });
}

export function useSuspendFamilyGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suspendFamilyGroup(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(familyGroupKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: familyGroupKeys.lists() });
    },
  });
}

export function useDeleteFamilyGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFamilyGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyGroupKeys.all });
    },
  });
}
