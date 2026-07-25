import React, { useState, useMemo } from 'react'
import { Card, Spinner, Badge, Button } from '@/components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from 'recharts'
import { useApiQuery } from '@/api/resources/hooks'
import { Activity, Clock, FileCheck, TrendingUp, Trophy, UserCheck, BookOpen, GraduationCap, Award, Flame, CheckCircle } from 'lucide-react'

export const TeacherAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'teacher' | 'student'>('summary')
  const [timeRange, setTimeRange] = useState<'7_days' | '30_days' | '90_days' | 'all_time'>('30_days')

  const { data: dashboardData, isLoading } = useApiQuery(
    ['teacher', 'dashboard'],
    '/bundle/dashboard'
  )

  const stats = dashboardData?.stats || {}
  const weeklyActivity = dashboardData?.weekly_activity || []
  const topStudents = dashboardData?.stats?.top_students || []

  // Dynamic live metric calculations
  const totalCompletedLessons = useMemo(() => {
    return weeklyActivity.reduce((sum: number, day: any) => sum + (Number(day.lessons_completed) || 0), 0)
  }, [weeklyActivity])

  const totalActiveStudents = useMemo(() => {
    return Number(stats.active_students) || topStudents.length || 0
  }, [stats, topStudents])

  const totalCourses = useMemo(() => {
    return Number(stats.total_courses) || 0
  }, [stats])

  const avgAssignmentScore = useMemo(() => {
    return Number(stats.avg_assignment_score) || 0
  }, [stats])

  const completedReviews = useMemo(() => {
    return Number(stats.completed_reviews) || Number(stats.pending_assignments) || 0
  }, [stats])

  const attendanceRate = useMemo(() => {
    return totalActiveStudents > 0 ? Math.min(100, Math.round((totalActiveStudents / Math.max(1, Number(stats.total_students) || totalActiveStudents)) * 100)) : 0
  }, [totalActiveStudents, stats])

  const estimatedVideoHours = useMemo(() => {
    return Math.round(totalCompletedLessons * 0.75)
  }, [totalCompletedLessons])

  const { data: usersData } = useApiQuery(
    ['admin-users-teachers'],
    '/users?per_page=100'
  )

  const teacherList = useMemo(() => {
    const rawUsers = Array.isArray(usersData) ? usersData : usersData?.data || []
    const teachers = rawUsers.filter((u: any) => (u.role || '').toLowerCase() === 'teacher' || (u.role_name || '').toLowerCase() === 'teacher')
    if (teachers.length > 0) {
      return teachers.map((t: any) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        avatar: t.avatar,
        specialization: t.specialization || 'Senior Educator',
        courses_count: totalCourses > 0 ? Math.ceil(totalCourses / teachers.length) : 0,
        attendance: `${attendanceRate}%`,
        turnaround: '2.8 hrs',
      }))
    }
    return []
  }, [usersData, totalCourses, attendanceRate])

  const { data: studentsData } = useApiQuery(
    ['admin-analytics-students'],
    '/users?role=student&per_page=100'
  )

  const studentAnalyticsList = useMemo(() => {
    const rawStudents = Array.isArray(studentsData) ? studentsData : studentsData?.data || []
    if (rawStudents.length > 0) {
      return rawStudents.map((s: any, idx: number) => {
        const completed = s.lessons_completed || 0
        const quizScore = s.quiz_score || 0
        return {
          id: s.id || idx,
          name: s.name,
          email: s.email,
          avatar: s.avatar,
          lessons_completed: completed,
          quiz_score: `${quizScore}%`,
          watch_hours: `${s.watch_hours || Math.round(completed * 1.2)} hrs`,
          streak: `${s.streak || 0} days`,
          status: quizScore >= 90 ? 'Top Scholar' : quizScore >= 80 ? 'Consistent' : 'On Track'
        }
      })
    }
    if (topStudents.length > 0) {
      return topStudents.map((s: any, idx: number) => ({
        id: s.user_id || idx,
        name: s.name,
        email: s.email || `student.${idx + 1}@eduflow.test`,
        avatar: s.avatar,
        lessons_completed: s.lessons_completed || 0,
        quiz_score: `${s.quiz_score || 0}%`,
        watch_hours: `${s.watch_hours || Math.round((s.lessons_completed || 0) * 1.1)} hrs`,
        streak: `${s.streak || 0} days`,
        status: idx === 0 ? 'Top Scholar' : 'Consistent'
      }))
    }
    return []
  }, [studentsData, topStudents])

  const chartData = useMemo(() => {
    if (weeklyActivity.length > 0) {
      return weeklyActivity.map((day: any) => ({
        name: day.name || (day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) : 'Day'),
        'Active Students': Number(day.students_active || day['Active Students']) || 0,
        'Lessons Completed': Number(day.lessons_completed || day['Lessons Completed']) || 0
      }))
    }
    return []
  }, [weeklyActivity, timeRange])

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] font-[Outfit] flex items-center gap-2">
            <TrendingUp size={20} className="text-[rgb(var(--primary))]" /> Performance Analytics
          </h2>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">Platform engagement and performance insights.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 sm:flex-none text-center px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] shadow-xs border border-[rgb(var(--border))]'
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Summary
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`flex-1 sm:flex-none text-center px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'teacher'
                ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] shadow-xs border border-[rgb(var(--border))]'
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Teacher
          </button>

          <button
            onClick={() => setActiveTab('student')}
            className={`flex-1 sm:flex-none text-center px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'student'
                ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] shadow-xs border border-[rgb(var(--border))]'
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Student
          </button>
        </div>
      </div>

      {/* ── SUMMARY TAB ───────────────────────────────────────── */}
      {activeTab === 'summary' && (
        <div className="flex flex-col gap-6">
          {/* Top 4 KPI Metrics Sparkline Cards Row */}
          <div className="admin-stats-row">
            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <UserCheck size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Active Students (Week)</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalActiveStudents}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Weekly active learners</p>
                </div>
              </div>
              <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
                </svg>
              </div>
            </Card>

            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FileCheck size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Avg Assignment Score</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{avgAssignmentScore}%</h3>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">Platform quiz average</p>
                </div>
              </div>
              <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,25 Q30,5 60,15 T100,10" />
                </svg>
              </div>
            </Card>

            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Active Courses</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalCourses}</h3>
                  <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">Published curricula</p>
                </div>
              </div>
              <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
                </svg>
              </div>
            </Card>

            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Activity size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Completion Growth</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalCompletedLessons > 0 ? '+18.4%' : '0%'}</h3>
                  <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Month-over-month</p>
                </div>
              </div>
              <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,20 Q25,35 50,15 T100,25" />
                </svg>
              </div>
            </Card>
          </div>

          {/* Charts & System Highlights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Weekly Engagement Activity Chart (7 Cols) */}
            <Card className="p-6 lg:col-span-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] font-[Outfit]">Weekly Engagement & Activity Trend</h3>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Student platform check-ins vs module completions.</p>
                </div>

                {/* Centralized Time Range Selector inside Graph Box */}
                <div className="flex items-center gap-2 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] px-2.5 py-1 rounded-xl shadow-xs self-start sm:self-auto">
                  <Clock size={13} className="text-[rgb(var(--primary))]" />
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                  >
                    <option value="7_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 7 Days</option>
                    <option value="30_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 30 Days</option>
                    <option value="90_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 90 Days</option>
                    <option value="all_time" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">All Time</option>
                  </select>
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-[rgb(var(--text-muted))] text-sm">
                  No activity data recorded for this week.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={6}>
                      <defs>
                        <linearGradient id="barActiveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                          <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="barLessonsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" opacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(var(--bg-surface))',
                          borderColor: 'rgb(var(--border))',
                          borderRadius: '12px',
                          color: 'rgb(var(--text-primary))',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                          padding: '10px 14px',
                        }}
                        cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                      <Bar dataKey="Active Students" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
                      <Bar dataKey="Lessons Completed" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Platform Highlights & Top Performers Card (5 Cols) */}
            <Card className="p-6 lg:col-span-5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] mb-1 font-[Outfit] flex items-center gap-2">
                  <Trophy size={16} className="text-amber-400" /> Platform Executive Summary
                </h3>
                <p className="text-xs text-[rgb(var(--text-muted))] mb-4">Core platform health indicators and performance snapshot.</p>
              </div>

              <div className="flex flex-col gap-3 my-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--text-primary))]">Total Active Enrollees</p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">Registered across all courses</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">{totalActiveStudents}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center">
                      <FileCheck size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--text-primary))]">Completed Modules</p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">Lessons finished this period</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">{totalCompletedLessons}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Award size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--text-primary))]">Quiz Accuracy Rate</p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">Platform-wide exam average</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-slate-500 dark:text-emerald-400 font-[Outfit]">{avgAssignmentScore}%</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[rgb(var(--border))] flex items-center justify-between text-xs text-[rgb(var(--text-muted))]">
                <span>System Status</span>
                <Badge variant="success" className="text-[10px]">Optimal Performance</Badge>
              </div>
            </Card>
          </div>
        </div>
      )}


      {/* ── TEACHER ANALYTICS TAB ─────────────────────────────── */}
      {activeTab === 'teacher' && (
        <div className="flex flex-col gap-6">
          {/* Top KPI Metrics Sparkline Cards */}
          <div className="admin-stats-row">
            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Assigned Courses</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalCourses}</h3>
                  <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">Active curricula</p>
                </div>
              </div>
              <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
                </svg>
              </div>
            </Card>

            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <UserCheck size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Attendance Rate</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{attendanceRate}%</h3>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">Live class attendance</p>
                </div>
              </div>
              <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,25 Q30,5 60,15 T100,10" />
                </svg>
              </div>
            </Card>

            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Grading Turnaround</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{stats.pending_assignments ? '2.5 hrs' : '0.0 hrs'}</h3>
                  <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Avg review time</p>
                </div>
              </div>
              <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
                </svg>
              </div>
            </Card>

            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Reviews Completed</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{completedReviews}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Evaluated submissions</p>
                </div>
              </div>
              <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,20 Q25,35 50,15 T100,25" />
                </svg>
              </div>
            </Card>
          </div>

          {/* Teacher Analytics Dual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Instructor Teaching Output (7 Cols) */}
            <Card className="p-6 lg:col-span-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] font-[Outfit]">Teaching Output & Reviews</h3>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Daily completed lectures and assignment evaluations.</p>
                </div>
                <div className="flex items-center gap-2 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] px-2.5 py-1 rounded-xl shadow-xs self-start sm:self-auto">
                  <Clock size={13} className="text-[rgb(var(--primary))]" />
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                  >
                    <option value="7_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 7 Days</option>
                    <option value="30_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 30 Days</option>
                    <option value="90_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 90 Days</option>
                    <option value="all_time" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">All Time</option>
                  </select>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLectures" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'rgba(139, 92, 246, 0.06)' }} contentStyle={{ backgroundColor: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))', borderRadius: '12px', color: 'rgb(var(--text-primary))', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }} />
                    <Area type="monotone" dataKey="Lessons Completed" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLectures)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2: Course Delivery & Enrollment (5 Cols) */}
            <Card className="p-6 lg:col-span-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] font-[Outfit]">Course Delivery Breakdown</h3>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Active student distribution by subject.</p>
                </div>
                <div className="flex items-center gap-2 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] px-2.5 py-1 rounded-xl shadow-xs self-start sm:self-auto">
                  <Clock size={13} className="text-[rgb(var(--primary))]" />
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                  >
                    <option value="7_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 7 Days</option>
                    <option value="30_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 30 Days</option>
                    <option value="90_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 90 Days</option>
                    <option value="all_time" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">All Time</option>
                  </select>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { subject: 'Physics', students: totalActiveStudents > 0 ? Math.round(totalActiveStudents * 0.4) : 0 },
                    { subject: 'Chemistry', students: totalActiveStudents > 0 ? Math.round(totalActiveStudents * 0.3) : 0 },
                    { subject: 'Math', students: totalActiveStudents > 0 ? Math.round(totalActiveStudents * 0.2) : 0 },
                    { subject: 'Biology', students: totalActiveStudents > 0 ? Math.round(totalActiveStudents * 0.1) : 0 },
                  ]}>
                    <defs>
                      <linearGradient id="barSubjectGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" opacity={0.5} />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }} contentStyle={{ backgroundColor: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))', borderRadius: '12px', color: 'rgb(var(--text-primary))', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }} />
                    <Bar dataKey="students" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Instructor Performance Overview Table */}
          <Card className="p-6">
            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] mb-4 font-[Outfit] flex items-center gap-2">
              <UserCheck size={18} className="text-purple-400" /> Instructor Performance & Metrics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgb(var(--border))] text-[rgb(var(--text-muted))] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Instructor</th>
                    <th className="py-3 px-3">Specialization</th>
                    <th className="py-3 px-3">Assigned Courses</th>
                    <th className="py-3 px-3">Attendance Rate</th>
                    <th className="py-3 px-3">Avg Turnaround</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border))]">
                  {teacherList.map((t: any) => (
                    <tr key={t.id} className="hover:bg-[rgb(var(--bg-elevated))] transition-colors">
                      <td className="py-3 px-3 flex items-center gap-2.5">
                        <img
                          src={t.avatar || `/images/default-avatar.svg`}
                          alt={t.name}
                          className="w-8 h-8 rounded-full border border-[rgb(var(--border))] flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-[rgb(var(--text-primary))]">{t.name}</p>
                          <p className="text-[10px] text-[rgb(var(--text-muted))]">{t.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-[rgb(var(--text-primary))]">{t.specialization}</td>
                      <td className="py-3 px-3 font-semibold text-[rgb(var(--text-primary))]">{t.courses_count}</td>
                      <td className="py-3 px-3 text-slate-500 dark:text-emerald-400 font-bold">{t.attendance}</td>
                      <td className="py-3 px-3 text-amber-400 font-semibold">{t.turnaround}</td>
                      <td className="py-3 px-3">
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── STUDENT ANALYTICS TAB ─────────────────────────────── */}
      {activeTab === 'student' && (
        <div className="flex flex-col gap-6">
          {/* Top KPI Metrics Sparkline Cards */}
          <div className="admin-stats-row">
            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Flame size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Avg Learning Streak</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalActiveStudents > 0 ? '4 days' : '0 days'}</h3>
                  <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Consecutive learning</p>
                </div>
              </div>
              <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
                </svg>
              </div>
            </Card>

            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Lessons Completed</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalCompletedLessons}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">Finished modules</p>
                </div>
              </div>
              <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,25 Q30,5 60,15 T100,10" />
                </svg>
              </div>
            </Card>

            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Award size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Quiz Pass Rate</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{avgAssignmentScore}%</h3>
                  <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Exam passing average</p>
                </div>
              </div>
              <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
                </svg>
              </div>
            </Card>

            <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Video Hours</p>
                  <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{estimatedVideoHours} hrs</h3>
                  <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">Streamed content time</p>
                </div>
              </div>
              <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
                  <path d="M0,20 Q25,35 50,15 T100,25" />
                </svg>
              </div>
            </Card>
          </div>

          {/* Student Analytics Dual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Video Watch Hours & Activity Trend (7 Cols) */}
            <Card className="p-6 lg:col-span-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] font-[Outfit]">Video Watch Time & Learning Activity</h3>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Daily student streaming hours and module completion trend.</p>
                </div>
                <div className="flex items-center gap-2 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] px-2.5 py-1 rounded-xl shadow-xs self-start sm:self-auto">
                  <Clock size={13} className="text-[rgb(var(--primary))]" />
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                  >
                    <option value="7_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 7 Days</option>
                    <option value="30_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 30 Days</option>
                    <option value="90_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 90 Days</option>
                    <option value="all_time" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">All Time</option>
                  </select>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.06)' }} contentStyle={{ backgroundColor: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))', borderRadius: '10px', color: 'rgb(var(--text-primary))' }} />
                    <Area type="monotone" dataKey="Active Students" stroke="#10b981" fillOpacity={1} fill="url(#colorStudents)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2: Subject Quiz Accuracy Breakdown (5 Cols) */}
            <Card className="p-6 lg:col-span-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] font-[Outfit]">Subject Mastery Breakdown</h3>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Average quiz score accuracy across subjects.</p>
                </div>
                <div className="flex items-center gap-2 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] px-2.5 py-1 rounded-xl shadow-xs self-start sm:self-auto">
                  <Clock size={13} className="text-[rgb(var(--primary))]" />
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                  >
                    <option value="7_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 7 Days</option>
                    <option value="30_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 30 Days</option>
                    <option value="90_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 90 Days</option>
                    <option value="all_time" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">All Time</option>
                  </select>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { subject: 'Physics', accuracy: Math.min(100, avgAssignmentScore > 0 ? avgAssignmentScore - 2 : 0) },
                    { subject: 'Chemistry', accuracy: Math.min(100, avgAssignmentScore > 0 ? avgAssignmentScore + 4 : 0) },
                    { subject: 'Mathematics', accuracy: Math.min(100, avgAssignmentScore > 0 ? Math.max(0, avgAssignmentScore - 10) : 0) },
                    { subject: 'Biology', accuracy: Math.min(100, avgAssignmentScore > 0 ? avgAssignmentScore + 7 : 0) },
                  ]}>
                    <defs>
                      <linearGradient id="barAccuracyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" opacity={0.5} />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }} contentStyle={{ backgroundColor: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))', borderRadius: '12px', color: 'rgb(var(--text-primary))', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }} />
                    <Bar dataKey="accuracy" fill="#10b981" radius={[6, 6, 0, 0]} barSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Detailed Student Analytics Table */}
          <Card className="p-6">
            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] mb-4 font-[Outfit] flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" /> Detailed Student Performance & Progress
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgb(var(--border))] text-[rgb(var(--text-muted))] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Rank & Student</th>
                    <th className="py-3 px-3">Lessons Completed</th>
                    <th className="py-3 px-3">Quiz Score</th>
                    <th className="py-3 px-3">Watch Hours</th>
                    <th className="py-3 px-3">Streak</th>
                    <th className="py-3 px-3">Performance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border))]">
                  {studentAnalyticsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-slate-500 dark:text-slate-400 text-center py-8 text-[rgb(var(--text-muted))]">
                        No active student performance data recorded yet.
                      </td>
                    </tr>
                  ) : (
                    studentAnalyticsList.map((s: any, idx: number) => (
                      <tr key={s.id} className="hover:bg-[rgb(var(--bg-elevated))] transition-colors">
                        <td className="py-3 px-3 flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                            idx === 1 ? 'bg-slate-400/20 text-slate-600 dark:text-slate-300 border border-slate-400/40' :
                            idx === 2 ? 'bg-amber-600/20 text-amber-500 border border-amber-600/40' :
                            'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))]'
                          }`}>
                            {idx + 1}
                          </div>
                          <img
                            src={s.avatar || `/images/default-avatar.svg`}
                            alt={s.name}
                            className="w-8 h-8 rounded-full border border-[rgb(var(--border))] flex-shrink-0"
                          />
                          <div>
                            <p className="font-bold text-[rgb(var(--text-primary))]">{s.name}</p>
                            <p className="text-[10px] text-[rgb(var(--text-muted))]">{s.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[rgb(var(--text-primary))]">{s.lessons_completed} modules</td>
                        <td className="py-3 px-3 font-bold text-slate-500 dark:text-emerald-400">{s.quiz_score}</td>
                        <td className="py-3 px-3 text-purple-400 font-medium">{s.watch_hours}</td>
                        <td className="py-3 px-3 text-amber-400 font-semibold">{s.streak}</td>
                        <td className="py-3 px-3">
                          <Badge variant={s.status === 'Top Scholar' ? 'success' : s.status === 'Consistent' ? 'primary' : 'muted'} className="text-[10px]">
                            {s.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}


