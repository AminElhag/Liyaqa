import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchSecurityAlerts, 
  fetchUnreadAlertCount, 
  acknowledgeSecurityAlert 
} from "@/lib/api/security-alerts";
import type { SecurityAlertResponse } from "@/types/security";

export const securityAlertsKeys = {
  all: ["security-alerts"] as const,
  lists: () => [...securityAlertsKeys.all, "list"] as const,
  list: (filters: string) => [...securityAlertsKeys.lists(), { filters }] as const,
  count: () => [...securityAlertsKeys.all, "count"] as const,
};

/**
 * Hook to fetch security alerts
 */
export function useSecurityAlerts(unreadOnly?: boolean) {
  return useQuery({
    queryKey: securityAlertsKeys.list(unreadOnly ? "unread" : "all"),
    queryFn: () => fetchSecurityAlerts(unreadOnly),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to fetch unread alert count
 */
export function useUnreadAlertCount() {
  return useQuery({
    queryKey: securityAlertsKeys.count(),
    queryFn: fetchUnreadAlertCount,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Hook to acknowledge a security alert
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acknowledgeSecurityAlert,
    onSuccess: () => {
      // Invalidate and refetch alerts
      queryClient.invalidateQueries({ queryKey: securityAlertsKeys.all });
    },
  });
}
