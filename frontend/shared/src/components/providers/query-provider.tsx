"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "../../lib/query-client";
import { SessionExpiredError } from "../../lib/api/client";
import { useAuthStore } from "../stores/auth-store";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  // Extract locale from pathname (e.g., /en/login -> en)
  const locale = pathname.split('/')[1] || 'en';

  // Set up global error handler for SessionExpiredError
  React.useEffect(() => {
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();

    // Handle errors from queries
    const unsubscribeQuery = queryCache.subscribe((event) => {
      if (event.type === "updated" && event.query.state.error instanceof SessionExpiredError) {
        handleSessionExpired();
      }
    });

    // Handle errors from mutations
    const unsubscribeMutation = mutationCache.subscribe((event) => {
      if (event.type === "updated" && event.mutation?.state.error instanceof SessionExpiredError) {
        handleSessionExpired();
      }
    });

    function handleSessionExpired() {
      // Clear auth state
      logout();

      // Determine the correct login page based on current path
      const isPlatformRoute = pathname.includes("/platform") ||
                              pathname.includes("/clients") ||
                              pathname.includes("/deals") ||
                              pathname.includes("/client-plans") ||
                              pathname.includes("/client-subscriptions") ||
                              pathname.includes("/client-invoices") ||
                              pathname.includes("/platform-users") ||
                              pathname.includes("/support");

      const loginPath = isPlatformRoute
        ? `/${locale}/platform-login`
        : `/${locale}/login`;

      // Only redirect if not already on a login page
      if (!pathname.includes("/login")) {
        router.push(loginPath);
      }
    }

    return () => {
      unsubscribeQuery();
      unsubscribeMutation();
    };
  }, [queryClient, router, locale, pathname, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
