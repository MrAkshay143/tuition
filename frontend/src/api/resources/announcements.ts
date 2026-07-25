import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { toast } from 'react-hot-toast'

export const useAnnouncements = () => {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(res => res.data?.data || res.data)
  })
}

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/announcements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Announcement created successfully')
    },
    onError: () => {
      toast.error('Failed to create announcement')
    }
  })
}

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Announcement deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete announcement')
    }
  })
}
