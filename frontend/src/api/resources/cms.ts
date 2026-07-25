import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'

// ── Blogs ────────────────────────────────────────────────────────────────
export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...blogKeys.lists(), filters] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slugOrId: string | number) => [...blogKeys.details(), slugOrId] as const,
}

export const useBlogs = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: blogKeys.list(params || {}),
    queryFn: () => api.get('/blogs', params).then(res => {
      const responseData = res.data
      let items: any[] = []
      if (Array.isArray(responseData)) items = responseData
      else if (Array.isArray(responseData?.data)) items = responseData.data
      
      const meta = responseData?.meta || responseData
      return { items, meta }
    })
  })
}

export const useBlog = (slug: string) => {
  return useQuery({
    queryKey: blogKeys.detail(slug),
    queryFn: () => api.get(`/blogs/${slug}`).then(res => res.data?.data || res.data),
    enabled: !!slug
  })
}

// ── Achievements ────────────────────────────────────────────────────────
export const achievementKeys = {
  all: ['achievements'] as const,
  lists: () => [...achievementKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...achievementKeys.lists(), filters] as const,
}

export const useAchievements = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: achievementKeys.list(params || {}),
    queryFn: () => api.get('/achievements', params).then(res => {
      const responseData = res.data
      let items: any[] = []
      if (Array.isArray(responseData)) items = responseData
      else if (Array.isArray(responseData?.data)) items = responseData.data
      
      const meta = responseData?.meta || responseData
      return { items, meta }
    })
  })
}
