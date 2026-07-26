import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
})

// Token and session storage helpers
export const getToken = () => localStorage.getItem('eduflow_token')
export const setToken = (token: string) => {
  if (token) localStorage.setItem('eduflow_token', token)
}
export const removeToken = () => localStorage.removeItem('eduflow_token')

// Attach authorization token and client device headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`

    let deviceId = localStorage.getItem('eduflow_device_id')
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem('eduflow_device_id', deviceId)
    }

    config.headers['X-Device-ID'] = deviceId
    config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    config.headers['X-Language'] = navigator.language || 'en'
    config.headers['X-App-Version'] = '1.0.0'

    return config
  },
  (error) => Promise.reject(error),
)

// Global response error handler for sessions and status codes
let isRefreshing = false

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string, errors?: string, reset_token?: string, email?: string }>) => {
    const status = error.response?.status
    const msg = error.response?.data?.message

    if (status === 401) {
      const requestUrl: string = (error.config?.url as string) || ''
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

      // Skip 401 redirects for public endpoints, auth check endpoints, and unauthenticated guest pages
      const isPublicEndpoint = requestUrl.includes('/public/') || 
                              requestUrl.includes('/auth/login') || 
                              requestUrl.includes('/auth/me') ||
                              requestUrl.includes('/auth/forgot-password') ||
                              requestUrl.includes('/blogs') ||
                              requestUrl.includes('/achievements') ||
                              requestUrl.includes('/health')

      const isProtectedAppRoute = currentPath.startsWith('/student') || 
                             currentPath.startsWith('/teacher') || 
                             currentPath.startsWith('/admin')

      if (!isPublicEndpoint && isProtectedAppRoute) {
        removeToken()
        try {
          localStorage.removeItem('eduflow-auth')
          localStorage.removeItem('eduflow_token')
        } catch (e) {}

        if (!isRefreshing) {
          isRefreshing = true
          toast.error('Session expired. Please log in again.')
          setTimeout(() => {
            window.location.replace('/login')
            isRefreshing = false
          }, 800)
        }
      }
      return Promise.reject(error)
    }

    if (status === 403) {
      const errorType = error.response?.data?.errors
      if (errorType === 'PasswordResetRequired') {
        removeToken()
        localStorage.removeItem('eduflow-auth')
        
        if (!isRefreshing) {
          isRefreshing = true
          toast.error(msg || 'Security policy requires a password reset.', { duration: 5000 })
          
          const resetToken = error.response?.data?.reset_token as string | undefined
          const userEmail = error.response?.data?.email as string | undefined
          
          setTimeout(() => {
            if (resetToken && userEmail) {
              window.location.replace(`/login?token=${resetToken}&email=${encodeURIComponent(userEmail)}`)
            } else {
              window.location.replace('/login?reset=true')
            }
            isRefreshing = false
          }, 5000)
        }
      } else if (errorType === 'IpBlocked') {
        toast.error(msg || 'Your IP is blocked.')
      } else {
        toast.error('Permission denied.')
      }
    } else if (status === 422) {
      // Handled by form validation schemas
    } else if (status === 429) {
      toast.error('Rate limit exceeded. Please try again shortly.')
    } else if (status && status >= 500) {
      toast.error(msg || 'Server error. Please try again.')
    }

    return Promise.reject(error)
  },
)

// HTTP convenience wrapper
export const api = {
  get: <T = any>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),

  post: <T = any>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),

  put: <T = any>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((r) => r.data),

  patch: <T = any>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),

  delete: <T = any>(url: string) =>
    apiClient.delete<T>(url).then((r) => r.data),

  upload: <T = any>(url: string, formData: FormData, onProgress?: (pct: number) => void) =>
    apiClient.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    }).then((r) => r.data),
}

export default apiClient
