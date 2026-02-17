import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGxSettings,
  updateGxSettings,
  getRoomLayouts,
  getActiveRoomLayouts,
  getRoomLayout,
  createRoomLayout,
  updateRoomLayout,
  activateRoomLayout,
  deactivateRoomLayout,
  deleteRoomLayout,
} from "../lib/api/gx";
import type {
  UpdateGxSettingsRequest,
  CreateRoomLayoutRequest,
  UpdateRoomLayoutRequest,
} from "../types/scheduling";

// ==================== QUERY KEYS ====================

export const gxKeys = {
  all: ["gx"] as const,
  settings: () => [...gxKeys.all, "settings"] as const,
  roomLayouts: {
    all: ["room-layouts"] as const,
    lists: () => [...gxKeys.roomLayouts.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...gxKeys.roomLayouts.lists(), params] as const,
    active: () => [...gxKeys.roomLayouts.all, "active"] as const,
    detail: (id: string) => [...gxKeys.roomLayouts.all, "detail", id] as const,
  },
};

// ==================== GX SETTINGS HOOKS ====================

export function useGxSettings() {
  return useQuery({
    queryKey: gxKeys.settings(),
    queryFn: getGxSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes (config)
    retry: false,
  });
}

export function useUpdateGxSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGxSettingsRequest) => updateGxSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gxKeys.settings() });
    },
  });
}

// ==================== ROOM LAYOUT HOOKS ====================

export function useRoomLayouts(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: gxKeys.roomLayouts.list(params),
    queryFn: () => getRoomLayouts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes (lists)
  });
}

export function useActiveRoomLayouts() {
  return useQuery({
    queryKey: gxKeys.roomLayouts.active(),
    queryFn: getActiveRoomLayouts,
    staleTime: 2 * 60 * 1000,
    retry: false,
    placeholderData: [] as Awaited<ReturnType<typeof getActiveRoomLayouts>>,
  });
}

export function useRoomLayout(id: string) {
  return useQuery({
    queryKey: gxKeys.roomLayouts.detail(id),
    queryFn: () => getRoomLayout(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute (detail)
  });
}

export function useCreateRoomLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoomLayoutRequest) => createRoomLayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gxKeys.roomLayouts.all });
    },
  });
}

export function useUpdateRoomLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRoomLayoutRequest;
    }) => updateRoomLayout(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: gxKeys.roomLayouts.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: gxKeys.roomLayouts.lists() });
      queryClient.invalidateQueries({ queryKey: gxKeys.roomLayouts.active() });
    },
  });
}

export function useActivateRoomLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateRoomLayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gxKeys.roomLayouts.all });
    },
  });
}

export function useDeactivateRoomLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateRoomLayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gxKeys.roomLayouts.all });
    },
  });
}

export function useDeleteRoomLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRoomLayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gxKeys.roomLayouts.all });
    },
  });
}
