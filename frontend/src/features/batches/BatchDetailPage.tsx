import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApiQuery, useApiMutation } from '@/api/resources/hooks'
import { Card, Spinner, Badge, Button } from '@/components/ui'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { Users, BookOpen, ArrowLeft, GraduationCap, Plus, UserMinus, X, Search } from 'lucide-react'
import { useAuthStore } from '@/store'
import { usePermission } from '@/contexts/PermissionContext'
import { ConfirmModal, Modal } from '@/components/ui/overlays'
import toast from 'react-hot-toast'

export const BatchDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { can } = usePermission()
  const isAdmin = can('module.settings') // Proxy for admin capabilities

  const [activeTab, setActiveTab] = useState<'students' | 'courses'>('students')
  const [removeStudentTarget, setRemoveStudentTarget] = useState<any>(null)
  const [studentSearch, setStudentSearch] = useState('')

  // Add Student modal state
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [studentPickerSearch, setStudentPickerSearch] = useState('')

  // Assign Course modal state
  const [assignCourseOpen, setAssignCourseOpen] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([])
  const [coursePickerSearch, setCoursePickerSearch] = useState('')

  const { data: batch, isLoading } = useApiQuery(
    ['batch', id],
    `/batches/${id}?include=students,courses`
  )

  // All students (for picker)
  const { data: allStudentsData } = useApiQuery(
    ['admin', 'students'],
    '/users?role=student&per_page=200',
    undefined,
    { enabled: addStudentOpen }
  )

  // All courses (for picker)
  const { data: allCoursesData } = useApiQuery(
    ['teacher', 'courses', ''],
    '/courses',
    undefined,
    { enabled: assignCourseOpen }
  )

  const removeStudentMutation = useApiMutation<any, number>(
    (studentId: number) => `/batches/${id}/students/${studentId}`,
    'delete',
    {
      onSuccess: () => {
        toast.success('Student removed from batch')
        setRemoveStudentTarget(null)
      },
      invalidateKeys: [['batch', id]]
    }
  )

  const addStudentsMutation = useApiMutation<any, { student_ids: number[] }>(
    `/batches/${id}/students`,
    'post',
    {
      onSuccess: () => {
        toast.success('Students added to batch!')
        setAddStudentOpen(false)
        setSelectedStudentIds([])
        setStudentPickerSearch('')
      },
      invalidateKeys: [['batch', id]]
    }
  )

  const assignCoursesMutation = useApiMutation<any, { course_ids: number[] }>(
    `/batches/${id}/courses`,
    'post',
    {
      onSuccess: () => {
        toast.success('Courses assigned to batch!')
        setAssignCourseOpen(false)
        setSelectedCourseIds([])
        setCoursePickerSearch('')
      },
      invalidateKeys: [['batch', id]]
    }
  )

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (!batch) return (
    <div className="flex flex-col items-center gap-4 py-20 text-[rgb(var(--text-muted))]">
      <p className="font-semibold">Batch not found</p>
      <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  )

  const students: any[] = batch.students || []
  const courses: any[] = batch.courses || []
  const filteredStudents = studentSearch.trim()
    ? students.filter((s: any) =>
        s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students

  // Students not already in batch
  const batchStudentIds = new Set(students.map((s: any) => s.id))
  const availableStudents = (allStudentsData || []).filter((s: any) => !batchStudentIds.has(s.id))
  const filteredAvailableStudents = studentPickerSearch.trim()
    ? availableStudents.filter((s: any) =>
        s.name?.toLowerCase().includes(studentPickerSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(studentPickerSearch.toLowerCase())
      )
    : availableStudents

  // Courses not already in batch
  const batchCourseIds = new Set(courses.map((c: any) => c.id))
  const availableCourses = (allCoursesData || []).filter((c: any) => !batchCourseIds.has(c.id))
  const filteredAvailableCourses = coursePickerSearch.trim()
    ? availableCourses.filter((c: any) =>
        c.title?.toLowerCase().includes(coursePickerSearch.toLowerCase())
      )
    : availableCourses

  const tabs = [
    { key: 'students', label: 'Students', icon: Users, count: students.length },
    { key: 'courses',  label: 'Courses',  icon: BookOpen, count: courses.length },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </Button>
          <div
            className="w-3 h-10 rounded-full flex-shrink-0"
            style={{ backgroundColor: batch.color || '#6366f1' }}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold font-[Outfit] text-[rgb(var(--text-primary))]">{batch.name}</h2>
              <Badge variant={batch.is_active ? 'success' : 'muted'} dot>
                {batch.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-[rgb(var(--text-muted))] flex items-center gap-1 mt-0.5">
              <GraduationCap size={13} />
              Teacher: <span className="font-semibold text-[rgb(var(--text-secondary))] ml-0.5">{batch.teacher?.name || 'Unassigned'}</span>
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Plus size={13} />} onClick={() => setAddStudentOpen(true)}>
              Add Student
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={13} />} onClick={() => setAssignCourseOpen(true)}>
              Assign Course
            </Button>
          </div>
        )}
      </div>

      {/* Summary stat chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 text-slate-500 dark:text-blue-700 dark:text-blue-400 rounded-xl text-sm font-bold border border-blue-100 dark:border-blue-900/30">
          <Users size={14} /> {students.length} Students
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 rounded-xl text-sm font-bold border border-violet-100 dark:border-violet-900/30">
          <BookOpen size={14} /> {courses.length} Courses
        </div>
        {batch.description && (
          <div className="text-sm text-[rgb(var(--text-muted))] flex items-center gap-1.5 px-3 py-2 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
            {batch.description}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[rgb(var(--border))]">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all relative ${
              activeTab === key
                ? 'border-[rgb(var(--primary))] text-[rgb(var(--primary))]'
                : 'border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))]'
            }`}
          >
            <Icon size={15} />
            {label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              activeTab === key
                ? 'bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]'
                : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))]'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <Card className="overflow-hidden">
        {activeTab === 'students' ? (
          <>
            {students.length > 0 && (
              <div className="px-4 py-3 border-b border-[rgb(var(--border))] flex items-center gap-2">
                <Search size={14} className="text-[rgb(var(--text-muted))] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="text-sm bg-transparent flex-1 outline-none text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]"
                />
                {studentSearch && (
                  <button onClick={() => setStudentSearch('')} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
                    <X size={13} />
                  </button>
                )}
              </div>
            )}
            <div className="overflow-x-auto">
              {filteredStudents.length === 0 ? (
                <div className="px-5 py-14 text-slate-500 dark:text-slate-400 text-center">
                  <Users size={32} className="mx-auto mb-3 text-[rgb(var(--text-muted))] opacity-25" />
                  <p className="text-sm text-[rgb(var(--text-muted))]">
                    {studentSearch ? 'No students match your search.' : 'No students enrolled in this batch.'}
                  </p>
                  {isAdmin && !studentSearch && (
                    <Button variant="primary" size="sm" className="mt-4" leftIcon={<Plus size={13} />} onClick={() => setAddStudentOpen(true)}>
                      Add First Student
                    </Button>
                  )}
                </div>
              ) : (
                <EnterpriseTable
                  columns={[
                    {
                      header: 'Student',
                      accessor: (student: any) => (
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || `/images/default-avatar.svg`}
                            alt="avatar"
                            className="w-8 h-8 rounded-full border border-[rgb(var(--border))] flex-shrink-0"
                          />
                          <span className="font-semibold text-[rgb(var(--text-primary))]">{student.name}</span>
                        </div>
                      )
                    },
                    {
                      header: 'Email',
                      accessor: (student: any) => (
                        <span className="text-[rgb(var(--text-secondary))]">{student.email}</span>
                      )
                    },
                    ...(isAdmin ? [{
                      header: 'Action',
                      accessor: (student: any) => (
                        <div className="flex justify-end text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[rgb(var(--error))] hover:bg-[rgb(var(--error)/0.08)] text-xs font-bold gap-1"
                            leftIcon={<UserMinus size={13} />}
                            onClick={() => setRemoveStudentTarget(student)}
                          >
                            Remove
                          </Button>
                        </div>
                      )
                    }] : [])
                  ]}
                  data={filteredStudents}
                />
              )}
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            {courses.length === 0 ? (
              <div className="px-5 py-14 text-slate-500 dark:text-slate-400 text-center">
                <BookOpen size={32} className="mx-auto mb-3 text-[rgb(var(--text-muted))] opacity-25" />
                <p className="text-sm text-[rgb(var(--text-muted))]">No courses assigned to this batch yet.</p>
                {isAdmin && (
                  <Button variant="primary" size="sm" className="mt-4" leftIcon={<Plus size={13} />} onClick={() => setAssignCourseOpen(true)}>
                    Assign First Course
                  </Button>
                )}
              </div>
            ) : (
              <EnterpriseTable
                columns={[
                  {
                    header: 'Course',
                    accessor: (course: any) => (
                      <div className="flex items-center gap-3">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[rgb(var(--border))]" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[rgb(var(--primary)/0.08)] flex items-center justify-center flex-shrink-0">
                            <BookOpen size={16} className="text-[rgb(var(--primary))]" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-[rgb(var(--text-primary))]">{course.title}</div>
                          {course.teacher && (
                            <div className="text-xs text-[rgb(var(--text-muted))]">by {course.teacher.name}</div>
                          )}
                        </div>
                      </div>
                    )
                  },
                  {
                    header: 'Status',
                    accessor: (course: any) => (
                      <Badge variant={course.status === 'published' ? 'success' : 'muted'}>
                        {(course.status || 'draft').toUpperCase()}
                      </Badge>
                    )
                  },
                  {
                    header: 'Action',
                    accessor: (course: any) => (
                      <div className="flex justify-end text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-bold"
                          onClick={() => navigate(`/teacher/courses/${course.id}/builder`)}
                        >
                          View Course
                        </Button>
                      </div>
                    )
                  }
                ]}
                data={courses}
              />
            )}
          </div>
        )}
      </Card>

      {/* ── ADD STUDENT MODAL ─────────────────────────────────────── */}
      <Modal
        open={addStudentOpen}
        onClose={() => { setAddStudentOpen(false); setSelectedStudentIds([]); setStudentPickerSearch('') }}
        title="Add Students to Batch"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setAddStudentOpen(false); setSelectedStudentIds([]) }}>Cancel</Button>
            <Button
              variant="primary"
              disabled={selectedStudentIds.length === 0}
              loading={addStudentsMutation.isPending}
              onClick={() => addStudentsMutation.mutate({ student_ids: selectedStudentIds })}
            >
              Add {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} ` : ''}Student{selectedStudentIds.length !== 1 ? 's' : ''}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.3)] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]"
              placeholder="Search students by name or email..."
              value={studentPickerSearch}
              onChange={e => setStudentPickerSearch(e.target.value)}
            />
          </div>

          {/* Selected count */}
          {selectedStudentIds.length > 0 && (
            <div className="flex items-center justify-between text-xs font-bold bg-[rgb(var(--primary)/0.06)] text-[rgb(var(--primary))] px-3 py-2 rounded-xl border border-[rgb(var(--primary)/0.15)]">
              <span>{selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected</span>
              <button className="hover:underline" onClick={() => setSelectedStudentIds([])}>Clear all</button>
            </div>
          )}

          {/* Student list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-[rgb(var(--border))] border border-[rgb(var(--border))] rounded-xl">
            {filteredAvailableStudents.length === 0 ? (
              <div className="py-8 text-slate-500 dark:text-slate-400 text-center text-sm text-[rgb(var(--text-muted))]">
                {studentPickerSearch ? 'No students found.' : 'All students are already in this batch.'}
              </div>
            ) : (
              filteredAvailableStudents.map((s: any) => {
                const checked = selectedStudentIds.includes(s.id)
                return (
                  <label key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        if (e.target.checked) setSelectedStudentIds(prev => [...prev, s.id])
                        else setSelectedStudentIds(prev => prev.filter(x => x !== s.id))
                      }}
                      className="w-4 h-4 rounded accent-[rgb(var(--primary))]"
                    />
                    <img
                      src={s.avatar || `/images/default-avatar.svg`}
                      alt=""
                      className="w-7 h-7 rounded-full border border-[rgb(var(--border))] flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate">{s.name}</p>
                      <p className="text-xs text-[rgb(var(--text-muted))] truncate">{s.email}</p>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </div>
      </Modal>

      {/* ── ASSIGN COURSE MODAL ────────────────────────────────────── */}
      <Modal
        open={assignCourseOpen}
        onClose={() => { setAssignCourseOpen(false); setSelectedCourseIds([]); setCoursePickerSearch('') }}
        title="Assign Courses to Batch"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setAssignCourseOpen(false); setSelectedCourseIds([]) }}>Cancel</Button>
            <Button
              variant="primary"
              disabled={selectedCourseIds.length === 0}
              loading={assignCoursesMutation.isPending}
              onClick={() => assignCoursesMutation.mutate({ course_ids: selectedCourseIds })}
            >
              Assign {selectedCourseIds.length > 0 ? `${selectedCourseIds.length} ` : ''}Course{selectedCourseIds.length !== 1 ? 's' : ''}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.3)] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]"
              placeholder="Search courses by title..."
              value={coursePickerSearch}
              onChange={e => setCoursePickerSearch(e.target.value)}
            />
          </div>

          {selectedCourseIds.length > 0 && (
            <div className="flex items-center justify-between text-xs font-bold bg-[rgb(var(--primary)/0.06)] text-[rgb(var(--primary))] px-3 py-2 rounded-xl border border-[rgb(var(--primary)/0.15)]">
              <span>{selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} selected</span>
              <button className="hover:underline" onClick={() => setSelectedCourseIds([])}>Clear all</button>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto divide-y divide-[rgb(var(--border))] border border-[rgb(var(--border))] rounded-xl">
            {filteredAvailableCourses.length === 0 ? (
              <div className="py-8 text-slate-500 dark:text-slate-400 text-center text-sm text-[rgb(var(--text-muted))]">
                {coursePickerSearch ? 'No courses found.' : 'All courses are already assigned to this batch.'}
              </div>
            ) : (
              filteredAvailableCourses.map((c: any) => {
                const checked = selectedCourseIds.includes(c.id)
                return (
                  <label key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        if (e.target.checked) setSelectedCourseIds(prev => [...prev, c.id])
                        else setSelectedCourseIds(prev => prev.filter(x => x !== c.id))
                      }}
                      className="w-4 h-4 rounded accent-[rgb(var(--primary))]"
                    />
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-[rgb(var(--border))]" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[rgb(var(--primary)/0.08)] flex items-center justify-center flex-shrink-0">
                        <BookOpen size={13} className="text-[rgb(var(--primary))]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={c.status === 'published' ? 'success' : 'muted'} className="text-[9px]">
                          {(c.status || 'draft').toUpperCase()}
                        </Badge>
                        {c.teacher && <span className="text-xs text-[rgb(var(--text-muted))]">{c.teacher.name}</span>}
                      </div>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </div>
      </Modal>

      {/* ── REMOVE STUDENT CONFIRM ────────────────────────────────── */}
      <ConfirmModal
        open={!!removeStudentTarget}
        onClose={() => setRemoveStudentTarget(null)}
        onConfirm={() => { if (removeStudentTarget) removeStudentMutation.mutate(removeStudentTarget.id) }}
        loading={removeStudentMutation.isPending}
        title="Remove Student"
        message={`Remove "${removeStudentTarget?.name}" from this batch? They will lose access to batch courses.`}
        confirmLabel="Remove"
        variant="error"
      />
    </div>
  )
}

