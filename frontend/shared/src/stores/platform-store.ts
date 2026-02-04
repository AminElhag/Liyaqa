import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DealStatus, DealSource } from "../types/platform";

/**
 * Filters for deal list/kanban view.
 */
interface DealFilters {
  status?: DealStatus;
  source?: DealSource;
  salesRepId?: string;
  search?: string;
}

/**
 * Platform-specific UI state for the Platform Admin dashboard.
 */
interface PlatformState {
  /** View mode for deals: table or kanban board */
  dealViewMode: "table" | "kanban";
  /** Filters applied to deal list */
  dealFilters: DealFilters;
  /** Selected client ID for detail views */
  selectedClientId: string | null;
  /** Selected club ID when browsing client data */
  selectedClubId: string | null;

  // Actions
  setDealViewMode: (mode: "table" | "kanban") => void;
  setDealFilters: (filters: DealFilters) => void;
  clearDealFilters: () => void;
  setSelectedClient: (clientId: string | null) => void;
  setSelectedClub: (clubId: string | null) => void;
  clearSelection: () => void;
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      dealViewMode: "table",
      dealFilters: {},
      selectedClientId: null,
      selectedClubId: null,

      setDealViewMode: (mode) => set({ dealViewMode: mode }),

      setDealFilters: (filters) =>
        set((state) => ({
          dealFilters: { ...state.dealFilters, ...filters },
        })),

      clearDealFilters: () => set({ dealFilters: {} }),

      setSelectedClient: (clientId) =>
        set({
          selectedClientId: clientId,
          selectedClubId: null, // Reset club when client changes
        }),

      setSelectedClub: (clubId) => set({ selectedClubId: clubId }),

      clearSelection: () =>
        set({
          selectedClientId: null,
          selectedClubId: null,
        }),
    }),
    {
      name: "platform-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dealViewMode: state.dealViewMode,
        // Don't persist filters or selections
      }),
    }
  )
);
