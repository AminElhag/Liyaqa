import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionApi } from "../lib/api/sessions";

export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
};

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.lists(),
    queryFn: () => sessionApi.listSessions(),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currentSessionId?: string) =>
      sessionApi.revokeAllOtherSessions(currentSessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}
