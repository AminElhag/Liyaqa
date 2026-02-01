import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityAlertsApi } from '@/lib/api/security-alerts';
import type { SecurityAlert } from '@/lib/api/security-alerts';
import { toast } from 'sonner';

/**
 * Query key factory for security alerts
 */
export const securityAlertKeys = {
  all: ['security-alerts'] as const,
  lists: () => [...securityAlertKeys.all, 'list'] as const,
  list: (page: number, size: number, resolved?: boolean) =>
    [...securityAlertKeys.lists(), { page, size, resolved }] as const,
  unread: () => [...securityAlertKeys.all, 'unread'] as const,
  unreadCount: () => [...securityAlertKeys.all, 'unread-count'] as const,
};

/**
 * Hook to get paginated security alerts
 */
export function useSecurityAlerts(page: number = 0, size: number = 20, resolved?: boolean) {
  return useQuery({
    queryKey: securityAlertKeys.list(page, size, resolved),
    queryFn: () => securityAlertsApi.getAlerts(page, size, resolved),
  });
}

/**
 * Hook to get unread security alerts
 */
export function useUnreadAlerts() {
  return useQuery({
    queryKey: securityAlertKeys.unread(),
    queryFn: () => securityAlertsApi.getUnreadAlerts(),
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to get count of unread alerts
 */
export function useUnreadAlertsCount() {
  return useQuery({
    queryKey: securityAlertKeys.unreadCount(),
    queryFn: () => securityAlertsApi.getUnreadCount(),
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to acknowledge an alert
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => securityAlertsApi.acknowledgeAlert(alertId),
    onSuccess: (data) => {
      toast.success(data.message || 'Alert acknowledged');

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: securityAlertKeys.all });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to acknowledge alert');
    },
  });
}

/**
 * Hook to dismiss an alert
 */
export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => securityAlertsApi.dismissAlert(alertId),
    onSuccess: (data) => {
      toast.success(data.message || 'Alert dismissed');

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: securityAlertKeys.all });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to dismiss alert');
    },
  });
}

/**
 * Hook to acknowledge all unread alerts
 */
export function useAcknowledgeAllAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => securityAlertsApi.acknowledgeAllAlerts(),
    onSuccess: (data) => {
      toast.success(data.message || 'All alerts acknowledged');

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: securityAlertKeys.all });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to acknowledge alerts');
    },
  });
}
