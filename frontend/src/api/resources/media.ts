import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'

// Query Key Factory
export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...mediaKeys.lists(), filters] as const,
  details: () => [...mediaKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...mediaKeys.details(), id] as const,
  usage: (id: string | number) => [...mediaKeys.all, 'usage', id] as const,
  recycleBin: (filters: Record<string, any>) => [...mediaKeys.all, 'recycle-bin', filters] as const,
}

export const useMediaList = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: mediaKeys.list(params || {}),
    queryFn: () => api.get('/media', params).then(res => {
      const meta = res?.meta || (res?.current_page ? {
        current_page: res.current_page,
        last_page: res.last_page || 1,
        per_page: res.per_page || 15,
        total: res.total || 0,
      } : null)

      let items: any[] = []
      if (Array.isArray(res)) items = res
      else if (Array.isArray(res?.data)) items = res.data
      else if (Array.isArray(res?.data?.data)) items = res.data.data

      return { items, meta }
    })
  })
}

export const useMediaDetail = (id: string | number) => {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: () => api.get(`/media/${id}`).then(res => res.data?.data || res.data),
    enabled: !!id
  })
}

export const useUploadMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'file' && value instanceof File) {
            formData.append('file', value)
          } else if (key === 'link_entities' && Array.isArray(value)) {
            value.forEach((entity, idx) => {
              formData.append(`link_entities[${idx}][type]`, String(entity.type))
              formData.append(`link_entities[${idx}][id]`, String(entity.id))
              if (entity.link_type) {
                formData.append(`link_entities[${idx}][link_type]`, String(entity.link_type))
              }
            })
          } else {
            formData.append(key, String(value))
          }
        }
      })
      return api.upload('/media/upload', formData)
    },
    onSuccess: () => {
      toast.success('File uploaded successfully')
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to upload file')
    }
  })
}

export const useImportYoutube = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/media/youtube', data),
    onSuccess: () => {
      toast.success('Video imported successfully')
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to import video')
    }
  })
}

export const useUpdateMedia = (id?: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => {
      const targetId = data.id || id
      return api.put(`/media/${targetId}`, data)
    },
    onSuccess: () => {
      toast.success('Media updated successfully')
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update media')
    }
  })
}

export const useReplaceMedia = (id?: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id: targetId, file }: { id?: string | number; file: File }) => {
      const activeId = targetId || id
      const formData = new FormData()
      formData.append('file', file)
      return api.upload(`/media/${activeId}/replace`, formData)
    },
    onSuccess: () => {
      toast.success('File replaced successfully')
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to replace file')
    }
  })
}

export const useDeleteMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, force }: { id: string | number; force?: boolean }) => 
      api.delete(`/media/${id}?force=${force ? 'true' : 'false'}`),
    onSuccess: (_, variables) => {
      toast.success(variables.force ? 'Media permanently deleted' : 'Media moved to Recycle Bin')
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['media'] }) // clear recycle bin lists too
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete media')
    }
  })
}

export const useMediaUsage = (id: string | number) => {
  return useQuery({
    queryKey: mediaKeys.usage(id),
    queryFn: () => api.get(`/media/${id}/usage`).then(res => res.data?.data || res.data),
    enabled: !!id
  })
}

export const useRecycleBinList = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: mediaKeys.recycleBin(params || {}),
    queryFn: () => api.get('/media/recycle-bin', params).then(res => {
      if (Array.isArray(res)) return res
      if (res?.data && Array.isArray(res.data)) return res.data
      return []
    })
  })
}

export const useRestoreMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => api.post(`/media/${id}/restore`),
    onSuccess: () => {
      toast.success('Media restored successfully')
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to restore media')
    }
  })
}

// Bulk Actions
export const useBulkDeleteMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, force }: { ids: (string | number)[]; force?: boolean }) => 
      api.post(`/media/bulk-delete?force=${force ? 'true' : 'false'}`, { ids }),
    onSuccess: () => {
      toast.success('Bulk delete operation completed')
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bulk delete failed')
    }
  })
}

export const useBulkPublishMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: (string | number)[]) => api.post('/media/bulk-publish', { ids }),
    onSuccess: () => {
      toast.success('Bulk publish completed')
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bulk publish failed')
    }
  })
}

export const useBulkArchiveMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: (string | number)[]) => api.post('/media/bulk-archive', { ids }),
    onSuccess: () => {
      toast.success('Bulk archive completed')
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bulk archive failed')
    }
  })
}

export const useBulkCategoryMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, category_id }: { ids: (string | number)[]; category_id: number | null }) => 
      api.post('/media/bulk-category', { ids, category_id }),
    onSuccess: () => {
      toast.success('Bulk category updated')
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bulk category update failed')
    }
  })
}

// Category Management
export const useCategories = () => {
  return useQuery({
    queryKey: ['media', 'categories'],
    queryFn: () => api.get('/content-categories').then(res => res.data?.data || res.data)
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) => api.post('/content-categories', data),
    onSuccess: () => {
      toast.success('Category created successfully')
      queryClient.invalidateQueries({ queryKey: ['media', 'categories'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create category')
    }
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => api.delete(`/content-categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['media', 'categories'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete category')
    }
  })
}
