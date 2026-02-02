import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { SessionExpiredError } from "./api/client";

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.error("[React Query Error]", error);
          if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
          }
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.error("[React Query Mutation Error]", error);
          if (error instanceof Error) {
            console.error("Mutation error:", error.message);
          }
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Increased from 5 minutes to 10 minutes for better caching
        staleTime: 10 * 60 * 1000,
        // Increased from 10 minutes to 30 minutes to keep cached data longer
        gcTime: 30 * 60 * 1000,
        // Changed from "always" to false to prevent excessive refetches on tab switching
        // Queries will only refetch if data is stale (based on staleTime)
        refetchOnWindowFocus: false,
        // Keep refetchOnMount for fresh data on page navigation
        refetchOnMount: true,
        // Increased retry count from 1 to 2 for better resilience to transient network errors
        retry: (failureCount, error) => {
          if (error instanceof SessionExpiredError) return false;
          return failureCount < 2;
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
