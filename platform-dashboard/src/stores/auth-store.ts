import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api, {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  getAccessToken,
  clearTokens,
} from '@/api/client'
import type {
  User,
  PlatformRole,
  SendCodeResponse,
  PlatformAuthResponse,
  RefreshTokenResponse,
} from '@/types'

// ============================================
// State Interface
// ============================================

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  _hasHydrated: boolean

  // OTP passwordless state
  passwordlessEmail: string | null
  codeExpiresAt: number | null

  // Actions
  sendCode: (email: string) => Promise<void>
  verifyCode: (email: string, code: string, deviceInfo?: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  initialize: () => Promise<void>
  clearError: () => void
  setUser: (user: User | null) => void
  setHasHydrated: (state: boolean) => void
  clearPasswordlessState: () => void

  // RBAC helpers
  isPlatformUser: () => boolean
  isPlatformRole: (role: PlatformRole) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

// ============================================
// Store
// ============================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,
      passwordlessEmail: null,
      codeExpiresAt: null,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state })
      },

      // ---- OTP Flow ----

      sendCode: async (email: string) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post<SendCodeResponse>(
            '/api/platform/auth/send-code',
            { email },
          )
          const expiresAt = Date.now() + data.expiresIn * 1000
          set({
            passwordlessEmail: email,
            codeExpiresAt: expiresAt,
            isLoading: false,
          })
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to send login code'
          set({ isLoading: false, error: msg })
          throw error
        }
      },

      verifyCode: async (email: string, code: string, deviceInfo?: string) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post<PlatformAuthResponse>(
            '/api/platform/auth/verify-code',
            { email, code, deviceInfo },
          )

          setAccessToken(data.accessToken)
          setRefreshToken(data.refreshToken)

          set({
            user: { ...data.user, isPlatformUser: true },
            isAuthenticated: true,
            isLoading: false,
            passwordlessEmail: null,
            codeExpiresAt: null,
          })
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Invalid or expired code'
          set({ isLoading: false, error: msg })
          throw error
        }
      },

      // ---- Session ----

      logout: async () => {
        const refreshTokenValue = getRefreshToken()
        if (refreshTokenValue) {
          try {
            await api.post('/api/platform/auth/logout', { refreshToken: refreshTokenValue })
          } catch {
            // Ignore logout API errors
          }
        }

        clearTokens()
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          passwordlessEmail: null,
          codeExpiresAt: null,
        })
      },

      refreshToken: async (): Promise<boolean> => {
        const refreshTokenValue = getRefreshToken()
        if (!refreshTokenValue) {
          await get().logout()
          return false
        }

        try {
          const { data } = await api.post<RefreshTokenResponse>(
            '/api/platform/auth/refresh',
            { refreshToken: refreshTokenValue },
          )
          setAccessToken(data.accessToken)
          setRefreshToken(data.refreshToken)
          return true
        } catch {
          await get().logout()
          return false
        }
      },

      initialize: async () => {
        const currentToken = getAccessToken()
        if (get().isAuthenticated && currentToken) {
          set({ isLoading: false })
          return
        }

        const refreshTokenValue = getRefreshToken()
        if (!refreshTokenValue) {
          set({ isAuthenticated: false, user: null, isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const existingToken = getAccessToken()
          let refreshed = !!existingToken
          if (!refreshed) {
            refreshed = await get().refreshToken()
          }

          if (refreshed) {
            const { data: user } = await api.get<User>('/api/platform/auth/me')
            set({
              user: { ...user, isPlatformUser: true },
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({ isAuthenticated: false, user: null, isLoading: false })
          }
        } catch {
          set({ isAuthenticated: false, user: null, isLoading: false })
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),

      clearPasswordlessState: () => set({ passwordlessEmail: null, codeExpiresAt: null }),

      // ---- RBAC Helpers ----

      isPlatformUser: () => {
        const { user } = get()
        return !!user?.isPlatformUser
      },

      isPlatformRole: (role: PlatformRole) => {
        const { user } = get()
        if (!user?.permissions) return false
        // Platform roles are checked via the user role string
        return (user.role as string) === role
      },

      hasPermission: (permission: string) => {
        const { user } = get()
        if (!user?.permissions) return false
        return user.permissions.includes(permission)
      },

      hasAnyPermission: (permissions: string[]) => {
        const { user } = get()
        if (!user?.permissions) return false
        return permissions.some((p) => user.permissions!.includes(p))
      },

      hasAllPermissions: (permissions: string[]) => {
        const { user } = get()
        if (!user?.permissions) return false
        return permissions.every((p) => user.permissions!.includes(p))
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        passwordlessEmail: state.passwordlessEmail,
        codeExpiresAt: state.codeExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
        }
      },
    },
  ),
)

export function useHasHydrated() {
  return useAuthStore((state) => state._hasHydrated)
}
