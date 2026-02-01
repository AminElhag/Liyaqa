import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oauthApi } from '@/lib/api/oauth';
import type { OAuthProvider } from '@/lib/api/oauth';
import { toast } from 'sonner';

/**
 * Query key factory for OAuth
 */
export const oauthKeys = {
  all: ['oauth'] as const,
  providers: (organizationId?: string) => [...oauthKeys.all, 'providers', organizationId] as const,
};

/**
 * Hook to get OAuth providers for an organization
 */
export function useOAuthProviders(organizationId?: string) {
  return useQuery({
    queryKey: oauthKeys.providers(organizationId),
    queryFn: () => oauthApi.getProviders(organizationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to link OAuth provider to account
 */
export function useLinkOAuthProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: oauthApi.linkProvider,
    onSuccess: (data) => {
      toast.success(data.message || 'OAuth provider linked successfully');
      queryClient.invalidateQueries({ queryKey: oauthKeys.all });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to link OAuth provider');
    },
  });
}

/**
 * Hook to unlink OAuth provider from account
 */
export function useUnlinkOAuthProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: oauthApi.unlinkProvider,
    onSuccess: (data) => {
      toast.success(data.message || 'OAuth provider unlinked successfully');
      queryClient.invalidateQueries({ queryKey: oauthKeys.all });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to unlink OAuth provider');
    },
  });
}
