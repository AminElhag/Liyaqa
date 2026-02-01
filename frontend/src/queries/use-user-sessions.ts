import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userSessionApi } from '@/lib/api/user-sessions';
import type { UserSession } from '@/lib/api/user-sessions';
import { toast } from 'sonner';

/**
 * Query key factory for user sessions
 */
export const userSessionKeys = {
  all: ['user-sessions'] as const,
  active: () => [...userSessionKeys.all, 'active'] as const,
  count: () => [...userSessionKeys.all, 'count'] as const,
};

/**
 * Hook to get all active sessions for the current user
 */
export function useActiveSessions() {
  return useQuery({
    queryKey: userSessionKeys.active(),
    queryFn: () => userSessionApi.listActiveSessions(),
  });
}

/**
 * Hook to get count of active sessions
 */
export function useActiveSessionCount() {
  return useQuery({
    queryKey: userSessionKeys.count(),
    queryFn: () => userSessionApi.getActiveSessionCount(),
  });
}

/**
 * Hook to revoke a specific session
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => userSessionApi.revokeSession(sessionId),
    onSuccess: (data, sessionId) => {
      toast.success(data.message || 'Session revoked successfully');
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: userSessionKeys.active() });
      queryClient.invalidateQueries({ queryKey: userSessionKeys.count() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to revoke session');
    },
  });
}

/**
 * Hook to revoke all sessions except optionally one
 */
export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exceptSessionId?: string) => 
      userSessionApi.revokeAllSessions(exceptSessionId),
    onSuccess: (data) => {
      toast.success(data.message || 'All other sessions revoked successfully');
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: userSessionKeys.active() });
      queryClient.invalidateQueries({ queryKey: userSessionKeys.count() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to revoke sessions');
    },
  });
}
