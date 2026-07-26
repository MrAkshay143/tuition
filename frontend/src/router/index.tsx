import { createBrowserRouter, Navigate, RouterProvider, Outlet } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthStore } from '@/store'
import { AppShell, AdminShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui'
import { RouteErrorBoundary } from '@/shared/errors/ErrorBoundary'

// ── Layouts ──────────────────────────────────────────────────
import PublicLayout from '@/layouts/PublicLayout'

// ── Public Pages ──────────────────────────────────────────────
const Home = lazy(() => import('@/pages/Home'))
const About = lazy(() => import('@/pages/About'))
const Courses = lazy(() => import('@/pages/Courses'))
const CourseDetails = lazy(() => import('@/pages/CourseDetails'))
const LiveClasses = lazy(() => import('@/pages/LiveClasses'))
const StudyMaterials = lazy(() => import('@/pages/StudyMaterials'))
const Results = lazy(() => import('@/pages/Results'))
const Testimonials = lazy(() => import('@/pages/Testimonials'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const Blog = lazy(() => import('@/pages/Blog'))
const BlogDetails = lazy(() => import('@/pages/BlogDetails'))
const FAQ = lazy(() => import('@/pages/FAQ'))
const Contact = lazy(() => import('@/pages/Contact'))
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'))
const Terms = lazy(() => import('@/pages/Terms'))
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// ── Auth Pages ──────────────────────────────────────────────
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))

// ── Teacher Dashboard & Operations ────────────────────────────
const TeacherDashboard = lazy(() => import('@/features/dashboard/TeacherDashboard'))
const StudentsPage = lazy(() => import('@/features/students/StudentsPage'))
const StudentProfilePage = lazy(() => import('@/features/students/StudentProfilePage'))
const UserProfilePage = lazy(() => import('@/features/profile/UserProfilePage').then((m) => ({ default: m.UserProfilePage })))
const BatchesPage = lazy(() => import('@/features/batches/BatchesPage'))


// Teacher Phase 2 stubs
const CourseBuilderPage = lazy(() => import('@/features/courses/CourseBuilderPage'))
const TeacherCoursesPage = lazy(() => import('@/features/stubs').then((m) => ({ default: m.TeacherCoursesPage })))
const TeacherVideosPage = lazy(() => import('@/features/stubs').then((m) => ({ default: m.TeacherVideosPage })))
const TeacherNotesPage = lazy(() => import('@/features/stubs').then((m) => ({ default: m.TeacherNotesPage })))
const TeacherLiveClassesPage = lazy(() => import('@/features/live-classes/LiveClassesPage').then((m) => ({ default: m.LiveClassesPage })))
const TeacherAssignmentsPage = lazy(() => import('@/features/assignments/AssignmentsPage').then((m) => ({ default: m.AssignmentsPage })))
const TeacherAssignmentSubmissionsPage = lazy(() => import('@/features/assignments/AssignmentSubmissionsPage').then((m) => ({ default: m.AssignmentSubmissionsPage })))
const TeacherExamsPage = lazy(() => import('@/features/exams/ExamsPage').then((m) => ({ default: m.ExamsPage })))
const QuestionBankPage = lazy(() => import('@/features/exams/QuestionBankPage'))
const TeacherExamQuestionsEditor = lazy(() => import('@/features/exams/ExamQuestionsEditor').then((m) => ({ default: m.ExamQuestionsEditor })))
const TeacherExamAttemptsPage = lazy(() => import('@/features/exams/ExamAttemptsPage').then((m) => ({ default: m.ExamAttemptsPage })))
const TeacherCertificatesPage = lazy(() => import('@/features/certificates/TeacherCertificatesPage').then(m => ({ default: m.TeacherCertificatesPage })))
const ContentLibraryPage = lazy(() => import('@/features/media/ContentLibrary').then(m => ({ default: m.ContentLibrary })))

const TeacherAnnouncementsPage = lazy(() => import('@/features/announcements/TeacherAnnouncementsPage').then((m) => ({ default: m.TeacherAnnouncementsPage })))
const TeacherCalendarPage = lazy(() => import('@/features/calendar/TeacherCalendarPage').then((m) => ({ default: m.TeacherCalendarPage })))
const TeacherAnalyticsPage = lazy(() => import('@/features/analytics/TeacherAnalyticsPage').then((m) => ({ default: m.TeacherAnalyticsPage })))
const BatchDetailPage = lazy(() => import('@/features/batches/BatchDetailPage').then((m) => ({ default: m.BatchDetailPage })))
const TeacherSettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))

// ── Student Dashboard & Operations ────────────────────────────
const StudentDashboard = lazy(() => import('@/features/dashboard/StudentDashboard'))
const StudentCoursesPage = lazy(() => import('@/features/courses/StudentCoursesPage'))
const LessonViewerPage = lazy(() => import('@/features/courses/LessonViewerPage').then(m => ({ default: m.LessonViewerPage })))
const StudentLiveClassesPage = lazy(() => import('@/features/live-classes/StudentLiveClassesPage').then((m) => ({ default: m.StudentLiveClassesPage })))
const StudentNotesPage = lazy(() => import('@/features/notes/StudentNotesPage').then((m) => ({ default: m.StudentNotesPage })))
const StudentAssignmentsPage = lazy(() => import('@/features/assignments/StudentAssignmentsPage').then((m) => ({ default: m.StudentAssignmentsPage })))
const StudentSettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const StudentExamsPage = lazy(() => import('@/features/exams/StudentExamsPage').then((m) => ({ default: m.StudentExamsPage })))
const StudentExamTakingPage = lazy(() => import('@/features/exams/ExamTakingPage').then((m) => ({ default: m.ExamTakingPage })))
const StudentExamResultPage = lazy(() => import('@/features/exams/ExamResultPage').then((m) => ({ default: m.ExamResultPage })))
const StudentProgressPage = lazy(() => import('@/features/dashboard/StudentProgressPage'))
const ChatPage = lazy(() => import('@/features/chat/ChatPage').then((m) => ({ default: m.ChatPage })))
const StudentCalendarPage = lazy(() => import('@/features/calendar/StudentCalendarPage').then((m) => ({ default: m.StudentCalendarPage })))
const StudentCertificatesPage = lazy(() => import('@/features/certificates/StudentCertificatesPage').then((m) => ({ default: m.StudentCertificatesPage })))


// ── Admin Operations ──────────────────────────────────────────
const AdminOverviewPage = lazy(() => import('@/features/admin/AdminOverviewPage'))
const AdminUsersPage = lazy(() => import('@/features/admin/AdminUsersPage'))
const AdminRolesPage = lazy(() => import('@/features/admin/AdminRolesPage'))
const AdminSettingsPage = lazy(() => import('@/features/admin/AdminSettingsPage'))
const AdminLogsPage = lazy(() => import('@/features/admin/AdminLogsPage'))
const AdminSecurityPage = lazy(() => import('@/features/admin/AdminSecurityPage'))
const AdminOperationsPage = lazy(() => import('@/pages/AdminOperationsPage').then((m) => ({ default: m.AdminOperationsPage })))
const AdminAnnouncementsPage = lazy(() => import('@/features/admin/AdminAnnouncementsPage'))
const AdminBackupPage = lazy(() => import('@/features/admin/AdminBackupPage'))
const AdminEducationTypesPage = lazy(() => import('@/features/admin/AdminEducationTypesPage'))
const AdminSubjectsPage = lazy(() => import('@/features/admin/AdminSubjectsPage'))
const AdminSessionsPage = lazy(() => import('@/features/admin/AdminSessionsPage'))
const AdminProgramsPage = lazy(() => import('@/features/admin/AdminProgramsPage'))

// ── Loading Fallback ─────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <Spinner size={32} />
  </div>
)

// ── Route Guards ─────────────────────────────────────────────
function RequireAuth({ roles, permissions }: { roles?: string[], permissions?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  
  if (roles && !roles.includes(user.role)) {
    const dest = user.role === 'admin' ? '/admin/overview' : `/${user.role}/dashboard`
    return <Navigate to={dest} replace />
  }

  if (permissions && permissions.length > 0) {
    const hasPerm = user.role === 'admin' || permissions.every(p => user.permissions?.includes(p))
    if (!hasPerm) {
      const dest = user.role === 'admin' ? '/admin/overview' : `/${user.role}/dashboard`
      return <Navigate to={dest} replace />
    }
  }

  return <Outlet />
}

function GuestOnly() {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated && user) {
    const dest = user.role === 'admin' ? '/admin/overview' : `/${user.role}/dashboard`
    return <Navigate to={dest} replace />
  }
  return <Outlet />
}

function ProfileRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  const dest = user.role === 'student' ? '/student/profile' : `/${user.role}/profile`
  return <Navigate to={dest} replace />
}

function RoleBasedExamsRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  const dest = user.role === 'student' ? '/student/exams' : user.role === 'admin' ? '/admin/exams' : '/teacher/exams'
  return <Navigate to={dest} replace />
}

function RoleBasedAssignmentsRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  const dest = user.role === 'student' ? '/student/assignments' : user.role === 'admin' ? '/admin/assignments' : '/teacher/assignments'
  return <Navigate to={dest} replace />
}

// Redirects unauthenticated users to login, saving the intended path
// so LoginPage can redirect back after a successful login.
function RedirectToLogin({ to }: { to: string }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated && user) {
    if (to === '/exams') {
      const dest = user.role === 'student' ? '/student/exams' : `/${user.role}/exams`
      return <Navigate to={dest} replace />
    }
    const dest = user.role === 'admin' ? '/admin/overview' : `/${user.role}/dashboard`
    return <Navigate to={dest} replace />
  }
  // Save intended destination so login page can redirect back
  sessionStorage.setItem('redirect_after_login', to)
  // Show toast asynchronously to avoid render-time side effect
  setTimeout(() => {
    import('react-hot-toast').then(({ default: toast }) =>
      toast('Please log in to access this page.', { duration: 3500 })
    )
  }, 0)
  return <Navigate to="/login" replace />
}

// ── Router Setup ──────────────────────────────────────────────
const router = createBrowserRouter([
  
  // 1. Public Layout Pages
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <Suspense fallback={<PageLoader />}><Home /></Suspense> },
      { path: '/about', element: <Suspense fallback={<PageLoader />}><About /></Suspense> },
      { path: '/courses', element: <Suspense fallback={<PageLoader />}><Courses /></Suspense> },
      { path: '/courses/:id', element: <Suspense fallback={<PageLoader />}><CourseDetails /></Suspense> },
      { path: '/live-classes', element: <Suspense fallback={<PageLoader />}><LiveClasses /></Suspense> },
      { path: '/study-materials', element: <Suspense fallback={<PageLoader />}><StudyMaterials /></Suspense> },
      { path: '/results', element: <Suspense fallback={<PageLoader />}><Results /></Suspense> },
      { path: '/testimonials', element: <Suspense fallback={<PageLoader />}><Testimonials /></Suspense> },
      { path: '/gallery', element: <Suspense fallback={<PageLoader />}><Gallery /></Suspense> },
      { path: '/blog', element: <Suspense fallback={<PageLoader />}><Blog /></Suspense> },
      { path: '/blog/:id', element: <Suspense fallback={<PageLoader />}><BlogDetails /></Suspense> },
      { path: '/faq', element: <Suspense fallback={<PageLoader />}><FAQ /></Suspense> },
      { path: '/contact', element: <Suspense fallback={<PageLoader />}><Contact /></Suspense> },
      { path: '/privacy', element: <Suspense fallback={<PageLoader />}><PrivacyPolicy /></Suspense> },
      { path: '/terms', element: <Suspense fallback={<PageLoader />}><Terms /></Suspense> },
      { path: '/refund', element: <Suspense fallback={<PageLoader />}><RefundPolicy /></Suspense> },
      { path: '/404', element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense> },
    ]
  },

  // 2. Guest/Auth Layout Pages
  {
    element: <GuestOnly />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/login', element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
    ]
  },

  // 3. Authenticated Teacher/Admin Academic Pages
  {
    element: <RequireAuth roles={['teacher', 'admin']} />,
    errorElement: <RouteErrorBoundary />,
    children: [{
      element: <AppShell />,
      children: [
        { path: '/teacher', element: <Navigate to="/teacher/dashboard" replace /> },
        { path: '/teacher/dashboard', element: <Suspense fallback={<PageLoader />}><TeacherDashboard /></Suspense> },
        { path: '/teacher/students', element: <Suspense fallback={<PageLoader />}><StudentsPage /></Suspense> },
        { path: '/teacher/students/:id', element: <Suspense fallback={<PageLoader />}><StudentProfilePage /></Suspense> },
        { path: '/teacher/batches', element: <Suspense fallback={<PageLoader />}><BatchesPage /></Suspense> },
        { path: '/teacher/batches/:id', element: <Suspense fallback={<PageLoader />}><BatchDetailPage /></Suspense> },
        { path: '/teacher/courses', element: <Suspense fallback={<PageLoader />}><TeacherCoursesPage /></Suspense> },
        { path: '/teacher/courses/:id/builder', element: <Suspense fallback={<PageLoader />}><CourseBuilderPage /></Suspense> },
        { path: '/teacher/videos', element: <Suspense fallback={<PageLoader />}><TeacherVideosPage /></Suspense> },
        { path: '/teacher/notes', element: <Suspense fallback={<PageLoader />}><TeacherNotesPage /></Suspense> },
        { path: '/teacher/media', element: <Suspense fallback={<PageLoader />}><ContentLibraryPage /></Suspense> },
        { path: '/teacher/question-bank', element: <Suspense fallback={<PageLoader />}><QuestionBankPage /></Suspense> },
        { path: '/teacher/live-classes', element: <Suspense fallback={<PageLoader />}><TeacherLiveClassesPage /></Suspense> },
        { path: '/teacher/assignments', element: <Suspense fallback={<PageLoader />}><TeacherAssignmentsPage /></Suspense> },
        { path: '/teacher/assignments/:id/submissions', element: <Suspense fallback={<PageLoader />}><TeacherAssignmentSubmissionsPage /></Suspense> },
        { path: '/teacher/exams', element: <Suspense fallback={<PageLoader />}><TeacherExamsPage /></Suspense> },
        { path: '/teacher/exams/:id/questions', element: <Suspense fallback={<PageLoader />}><TeacherExamQuestionsEditor /></Suspense> },
        { path: '/teacher/exams/:id/attempts', element: <Suspense fallback={<PageLoader />}><TeacherExamAttemptsPage /></Suspense> },
        { path: '/teacher/certificates', element: <Suspense fallback={<PageLoader />}><TeacherCertificatesPage /></Suspense> },
        { path: '/teacher/chat', element: <Suspense fallback={<PageLoader />}><ChatPage /></Suspense> },
        { path: '/teacher/announcements', element: <Suspense fallback={<PageLoader />}><TeacherAnnouncementsPage /></Suspense> },
        { path: '/teacher/calendar', element: <Suspense fallback={<PageLoader />}><TeacherCalendarPage /></Suspense> },
        { path: '/teacher/analytics', element: <Suspense fallback={<PageLoader />}><TeacherAnalyticsPage /></Suspense> },
        { path: '/teacher/settings', element: <Suspense fallback={<PageLoader />}><TeacherSettingsPage /></Suspense> },
        { path: '/teacher/profile', element: <Suspense fallback={<PageLoader />}><UserProfilePage /></Suspense> },
      ]
    }]
  },

  // 4. Authenticated Student Pages
  {
    element: <RequireAuth roles={['student', 'admin']} />,
    errorElement: <RouteErrorBoundary />,
    children: [{

      element: <AppShell />,
      children: [
        { path: '/student', element: <Navigate to="/student/dashboard" replace /> },
        { path: '/student/dashboard', element: <Suspense fallback={<PageLoader />}><StudentDashboard /></Suspense> },
        { path: '/student/courses', element: <Suspense fallback={<PageLoader />}><StudentCoursesPage /></Suspense> },
        { path: '/student/courses/:courseId/lessons/:lessonId', element: <Suspense fallback={<PageLoader />}><LessonViewerPage /></Suspense> },
        { path: '/student/live-classes', element: <Suspense fallback={<PageLoader />}><StudentLiveClassesPage /></Suspense> },
        { path: '/student/notes', element: <Suspense fallback={<PageLoader />}><StudentNotesPage /></Suspense> },
        { path: '/student/assignments', element: <Suspense fallback={<PageLoader />}><StudentAssignmentsPage /></Suspense> },
        { path: '/student/exams', element: <Suspense fallback={<PageLoader />}><StudentExamsPage /></Suspense> },
        { path: '/student/exams/:id/take', element: <Suspense fallback={<PageLoader />}><StudentExamTakingPage /></Suspense> },
        { path: '/student/exams/:id/result', element: <Suspense fallback={<PageLoader />}><StudentExamResultPage /></Suspense> },
        { path: '/student/progress', element: <Suspense fallback={<PageLoader />}><StudentProgressPage /></Suspense> },
        { path: '/student/chat', element: <Suspense fallback={<PageLoader />}><ChatPage /></Suspense> },
        { path: '/student/calendar', element: <Suspense fallback={<PageLoader />}><StudentCalendarPage /></Suspense> },
        { path: '/student/certificates', element: <Suspense fallback={<PageLoader />}><StudentCertificatesPage /></Suspense> },
        { path: '/student/settings', element: <Suspense fallback={<PageLoader />}><StudentSettingsPage /></Suspense> },
        { path: '/student/profile', element: <Suspense fallback={<PageLoader />}><StudentProfilePage /></Suspense> },
      ]
    }]
  },

  // 5. Authenticated Admin Pages
  {
    element: <RequireAuth roles={['admin']} />,
    errorElement: <RouteErrorBoundary />,
    children: [{
      element: <AdminShell />,
      children: [
        { path: '/admin', element: <Navigate to="/admin/overview" replace /> },
        { path: '/admin/overview', element: <Suspense fallback={<PageLoader />}><AdminOverviewPage /></Suspense> },
        { path: '/admin/users', element: <Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense> },
        { path: '/admin/roles', element: <Suspense fallback={<PageLoader />}><AdminRolesPage /></Suspense> },
        { path: '/admin/settings', element: <Suspense fallback={<PageLoader />}><AdminSettingsPage /></Suspense> },
        { path: '/admin/logs', element: <Suspense fallback={<PageLoader />}><AdminLogsPage /></Suspense> },
        { path: '/admin/security', element: <Suspense fallback={<PageLoader />}><AdminSecurityPage /></Suspense> },
        { path: '/admin/operations', element: <Suspense fallback={<PageLoader />}><AdminOperationsPage /></Suspense> },
        { path: '/admin/announcements', element: <Suspense fallback={<PageLoader />}><AdminAnnouncementsPage /></Suspense> },
        { path: '/admin/backup', element: <Suspense fallback={<PageLoader />}><AdminBackupPage /></Suspense> },
        // Taxonomy Management
        { path: '/admin/education-types', element: <Suspense fallback={<PageLoader />}><AdminEducationTypesPage /></Suspense> },
        { path: '/admin/subjects', element: <Suspense fallback={<PageLoader />}><AdminSubjectsPage /></Suspense> },
        { path: '/admin/sessions', element: <Suspense fallback={<PageLoader />}><AdminSessionsPage /></Suspense> },
        { path: '/admin/programs', element: <Suspense fallback={<PageLoader />}><AdminProgramsPage /></Suspense> },
        // Academic Management (admin shell, same components as teacher)
        { path: '/admin/batches', element: <Suspense fallback={<PageLoader />}><BatchesPage /></Suspense> },
        { path: '/admin/batches/:id', element: <Suspense fallback={<PageLoader />}><BatchDetailPage /></Suspense> },
        { path: '/admin/courses', element: <Suspense fallback={<PageLoader />}><TeacherCoursesPage /></Suspense> },
        { path: '/admin/courses/:id/builder', element: <Suspense fallback={<PageLoader />}><CourseBuilderPage /></Suspense> },
        { path: '/admin/live-classes', element: <Suspense fallback={<PageLoader />}><TeacherLiveClassesPage /></Suspense> },
        { path: '/admin/videos', element: <Suspense fallback={<PageLoader />}><TeacherVideosPage /></Suspense> },
        { path: '/admin/notes', element: <Suspense fallback={<PageLoader />}><TeacherNotesPage /></Suspense> },
        { path: '/admin/media', element: <Suspense fallback={<PageLoader />}><ContentLibraryPage /></Suspense> },
        { path: '/admin/question-bank', element: <Suspense fallback={<PageLoader />}><QuestionBankPage /></Suspense> },
        { path: '/admin/assignments', element: <Suspense fallback={<PageLoader />}><TeacherAssignmentsPage /></Suspense> },
        { path: '/admin/assignments/:id/submissions', element: <Suspense fallback={<PageLoader />}><TeacherAssignmentSubmissionsPage /></Suspense> },
        { path: '/admin/exams', element: <Suspense fallback={<PageLoader />}><TeacherExamsPage /></Suspense> },
        { path: '/admin/exams/:id/questions', element: <Suspense fallback={<PageLoader />}><TeacherExamQuestionsEditor /></Suspense> },
        { path: '/admin/exams/:id/attempts', element: <Suspense fallback={<PageLoader />}><TeacherExamAttemptsPage /></Suspense> },
        { path: '/admin/students', element: <Suspense fallback={<PageLoader />}><StudentsPage /></Suspense> },
        { path: '/admin/students/:id', element: <Suspense fallback={<PageLoader />}><StudentProfilePage /></Suspense> },
        { path: '/admin/analytics', element: <Suspense fallback={<PageLoader />}><TeacherAnalyticsPage /></Suspense> },
        { path: '/admin/profile', element: <Suspense fallback={<PageLoader />}><UserProfilePage /></Suspense> },
      ]
    }]
  },

  // 6. Generic Profile, Exams & Assignments Redirect Routes
  { path: '/profile', element: <ProfileRedirect /> },
  { path: '/exams', element: <RoleBasedExamsRedirect /> },
  { path: '/assignments', element: <RoleBasedAssignmentsRedirect /> },

  // 7. Catchall 404
  { path: '*', element: <Navigate to="/404" replace /> },
])

export default function Router() {
  return <RouterProvider router={router} />
}
