"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as tasksApi from "@/lib/api/tasks";

// Query keys
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (params?: object) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  memberTasks: (memberId: string) => [...taskKeys.all, "member", memberId] as const,
  myTasks: () => [...taskKeys.all, "my-tasks"] as const,
  myTasksToday: () => [...taskKeys.all, "my-tasks-today"] as const,
  myTasksForDate: (date: string) => [...taskKeys.all, "my-tasks", date] as const,
  overdue: () => [...taskKeys.all, "overdue"] as const,
  unassigned: () => [...taskKeys.all, "unassigned"] as const,
  byType: (type: string) => [...taskKeys.all, "by-type", type] as const,
  stats: () => [...taskKeys.all, "stats"] as const,
  types: () => [...taskKeys.all, "types"] as const,
};

// Queries

export function useTask(taskId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => tasksApi.getTask(taskId),
    enabled: options?.enabled !== false && !!taskId,
  });
}

export function useMemberTasks(
  memberId: string,
  params?: {
    statuses?: tasksApi.TaskStatus[];
    page?: number;
    size?: number;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...taskKeys.memberTasks(memberId), params],
    queryFn: () => tasksApi.getMemberTasks(memberId, params),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useMyTasks(
  params?: {
    statuses?: tasksApi.TaskStatus[];
    page?: number;
    size?: number;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...taskKeys.myTasks(), params],
    queryFn: () => tasksApi.getMyTasks(params),
    enabled: options?.enabled !== false,
  });
}

export function useMyTasksToday(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskKeys.myTasksToday(),
    queryFn: () => tasksApi.getMyTasksToday(),
    enabled: options?.enabled !== false,
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

export function useMyTasksForDate(
  date: string,
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...taskKeys.myTasksForDate(date), params],
    queryFn: () => tasksApi.getMyTasksForDate(date, params),
    enabled: options?.enabled !== false && !!date,
  });
}

export function useOverdueTasks(
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...taskKeys.overdue(), params],
    queryFn: () => tasksApi.getOverdueTasks(params),
    enabled: options?.enabled !== false,
  });
}

export function useUnassignedTasks(
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...taskKeys.unassigned(), params],
    queryFn: () => tasksApi.getUnassignedTasks(params),
    enabled: options?.enabled !== false,
  });
}

export function useTasksByType(
  taskType: tasksApi.TaskType,
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...taskKeys.byType(taskType), params],
    queryFn: () => tasksApi.getTasksByType(taskType, params),
    enabled: options?.enabled !== false,
  });
}

export function useTaskStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: () => tasksApi.getTaskStats(),
    enabled: options?.enabled !== false,
  });
}

export function useTaskTypes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskKeys.types(),
    queryFn: () => tasksApi.getTaskTypes(),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Mutations

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: tasksApi.CreateTaskRequest) => tasksApi.createTask(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.memberTasks(data.memberId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasksToday() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      request,
    }: {
      taskId: string;
      request: tasksApi.UpdateTaskRequest;
    }) => tasksApi.updateTask(taskId, request),
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      assigneeUserId,
    }: {
      taskId: string;
      assigneeUserId: string;
    }) => tasksApi.assignTask(taskId, { assigneeUserId }),
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.unassigned() });
    },
  });
}

export function useUnassignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.unassignTask(taskId),
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useStartTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.startTask(taskId),
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      request,
    }: {
      taskId: string;
      request: tasksApi.CompleteTaskRequest;
    }) => tasksApi.completeTask(taskId, request),
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasksToday() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

export function useCancelTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      tasksApi.cancelTask(taskId, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

export function useSnoozeTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      newDueDate,
    }: {
      taskId: string;
      newDueDate: string;
    }) => tasksApi.snoozeTask(taskId, { newDueDate }),
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasksToday() });
    },
  });
}

export function useRescheduleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      request,
    }: {
      taskId: string;
      request: tasksApi.RescheduleTaskRequest;
    }) => tasksApi.rescheduleTask(taskId, request),
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
