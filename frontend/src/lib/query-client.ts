import { QueryClient } from "@tanstack/react-query";
import { SessionExpiredError } from "./api/client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is immediately stale - always refetch on mount for fresh data
        staleTime: 0,
        // Keep unused data in cache for 5 mins (shows old data while refetching)
        gcTime: 5 * 60 * 1000,
        // Refetch when user returns to tab
        refetchOnWindowFocus: true,
        // Always refetch when component mounts
        refetchOnMount: true,
        retry: (failureCount, error) => {
          // Don't retry on session expiry - user is being redirected to login
          if (error instanceof SessionExpiredError) return false;
          return failureCount < 1;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
