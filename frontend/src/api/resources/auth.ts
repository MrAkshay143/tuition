import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store'
import type { User, AuthResponse, LoginForm } from '@/types'
import { toast } from 'react-hot-toast'
import { getAllProgress } from '@/lib/playbackDB'

// ── Fetch current user ──────────────────────────────────────
export function useMe() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.get('/auth/me').then((r) => (r?.data?.user ?? r?.data ?? r)),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 min
    retry: false,
  })
}

// ── Login ──────────────────────────────────────────────────
export function useLogin() {
  const { setAuth } = useAuthStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginForm) => api.post('/auth/login', data),
    onSuccess: (res: any) => {
      // Safely extract payload from Laravel ApiResponse wrapper { success: true, data: { user, token } }
      const payload = res?.data ?? res
      const user = payload?.user
      const token = payload?.token

      if (!user || !token) {
        toast.error(res?.message || 'Invalid login response from server.')
        return
      }

      setAuth(user, token)
      qc.setQueryData(queryKeys.me, user)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)

      // ── Guest → Auth migration (best-effort, non-blocking) ──────────
      // Upload any locally saved lesson progress to the server so the
      // user can continue seamlessly on any device after logging in.
      getAllProgress().then(async (records) => {
        const meaningful = records.filter((r) => r.watchedSeconds >= 5)
        if (meaningful.length === 0) return
        for (const record of meaningful) {
          try {
            await api.post(`/lessons/${record.lessonId}/progress`, {
              watch_seconds: Math.floor(record.watchedSeconds),
              position:      Math.floor(record.watchedSeconds),
            })
          } catch {
            // Lesson may not exist or user is not enrolled - skip silently
          }
        }
      }).catch(() => {}) // never throw from migration
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || err?.message || 'Invalid email or password.'
      toast.error(errorMsg)
    },
  })
}

// ── Logout ─────────────────────────────────────────────────
export function useLogout() {
  const { logout } = useAuthStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      logout()
      qc.clear()
      window.location.href = '/login'
    },
  })
}

// ── Forgot Password ─────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api.post('/auth/forgot-password', { email }),
    onSuccess: () => toast.success('Password reset link sent to your email.'),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not send reset link.'),
  })
}

// ── Reset Password ──────────────────────────────────────────
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
      api.post('/auth/reset-password', data),
    onSuccess: () => toast.success('Password reset successfully. Please log in.'),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Invalid or expired reset link.'),
  })
}

// ── Update FCM Token ────────────────────────────────────────
export function useUpdateFcmToken() {
  return useMutation({
    mutationFn: (fcm_token: string) => api.post('/notifications/fcm-token', { fcm_token }),
  })
}
