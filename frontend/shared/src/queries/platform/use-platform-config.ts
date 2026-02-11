"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAllSettingsGrouped,
  updateSetting,
  getAllMaintenanceWindows,
  createMaintenanceWindow,
  cancelMaintenanceWindow,
} from "../../lib/api/platform/platform-config";
import type {
  SettingsByCategoryResponse,
  MaintenanceWindowResponse,
  CreateMaintenanceWindowRequest,
} from "../../types/platform/platform-config";
import { toast } from "sonner";

export const platformConfigKeys = {
  all: ["platform", "config"] as const,
  settings: () => [...platformConfigKeys.all, "settings"] as const,
  maintenance: () => [...platformConfigKeys.all, "maintenance"] as const,
};

/** Fetch all settings grouped by category (10 min stale) */
export function useAllSettingsGrouped() {
  return useQuery<SettingsByCategoryResponse[]>({
    queryKey: platformConfigKeys.settings(),
    queryFn: () => getAllSettingsGrouped(),
    staleTime: 10 * 60 * 1000,
  });
}

/** Update a single setting by key */
export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateSetting(key, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformConfigKeys.settings() });
      toast.success("Setting saved");
    },
    onError: () => {
      toast.error("Failed to save setting");
    },
  });
}

/** Fetch all maintenance windows (5 min stale) */
export function useAllMaintenanceWindows() {
  return useQuery<MaintenanceWindowResponse[]>({
    queryKey: platformConfigKeys.maintenance(),
    queryFn: () => getAllMaintenanceWindows(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Create a new maintenance window */
export function useCreateMaintenanceWindow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaintenanceWindowRequest) =>
      createMaintenanceWindow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformConfigKeys.maintenance() });
      toast.success("Maintenance window created");
    },
    onError: () => {
      toast.error("Failed to create maintenance window");
    },
  });
}

/** Cancel a maintenance window by ID */
export function useCancelMaintenanceWindow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelMaintenanceWindow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformConfigKeys.maintenance() });
      toast.success("Maintenance window cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel maintenance window");
    },
  });
}
