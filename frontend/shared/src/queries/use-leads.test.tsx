import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useLeads,
  useLead,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useAssignLead,
  useConvertLead,
  useLogLeadActivity,
  leadKeys,
} from './use-leads';
import * as leadsApi from '../lib/api/leads';
import type { Lead, CreateLeadRequest, ConvertLeadRequest } from '../types/lead';
import type { PaginatedResponse } from '../types/api';

// Mock the API module
vi.mock('@/lib/api/leads');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('use-leads hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('leadKeys', () => {
    it('should generate correct query keys', () => {
      expect(leadKeys.all).toEqual(['leads']);
      expect(leadKeys.lists()).toEqual(['leads', 'list']);
      expect(leadKeys.list({ status: 'NEW' })).toEqual(['leads', 'list', { status: 'NEW' }]);
      expect(leadKeys.detail('123')).toEqual(['leads', 'detail', '123']);
      expect(leadKeys.activities('123')).toEqual(['leads', 'activities', '123']);
      expect(leadKeys.pipelineStats()).toEqual(['leads', 'stats', 'pipeline']);
    });
  });

  describe('useLeads', () => {
    it('should fetch leads list successfully', async () => {
      const mockLeads: PaginatedResponse<Lead> = {
        content: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+966501234567',
            source: 'WALK_IN',
            status: 'NEW',
            score: 75,
          } as Lead,
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      };

      vi.mocked(leadsApi.getLeads).mockResolvedValue(mockLeads);

      const { result } = renderHook(() => useLeads(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockLeads);
      expect(leadsApi.getLeads).toHaveBeenCalledWith({});
    });

    it('should fetch leads with query parameters', async () => {
      const params = { status: 'NEW', source: 'REFERRAL', page: 0, size: 20 };
      const mockLeads: PaginatedResponse<Lead> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
      };

      vi.mocked(leadsApi.getLeads).mockResolvedValue(mockLeads);

      const { result } = renderHook(() => useLeads(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(leadsApi.getLeads).toHaveBeenCalledWith(params);
    });

    it('should handle error when fetching leads', async () => {
      const error = new Error('Failed to fetch leads');
      vi.mocked(leadsApi.getLeads).mockRejectedValue(error);

      const { result } = renderHook(() => useLeads(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useLead', () => {
    it('should fetch single lead by ID', async () => {
      const mockLead: Lead = {
        id: '123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+966509876543',
        source: 'SOCIAL_MEDIA',
        status: 'CONTACTED',
        score: 85,
        assignedToUserId: 'user-456',
      } as Lead;

      vi.mocked(leadsApi.getLead).mockResolvedValue(mockLead);

      const { result } = renderHook(() => useLead('123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockLead);
      expect(leadsApi.getLead).toHaveBeenCalledWith('123');
    });

    it('should not fetch when ID is empty', () => {
      const { result } = renderHook(() => useLead(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(leadsApi.getLead).not.toHaveBeenCalled();
    });

    it('should handle error when lead not found', async () => {
      const error = new Error('Lead not found');
      vi.mocked(leadsApi.getLead).mockRejectedValue(error);

      const { result } = renderHook(() => useLead('999'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCreateLead', () => {
    it('should create lead successfully', async () => {
      const newLead: CreateLeadRequest = {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+966501111111',
        source: 'REFERRAL',
        priority: 'HIGH',
        notes: 'Referred by existing member',
      };

      const createdLead: Lead = {
        id: '456',
        ...newLead,
        status: 'NEW',
        score: 90,
      } as Lead;

      vi.mocked(leadsApi.createLead).mockResolvedValue(createdLead);

      const { result } = renderHook(() => useCreateLead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newLead);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(createdLead);
      expect(leadsApi.createLead).toHaveBeenCalledWith(newLead);
    });

    it('should invalidate leads list after creation', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const newLead: CreateLeadRequest = {
        name: 'Test Lead',
        email: 'test@example.com',
        phone: '+966501234567',
        source: 'WALK_IN',
      };

      vi.mocked(leadsApi.createLead).mockResolvedValue({
        id: '789',
        ...newLead,
        status: 'NEW',
        score: 50,
      } as Lead);

      const { result } = renderHook(() => useCreateLead(), { wrapper });

      result.current.mutate(newLead);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: leadKeys.lists(),
      });
    });

    it('should handle creation error', async () => {
      const error = new Error('Email already exists');
      vi.mocked(leadsApi.createLead).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateLead(), {
        wrapper: createWrapper(),
      });

      const newLead: CreateLeadRequest = {
        name: 'Duplicate',
        email: 'existing@example.com',
        phone: '+966501234567',
        source: 'WALK_IN',
      };

      result.current.mutate(newLead);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateLead', () => {
    it('should update lead successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        priority: 'URGENT' as const,
        notes: 'Updated notes',
      };

      const updatedLead: Lead = {
        id: '123',
        name: 'Updated Name',
        email: 'test@example.com',
        phone: '+966501234567',
        source: 'WALK_IN',
        status: 'NEW',
        priority: 'URGENT',
        score: 75,
      } as Lead;

      vi.mocked(leadsApi.updateLead).mockResolvedValue(updatedLead);

      const { result } = renderHook(() => useUpdateLead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '123', data: updateData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(updatedLead);
      expect(leadsApi.updateLead).toHaveBeenCalledWith('123', updateData);
    });

    it('should handle update error', async () => {
      const error = new Error('Lead not found');
      vi.mocked(leadsApi.updateLead).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateLead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '999', data: {} });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDeleteLead', () => {
    it('should delete lead successfully', async () => {
      vi.mocked(leadsApi.deleteLead).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteLead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(leadsApi.deleteLead).toHaveBeenCalledWith('123');
    });

    it('should invalidate queries after deletion', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      vi.mocked(leadsApi.deleteLead).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteLead(), { wrapper });

      result.current.mutate('123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useAssignLead', () => {
    it('should assign lead to user successfully', async () => {
      const assignedLead: Lead = {
        id: '123',
        name: 'Test Lead',
        email: 'test@example.com',
        phone: '+966501234567',
        source: 'WALK_IN',
        status: 'NEW',
        score: 75,
        assignedToUserId: 'user-456',
      } as Lead;

      vi.mocked(leadsApi.assignLead).mockResolvedValue(assignedLead);

      const { result } = renderHook(() => useAssignLead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: '123',
        data: { assignToUserId: 'user-456' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(assignedLead);
      expect(leadsApi.assignLead).toHaveBeenCalledWith('123', {
        assignToUserId: 'user-456',
      });
    });
  });

  describe('useConvertLead', () => {
    it('should convert lead to member successfully', async () => {
      const convertRequest: ConvertLeadRequest = {
        planId: 'plan-123',
        startDate: '2026-02-01',
        notes: 'Converted from lead',
      };

      const convertedMember = {
        id: 'member-789',
        firstName: { en: 'John', ar: '' },
        lastName: { en: 'Doe', ar: '' },
        email: 'john@example.com',
        status: 'ACTIVE',
      };

      vi.mocked(leadsApi.convertLead).mockResolvedValue(convertedMember);

      const { result } = renderHook(() => useConvertLead(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '123', data: convertRequest });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(convertedMember);
      expect(leadsApi.convertLead).toHaveBeenCalledWith('123', convertRequest);
    });

    it('should invalidate lead queries after conversion', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      vi.mocked(leadsApi.convertLead).mockResolvedValue({
        id: 'member-123',
      } as any);

      const { result } = renderHook(() => useConvertLead(), { wrapper });

      result.current.mutate({ id: '123', data: { planId: 'plan-1' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useLogLeadActivity', () => {
    it('should log activity successfully', async () => {
      const activityData = {
        type: 'CALL' as const,
        notes: 'Discussed membership options',
        durationMinutes: 15,
      };

      const loggedActivity = {
        id: 'activity-123',
        leadId: '123',
        ...activityData,
        createdAt: '2026-01-31T10:00:00Z',
      };

      vi.mocked(leadsApi.logLeadActivity).mockResolvedValue(loggedActivity);

      const { result } = renderHook(() => useLogLeadActivity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ leadId: '123', data: activityData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(loggedActivity);
      expect(leadsApi.logLeadActivity).toHaveBeenCalledWith('123', activityData);
    });

    it('should invalidate activities after logging', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      vi.mocked(leadsApi.logLeadActivity).mockResolvedValue({
        id: 'activity-1',
        leadId: '123',
        type: 'CALL',
      } as any);

      const { result } = renderHook(() => useLogLeadActivity(), { wrapper });

      result.current.mutate({
        leadId: '123',
        data: { type: 'CALL', notes: 'Test' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: leadKeys.activities('123'),
      });
    });
  });
});
