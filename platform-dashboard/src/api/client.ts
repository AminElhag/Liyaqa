import axios from 'axios'
import i18n from '@/i18n'
import { useAuthStore } from '@/stores/auth-store'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = i18n.language
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    if (error.response?.status === 403) {
      const event = new CustomEvent('toast', {
        detail: { type: 'error', message: 'Permission denied' },
      })
      window.dispatchEvent(event)
    }

    if (!error.response) {
      const event = new CustomEvent('toast', {
        detail: { type: 'error', message: 'Connection lost' },
      })
      window.dispatchEvent(event)
    }

    return Promise.reject(error)
  },
)

export default apiClient
