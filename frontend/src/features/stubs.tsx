import React, { useState } from 'react'
import { useTheme } from '@/design-system/hooks/useTheme'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useStudentDashboard, useStudentBookmarks, useStudentProgress } from '@/api/resources/students'
import { getAdminUsers } from '@/api/resources/admin'
import {
  BookOpen, Video, FileText, Radio, ClipboardList, BookOpenCheck, Award,
  BarChart3, MessageSquare, Bell, Calendar, Settings, Plus, Download, Send, Trash2,
  Flame, Clock, Bookmark, ChevronRight, Search, ArrowUpDown, History, Copy, GraduationCap, SlidersHorizontal, ChevronDown, UserCheck
} from 'lucide-react'
import { Button, Card, Badge, Spinner, Input } from '@/components/ui'

import { CreateCourseModal } from '@/features/courses/CreateCourseModal'
import { ConfirmModal } from '@/components/ui/overlays'
import { useAuthStore } from '@/store'
import { usePermission } from '@/contexts/PermissionContext'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// ── STUDENT DASHBOARD ───────────────────────────────────────────────
export function StudentDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useStudentDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-[rgb(var(--bg-elevated))] animate-pulse rounded-2xl" />
        <div className="admin-stats-row">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-24 bg-[rgb(var(--bg-elevated))] animate-pulse rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-[rgb(var(--bg-elevated))] animate-pulse rounded-2xl" />
          <div className="h-64 bg-[rgb(var(--bg-elevated))] animate-pulse rounded-2xl" />
        </div>
      </div>
    )
  }

  const analytics = data?.analytics || { hours_learned: 0, lessons_completed: 0, courses_completed: 0, current_streak: 0, longest_streak: 0, weekly_activity: [] }
  const resume = data?.resume
  const enrolledCourses = data?.enrolled_courses || []
  const history = data?.history || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-[Outfit] tracking-tight text-[rgb(var(--text-primary))]">Welcome back!</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-1 font-[Inter]">Here is a summary of your learning journey today.</p>
        </div>
        <Badge variant="muted">Student Workspace</Badge>
      </div>

      {/* ── RESUME LEARNING HERO BANNER ──────────────────────────────── */}
      {resume && (
        <Card className="p-6 overflow-hidden relative border border-[rgb(var(--primary)/0.15)]" style={{ background: 'linear-gradient(135deg, rgb(var(--bg-surface)), rgb(var(--primary)/0.04))' }}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary">CONTINUE WATCHING</Badge>
                <span className="text-xs text-[rgb(var(--text-secondary))] font-medium flex items-center gap-1">
                  <Clock size={12} /> Last active position: {Math.floor(resume.resume_position / 60)}m {resume.resume_position % 60}s
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))] font-[Outfit]">
                {resume.lesson.title}
              </h2>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                Module: <span className="font-semibold text-[rgb(var(--text-primary))]">{resume.module.title}</span> • Course: <span className="font-semibold text-[rgb(var(--text-primary))]">{resume.course.title}</span>
              </p>
              
              <div className="space-y-1.5 max-w-md pt-2">
                <div className="flex justify-between text-xs font-semibold text-[rgb(var(--text-secondary))]">
                  <span>Lesson Progress</span>
                  <span>{resume.watch_percentage}% Complete</span>
                </div>
                <div className="w-full bg-[rgb(var(--border))] h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-2 rounded-full transition-all duration-500 bg-[rgb(var(--primary))]" 
                    style={{ width: `${resume.watch_percentage}%` }}
                  />
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              variant="primary"
              className="font-semibold shadow-md flex items-center gap-2"
              onClick={() => navigate(`/student/courses/${resume.course.id}/lessons/${resume.lesson.id}`)}
            >
              Resume Lesson <ChevronRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      {/* ── LEARNING STATS GRID ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-orange-500">
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 flex-shrink-0">
            <Flame className="animate-pulse" size={22} />
          </div>
          <div>
            <span className="text-xs text-[rgb(var(--text-muted))] block font-medium">Learning Streak</span>
            <span className="text-2xl font-extrabold mt-0.5 text-orange-600 font-[Outfit] block">{analytics.current_streak} days</span>
            <span className="text-[10px] text-[rgb(var(--text-muted))] block">Best: {analytics.longest_streak} days</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-[rgb(var(--primary))]">
          <div className="w-12 h-12 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center text-[rgb(var(--primary))] flex-shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs text-[rgb(var(--text-muted))] block font-medium">Hours Learned</span>
            <span className="text-2xl font-extrabold mt-0.5 text-[rgb(var(--primary))] font-[Outfit] block">{analytics.hours_learned} hrs</span>
            <span className="text-[10px] text-[rgb(var(--text-muted))] block">Estimated video time</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-slate-500 dark:text-emerald-600 flex-shrink-0">
            <BookOpenCheck size={22} />
          </div>
          <div>
            <span className="text-xs text-[rgb(var(--text-muted))] block font-medium">Lessons Finished</span>
            <span className="text-2xl font-extrabold mt-0.5 text-slate-500 dark:text-emerald-600 font-[Outfit] block">{analytics.lessons_completed}</span>
            <span className="text-[10px] text-[rgb(var(--text-muted))] block">Auto-completed at 95%</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-violet-500">
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-600 flex-shrink-0">
            <Award size={22} />
          </div>
          <div>
            <span className="text-xs text-[rgb(var(--text-muted))] block font-medium">Courses Completed</span>
            <span className="text-2xl font-extrabold mt-0.5 text-violet-600 font-[Outfit] block">{analytics.courses_completed}</span>
            <span className="text-[10px] text-[rgb(var(--text-muted))] block">Certificate issued</span>
          </div>
        </Card>
      </div>

      {/* ── DETAILED VIEWS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Courses & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-[rgb(var(--text-primary))] font-[Outfit]">My Active Enrolled Courses</h2>
            {enrolledCourses.length === 0 ? (
              <Card className="p-8 text-slate-500 dark:text-slate-400 text-center text-[rgb(var(--text-secondary))]">
                You are not enrolled in any active courses yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.map((course: any) => (
                  <Card key={course.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200">
                    <div className="space-y-3">
                      <div className="flex gap-3 items-center">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[rgb(var(--primary)/0.1)] flex items-center justify-center text-[rgb(var(--primary))] text-sm font-extrabold font-[Outfit] flex-shrink-0">
                            {course.title.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-1">{course.title}</h3>
                          <span className="text-[10px] text-[rgb(var(--text-muted))]">Curriculum active</span>
                        </div>
                      </div>
                      <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-2">{course.description}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[rgb(var(--border))] flex flex-col gap-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-[rgb(var(--text-secondary))]">
                          <span>Syllabus complete</span>
                          <span>{course.completed_percentage}%</span>
                        </div>
                        <div className="w-full bg-[rgb(var(--border))] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[rgb(var(--primary))] h-1.5 rounded-full" style={{ width: `${course.completed_percentage}%` }} />
                        </div>
                      </div>
                      <Button size="sm" variant="primary" className="w-full justify-center flex gap-1 items-center" onClick={() => navigate(`/courses/${course.id}`)}>
                        Go to Classroom <ChevronRight size={12} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Watch Time Chart Widget */}
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">Weekly Learning Progress</h3>
            <div className="flex justify-between items-end h-32 pt-4 px-2">
              {analytics.weekly_activity.map((act: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full max-w-[24px] bg-[rgb(var(--border))] h-24 rounded-t-lg relative flex items-end">
                    <div 
                      className="bg-[rgb(var(--primary))] w-full rounded-t-lg transition-all duration-500 hover:opacity-80 relative group"
                      style={{ height: `${Math.max(8, Math.min(100, (act.hours / 4) * 100))}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-surface))] text-[9px] font-bold py-1 px-1.5 rounded shadow whitespace-nowrap z-30">
                        {act.hours} hrs
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium">{act.day}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Timeline Recent Activity */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-[rgb(var(--text-primary))]">
              <History size={16} />
              <h3 className="font-bold text-sm font-[Outfit]">Recent Activity Logs</h3>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-[rgb(var(--text-secondary))] text-slate-500 dark:text-slate-400 text-center py-4">No recent activity records.</p>
            ) : (
              <div className="space-y-4">
                {history.map((h: any, idx: number) => (
                  <div key={h.id || idx} className="flex gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] mt-1.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[rgb(var(--text-primary))] font-medium">
                        {h.action === 'lesson_completed' && 'Completed Lesson'}
                        {h.action === 'lesson_opened' && 'Opened Lesson'}
                        {h.action === 'resume' && 'Resumed Playback'}
                        {h.action === 'bookmark_added' && 'Added Bookmark'}
                        <span className="font-bold block text-[10px] text-[rgb(var(--primary))] line-clamp-1">{h.lesson_title}</span>
                      </p>
                      <span className="text-[9px] text-[rgb(var(--text-muted))]">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── STUDENT COURSES ─────────────────────────────────────────────────
export function StudentCoursesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'progress' | 'completed' | 'bookmarks'>('all')
  const [sortBy, setSortBy] = useState<'alpha' | 'progress' | 'recent'>('recent')

  const { data, isLoading } = useStudentDashboard()

  const { data: bookmarksData } = useStudentBookmarks()

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  const courses = data?.enrolled_courses || []
  const bookmarks = bookmarksData || []

  let filtered = [...courses]

  if (activeTab === 'progress') {
    filtered = filtered.filter(c => c.completed_percentage > 0 && c.completed_percentage < 100)
  } else if (activeTab === 'completed') {
    filtered = filtered.filter(c => c.completed_percentage === 100)
  } else if (activeTab === 'bookmarks') {
    const bookmarkedLessonCourseIds = bookmarks.map((b: any) => b.lesson?.module?.course_id)
    filtered = filtered.filter(c => bookmarkedLessonCourseIds.includes(c.id))
  }

  if (search.trim()) {
    filtered = filtered.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
  }

  filtered.sort((a, b) => {
    if (sortBy === 'alpha') {
      return a.title.localeCompare(b.title)
    } else if (sortBy === 'progress') {
      return b.completed_percentage - a.completed_percentage
    } else {
      return b.id - a.id;
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-[Outfit] tracking-tight text-[rgb(var(--text-primary))]">My Courses</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5 font-[Inter]">Filter and launch your classroom curriculum courses.</p>
        </div>
        
        <div className="relative w-full md:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.3)] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgb(var(--border))] pb-3">
        <div className="flex gap-1 overflow-x-auto">
          {(['all', 'progress', 'completed', 'bookmarks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-[rgb(var(--primary))] text-white shadow-sm'
                  : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-elevated))]'
              }`}
            >
              {tab === 'progress' ? 'In Progress' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-secondary))]">
          <ArrowUpDown size={14} />
          <span>Sort:</span>
          <select
            className="border-none focus:ring-0 text-xs font-bold text-[rgb(var(--text-primary))] bg-transparent"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="recent">Recently Added</option>
            <option value="progress">Highest Progress</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-slate-500 dark:text-slate-400 text-center text-[rgb(var(--text-secondary))]">
          No courses found matching selected filters.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(course => (
            <Card key={course.id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div>
                {course.thumbnail ? (
                  <img src={course.thumbnail} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-[rgb(var(--primary)/0.08)] flex items-center justify-center text-[rgb(var(--primary))] text-3xl font-extrabold font-[Outfit]">
                    {course.title.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-2">{course.description}</p>
                </div>
              </div>

              <div className="p-5 border-t border-[rgb(var(--border))] space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-[rgb(var(--text-secondary))]">
                    <span>Course Complete</span>
                    <span>{course.completed_percentage}%</span>
                  </div>
                  <div className="w-full bg-[rgb(var(--border))] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[rgb(var(--primary))] h-1.5 rounded-full" style={{ width: `${course.completed_percentage}%` }} />
                  </div>
                </div>

                <Button variant="primary" className="w-full justify-center flex items-center gap-1" onClick={() => navigate(`/courses/${course.id}`)}>
                  Go to Classroom <ChevronRight size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── STUDENT PROGRESS ────────────────────────────────────────────────
export function StudentProgressPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useStudentProgress()

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  const completions = data || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-[Outfit] tracking-tight text-[rgb(var(--text-primary))]">Learning Journey</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5 font-[Inter]">Review your completions, history timeline, and print certificates.</p>
        </div>
        <Badge variant="muted">Journey Logs</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Completions list & Certificates */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">My Classroom Certifications</h3>
            {completions.length === 0 ? (
              <p className="text-xs text-[rgb(var(--text-secondary))] py-4 text-slate-500 dark:text-slate-400 text-center">No certifications earned yet.</p>
            ) : (
              <div className="space-y-4">
                {completions.map((comp: any) => (
                  <div key={comp.id} className="p-4 border border-[rgb(var(--border))] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">{comp.course?.title}</h4>
                        {comp.completed_percentage === 100 && (
                          <Badge variant="success">COMPLETED</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-secondary))]">
                        Completion: <span className="font-bold">{comp.completed_percentage}%</span>
                      </p>
                    </div>

                    {comp.completed_percentage === 100 && comp.certificate_id && (
                      <Button 
                        size="sm" 
                        variant="primary"
                        className="font-bold flex items-center gap-1.5 flex-shrink-0"
                        onClick={() => {
                          toast.success(`Opening Certificate Ref: ${comp.certificate_id}`)
                          window.print()
                        }}
                      >
                        <Award size={14} /> Certificate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export function TeacherCoursesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore()
  const { can } = usePermission()
  const isAdmin = can('module.settings') // Proxy for admin capabilities
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [transferTarget, setTransferTarget] = useState<{ courseId: number; teacherId: number } | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const { data: teachers } = useQuery({
    queryKey: ['admin', 'teachers'],
    queryFn: async () => {
      const res = await getAdminUsers({ role: 'teacher' })
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
    enabled: isAdmin
  })

  const { data, isLoading } = useQuery({
    queryKey: ['teacher', 'courses', selectedTeacherId],
    queryFn: async () => {
      const params = selectedTeacherId ? { teacher_id: selectedTeacherId } : {}
      const res = (await api.get('/courses', params)) as any
      return Array.isArray(res) ? res : (res?.data ?? [])
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: { title: string, description?: string, teacher_id?: number | null }) => {
      const payload: any = { title: data.title, description: data.description }
      if (data.teacher_id) payload.teacher_id = data.teacher_id
      else if (isAdmin && selectedTeacherId) payload.teacher_id = parseInt(selectedTeacherId)
      return api.post('/courses', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'courses'] })
      setShowCreateModal(false)
      toast.success('Course created successfully!')
    }
  })

  const duplicateMutation = useMutation({
    mutationFn: (courseId: number) => api.post(`/courses/${courseId}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'courses'] })
      toast.success('Course duplicated!')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (courseId: number) => api.delete(`/courses/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'courses'] })
      setDeleteTargetId(null)
      toast.success('Course deleted.')
    }
  })

  const transferMutation = useMutation({
    mutationFn: ({ courseId, teacherId }: { courseId: number; teacherId: number }) =>
      api.put(`/courses/${courseId}`, { teacher_id: teacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'courses'] })
      toast.success('Course ownership transferred!')
    }
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.upload('/courses/import', formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'courses'] })
      toast.success('Course imported successfully!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to import course.')
    }
  })

  const allCourses = (data as any[]) || []
  const published = allCourses.filter((c: any) => c.status === 'published')
  const drafts = allCourses.filter((c: any) => c.status !== 'published')

  let filtered = statusFilter === 'published' ? published
    : statusFilter === 'draft' ? drafts
    : allCourses

  if (search.trim()) {
    filtered = filtered.filter((c: any) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    )
  }

  const pubPct = allCourses.length ? Math.round((published.length / allCourses.length) * 100) : 73
  const draftPct = allCourses.length ? Math.round((drafts.length / allCourses.length) * 100) : 27

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Page Header matching Users & Roles Pages */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <BookOpen size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Courses
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Manage and organize all courses in your catalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            id="course-package-importer"
            className="hidden"
            accept=".eduflow"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                importMutation.mutate(e.target.files[0])
              }
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} className="rotate-180" />}
            onClick={() => document.getElementById('course-package-importer')?.click()}
            loading={importMutation.isPending}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer hidden sm:inline-flex"
          >
            Import
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Create Course</span>
            <span className="inline sm:hidden">+ Course</span>
          </Button>
        </div>
      </div>

      {/* 2. Top KPI Metrics Row matching Users & Roles Pages */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Courses */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <BookOpen size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Courses</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{allCourses.length}</h3>
            <p className="text-[10px] text-purple-400 font-semibold mt-1">↑ 3 this month</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </Card>

        {/* Card 2: Published */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpenCheck size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Published</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{published.length}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">{pubPct}% of total</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pubPct}%` }}></div>
          </div>
        </Card>

        {/* Card 3: Draft */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <FileText size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Draft</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{drafts.length}</h3>
            <p className="text-[10px] text-amber-400 font-semibold mt-1">{draftPct}% of total</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${draftPct}%` }}></div>
          </div>
        </Card>

        {/* Card 4: Teachers Assigned */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <GraduationCap size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Teachers Assigned</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{teachers?.length || 0}</h3>
            <p className="text-[10px] text-blue-400 font-semibold mt-1">Assigned teachers</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${teachers?.length ? '100%' : '0%'}` }}></div>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter Bar with Workable Filter Button */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Left Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Workable Filter Toggle Button on Right Side */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0",
              showFilters || statusFilter !== 'all' || selectedTeacherId !== ''
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(statusFilter !== 'all' || selectedTeacherId !== '') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel - Side by Side */}
        {(showFilters || statusFilter !== 'all' || selectedTeacherId !== '') && (
          <div className="p-2.5 sm:p-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
              {isAdmin && (
                <div className="relative flex-1 min-w-0">
                  <select
                    value={selectedTeacherId}
                    onChange={e => setSelectedTeacherId(e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                  >
                    <option value="">All Teachers</option>
                    {(teachers || []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
                </div>
              )}

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-[rgb(var(--bg-elevated))] rounded-xl p-1 border border-[rgb(var(--border))] shrink-0">
                {(['all', 'published', 'draft'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg capitalize transition-all cursor-pointer",
                      statusFilter === s
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {(statusFilter !== 'all' || selectedTeacherId !== '') && (
              <button
                onClick={() => { setStatusFilter('all'); setSelectedTeacherId('') }}
                className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Courses 2-Column Grid on Mobile matching Public Courses Page */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-56 sm:h-64 bg-[rgb(var(--bg-elevated))] animate-pulse rounded-2xl border border-[rgb(var(--border))]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-slate-500 dark:text-slate-400 text-center border-dashed border-2">
          <BookOpen className="w-10 h-10 mx-auto opacity-25 mb-3 text-[rgb(var(--text-muted))]" />
          <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] font-[Outfit]">No Courses Found</h3>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-1">
            {search ? `No results for "${search}"` : 'No courses match the selected filters.'}
          </p>
          {search && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSearch('')}>Clear Search</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filtered.map((course: any) => (
            <Card key={course.id} className="overflow-hidden border border-[rgb(var(--border))] flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-200 group p-0">
              {/* Top Thumbnail Image */}
              {course.thumbnail ? (
                <img src={course.thumbnail} className="w-full h-24 sm:h-36 object-cover" />
              ) : (
                <div className="w-full h-24 sm:h-36 bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border))] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center">
                  <BookOpen size={22} className="text-[rgb(var(--text-muted))] opacity-40 mb-1 sm:w-7 sm:h-7" />
                  <span className="text-[9px] sm:text-[11px] text-[rgb(var(--text-muted))] font-medium">No thumbnail</span>
                </div>
              )}

              <div className="p-2.5 sm:p-4 flex flex-col gap-2 sm:gap-3 flex-1 justify-between">
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Status & Course ID */}
                  <div className="flex items-center justify-between">
                    {course.status === 'published' ? (
                      <Badge variant="success" className="text-[7px] sm:text-[8px] uppercase font-mono bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 px-1.5 sm:px-2 py-0.5">
                        PUBLISHED
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[7px] sm:text-[8px] uppercase font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 sm:px-2 py-0.5">
                        DRAFT
                      </Badge>
                    )}
                    <span className="text-[9px] sm:text-[10px] text-[rgb(var(--text-muted))] font-mono font-bold">#{course.id}</span>
                  </div>

                  {/* Title & Instructor */}
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-[rgb(var(--text-primary))] font-[Outfit] leading-snug line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-[rgb(var(--text-muted))] font-semibold mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
                      <GraduationCap size={11} className="text-indigo-400 shrink-0" /> <span className="truncate">{course.teacher?.name || 'Platform Admin'}</span>
                    </p>
                  </div>

                  {/* Description */}
                  {course.description && (
                    <p className="text-[10px] sm:text-[11px] text-[rgb(var(--text-muted))] line-clamp-1 sm:line-clamp-2 leading-tight">
                      {course.description}
                    </p>
                  )}

                  {/* Modules & Lessons Real Database Stats */}
                  {(() => {
                    const modulesCount = typeof course.modules_count === 'number' ? course.modules_count : (Array.isArray(course.modules) ? course.modules.length : 0)
                    const lessonsCount = typeof course.lessons_count === 'number' ? course.lessons_count : (Array.isArray(course.modules) ? course.modules.reduce((acc: number, m: any) => acc + (Array.isArray(m.lessons) ? m.lessons.length : (m.lessons_count || 0)), 0) : 0)
                    return (
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-indigo-500/20">
                          <BookOpen size={10} />
                          {modulesCount} {modulesCount === 1 ? 'Module' : 'Modules'}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <Video size={10} />
                          {lessonsCount} {lessonsCount === 1 ? 'Lesson' : 'Lessons'}
                        </span>
                      </div>
                    )
                  })()}
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-[rgb(var(--border))] mt-1 sm:mt-2">
                  <button
                    onClick={() => duplicateMutation.mutate(course.id)}
                    className="p-1.5 sm:p-2 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                    title="Duplicate Course"
                  >
                    <Copy size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>

                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1 font-bold text-[10px] sm:text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-1 sm:py-1.5 px-1.5 sm:px-3 shadow-md shadow-indigo-600/20 cursor-pointer truncate"
                    onClick={() => navigate(`/teacher/courses/${course.id}/builder`)}
                  >
                    <span className="hidden sm:inline">Build Syllabus</span>
                    <span className="inline sm:hidden">Build</span>
                  </Button>

                  <button
                    onClick={() => setDeleteTargetId(course.id)}
                    className="p-1.5 sm:p-2 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Delete Course"
                  >
                    <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateCourseModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(title, description, teacherId) => {
          createMutation.mutate({ title, description, teacher_id: teacherId })
        }}
        isPending={createMutation.isPending}
      />

      <ConfirmModal
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        title="Transfer Ownership"
        message="Transfer course ownership to selected teacher?"
        confirmVariant="primary"
        confirmLabel="Transfer"
        loading={transferMutation.isPending}
        onConfirm={() => {
          if (transferTarget) {
            transferMutation.mutate(transferTarget, {
              onSuccess: () => setTransferTarget(null)
            })
          }
        }}
      />

      <ConfirmModal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Course"
        message="Delete this course?"
        confirmVariant="error"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMutation.mutate(deleteTargetId, {
              onSuccess: () => setDeleteTargetId(null)
            })
          }
        }}
      />
    </div>
  )
}

// ── TEACHER VIDEOS ──────────────────────────────────────────────────
export { TeacherVideosPage } from './media/TeacherVideosPage'

// ── LESSON VIEWER ────────────────────────────────────────────────────
export { LessonViewerPage } from './courses/LessonViewerPage'

// ── TEACHER NOTES ───────────────────────────────────────────────────
export { TeacherNotesPage } from './media/TeacherNotesPage'

















