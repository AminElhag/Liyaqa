import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, LoginRequest, RegisterRequest, PlatformLoginRequest, SendCodeRequest, VerifyCodeRequest, AccountType, AccountTypeInfo } from "../types/auth";
import { isPlatformRole, isMfaRequired, isAccountTypeSelection } from "../types/auth";
import { authApi } from "../lib/api/auth";
import { mfaApi } from "../lib/api/mfa";
import {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  getAccessToken,
  clearTokens,
  setRefreshTokenFn,
  setTenantContext,
  setPlatformMode,
  getPlatformMode,
} from "../lib/api/client";
import { useTenantStore } from "../stores/tenant-store";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // MFA state
  mfaRequired: boolean;
  mfaPendingUserId: string | null;
  mfaEmail: string | null;

  // Passwordless state
  passwordlessEmail: string | null;
  codeExpiresAt: number | null; // timestamp in milliseconds

  // Account type selection state
  accountTypeSelectionRequired: boolean;
  accountTypeSessionToken: string | null;
  availableAccountTypes: AccountTypeInfo[];
  pendingUser: User | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  platformLogin: (credentials: PlatformLoginRequest) => Promise<void>;
  verifyMfaAndLogin: (code: string, deviceInfo?: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  isPlatformUser: () => boolean;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasAllPermissions: (permissionCodes: string[]) => boolean;
  setHasHydrated: (state: boolean) => void;
  clearMfaState: () => void;
  selectAccountType: (accountType: AccountType) => Promise<void>;
  switchAccountType: (accountType: AccountType) => Promise<void>;
  clearAccountTypeSelection: () => void;
  sendPlatformLoginCode: (email: string) => Promise<void>;
  verifyPlatformLoginCode: (email: string, code: string, deviceInfo?: string) => Promise<void>;
  clearPasswordlessState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,
      mfaRequired: false,
      mfaPendingUserId: null,
      mfaEmail: null,
      passwordlessEmail: null,
      codeExpiresAt: null,
      accountTypeSelectionRequired: false,
      accountTypeSessionToken: null,
      availableAccountTypes: [],
      pendingUser: null,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      clearMfaState: () => {
        set({
          mfaRequired: false,
          mfaPendingUserId: null,
          mfaEmail: null,
        });
      },

      selectAccountType: async (accountType: AccountType) => {
        const { accountTypeSessionToken } = get();
        if (!accountTypeSessionToken) {
          throw new Error("No pending account type selection");
        }

        set({ isLoading: true, error: null });
        try {
          const response = await authApi.selectAccountType({
            sessionToken: accountTypeSessionToken,
            accountType,
          });

          // Store tokens
          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);

          // Disable platform mode for regular login
          setPlatformMode(false);

          // Set tenant context from user
          if (response.user.tenantId) {
            setTenantContext(
              response.user.tenantId,
              response.user.organizationId || null,
              response.user.role === "SUPER_ADMIN"
            );
            useTenantStore.getState().setTenant(
              response.user.tenantId,
              undefined,
              response.user.organizationId || undefined
            );
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            accountTypeSelectionRequired: false,
            accountTypeSessionToken: null,
            availableAccountTypes: [],
            pendingUser: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to select account type";
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      switchAccountType: async (accountType: AccountType) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.switchAccountType({ accountType });

          // Store new tokens
          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);

          // Update user in state
          set({
            user: response.user,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to switch account type";
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      clearAccountTypeSelection: () => {
        set({
          accountTypeSelectionRequired: false,
          accountTypeSessionToken: null,
          availableAccountTypes: [],
          pendingUser: null,
        });
      },

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);

          // Check if MFA is required
          if (isMfaRequired(response)) {
            set({
              isLoading: false,
              mfaRequired: true,
              mfaPendingUserId: response.userId,
              mfaEmail: response.email,
            });
            return;
          }

          // Check if account type selection is required
          if (isAccountTypeSelection(response)) {
            set({
              isLoading: false,
              accountTypeSelectionRequired: true,
              accountTypeSessionToken: response.sessionToken,
              availableAccountTypes: response.availableAccountTypes,
              pendingUser: response.user,
            });
            return;
          }

          // Store tokens
          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);

          // Disable platform mode for regular login
          setPlatformMode(false);

          // Set tenant context from user
          if (response.user.tenantId) {
            setTenantContext(
              response.user.tenantId,
              response.user.organizationId || null,
              response.user.role === "SUPER_ADMIN"
            );
            // Also update tenant-store for display purposes
            useTenantStore.getState().setTenant(
              response.user.tenantId,
              undefined, // tenantName - we don't have it here
              response.user.organizationId || undefined
            );
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            mfaRequired: false,
            mfaPendingUserId: null,
            mfaEmail: null,
            accountTypeSelectionRequired: false,
            accountTypeSessionToken: null,
            availableAccountTypes: [],
            pendingUser: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: "Invalid credentials",
          });
          throw error;
        }
      },

      verifyMfaAndLogin: async (code: string, deviceInfo?: string) => {
        const { mfaPendingUserId } = get();
        if (!mfaPendingUserId) {
          throw new Error("No pending MFA verification");
        }

        set({ isLoading: true, error: null });
        try {
          const response = await mfaApi.verifyLogin({
            userId: mfaPendingUserId,
            code,
            deviceInfo,
          });

          // Store tokens
          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);

          // Disable platform mode for regular login
          setPlatformMode(false);

          // Set tenant context from user
          if (response.user.tenantId) {
            setTenantContext(
              response.user.tenantId,
              response.user.organizationId || null,
              response.user.role === "SUPER_ADMIN"
            );
            // Also update tenant-store for display purposes
            useTenantStore.getState().setTenant(
              response.user.tenantId,
              undefined,
              response.user.organizationId || undefined
            );
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            mfaRequired: false,
            mfaPendingUserId: null,
            mfaEmail: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Invalid MFA code";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      platformLogin: async (credentials: PlatformLoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.platformLogin(credentials);

          // Store tokens
          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);

          // Enable platform mode - skip tenant headers
          setPlatformMode(true);

          // Clear tenant context for platform users
          setTenantContext(null);

          set({
            user: { ...response.user, isPlatformUser: true },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: "Invalid credentials",
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);

          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);

          if (response.user.tenantId) {
            setTenantContext(
              response.user.tenantId,
              response.user.organizationId || null,
              response.user.role === "SUPER_ADMIN"
            );
            // Also update tenant-store for display purposes
            useTenantStore.getState().setTenant(
              response.user.tenantId,
              undefined,
              response.user.organizationId || undefined
            );
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: "Registration failed",
          });
          throw error;
        }
      },

      logout: async () => {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            await authApi.logout(refreshToken);
          } catch {
            // Ignore logout API errors
          }
        }

        clearTokens();
        setTenantContext(null);
        setPlatformMode(false);
        // Also clear tenant-store to prevent stale data on next login
        useTenantStore.getState().clear();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          mfaRequired: false,
          mfaPendingUserId: null,
          mfaEmail: null,
          passwordlessEmail: null,
          codeExpiresAt: null,
          accountTypeSelectionRequired: false,
          accountTypeSessionToken: null,
          availableAccountTypes: [],
          pendingUser: null,
        });
      },

      refreshToken: async (): Promise<boolean> => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          get().logout();
          return false;
        }

        try {
          // Check if this is a platform user
          // First try from user state, then fall back to persisted platform mode
          const storedUser = get().user;
          const isPlatform = storedUser?.isPlatformUser
            || (storedUser ? isPlatformRole(storedUser.role) : false)
            || getPlatformMode(); // Fallback to persisted platform mode

          // Use appropriate refresh endpoint
          const response = isPlatform
            ? await authApi.platformRefresh({ refreshToken })
            : await authApi.refresh({ refreshToken });

          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);
          return true;
        } catch {
          get().logout();
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      initialize: async () => {
        // If already authenticated with valid tokens, just restore tenant context
        const currentAccessToken = getAccessToken();
        if (get().isAuthenticated && currentAccessToken) {
          const storedUser = get().user;
          if (storedUser) {
            // Restore tenant context from stored user
            if (storedUser.isPlatformUser || isPlatformRole(storedUser.role)) {
              setPlatformMode(true);
              setTenantContext(null);
            } else if (storedUser.tenantId) {
              setPlatformMode(false);
              setTenantContext(
                storedUser.tenantId,
                storedUser.organizationId || null,
                storedUser.role === "SUPER_ADMIN"
              );
              useTenantStore.getState().setTenant(
                storedUser.tenantId,
                undefined,
                storedUser.organizationId || undefined
              );
            }
          }
          set({ isLoading: false });
          return;
        }

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        // Check if stored user is a platform user
        // Fall back to persisted platform mode if user not yet hydrated
        const storedUser = get().user;
        const wasPlatformUser = storedUser?.isPlatformUser
          || (storedUser ? isPlatformRole(storedUser.role) : false)
          || getPlatformMode(); // Fallback to persisted platform mode

        set({ isLoading: true });
        try {
          // Check if we already have a valid access token
          const existingAccessToken = getAccessToken();

          // Try to refresh the token (or validate existing one)
          let refreshed = false;
          if (existingAccessToken) {
            // We have an access token, try to use it directly
            // If it fails, the 401 handler will trigger refresh
            refreshed = true;
          } else {
            // No access token, need to refresh
            refreshed = await get().refreshToken();
          }

          if (refreshed) {
            // Get user profile - use appropriate endpoint based on user type
            let user: User;
            if (wasPlatformUser) {
              // Platform users use the platform me endpoint
              setPlatformMode(true);
              user = await authApi.platformMe();
            } else {
              // Regular users use the standard me endpoint
              user = await authApi.me();
            }

            // Check if platform user and set appropriate mode
            if (user.isPlatformUser || isPlatformRole(user.role)) {
              setPlatformMode(true);
              setTenantContext(null);
              set({
                user: { ...user, isPlatformUser: true },
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              setPlatformMode(false);
              if (user.tenantId) {
                setTenantContext(
                  user.tenantId,
                  user.organizationId || null,
                  user.role === "SUPER_ADMIN"
                );
                // Also update tenant-store for display purposes
                useTenantStore.getState().setTenant(
                  user.tenantId,
                  undefined,
                  user.organizationId || undefined
                );
              }
              set({ user, isAuthenticated: true, isLoading: false });
            }
          } else {
            set({ isAuthenticated: false, user: null, isLoading: false });
          }
        } catch {
          set({ isAuthenticated: false, user: null, isLoading: false });
        }
      },

      sendPlatformLoginCode: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.sendPlatformLoginCode({ email });

          // Store email and expiration time
          const expiresAt = Date.now() + response.expiresIn * 1000;
          set({
            passwordlessEmail: email,
            codeExpiresAt: expiresAt,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to send login code";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      verifyPlatformLoginCode: async (email: string, code: string, deviceInfo?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.verifyPlatformLoginCode({
            email,
            code,
            deviceInfo,
          });

          // Store tokens
          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);

          // Enable platform mode
          setPlatformMode(true);

          // Clear tenant context for platform users
          setTenantContext(null);

          set({
            user: { ...response.user, isPlatformUser: true },
            isAuthenticated: true,
            isLoading: false,
            passwordlessEmail: null,
            codeExpiresAt: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Invalid or expired code";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      clearPasswordlessState: () => {
        set({
          passwordlessEmail: null,
          codeExpiresAt: null,
        });
      },

      isPlatformUser: () => {
        const { user } = get();
        return user?.isPlatformUser || (user ? isPlatformRole(user.role) : false);
      },

      hasPermission: (permissionCode: string) => {
        const { user } = get();
        if (!user?.permissions) return false;
        return user.permissions.includes(permissionCode);
      },

      hasAnyPermission: (permissionCodes: string[]) => {
        const { user } = get();
        if (!user?.permissions) return false;
        return permissionCodes.some((code) => user.permissions!.includes(code));
      },

      hasAllPermissions: (permissionCodes: string[]) => {
        const { user } = get();
        if (!user?.permissions) return false;
        return permissionCodes.every((code) => user.permissions!.includes(code));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist user data and auth state
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Persist passwordless login state to survive page reloads
        passwordlessEmail: state.passwordlessEmail,
        codeExpiresAt: state.codeExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        // Called when hydration is complete
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

// Register the refresh function with the API client
setRefreshTokenFn(() => useAuthStore.getState().refreshToken());

/**
 * Hook to wait for hydration to complete.
 * Use this in components that need to wait for persisted state.
 */
export function useHasHydrated() {
  return useAuthStore((state) => state._hasHydrated);
}
