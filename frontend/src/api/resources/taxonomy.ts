import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { toast } from 'react-hot-toast'

// ── Types ────────────────────────────────────────────────────────────────────

export interface EducationType {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
  order_index: number
  programs_count?: number
}

export interface Program {
  id: number
  education_type_id: number
  academic_session_id: number | null
  name: string
  slug: string
  description: string | null
  thumbnail: string | null
  is_active: boolean
  order_index: number
  courses_count?: number
  education_type?: Pick<EducationType, 'id' | 'name' | 'slug'>
}

export interface Subject {
  id: number
  name: string
  slug: string
  code: string | null
  color: string | null
  is_active: boolean
  order_index: number
  courses_count?: number
}

export interface AcademicSession {
  id: number
  name: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  is_active: boolean
  programs_count?: number
}

export interface TaxonomyData {
  education_types: Array<EducationType & {
    programs: Array<{ id: number; name: string; slug: string; courses_count: number }>
    total_courses: number
  }>
  subjects: Subject[]
}

// ── Public Taxonomy (for homepage, filters, course browse) ───────────────────

export const useTaxonomy = () => {
  return useQuery({
    queryKey: ['public', 'taxonomy'],
    queryFn: () =>
      api.get<any>('/public/explore').then((res: any) => ({
        education_types: (res?.data?.education_types ?? []) as TaxonomyData['education_types'],
        subjects: (res?.data?.subjects ?? []) as Subject[],
      })),
    staleTime: 1000 * 60 * 10, // 10 minutes - taxonomy changes infrequently
  })
}

// ── Admin Education Types ─────────────────────────────────────────────────────

export const useAdminEducationTypes = () =>
  useQuery({
    queryKey: ['admin', 'education-types'],
    queryFn: () =>
      api.get<{ success: boolean; data: EducationType[] }>('/admin/education-types').then(r => r.data ?? []),
  })

export const useCreateEducationType = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<EducationType>) => api.post('/admin/education-types', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'education-types'] }); toast.success('Education type created') },
    onError: () => toast.error('Failed to create education type'),
  })
}

export const useUpdateEducationType = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<EducationType> & { id: number }) =>
      api.put(`/admin/education-types/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'education-types'] }); toast.success('Education type updated') },
    onError: () => toast.error('Failed to update education type'),
  })
}

export const useDeleteEducationType = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/education-types/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'education-types'] }); toast.success('Education type deleted') },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  })
}

// ── Admin Programs ────────────────────────────────────────────────────────────

export const useAdminPrograms = (filters?: { education_type_id?: number; session_id?: number }) =>
  useQuery({
    queryKey: ['admin', 'programs', filters],
    queryFn: () =>
      api.get<{ success: boolean; data: Program[] }>('/admin/programs', { params: filters } as any).then(r => r.data ?? []),
  })

export const useCreateProgram = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Program>) => api.post('/admin/programs', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'programs'] }); toast.success('Program created') },
    onError: () => toast.error('Failed to create program'),
  })
}

export const useUpdateProgram = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Program> & { id: number }) => api.put(`/admin/programs/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'programs'] }); toast.success('Program updated') },
    onError: () => toast.error('Failed to update program'),
  })
}

export const useDeleteProgram = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/programs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'programs'] }); toast.success('Program deleted') },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  })
}

// ── Admin Subjects ────────────────────────────────────────────────────────────

export const useAdminSubjects = () =>
  useQuery({
    queryKey: ['admin', 'subjects'],
    queryFn: () =>
      api.get<{ success: boolean; data: Subject[] }>('/admin/subjects').then(r => r.data ?? []),
  })

export const useCreateSubject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Subject>) => api.post('/admin/subjects', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subjects'] }); toast.success('Subject created') },
    onError: () => toast.error('Failed to create subject'),
  })
}

export const useUpdateSubject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Subject> & { id: number }) => api.put(`/admin/subjects/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subjects'] }); toast.success('Subject updated') },
    onError: () => toast.error('Failed to update subject'),
  })
}

export const useDeleteSubject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subjects'] }); toast.success('Subject deleted') },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  })
}

// ── Admin Academic Sessions ───────────────────────────────────────────────────

export const useAdminSessions = () =>
  useQuery({
    queryKey: ['admin', 'academic-sessions'],
    queryFn: () =>
      api.get<{ success: boolean; data: AcademicSession[] }>('/admin/academic-sessions').then(r => r.data ?? []),
  })

export const useCreateSession = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AcademicSession>) => api.post('/admin/academic-sessions', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'academic-sessions'] }); toast.success('Session created') },
    onError: () => toast.error('Failed to create session'),
  })
}

export const useUpdateSession = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<AcademicSession> & { id: number }) =>
      api.put(`/admin/academic-sessions/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'academic-sessions'] }); toast.success('Session updated') },
    onError: () => toast.error('Failed to update session'),
  })
}

export const useDeleteSession = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/academic-sessions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'academic-sessions'] }); toast.success('Session deleted') },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  })
}
