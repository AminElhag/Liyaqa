"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  scheduleAnnouncement,
  archiveAnnouncement,
} from "../../lib/api/platform/announcements";
import { useToast } from "../../hooks/use-toast";
import type { PageResponse, UUID } from "../../types/api";
import type {
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  ScheduleAnnouncementRequest,
  AnnouncementQueryParams,
} from "../../types/platform/announcements";

export const announcementKeys = {
  all: ["platform", "announcements"] as const,
  lists: () => [...announcementKeys.all, "list"] as const,
  list: (params: AnnouncementQueryParams) =>
    [...announcementKeys.lists(), params] as const,
  details: () => [...announcementKeys.all, "detail"] as const,
  detail: (id: UUID) => [...announcementKeys.details(), id] as const,
};

export function useAnnouncements(
  params: AnnouncementQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<Announcement>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: announcementKeys.list(params),
    queryFn: () => getAnnouncements(params),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useAnnouncement(
  id: UUID,
  options?: Omit<UseQueryOptions<Announcement>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: () => getAnnouncement(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateAnnouncementRequest) => createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create announcement",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateAnnouncementRequest }) =>
      updateAnnouncement(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(announcementKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update announcement",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

export function usePublishAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: UUID) => publishAnnouncement(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(announcementKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to publish announcement",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

export function useScheduleAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: ScheduleAnnouncementRequest;
    }) => scheduleAnnouncement(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(announcementKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule announcement",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

export function useArchiveAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: UUID) => archiveAnnouncement(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(announcementKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to archive announcement",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}
