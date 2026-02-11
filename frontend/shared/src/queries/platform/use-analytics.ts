"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getChurnAnalysis,
  getFeatureAdoption,
  getComparativeAnalytics,
  exportAnalyticsReport,
} from "../../lib/api/platform/analytics";
import type { ReportType, ExportFormat } from "../../types/platform/analytics";

const STALE_5_MIN = 5 * 60 * 1000;

export const analyticsKeys = {
  all: ["platform", "analytics"] as const,
  churn: () => [...analyticsKeys.all, "churn"] as const,
  featureAdoption: () => [...analyticsKeys.all, "feature-adoption"] as const,
  comparative: () => [...analyticsKeys.all, "comparative"] as const,
};

export function useChurnAnalysis() {
  return useQuery({
    queryKey: analyticsKeys.churn(),
    queryFn: getChurnAnalysis,
    staleTime: STALE_5_MIN,
  });
}

export function useFeatureAdoption() {
  return useQuery({
    queryKey: analyticsKeys.featureAdoption(),
    queryFn: getFeatureAdoption,
    staleTime: STALE_5_MIN,
  });
}

export function useComparativeAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.comparative(),
    queryFn: getComparativeAnalytics,
    staleTime: STALE_5_MIN,
  });
}

export function useExportAnalyticsReport() {
  return useMutation({
    mutationFn: ({ type, format }: { type: ReportType; format: ExportFormat }) =>
      exportAnalyticsReport(type, format),
  });
}
