import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { toast } from 'react-hot-toast'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CourseProgram {
  id: number
  name: string
  slug: string
  education_type_id: number
}

export interface CourseSubject {
  id: number
  name: string
  slug: string
  color: string | null
}

export interface CourseSummary {
  id: number
  title: string
  slug: string
  description: string
  thumbnail: string | null
  status: 'published' | 'draft' | 'archived'
  price: number
  program_id: number | null
  subject_id: number | null
  program?: CourseProgram
  subject?: CourseSubject
  modules_count?: number
  lessons_count?: number
}

export interface CourseFilters {
  program_id?: number
  subject_id?: number
  education_type_id?: number
  status?: string
  search?: string
  page?: number
  per_page?: number
}

// ── Public Courses ────────────────────────────────────────────────────────────

export const usePublicCourses = () =>
  useQuery({
    queryKey: ['public', 'explore'],
    queryFn: () =>
      api.get<{ data: { courses: CourseSummary[] } }>('/public/explore').then(r => r.data.courses ?? []),
    staleTime: 0,
    refetchOnMount: 'always',
  })

// ── Admin Courses ─────────────────────────────────────────────────────────────

export const useAdminCourses = (filters?: CourseFilters) =>
  useQuery({
    queryKey: ['admin', 'courses', filters],
    queryFn: () =>
      api.get<{ success: boolean; data: CourseSummary[] }>('/courses', { params: filters } as any).then(r => r.data ?? []),
  })

export const useCreateCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CourseSummary>) => api.post('/courses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
      qc.invalidateQueries({ queryKey: ['public', 'explore'] })
      toast.success('Course created')
    },
    onError: () => toast.error('Failed to create course'),
  })
}

export const useUpdateCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CourseSummary> & { id: number }) =>
      api.put(`/courses/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
      qc.invalidateQueries({ queryKey: ['public', 'explore'] })
      toast.success('Course updated')
    },
    onError: () => toast.error('Failed to update course'),
  })
}

export const useDeleteCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
      qc.invalidateQueries({ queryKey: ['public', 'explore'] })
      toast.success('Course deleted')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  })
}
