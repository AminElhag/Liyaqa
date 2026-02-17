"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  previewEnrollment,
  createEnrollment,
} from "../lib/api/enrollment";
import type {
  EnrollmentPreviewRequest,
  EnrollmentPreviewResponse,
  EnrollmentRequest,
  EnrollmentResponse,
} from "../types/enrollment";
import { memberKeys } from "./use-members";
import { subscriptionKeys } from "./use-subscriptions";

export const enrollmentKeys = {
  all: ["enrollment"] as const,
  previews: () => [...enrollmentKeys.all, "preview"] as const,
  preview: (params: EnrollmentPreviewRequest) =>
    [...enrollmentKeys.previews(), params] as const,
};

export function useEnrollmentPreview(
  params: EnrollmentPreviewRequest,
  options?: Omit<
    UseQueryOptions<EnrollmentPreviewResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: enrollmentKeys.preview(params),
    queryFn: () => previewEnrollment(params),
    enabled: !!params.planId,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation<EnrollmentResponse, Error, EnrollmentRequest>({
    mutationFn: (data) => createEnrollment(data),
    onSuccess: () => {
      // Invalidate related caches
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}
