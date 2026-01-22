import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ImpersonationResponse } from "@/types/platform";
import type { UserRole } from "@/types/auth";
import { setAccessToken, getAccessToken } from "@/lib/api/client";

/**
 * State for managing user impersonation sessions.
 * Used by platform support and admin users to impersonate client users for debugging.
 */
interface ImpersonationState {
  /** Whether an impersonation session is currently active */
  isImpersonating: boolean;
  /** The original platform user's access token to restore after ending impersonation */
  originalToken: string | null;
  /** Information about the impersonated user */
  impersonatedUser: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
  /** When the impersonation session expires */
  expiresAt: string | null;
  /** Reason for impersonation (for audit) */
  reason: string | null;

  // Actions
  /**
   * Start an impersonation session.
   * Stores the current token and sets the impersonation token.
   */
  startImpersonation: (data: ImpersonationResponse, reason: string) => void;
  /**
   * End the current impersonation session.
   * Restores the original platform user's token.
   */
  endImpersonation: () => void;
  /**
   * Check if the impersonation session has expired.
   */
  isExpired: () => boolean;
}

export const useImpersonationStore = create<ImpersonationState>()(
  persist(
    (set, get) => ({
      isImpersonating: false,
      originalToken: null,
      impersonatedUser: null,
      expiresAt: null,
      reason: null,

      startImpersonation: (data: ImpersonationResponse, reason: string) => {
        // Store the current access token before impersonation
        const currentToken = getAccessToken();

        // Set the impersonation token as the new access token
        setAccessToken(data.accessToken);

        set({
          isImpersonating: true,
          originalToken: currentToken,
          impersonatedUser: {
            id: data.impersonatedUserId,
            email: data.impersonatedUserEmail,
            role: data.impersonatedRole,
          },
          expiresAt: data.expiresAt,
          reason,
        });
      },

      endImpersonation: () => {
        const { originalToken } = get();

        // Restore the original platform user's token
        if (originalToken) {
          setAccessToken(originalToken);
        }

        set({
          isImpersonating: false,
          originalToken: null,
          impersonatedUser: null,
          expiresAt: null,
          reason: null,
        });
      },

      isExpired: () => {
        const { expiresAt, isImpersonating } = get();
        if (!isImpersonating || !expiresAt) return false;
        return new Date(expiresAt) < new Date();
      },
    }),
    {
      name: "impersonation-storage",
      storage: createJSONStorage(() => sessionStorage), // Use session storage for security
      partialize: (state) => ({
        isImpersonating: state.isImpersonating,
        originalToken: state.originalToken,
        impersonatedUser: state.impersonatedUser,
        expiresAt: state.expiresAt,
        reason: state.reason,
      }),
    }
  )
);
