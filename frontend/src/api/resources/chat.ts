import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { toast } from 'react-hot-toast'

export const useConversations = () => {
  return useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => api.get('/chat/conversations').then(res => res.data?.data || res.data)
  })
}

export const useChatThread = (userId: number) => {
  return useQuery({
    queryKey: ['chat', 'thread', userId],
    queryFn: () => api.get(`/chat/messages/${userId}`).then(res => res.data?.data || res.data),
    enabled: !!userId,
    // WebRTC replaces polling
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number, data: { message: string, type?: string, uuid?: string } }) => {
      return api.post(`/chat/messages/${userId}`, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'thread', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
    onError: () => {
      toast.error('Failed to send message')
    }
  })
}

export const useMarkChatRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => api.patch(`/chat/messages/${userId}/read`),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'thread', userId] })
    }
  })
}

export const useUpdateMessageStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, status }: { uuid: string, status: 'delivered' | 'read' }) => {
      return api.patch(`/chat/messages/status/${uuid}`, { status })
    },
    onSuccess: () => {
      // Typically, we might optimistic update, so we don't necessarily need to invalidate immediately
    }
  })
}

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['chat', 'unread-count'],
    queryFn: () => api.get('/chat/unread-count').then(res => res.data?.data || res.data),
    // FCM push notifications will invalidate this, no polling needed.
  })
}

export const useChatPresence = () => {
  return useMutation({
    mutationFn: () => api.post('/chat/presence')
  })
}
