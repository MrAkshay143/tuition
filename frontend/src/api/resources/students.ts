import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/lib/queryKeys'
import type { Student, StudentForm, PaginatedResponse, ApiResponse } from '@/types'
import { toast } from 'react-hot-toast'

export interface StudentFilters {
  search?: string
  batch_id?: number
  active?: boolean
  cursor?: string
  per_page?: number
  include?: string
  fields?: string
  [key: string]: unknown
}


// ── List students (cursor paginated, includes support) ───────
export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.students(filters),
    queryFn: () => api.get<PaginatedResponse<Student>>('/students', filters as Record<string, unknown>),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  })
}

// ── Single student ───────────────────────────────────────────
export function useStudent(id: number) {
  return useQuery({
    queryKey: queryKeys.student(id),
    queryFn: () => api.get<ApiResponse<Student>>(`/students/${id}`, {
      include: 'batches,courses,progress,activity',
    }).then((r) => r.data),
    enabled: id > 0,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Create student ────────────────────────────────────────────
export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StudentForm) => {
      return api.post<ApiResponse<Student>>('/students', data)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success(`${res.data.name} added successfully!`)
    },
    onError: () => toast.error('Failed to create student.'),
  })
}

// ── Update student ────────────────────────────────────────────
export function useUpdateStudent(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<StudentForm>) => api.put<ApiResponse<Student>>(`/students/${id}`, data),
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.student(id), res.data)
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student updated.')
    },
    onError: () => toast.error('Failed to update student.'),
  })
}

// ── Delete student ─────────────────────────────────────────────
export function useDeleteStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student removed.')
    },
    onError: () => toast.error('Failed to delete student.'),
  })
}

// ── Toggle active ──────────────────────────────────────────────
export function useToggleStudentActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.put<ApiResponse<Student>>(`/students/${id}/toggle-active`, { active }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success(res.data.active ? 'Student activated.' : 'Student deactivated.')
    },
  })
}

// ── Assign batch ───────────────────────────────────────────────
export function useAssignBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, batchIds }: { studentId: number; batchIds: number[] }) =>
      api.post(`/students/${studentId}/assign-batch`, { batch_ids: batchIds }),
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.student(studentId) })
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Batch assignment updated.')
    },
  })
}

// ── Reset password ─────────────────────────────────────────────
export function useResetStudentPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.post(`/students/${id}/reset-password`, { password }),
    onSuccess: () => toast.success('Password reset successfully.'),
    onError: () => toast.error('Failed to reset password.'),
  })
}

// ── Assign course ──────────────────────────────────────────────
export function useAssignCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, courseIds }: { studentId: number; courseIds: number[] }) =>
      api.post(`/students/${studentId}/assign-course`, { course_ids: courseIds }),
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.student(studentId) })
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Course assignment updated.')
    },
    onError: () => toast.error('Failed to assign course.'),
  })
}

// ── Lock student ───────────────────────────────────────────────
export function useLockStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/students/${id}/lock`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.student(id) })
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Account locked.')
    },
    onError: () => toast.error('Failed to lock account.'),
  })
}

// ── Unlock student ─────────────────────────────────────────────
export function useUnlockStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/students/${id}/unlock`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.student(id) })
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Account unlocked.')
    },
    onError: () => toast.error('Failed to unlock account.'),
  })
}

// ── Force logout student ───────────────────────────────────────
export function useForceLogoutStudent() {
  return useMutation({
    mutationFn: (id: number) => api.post(`/students/${id}/force-logout`),
    onSuccess: () => toast.success('Student session terminated.'),
    onError: () => toast.error('Failed to terminate student session.'),
  })
}

// ── Student devices ────────────────────────────────────────────
export function useStudentDevices(studentId: number) {
  return useQuery({
    queryKey: ['students', studentId, 'devices'],
    queryFn: () =>
      api.get<ApiResponse<Array<{ id: number; device_name: string; ip_address: string; last_active_at: string; is_trusted: boolean }>>>(
        `/students/${studentId}/devices`,
      ).then((r) => r.data),
    enabled: studentId > 0,
  })
}

// ── Student Dashboard ───────────────────────────────────────────
export function useStudentDashboard() {
  return useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: () => api.get<any>('/student/dashboard').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

export function useStudentBookmarks() {
  return useQuery({
    queryKey: ['student', 'bookmarks'],
    queryFn: () => api.get<any>('/student/bookmarks').then(r => r.data?.data || []),
    staleTime: 1000 * 60 * 5,
  })
}

export function useStudentProgress() {
  return useQuery({
    queryKey: ['student', 'progress'],
    queryFn: () => api.get<any>('/student/progress').then(r => r.data?.data || []),
    staleTime: 1000 * 60 * 5,
  })
}
