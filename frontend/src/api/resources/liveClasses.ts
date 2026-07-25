import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'

// ── QUERIES ─────────────────────────────────────────────────────────────

export const useLiveClasses = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['liveClasses', params],
    queryFn: () => api.get('/live-classes', { params }).then(res => res.data?.data || res.data)
  })
}

export const useLiveClass = (id: string | number) => {
  return useQuery({
    queryKey: ['liveClasses', id],
    queryFn: () => api.get(`/live-classes/${id}`).then(res => res.data?.data || res.data),
    enabled: !!id
  })
}

export const useStudentLiveClasses = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['student', 'liveClasses', params],
    queryFn: () => api.get('/student/live-classes', { params }).then(res => res.data?.data || res.data)
  })
}

// ── MUTATIONS ───────────────────────────────────────────────────────────

export const useCreateLiveClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/live-classes', data),
    onSuccess: () => {
      toast.success('Live class created successfully')
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create live class')
    }
  })
}

export const useUpdateLiveClass = (id: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.put(`/live-classes/${id}`, data),
    onSuccess: () => {
      toast.success('Live class updated successfully')
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] })
      queryClient.invalidateQueries({ queryKey: ['liveClasses', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update live class')
    }
  })
}

export const useDeleteLiveClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => api.delete(`/live-classes/${id}`),
    onSuccess: () => {
      toast.success('Live class cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel live class')
    }
  })
}

export const useStartLiveClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => api.patch(`/live-classes/${id}/start`),
    onSuccess: () => {
      toast.success('Live class started')
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start live class')
    }
  })
}

export const useEndLiveClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => api.patch(`/live-classes/${id}/end`),
    onSuccess: () => {
      toast.success('Live class ended')
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to end live class')
    }
  })
}

export const useRecordAttendance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => api.post(`/live-classes/${id}/attendance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'liveClasses'] })
    },
    onError: (err: any) => {
      console.error('Failed to record attendance', err)
    }
  })
}
