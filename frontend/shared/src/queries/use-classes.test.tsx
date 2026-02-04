import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useClasses,
  useClass,
  useActiveClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useGenerateSessions,
  classKeys,
} from './use-classes';
import * as classesApi from '../lib/api/classes';
import type { GymClass, CreateClassRequest, GenerateSessionsRequest } from '../types/scheduling';
import type { PaginatedResponse } from '../types/api';

// Mock the API module
vi.mock('@/lib/api/classes');

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

describe('use-classes hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('classKeys', () => {
    it('should generate correct query keys', () => {
      expect(classKeys.all).toEqual(['classes']);
      expect(classKeys.lists()).toEqual(['classes', 'list']);
      expect(classKeys.list({ type: 'GROUP' })).toEqual(['classes', 'list', { type: 'GROUP' }]);
      expect(classKeys.detail('123')).toEqual(['classes', 'detail', '123']);
      expect(classKeys.active()).toEqual(['classes', 'active']);
    });
  });

  describe('useClasses', () => {
    it('should fetch classes list successfully', async () => {
      const mockClasses: PaginatedResponse<GymClass> = {
        content: [
          {
            id: '1',
            name: { en: 'Yoga', ar: 'يوجا' },
            type: 'GROUP',
            capacity: 20,
            duration: 60,
            trainerId: 'trainer-1',
            isActive: true,
          } as GymClass,
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      };

      vi.mocked(classesApi.getClasses).mockResolvedValue(mockClasses);

      const { result } = renderHook(() => useClasses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockClasses);
      expect(classesApi.getClasses).toHaveBeenCalledWith({});
    });

    it('should fetch classes with query parameters', async () => {
      const params = { type: 'GROUP', isActive: true, page: 0, size: 20 };
      const mockClasses: PaginatedResponse<GymClass> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
      };

      vi.mocked(classesApi.getClasses).mockResolvedValue(mockClasses);

      const { result } = renderHook(() => useClasses(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(classesApi.getClasses).toHaveBeenCalledWith(params);
    });

    it('should handle error when fetching classes', async () => {
      const error = new Error('Failed to fetch classes');
      vi.mocked(classesApi.getClasses).mockRejectedValue(error);

      const { result } = renderHook(() => useClasses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useClass', () => {
    it('should fetch single class by ID', async () => {
      const mockClass: GymClass = {
        id: '123',
        name: { en: 'HIIT Training', ar: 'تدريب HIIT' },
        description: { en: 'High intensity interval training', ar: '' },
        type: 'GROUP',
        capacity: 15,
        duration: 45,
        trainerId: 'trainer-2',
        isActive: true,
      } as GymClass;

      vi.mocked(classesApi.getClass).mockResolvedValue(mockClass);

      const { result } = renderHook(() => useClass('123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockClass);
      expect(classesApi.getClass).toHaveBeenCalledWith('123');
    });

    it('should not fetch when ID is empty', () => {
      const { result } = renderHook(() => useClass(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(classesApi.getClass).not.toHaveBeenCalled();
    });

    it('should handle error when class not found', async () => {
      const error = new Error('Class not found');
      vi.mocked(classesApi.getClass).mockRejectedValue(error);

      const { result } = renderHook(() => useClass('999'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useActiveClasses', () => {
    it('should fetch active classes for dropdown', async () => {
      const mockActiveClasses: GymClass[] = [
        {
          id: '1',
          name: { en: 'Yoga', ar: 'يوجا' },
          type: 'GROUP',
          isActive: true,
        } as GymClass,
        {
          id: '2',
          name: { en: 'Pilates', ar: 'بيلاتيس' },
          type: 'GROUP',
          isActive: true,
        } as GymClass,
      ];

      vi.mocked(classesApi.getActiveClasses).mockResolvedValue(mockActiveClasses);

      const { result } = renderHook(() => useActiveClasses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockActiveClasses);
      expect(result.current.data).toHaveLength(2);
    });

    it('should return empty array when no active classes', async () => {
      vi.mocked(classesApi.getActiveClasses).mockResolvedValue([]);

      const { result } = renderHook(() => useActiveClasses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useCreateClass', () => {
    it('should create class successfully', async () => {
      const newClass: CreateClassRequest = {
        name: { en: 'Spinning', ar: 'سبينينج' },
        description: { en: 'Indoor cycling class', ar: '' },
        type: 'GROUP',
        capacity: 25,
        duration: 45,
        trainerId: 'trainer-3',
      };

      const createdClass: GymClass = {
        id: '456',
        ...newClass,
        isActive: true,
      } as GymClass;

      vi.mocked(classesApi.createClass).mockResolvedValue(createdClass);

      const { result } = renderHook(() => useCreateClass(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newClass);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(createdClass);
      expect(classesApi.createClass).toHaveBeenCalledWith(newClass);
    });

    it('should invalidate class lists after creation', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const newClass: CreateClassRequest = {
        name: { en: 'Test Class', ar: '' },
        type: 'GROUP',
        capacity: 10,
        duration: 60,
      };

      vi.mocked(classesApi.createClass).mockResolvedValue({
        id: '789',
        ...newClass,
      } as GymClass);

      const { result } = renderHook(() => useCreateClass(), { wrapper });

      result.current.mutate(newClass);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: classKeys.lists(),
      });
    });

    it('should handle creation error', async () => {
      const error = new Error('Class name already exists');
      vi.mocked(classesApi.createClass).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateClass(), {
        wrapper: createWrapper(),
      });

      const newClass: CreateClassRequest = {
        name: { en: 'Duplicate', ar: '' },
        type: 'GROUP',
        capacity: 10,
        duration: 60,
      };

      result.current.mutate(newClass);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateClass', () => {
    it('should update class successfully', async () => {
      const updateData = {
        name: { en: 'Updated Yoga', ar: 'يوجا محدثة' },
        capacity: 30,
      };

      const updatedClass: GymClass = {
        id: '123',
        name: { en: 'Updated Yoga', ar: 'يوجا محدثة' },
        type: 'GROUP',
        capacity: 30,
        duration: 60,
        isActive: true,
      } as GymClass;

      vi.mocked(classesApi.updateClass).mockResolvedValue(updatedClass);

      const { result } = renderHook(() => useUpdateClass(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '123', data: updateData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(updatedClass);
      expect(classesApi.updateClass).toHaveBeenCalledWith('123', updateData);
    });

    it('should update cache after successful update', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const updatedClass: GymClass = {
        id: '123',
        name: { en: 'Updated', ar: '' },
        type: 'GROUP',
        capacity: 20,
        duration: 60,
        isActive: true,
      } as GymClass;

      vi.mocked(classesApi.updateClass).mockResolvedValue(updatedClass);

      const { result } = renderHook(() => useUpdateClass(), { wrapper });

      result.current.mutate({ id: '123', data: {} });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalled();
    });
  });

  describe('useDeleteClass', () => {
    it('should delete class successfully', async () => {
      vi.mocked(classesApi.deleteClass).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteClass(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(classesApi.deleteClass).toHaveBeenCalledWith('123');
    });

    it('should invalidate queries after deletion', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      vi.mocked(classesApi.deleteClass).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteClass(), { wrapper });

      result.current.mutate('123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should handle deletion error', async () => {
      const error = new Error('Cannot delete class with active sessions');
      vi.mocked(classesApi.deleteClass).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteClass(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useGenerateSessions', () => {
    it('should generate sessions for class successfully', async () => {
      const request: GenerateSessionsRequest = {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        startTime: '18:00',
      };

      const generatedSessions = {
        classId: '123',
        sessionsCreated: 12,
      };

      vi.mocked(classesApi.generateSessions).mockResolvedValue(generatedSessions);

      const { result } = renderHook(() => useGenerateSessions(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ classId: '123', data: request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(generatedSessions);
      expect(classesApi.generateSessions).toHaveBeenCalledWith('123', request);
    });

    it('should invalidate sessions after generation', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      vi.mocked(classesApi.generateSessions).mockResolvedValue({
        classId: '123',
        sessionsCreated: 10,
      });

      const { result } = renderHook(() => useGenerateSessions(), { wrapper });

      result.current.mutate({
        classId: '123',
        data: {
          startDate: '2026-02-01',
          endDate: '2026-02-28',
          daysOfWeek: ['MONDAY'],
          startTime: '18:00',
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should invalidate sessions queries
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
});
