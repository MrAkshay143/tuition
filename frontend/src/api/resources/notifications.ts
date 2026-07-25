import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/lib/queryKeys'
import { useNotificationStore } from '@/store'
import type { Notification, ApiResponse } from '@/types'
import { toast } from 'react-hot-toast'

// ── Infinite list of notifications ─────────────────────────
export function useNotifications(filter?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications({ filter }),
    queryFn: ({ pageParam }) =>
      api.get<{ data: Notification[]; next_cursor: string | null }>('/notifications', {
        cursor: pageParam,
        per_page: 20,
        type: filter === 'all' || !filter ? undefined : filter,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 1000 * 30,
  })
}

// ── Unread count ────────────────────────────────────────────
export function useUnreadCount() {
  const { setUnreadCount } = useNotificationStore()
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count')
      setUnreadCount(res.data.count)
      return res.data.count
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // Poll every minute as fallback
  })
}

// ── Mark single as read ─────────────────────────────────────
export function useMarkRead() {
  const qc = useQueryClient()
  const { markRead } = useNotificationStore()
  return useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onMutate: (id) => {
      markRead(id) // Optimistic
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount })
    },
  })
}

// ── Mark all as read ────────────────────────────────────────
export function useMarkAllRead() {
  const qc = useQueryClient()
  const { markAllRead } = useNotificationStore()
  return useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onMutate: () => {
      markAllRead() // Optimistic
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount })
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read.')
    },
  })
}

// ── Notification preferences ────────────────────────────────
export function useNotifPreferences() {
  return useQuery({
    queryKey: queryKeys.notifPreferences,
    queryFn: () => api.get<ApiResponse<Record<string, boolean>>>('/notifications/preferences').then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  })
}

export function useUpdateNotifPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prefs: Record<string, boolean>) => api.put('/notifications/preferences', prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifPreferences })
      toast.success('Notification preferences saved.')
    },
  })
}

// ── Update FCM token ────────────────────────────────────────
export function useRegisterFcmToken() {
  return useMutation({
    mutationFn: (fcm_token: string) => api.post('/notifications/fcm-token', { fcm_token }),
  })
}
