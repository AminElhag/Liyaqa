import { useQuery, useMutation } from '@tanstack/react-query'
import {
  sendCode,
  verifyCode,
  refreshToken,
  getMe,
  logout,
} from '@/api/endpoints/auth'
import type {
  SendCodeRequest,
  VerifyCodeRequest,
  RefreshTokenRequest,
} from '@/types'

// Query key factory
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

// ============================================
// Query hooks
// ============================================

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMe,
    staleTime: 600_000,
    retry: false,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useSendCode() {
  return useMutation({
    mutationFn: (data: SendCodeRequest) => sendCode(data),
  })
}

export function useVerifyCode() {
  return useMutation({
    mutationFn: (data: VerifyCodeRequest) => verifyCode(data),
  })
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => refreshToken(data),
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: (data: { refreshToken: string }) => logout(data),
  })
}
