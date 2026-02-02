import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useMembers,
  useMember,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  memberKeys,
} from './use-members';
import * as membersApi from '@/lib/api/members';
import type { Member, CreateMemberRequest, UpdateMemberRequest } from '@/types/member';
import type { PaginatedResponse } from '@/types/api';

// Mock the API module
vi.mock('@/lib/api/members');

// Create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('use-members hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('memberKeys', () => {
    it('should generate correct query keys', () => {
      expect(memberKeys.all).toEqual(['members']);
      expect(memberKeys.lists()).toEqual(['members', 'list']);
      expect(memberKeys.list({ status: 'ACTIVE' })).toEqual([
        'members',
        'list',
        { status: 'ACTIVE' },
      ]);
      expect(memberKeys.details()).toEqual(['members', 'detail']);
      expect(memberKeys.detail('123')).toEqual(['members', 'detail', '123']);
    });
  });

  describe('useMembers', () => {
    it('should fetch members list successfully', async () => {
      const mockMembers: PaginatedResponse<Member> = {
        content: [
          {
            id: '1',
            firstName: { en: 'John', ar: 'جون' },
            lastName: { en: 'Doe', ar: 'دو' },
            email: 'john@example.com',
            phone: '+966501234567',
            status: 'ACTIVE',
          } as Member,
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      };

      vi.mocked(membersApi.getMembers).mockResolvedValue(mockMembers);

      const { result } = renderHook(() => useMembers(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockMembers);
      expect(membersApi.getMembers).toHaveBeenCalledWith({});
    });

    it('should fetch members with query parameters', async () => {
      const params = { status: 'ACTIVE', search: 'John', page: 0, size: 10 };
      const mockMembers: PaginatedResponse<Member> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
      };

      vi.mocked(membersApi.getMembers).mockResolvedValue(mockMembers);

      const { result } = renderHook(() => useMembers(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(membersApi.getMembers).toHaveBeenCalledWith(params);
    });

    it('should handle error when fetching members', async () => {
      const error = new Error('Failed to fetch members');
      vi.mocked(membersApi.getMembers).mockRejectedValue(error);

      const { result } = renderHook(() => useMembers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should return empty list when no members exist', async () => {
      const emptyResponse: PaginatedResponse<Member> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
      };

      vi.mocked(membersApi.getMembers).mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => useMembers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.content).toHaveLength(0);
      expect(result.current.data?.totalElements).toBe(0);
    });
  });

  describe('useMember', () => {
    it('should fetch single member by ID', async () => {
      const mockMember: Member = {
        id: '123',
        firstName: { en: 'Jane', ar: 'جين' },
        lastName: { en: 'Smith', ar: 'سميث' },
        email: 'jane@example.com',
        phone: '+966509876543',
        status: 'ACTIVE',
      } as Member;

      vi.mocked(membersApi.getMember).mockResolvedValue(mockMember);

      const { result } = renderHook(() => useMember('123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockMember);
      expect(membersApi.getMember).toHaveBeenCalledWith('123');
    });

    it('should not fetch when ID is empty', () => {
      const { result } = renderHook(() => useMember(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(membersApi.getMember).not.toHaveBeenCalled();
    });

    it('should handle error when member not found', async () => {
      const error = new Error('Member not found');
      vi.mocked(membersApi.getMember).mockRejectedValue(error);

      const { result } = renderHook(() => useMember('999'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCreateMember', () => {
    it('should create member successfully', async () => {
      const newMember: CreateMemberRequest = {
        firstName: { en: 'Bob', ar: 'بوب' },
        lastName: { en: 'Johnson', ar: 'جونسون' },
        email: 'bob@example.com',
        phone: '+966501111111',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
      };

      const createdMember: Member = {
        id: '456',
        ...newMember,
        status: 'PENDING',
      } as Member;

      vi.mocked(membersApi.createMember).mockResolvedValue(createdMember);

      const { result } = renderHook(() => useCreateMember(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate(newMember);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(createdMember);
      expect(membersApi.createMember).toHaveBeenCalledWith(newMember);
    });

    it('should invalidate members list after creation', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const newMember: CreateMemberRequest = {
        firstName: { en: 'Test', ar: '' },
        lastName: { en: 'User', ar: '' },
        email: 'test@example.com',
        phone: '+966501234567',
      };

      vi.mocked(membersApi.createMember).mockResolvedValue({
        id: '789',
        ...newMember,
      } as Member);

      const { result } = renderHook(() => useCreateMember(), { wrapper });

      result.current.mutate(newMember);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: memberKeys.lists(),
      });
    });

    it('should handle creation error', async () => {
      const error = new Error('Email already exists');
      vi.mocked(membersApi.createMember).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateMember(), {
        wrapper: createWrapper(),
      });

      const newMember: CreateMemberRequest = {
        firstName: { en: 'Duplicate', ar: '' },
        lastName: { en: 'User', ar: '' },
        email: 'existing@example.com',
        phone: '+966501234567',
      };

      result.current.mutate(newMember);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateMember', () => {
    it('should update member successfully', async () => {
      const updateData: UpdateMemberRequest = {
        firstName: { en: 'Updated', ar: 'محدث' },
        email: 'updated@example.com',
      };

      const updatedMember: Member = {
        id: '123',
        firstName: { en: 'Updated', ar: 'محدث' },
        lastName: { en: 'User', ar: 'مستخدم' },
        email: 'updated@example.com',
        phone: '+966501234567',
        status: 'ACTIVE',
      } as Member;

      vi.mocked(membersApi.updateMember).mockResolvedValue(updatedMember);

      const { result } = renderHook(() => useUpdateMember(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '123', data: updateData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(updatedMember);
      expect(membersApi.updateMember).toHaveBeenCalledWith('123', updateData);
    });

    it('should update cache after successful update', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const updatedMember: Member = {
        id: '123',
        firstName: { en: 'Updated', ar: '' },
        lastName: { en: 'User', ar: '' },
        email: 'updated@example.com',
        phone: '+966501234567',
        status: 'ACTIVE',
      } as Member;

      vi.mocked(membersApi.updateMember).mockResolvedValue(updatedMember);

      const { result } = renderHook(() => useUpdateMember(), { wrapper });

      result.current.mutate({ id: '123', data: {} });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalled();
    });

    it('should handle update error', async () => {
      const error = new Error('Member not found');
      vi.mocked(membersApi.updateMember).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateMember(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '999', data: {} });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDeleteMember', () => {
    it('should delete member successfully', async () => {
      vi.mocked(membersApi.deleteMember).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteMember(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(membersApi.deleteMember).toHaveBeenCalledWith('123');
    });

    it('should invalidate queries after deletion', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      vi.mocked(membersApi.deleteMember).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteMember(), { wrapper });

      result.current.mutate('123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: memberKeys.lists(),
      });
    });

    it('should handle deletion error', async () => {
      const error = new Error('Cannot delete member with active subscription');
      vi.mocked(membersApi.deleteMember).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteMember(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });
});
