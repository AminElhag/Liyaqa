import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import i18n from '@/i18n'
import type { ApiError } from '@/types'

// ============================================
// Token Storage
// ============================================

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (stored) {
    accessToken = stored
    return stored
  }
  return null
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function clearTokens() {
  accessToken = null
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// ============================================
// Session Expired Error
// ============================================

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'SessionExpiredError'
  }
}

// ============================================
// Axios Instance
// ============================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================
// Request Interceptor
// ============================================

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = i18n.language
  return config
})

// ============================================
// Response Interceptor — 401 refresh queue
// ============================================

let isRefreshing = false
let failedQueue: Array<{
  resolve: (config: InternalAxiosRequestConfig) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach(({ reject }) => reject(error))
  failedQueue = []
}

function processQueueSuccess() {
  failedQueue.forEach(({ resolve, reject }) => {
    const token = getAccessToken()
    if (!token) {
      reject(new SessionExpiredError())
      return
    }
    // Create a minimal config to satisfy the type — the actual retry
    // uses the original request's config stored in the closure
    resolve({} as InternalAxiosRequestConfig)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Only handle 401 Unauthorized (not 403 Forbidden)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => {
              const token = getAccessToken()
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(api(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshTokenValue = getRefreshToken()
      if (!refreshTokenValue) {
        isRefreshing = false
        processQueue(new SessionExpiredError())
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(new SessionExpiredError())
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/platform/auth/refresh`,
          { refreshToken: refreshTokenValue },
          { headers: { 'Content-Type': 'application/json' } },
        )

        const { accessToken: newAccess, refreshToken: newRefresh } = response.data
        setAccessToken(newAccess)
        if (newRefresh) {
          setRefreshToken(newRefresh)
        }

        isRefreshing = false
        processQueueSuccess()

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch {
        isRefreshing = false
        processQueue(new SessionExpiredError())
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(new SessionExpiredError())
      }
    }

    // 403 — toast notification
    if (error.response?.status === 403) {
      const event = new CustomEvent('toast', {
        detail: { type: 'error', message: 'Permission denied' },
      })
      window.dispatchEvent(event)
    }

    // Network error
    if (!error.response) {
      const event = new CustomEvent('toast', {
        detail: { type: 'error', message: 'Connection lost' },
      })
      window.dispatchEvent(event)
    }

    return Promise.reject(error)
  },
)

// ============================================
// Error Helpers
// ============================================

export async function parseApiError(error: unknown): Promise<ApiError> {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data
    if (data && typeof data === 'object' && 'message' in data) {
      return data as ApiError
    }
    return {
      status: error.response.status,
      error: error.response.statusText,
      errorAr: error.response.statusText,
      message: 'An unexpected error occurred',
      messageAr: 'حدث خطأ غير متوقع',
    }
  }
  return {
    status: 0,
    error: 'Network Error',
    errorAr: 'خطأ في الشبكة',
    message: 'Unable to connect to the server',
    messageAr: 'تعذر الاتصال بالخادم',
  }
}

export function getLocalizedErrorMessage(error: ApiError, locale: string = 'en'): string {
  return locale === 'ar' ? error.messageAr : error.message
}

// ============================================
// Exports
// ============================================

export { api }
export default api
