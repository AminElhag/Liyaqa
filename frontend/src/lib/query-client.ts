import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { SessionExpiredError } from "./api/client";

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        console.error("[React Query Error]", error);
        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error("[React Query Mutation Error]", error);
        if (error instanceof Error) {
          console.error("Mutation error:", error.message);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: "always",
        refetchOnMount: true,
        retry: (failureCount, error) => {
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
