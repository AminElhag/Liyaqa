import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  expandedNavGroups: string[];

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleNavGroup: (groupId: string) => void;
  setExpandedNavGroups: (groups: string[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      expandedNavGroups: ["overview", "members"],

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),
      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      setMobileMenuOpen: (open: boolean) => set({ mobileMenuOpen: open }),
      toggleNavGroup: (groupId: string) =>
        set((state) => ({
          expandedNavGroups: state.expandedNavGroups.includes(groupId)
            ? state.expandedNavGroups.filter((id) => id !== groupId)
            : [...state.expandedNavGroups, groupId],
        })),
      setExpandedNavGroups: (groups: string[]) =>
        set({ expandedNavGroups: groups }),
    }),
    {
      name: "liyaqa-ui-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        expandedNavGroups: state.expandedNavGroups,
      }),
    }
  )
);
