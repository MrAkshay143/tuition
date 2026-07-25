import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Upload, Layers, BookOpen } from 'lucide-react'
import { useStudentProfileBundle } from '@/api/bundles'
import { useAuthStore } from '@/store'
import { useStudentDevices, useForceLogoutStudent } from '@/api/resources/students'
import { Avatar, Badge, Card, Button, Skeleton } from '@/components/ui'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { formatDate } from '@/lib/utils'
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'
import AssignBatchModal from './AssignBatchModal'
import AssignCourseModal from './AssignCourseModal'

const TABS = [
  'Overview',
  'Academic',
  'Attendance',
  'Assignments',
  'Exams',
  'Certificates',
  'Devices',
  'Login History',
  'Notifications',
  'Audit Log',
  'Timeline'
] as const
type Tab = typeof TABS[number]

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('Overview')
  const [assignBatchOpen, setAssignBatchOpen] = useState(false)
  const [assignCourseOpen, setAssignCourseOpen] = useState(false)
  const [assignPage, setAssignPage] = useState(1)
  const [assignPerPage, setAssignPerPage] = useState(10)

  const user = useAuthStore((s) => s.user)
  const targetId = id ? Number(id) : (user?.id || 0)
  const canManageDevices = user?.role === 'admin' || user?.role === 'teacher'
  const { data, isLoading } = useStudentProfileBundle(targetId)
  const backLink = user?.role === 'admin' ? '/admin/users' : user?.role === 'teacher' ? '/teacher/students' : '/student/courses'
  const { data: devicesData, isLoading: loadingDevices } = useStudentDevices(targetId, canManageDevices)
  const { mutate: forceLogout, isPending: loggingOut } = useForceLogoutStudent()

  if (isLoading) return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="flex gap-4">
        {TABS.map((t) => <Skeleton key={t} className="h-9 w-24 rounded-full" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  if (!data) return <div className="text-slate-500 dark:text-slate-400 text-center py-16 text-[rgb(var(--text-muted))]">Student profile not found.</div>

  const student = data?.student || ({} as any)
  const progress = data?.progress || {
    attendance_percentage: 0,
    courses_completed: 0,
    courses_enrolled: 0,
    assignments_submitted: 0,
    assignments_pending: 0,
    average_score: 0,
    total_watch_hours: 0,
  }

  const batches = Array.isArray(data?.batches) ? data.batches : []
  const assignments = Array.isArray(data?.assignments) ? data.assignments : []
  const exams = Array.isArray(data?.exams) ? data.exams : []
  const certificates = Array.isArray(data?.certificates) ? data.certificates : []
  const activity = Array.isArray(data?.activity) ? data.activity : []

  const totalAssignCount = assignments.length
  const lastAssignPage = Math.max(1, Math.ceil(totalAssignCount / assignPerPage))
  const paginatedAssignments = assignments.slice((assignPage - 1) * assignPerPage, assignPage * assignPerPage)

  const progressData = [
    { name: 'Attendance', value: progress.attendance_percentage || 0, fill: 'rgb(var(--primary))' },
    { name: 'Courses', value: Math.round((progress.courses_completed / Math.max(1, progress.courses_enrolled)) * 100), fill: 'rgb(var(--accent-dark))' },
    { name: 'Assignments', value: Math.round((progress.assignments_submitted / Math.max(1, progress.assignments_submitted + progress.assignments_pending)) * 100), fill: 'rgb(var(--warning))' },
  ]


  return (
    <>
    <div className="flex flex-col gap-5 pb-12 font-[Outfit]">
      {/* 1. Minimalist Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <Link to={backLink} className="hover:text-[rgb(var(--text-primary))] transition-colors">
              {user?.role === 'admin' ? 'Users' : user?.role === 'teacher' ? 'Students' : 'Dashboard'}
            </Link>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">{student.name || 'Student Profile'}</span>
          </div>
        </div>
      </div>

      {/* 2. Compact One-Line Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[150px] flex-1 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Attendance</span>
            <span className="text-[10px] font-bold text-indigo-500">{progress.attendance_percentage}%</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{progress.attendance_percentage}%</h3>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[150px] flex-1 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Courses</span>
            <span className="text-[10px] font-bold text-emerald-500">{progress.courses_completed}/{progress.courses_enrolled}</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{progress.courses_completed} <span className="text-xs text-[rgb(var(--text-muted))]">/ {progress.courses_enrolled}</span></h3>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[150px] flex-1 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Avg Score</span>
            <span className="text-[10px] font-bold text-amber-500">{progress.average_score}%</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{progress.average_score}%</h3>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[150px] flex-1 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Watch Time</span>
            <span className="text-[10px] font-bold text-purple-500">{progress.total_watch_hours}h</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{progress.total_watch_hours} <span className="text-xs text-[rgb(var(--text-muted))]">hours</span></h3>
        </Card>
      </div>

      {/* 3. Profile Hero Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-[rgb(var(--border))]"
        style={{ background: 'linear-gradient(135deg, rgb(var(--bg-surface)), rgba(99, 102, 241, 0.05))' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Avatar src={student.avatar} name={student.name} size="lg" />
              <button className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform">
                <Upload size={10} />
              </button>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] truncate">{student.name}</h2>
                <Badge variant={student.active ? 'success' : 'error'} className="text-[9px] px-1.5 py-0.2" dot>{student.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="text-xs text-[rgb(var(--text-muted))] truncate">{student.email}</p>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <div className="flex gap-1.5 shrink-0">
              <Button variant="secondary" size="sm" className="h-8 text-xs px-2.5" leftIcon={<Edit size={12} />}>Edit</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" leftIcon={<Layers size={12} />} onClick={() => setAssignBatchOpen(true)}>Batch</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" leftIcon={<BookOpen size={12} />} onClick={() => setAssignCourseOpen(true)}>Course</Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 bg-[rgb(var(--bg-elevated))] p-1 rounded-xl border border-[rgb(var(--border))]">
        {TABS.map((t) => (
          <button
            key={t}
            className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              tab === t
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <Card className="p-3.5 sm:p-4">
              <h3 className="widget-title mb-3 text-sm">Progress Overview</h3>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart cx="50%" cy="50%" innerRadius={25} outerRadius={90} data={progressData}>
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'rgb(var(--border))' }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-2 flex-wrap">
                {progressData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                    <span className="text-[rgb(var(--text-secondary))]">{d.name}: <strong>{d.value}%</strong></span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="widget-title text-sm">Enrolled Batches</h3>
                {(user?.role === 'admin' || user?.role === 'teacher') && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" leftIcon={<Layers size={12} />} onClick={() => setAssignBatchOpen(true)}>Manage</Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {batches.length === 0 ? (
                  <p className="text-xs text-[rgb(var(--text-muted))] py-4 text-center">Not enrolled in any batch.</p>
                ) : batches.map((b) => (
                  <div key={b.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: b.color }}>{b.name[0]}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[rgb(var(--text-primary))] truncate">{b.name}</p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">{b.students_count} students</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'Academic' && (
          <Card className="p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="widget-title text-sm">Academic Progress</h3>
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" leftIcon={<BookOpen size={12} />} onClick={() => setAssignCourseOpen(true)}>Manage Courses</Button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {batches.length === 0 ? (
                <p className="text-xs text-[rgb(var(--text-muted))] py-4 text-center">Not enrolled in any batch track.</p>
              ) : batches.map(b => (
                <div key={b.id} className="p-2.5 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl text-xs">
                  <p className="font-bold text-[rgb(var(--text-primary))]">{b.name} Course Track</p>
                  <p className="text-[10px] text-[rgb(var(--text-muted))] mt-0.5">Status: Enrolled</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'Attendance' && (
          <Card className="p-3.5 sm:p-4">
            <h3 className="widget-title mb-3 text-sm">Class Attendance</h3>
            <p className="text-xs text-[rgb(var(--text-secondary))]">Live attendance rate: <strong className="text-emerald-500 font-extrabold">{progress.attendance_percentage}%</strong></p>
            <p className="text-[11px] text-[rgb(var(--text-muted))] mt-1">No unexcused absences recorded.</p>
          </Card>
        )}

        {tab === 'Assignments' && (
          <Card className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">Assignments ({assignments.length})</h3>
            </div>
            
            {assignments.length === 0 ? (
              <p className="text-xs text-[rgb(var(--text-muted))] py-6 text-center">No assignment submissions recorded yet.</p>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block md:hidden space-y-2">
                  {paginatedAssignments.map((sub: any) => (
                    <div key={sub.id} className="p-3 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-[rgb(var(--text-primary))] truncate">Assignment #{sub.assignment_id}</span>
                        <Badge variant={sub.status === 'reviewed' ? 'success' : sub.status === 'submitted' ? 'warning' : 'primary'} className="text-[9px] px-2 py-0.5">
                          {sub.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[rgb(var(--text-muted))] pt-1 border-t border-[rgb(var(--border))]">
                        <span>Grade: <strong className="text-[rgb(var(--text-primary))] font-mono">{sub.grade !== null ? `${sub.grade}` : '-'}</strong></span>
                        <span>{formatDate(sub.submitted_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <EnterpriseTable
                    columns={[
                      {
                        header: 'Assignment',
                        accessor: (sub: any) => <span className="font-semibold text-xs text-[rgb(var(--text-primary))]">Assignment #{sub.assignment_id}</span>
                      },
                      {
                        header: 'Submitted',
                        accessor: (sub: any) => <span className="text-xs text-[rgb(var(--text-muted))]">{formatDate(sub.submitted_at)}</span>
                      },
                      {
                        header: 'Grade',
                        accessor: (sub: any) => <span className="font-bold text-xs text-[rgb(var(--text-primary))] font-mono">{sub.grade !== null ? `${sub.grade}` : '-'}</span>
                      },
                      {
                        header: 'Status',
                        accessor: (sub: any) => <Badge variant={sub.status === 'reviewed' ? 'success' : sub.status === 'submitted' ? 'warning' : 'primary'} className="text-[10px]">{sub.status}</Badge>
                      }
                    ]}
                    data={paginatedAssignments}
                    meta={{
                      current_page: assignPage,
                      last_page: lastAssignPage,
                      per_page: assignPerPage,
                      total: totalAssignCount,
                    }}
                    onPageChange={(p) => setAssignPage(p)}
                    onPerPageChange={(pp) => {
                      setAssignPerPage(pp)
                      setAssignPage(1)
                    }}
                  />
                </div>
              </>
            )}
          </Card>
        )}

        {tab === 'Exams' && (
          <Card className="p-3.5 sm:p-4">
            <h3 className="widget-title mb-3 text-sm">Exam Attempts</h3>
            {exams.length === 0 ? (
              <p className="text-xs text-[rgb(var(--text-muted))] py-6 text-center">No exam attempts found.</p>
            ) : (
              <div className="space-y-2">
                {exams.map((e: any) => (
                  <div key={e.id} className="flex justify-between items-center p-2.5 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-[rgb(var(--text-primary))]">Exam #{e.exam_id}</p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))] mt-0.5">Score: <strong className="text-[rgb(var(--text-primary))] font-mono">{e.score}%</strong></p>
                    </div>
                    <Badge variant={e.passed ? 'success' : 'error'} className="text-[9px] px-2 py-0.5">{e.passed ? 'Passed' : 'Failed'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'Certificates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <Card key={cert.id} className="p-4 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-[rgb(var(--warning)/0.12)] flex items-center justify-center text-2xl">🏆</div>
                <div>
                  <p className="font-semibold text-[rgb(var(--text-primary))] capitalize">{cert.type} Certificate</p>
                  <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{cert.course?.title ?? 'General'}</p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Issued {formatDate(cert.issued_at)}</p>
                </div>
                <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[rgb(var(--primary))] hover:underline">
                  Download PDF →
                </a>
              </Card>
            ))}
          </div>
        )}

        {tab === 'Devices' && (
          <Card className="p-5">
            <h3 className="widget-title mb-4">Active Devices & Sessions</h3>
            {loadingDevices ? (
              <div className="flex flex-col gap-2"><Skeleton className="h-12 rounded-lg" /><Skeleton className="h-12 rounded-lg" /></div>
            ) : (devicesData ?? []).length === 0 ? (
              <p className="text-sm text-[rgb(var(--text-muted))]">No active device sessions found for this student.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {(devicesData ?? []).map((dev) => (
                  <div key={dev.id} className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
                    <div>
                      <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{dev.device_name || 'Browser Session'}</p>
                      <p className="text-xs text-[rgb(var(--text-muted))]">IP: {dev.ip_address} • Last Active: {formatDate(dev.last_active_at)}</p>
                    </div>
                    <Button variant="error" size="sm" loading={loggingOut} onClick={() => forceLogout(student.id)}>
                      Force Logout
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'Login History' && (
          <Card className="p-5">
            <h3 className="widget-title mb-3">Login Logs</h3>
            <p className="text-xs text-[rgb(var(--text-muted))]">No suspicious login attempts recorded.</p>
          </Card>
        )}

        {tab === 'Notifications' && (
          <Card className="p-5">
            <h3 className="widget-title mb-3">Notification Logs</h3>
            <p className="text-xs text-[rgb(var(--text-muted))]">No pending notification warnings.</p>
          </Card>
        )}

        {tab === 'Audit Log' && (
          <Card className="overflow-hidden">
            <EnterpriseTable
              columns={[
                {
                  header: 'Event',
                  accessor: (log: any) => <Badge variant="muted">{log.event}</Badge>
                },
                {
                  header: 'Description',
                  accessor: (log: any) => <span className="text-[rgb(var(--text-secondary))] max-w-xs truncate block">{log.description}</span>
                },
                {
                  header: 'IP',
                  accessor: (log: any) => <span className="text-[rgb(var(--text-muted))] font-mono">{log.ip_address}</span>
                },
                {
                  header: 'Time',
                  accessor: (log: any) => <span className="text-[rgb(var(--text-muted))]">{formatDate(log.created_at)}</span>
                }
              ]}
              data={activity}
            />
          </Card>
        )}

        {tab === 'Timeline' && (
          <Card className="p-5 space-y-4">
            <h3 className="widget-title">Account Timeline</h3>
            <div className="relative pl-6 border-l border-[rgb(var(--border))] space-y-4 text-xs">
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))] border-4 border-[rgb(var(--bg-base))]" />
                <p className="font-semibold text-[rgb(var(--text-primary))]">Registered Student Account</p>
                <p className="text-[rgb(var(--text-muted))] mt-0.5">{formatDate(student.created_at)}</p>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </div>

    <AssignBatchModal
      open={assignBatchOpen}
      onClose={() => setAssignBatchOpen(false)}
      student={student}
    />
    <AssignCourseModal
      open={assignCourseOpen}
      onClose={() => setAssignCourseOpen(false)}
      student={student}
    />
  </>
  )
}
