import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { setTenantContext } from "@/lib/api/client";

interface TenantState {
  tenantId: string | null;
  tenantName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  isSuperTenant: boolean;

  // Actions
  setTenant: (
    tenantId: string,
    tenantName?: string,
    organizationId?: string,
    organizationName?: string
  ) => void;
  setOrganization: (organizationId: string, organizationName?: string) => void;
  setSuperTenant: (isSuperTenant: boolean) => void;
  clear: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      tenantName: null,
      organizationId: null,
      organizationName: null,
      isSuperTenant: false,

      setTenant: (
        tenantId: string,
        tenantName?: string,
        organizationId?: string,
        organizationName?: string
      ) => {
        const state = get();
        setTenantContext(
          tenantId,
          organizationId || state.organizationId,
          state.isSuperTenant
        );
        set({
          tenantId,
          tenantName: tenantName || null,
          organizationId: organizationId || state.organizationId,
          organizationName: organizationName || state.organizationName,
        });
      },

      setOrganization: (organizationId: string, organizationName?: string) => {
        const state = get();
        setTenantContext(state.tenantId, organizationId, state.isSuperTenant);
        set({
          organizationId,
          organizationName: organizationName || null,
        });
      },

      setSuperTenant: (isSuperTenant: boolean) => {
        const state = get();
        setTenantContext(state.tenantId, state.organizationId, isSuperTenant);
        set({ isSuperTenant });
      },

      clear: () => {
        setTenantContext(null);
        set({
          tenantId: null,
          tenantName: null,
          organizationId: null,
          organizationName: null,
          isSuperTenant: false,
        });
      },
    }),
    {
      name: "tenant-storage",
      storage: createJSONStorage(() => localStorage),
      // NOTE: Removed onRehydrateStorage callback that was calling setTenantContext.
      // The auth-store is the source of truth for tenant context and handles
      // setting it during login and initialize(). Having tenant-store also
      // set it on rehydration caused race conditions where stale/null values
      // from localStorage would overwrite the correct tenant context set by auth-store.
    }
  )
);
