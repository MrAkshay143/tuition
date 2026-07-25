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
    refetchInterval: 5000 // Poll every 5s for new messages
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number, data: { body: string, type?: string } }) => {
      return api.post(`/chat/messages/${userId}`, { type: 'text', ...data })
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
    }
  })
}

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['chat', 'unread-count'],
    queryFn: () => api.get('/chat/unread-count').then(res => res.data?.data || res.data),
    refetchInterval: 15000 // Poll every 15s for new message notifications
  })
}
