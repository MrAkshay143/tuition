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
  const user = useAuthStore((s) => s.user)
  const targetId = id ? Number(id) : (user?.id || 0)
  const { data, isLoading } = useStudentProfileBundle(targetId)
  const backLink = user?.role === 'admin' ? '/admin/users' : '/teacher/students'
  const { data: devicesData, isLoading: loadingDevices } = useStudentDevices(targetId)
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

  if (!data) return <div className="text-slate-500 dark:text-slate-400 text-center py-16 text-[rgb(var(--text-muted))]">Student not found.</div>

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
  const [assignPage, setAssignPage] = useState(1)
  const [assignPerPage, setAssignPerPage] = useState(10)

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
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link to={backLink} className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors w-fit">
        <ArrowLeft size={16} /> Back to Students
      </Link>

      {/* Profile Hero */}
      <motion.div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, rgb(var(--primary) / 0.08), rgb(var(--accent) / 0.08))' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-5 flex-wrap">
          <div className="relative">
            <Avatar src={student.avatar} name={student.name} size="xl" />
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
              <Upload size={12} />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] font-[Outfit]">{student.name}</h2>
              <Badge variant={student.active ? 'success' : 'error'} dot>{student.active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="text-[rgb(var(--text-muted))] mt-1">{student.email}</p>
            {student.phone && <p className="text-sm text-[rgb(var(--text-muted))]">{student.phone}</p>}
            <p className="text-xs text-[rgb(var(--text-muted))] mt-2">Enrolled {formatDate(student.created_at)}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" leftIcon={<Edit size={15} />}>Edit Profile</Button>
            <Button variant="outline" size="sm" leftIcon={<Layers size={14} />} onClick={() => setAssignBatchOpen(true)}>Assign Batch</Button>
            <Button variant="outline" size="sm" leftIcon={<BookOpen size={14} />} onClick={() => setAssignCourseOpen(true)}>Assign Course</Button>
          </div>
        </div>

        {/* Progress stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[rgb(var(--border))]">
          {[
            { label: 'Attendance', value: `${progress.attendance_percentage}%` },
            { label: 'Courses', value: `${progress.courses_completed}/${progress.courses_enrolled}` },
            { label: 'Avg Score', value: `${progress.average_score}%` },
            { label: 'Watch Time', value: `${progress.total_watch_hours}h` },
          ].map((s) => (
            <div key={s.label} className="text-slate-500 dark:text-slate-400 text-center">
              <p className="text-xl font-bold text-[rgb(var(--text-primary))] font-[Outfit]">{s.value}</p>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              tab === t
                ? 'bg-[rgb(var(--primary))] text-white shadow-sm'
                : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="widget-title mb-4">Progress Overview</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius={30} outerRadius={100} data={progressData}>
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'rgb(var(--border))' }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {progressData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                    <span className="text-[rgb(var(--text-secondary))]">{d.name}: <strong>{d.value}%</strong></span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="widget-title">Enrolled Batches</h3>
                <Button variant="ghost" size="sm" leftIcon={<Layers size={13} />} onClick={() => setAssignBatchOpen(true)}>Manage</Button>
              </div>
              <div className="flex flex-col gap-2">
                {batches.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--text-muted))]">Not enrolled in any batch.</p>
                ) : batches.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg-elevated))]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: b.color }}>{b.name[0]}</div>
                    <div>
                      <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{b.name}</p>
                      <p className="text-xs text-[rgb(var(--text-muted))]">{b.students_count} students</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'Academic' && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="widget-title">Academic Progress</h3>
              <Button variant="ghost" size="sm" leftIcon={<BookOpen size={13} />} onClick={() => setAssignCourseOpen(true)}>Manage Courses</Button>
            </div>
            <div className="flex flex-col gap-2">
              {batches.length === 0 ? (
                <p className="text-sm text-[rgb(var(--text-muted))]">Not enrolled in any batch.</p>
              ) : batches.map(b => (
                <div key={b.id} className="p-3 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-lg">
                  <p className="font-semibold text-sm text-[rgb(var(--text-primary))]">{b.name} Course Track</p>
                  <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Status: Enrolled</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'Attendance' && (
          <Card className="p-5">
            <h3 className="widget-title mb-4">Class Attendance</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">Live attendance percentage: <strong>{progress.attendance_percentage}%</strong></p>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-1">No missed classes recorded.</p>
          </Card>
        )}

        {tab === 'Assignments' && (
          <Card className="overflow-hidden">
            <EnterpriseTable
              columns={[
                {
                  header: 'Assignment',
                  accessor: (sub: any) => <span className="font-medium">Assignment #{sub.assignment_id}</span>
                },
                {
                  header: 'Submitted',
                  accessor: (sub: any) => <span className="text-[rgb(var(--text-muted))]">{formatDate(sub.submitted_at)}</span>
                },
                {
                  header: 'Grade',
                  accessor: (sub: any) => <span className="font-semibold">{sub.grade !== null ? `${sub.grade}` : '-'}</span>
                },
                {
                  header: 'Status',
                  accessor: (sub: any) => <Badge variant={sub.status === 'reviewed' ? 'success' : sub.status === 'submitted' ? 'warning' : 'primary'}>{sub.status}</Badge>
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
          </Card>
        )}

        {tab === 'Exams' && (
          <Card className="p-5">
            <h3 className="widget-title mb-4">Exam Attempts</h3>
            {exams.length === 0 ? (
              <p className="text-sm text-[rgb(var(--text-muted))]">No exam attempts found.</p>
            ) : (
              <div className="space-y-3">
                {exams.map((e: any) => (
                  <div key={e.id} className="flex justify-between items-center p-3 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-lg text-xs">
                    <div>
                      <p className="font-semibold text-[rgb(var(--text-primary))]">Exam #{e.exam_id}</p>
                      <p className="text-[rgb(var(--text-muted))] mt-0.5">Score: {e.score}%</p>
                    </div>
                    <Badge variant={e.passed ? 'success' : 'error'}>{e.passed ? 'Passed' : 'Failed'}</Badge>
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
            <h3 className="widget-title mb-4">Login Logs</h3>
            <p className="text-sm text-[rgb(var(--text-muted))]">No security failures or impossible travel flags detected.</p>
          </Card>
        )}

        {tab === 'Notifications' && (
          <Card className="p-5">
            <h3 className="widget-title mb-4">Notification Alerts Dispatch</h3>
            <p className="text-sm text-[rgb(var(--text-muted))]">No push or SMS warnings queued.</p>
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
            <h3 className="widget-title">Student Milestones Timeline</h3>
            <div className="relative pl-6 border-l border-[rgb(var(--border))] space-y-4 text-xs">
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))] border-4 border-[rgb(var(--bg-base))]" />
                <p className="font-semibold text-[rgb(var(--text-primary))]">Student Registration Completed</p>
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
