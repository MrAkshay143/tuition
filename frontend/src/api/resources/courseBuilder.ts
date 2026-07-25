import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { toast } from 'react-hot-toast'
import type { Course, Lesson } from '@/types'

// ── Queries ─────────────────────────────────────────────────────────────────

export const useTeacherCourse = (id: number | null) =>
  useQuery<Course>({
    queryKey: ['teacher', 'course', id],
    queryFn: async () => {
      const res = (await api.get(`/courses/${id}`)) as any
      const raw = res.data?.data || res.data || res
      return { ...raw, modules: Array.isArray(raw?.modules) ? raw.modules : [] }
    },
    enabled: !!id,
  })

export const useCourseVersions = (id: number | null) =>
  useQuery<any[]>({
    queryKey: ['teacher', 'course', id, 'versions'],
    queryFn: async () => {
      const res = (await api.get(`/courses/${id}/versions`)) as any
      return Array.isArray(res) ? res : (res.data || [])
    },
    enabled: !!id,
  })

// ── Mutations ───────────────────────────────────────────────────────────────

export const useAcquireCourseLock = (id: number | null, onError: (err: any) => void) =>
  useMutation({
    mutationFn: () => api.post(`/courses/${id}/lock`),
    onError,
  })

export const useReleaseCourseLock = (id: number | null) =>
  useMutation({
    mutationFn: () => api.post(`/courses/${id}/unlock`),
  })

export const useUpdateTeacherCourse = (id: number | null, onSuccess?: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Course>) => api.put(`/courses/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'course', id] })
      onSuccess?.()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save changes.'),
  })
}

export const usePublishCourse = (id: number | null, onSuccess?: () => void, onError?: (err: any) => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (publish: boolean) => api.patch(`/courses/${id}/publish`, { publish }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'course', id] })
      onSuccess?.()
    },
    onError: (err: any) => {
      onError?.(err)
    },
  })
}

export const useDuplicateCourse = (id: number | null, onSuccess?: (res: any) => void) =>
  useMutation({
    mutationFn: () => api.post(`/courses/${id}/duplicate`),
    onSuccess,
  })

export const useAddModule = (id: number | null) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.post(`/courses/${id}/modules`, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'course', id] })
      toast.success('Module added!')
    },
  })
}

export const useUpdateModule = (id: number | null) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId, title }: { moduleId: number; title: string }) =>
      api.put(`/modules/${moduleId}`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher', 'course', id] }),
  })
}

export const useDeleteModule = (id: number | null) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (moduleId: number) => api.delete(`/modules/${moduleId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'course', id] })
      toast.success('Module deleted')
    },
  })
}

export const useAddLesson = (courseId: number | null, onSuccess?: (res: any) => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId, chapterId, title, type }: { moduleId?: number; chapterId?: number; title: string; type: string }) => {
      if (chapterId) {
        return api.post(`/chapters/${chapterId}/lessons`, { title, type })
      } else if (moduleId) {
        return api.post(`/modules/${moduleId}/lessons`, { title, type })
      } else {
        throw new Error('Module or Chapter must be specified')
      }
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['teacher', 'course', courseId] })
      toast.success('Lesson added!')
      onSuccess?.(res)
    },
  })
}

export const useUpdateLesson = (courseId: number | null) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: number; data: Partial<Lesson> }) =>
      api.put(`/lessons/${lessonId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'course', courseId] })
      toast.success('Lesson saved!')
    },
  })
}

export const useDeleteLesson = (courseId: number | null, onSuccess?: () => void) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lessonId: number) => api.delete(`/lessons/${lessonId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'course', courseId] })
      toast.success('Lesson deleted')
      onSuccess?.()
    },
  })
}

export const useSaveCourseVersion = (id: number | null, onSuccess?: () => void) =>
  useMutation({
    mutationFn: (summary: string) => api.post(`/courses/${id}/versions`, { change_summary: summary }),
    onSuccess: () => {
      toast.success('Checkpoint saved!')
      onSuccess?.()
    },
  })

export const exportCourseAction = async (id: number) => {
  return await api.get(`/courses/${id}/export`) as any
}
