import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/lib/queryKeys'
import type { DashboardBundle, StudentDashboardBundle, AdminOverviewBundle } from '@/types'

// ── Teacher Dashboard Bundle ────────────────────────────────
// Single call returns: stats + today's classes + upcoming + recent submissions
//                      + notifications + storage
export function useDashboardBundle() {
  return useQuery({
    queryKey: queryKeys.dashboardBundle,
    queryFn: () => api.get<{ data: DashboardBundle }>('/bundle/dashboard').then((r) => r.data),
    staleTime: 1000 * 60 * 2, // 2 min
    refetchOnWindowFocus: true,
  })
}

// ── Student Dashboard Bundle ────────────────────────────────
export function useStudentDashboardBundle() {
  return useQuery({
    queryKey: queryKeys.studentDashboard,
    queryFn: () => api.get<{ data: StudentDashboardBundle }>('/bundle/student-dashboard').then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  })
}

// ── Student Profile Bundle ──────────────────────────────────
// Single call returns: student profile + batches + courses + progress
//                      + assignments + exams + attendance + certificates + activity
export function useStudentProfileBundle(id: number) {
  return useQuery({
    queryKey: queryKeys.studentProfileBundle(id),
    queryFn: () => api.get<{ data: {
      student: import('@/types').Student
      progress: import('@/types').StudentProgress
      batches: import('@/types').Batch[]
      assignments: import('@/types').AssignmentSubmission[]
      exams: import('@/types').Exam[]
      certificates: import('@/types').Certificate[]
      activity: import('@/types').ActivityLog[]
    } }>(`/bundle/student-profile/${id}`).then((r) => r.data),
    enabled: id > 0,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Admin Overview Bundle ───────────────────────────────────
export function useAdminBundle() {
  return useQuery({
    queryKey: queryKeys.adminBundle,
    queryFn: () => api.get<{ data: AdminOverviewBundle }>('/bundle/admin-overview').then((r) => r.data),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
  })
}
