// ── Query Key Factory ─────────────────────────────────────────────────────────
// Provides typed, structured query keys for TanStack Query.
// Rules: all keys are arrays → easier to invalidate subtrees.

export const queryKeys = {
  // Auth
  me: ['auth', 'me'] as const,

  // Bundle endpoints
  dashboardBundle:  ['bundle', 'dashboard'] as const,
  studentDashboard: ['bundle', 'student-dashboard'] as const,
  adminBundle:      ['bundle', 'admin-overview'] as const,
  studentProfileBundle: (id: number) => ['bundle', 'student-profile', id] as const,

  // Students
  students: (filters?: Record<string, unknown>) => ['students', filters ?? {}] as const,
  student:  (id: number) => ['students', id] as const,

  // Batches
  batches: (filters?: Record<string, unknown>) => ['batches', filters ?? {}] as const,
  batch:   (id: number) => ['batches', id] as const,
  batchStudents: (id: number) => ['batches', id, 'students'] as const,

  // Notifications
  notifications:    (filters?: Record<string, unknown>) => ['notifications', filters ?? {}] as const,
  unreadCount:      ['notifications', 'unread-count'] as const,
  notifPreferences: ['notifications', 'preferences'] as const,

  // Admin
  users:          (filters?: Record<string, unknown>) => ['admin', 'users', filters ?? {}] as const,
  roles:          () => ['admin', 'roles'] as const,
  role:           (id: string) => ['admin', 'roles', id] as const,
  settings:       (group?: string) => ['admin', 'settings', group ?? 'all'] as const,
  activityLogs:   (filters?: Record<string, unknown>) => ['admin', 'logs', filters ?? {}] as const,
  deviceSessions: () => ['admin', 'device-sessions'] as const,
} as const
