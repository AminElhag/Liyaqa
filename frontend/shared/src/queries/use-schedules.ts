"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSchedule, removeSchedule } from "../lib/api/classes";
import type { UUID } from "../types/api";
import { classKeys } from "./use-classes";

/**
 * Query keys for schedules
 */
export const scheduleKeys = {
  all: ["schedules"] as const,
  byClass: (classId: UUID) => [...scheduleKeys.all, "class", classId] as const,
};

/**
 * Hook to add a schedule to a class
 */
export function useAddSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      schedule,
    }: {
      classId: UUID;
      schedule: { dayOfWeek: string; startTime: string; endTime: string };
    }) => addSchedule(classId, schedule),
    onSuccess: (_newSchedule, { classId }) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
}

/**
 * Hook to remove a schedule from a class
 */
export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      scheduleId,
    }: {
      classId: UUID;
      scheduleId: UUID;
    }) => removeSchedule(classId, scheduleId),
    onSuccess: (_result, { classId }) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
}
