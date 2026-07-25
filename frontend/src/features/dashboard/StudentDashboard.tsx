import React, { useState } from 'react'
import { useApiQuery } from '@/api/resources/hooks'
import { useNavigate } from 'react-router-dom'
import { Clock, BookOpenCheck, Award, Flame, ChevronRight, ChevronLeft, History, PlayCircle, ChevronDown, Link as LinkIcon, FolderOpen, Sparkles, Edit3 } from 'lucide-react'
import { Button, Card, Spinner } from '@/components/ui'

// 3D Pyramid Graphic Component matching snapshot
const Pyramid3DGraphic = () => (
  <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/80 via-slate-950 to-black relative flex items-center justify-center overflow-hidden">
    {/* Background tech grid dots */}
    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:14px_14px]" />
    
    {/* Glowing purple ambient aura */}
    <div className="absolute w-36 h-36 bg-indigo-500/25 rounded-full blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
    
    {/* 3D Pyramid SVG */}
    <svg viewBox="0 0 200 200" className="w-24 h-24 relative z-10 drop-shadow-[0_8px_16px_rgba(99,102,241,0.6)]">
      <defs>
        <linearGradient id="pyrLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="pyrRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="pyrInnerGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      
      {/* Pyramid Left Facet */}
      <polygon points="100,25 30,145 100,170" fill="url(#pyrLeftGrad)" opacity="0.95" />
      {/* Pyramid Right Facet */}
      <polygon points="100,25 100,170 170,145" fill="url(#pyrRightGrad)" opacity="0.9" />
      
      {/* Floating Inner Core */}
      <polygon points="100,75 68,135 100,150" fill="url(#pyrInnerGlow)" />
      <polygon points="100,75 100,150 132,135" fill="url(#pyrLeftGrad)" opacity="0.5" />
      
      {/* Edge Highlights */}
      <line x1="100" y1="25" x2="100" y2="170" stroke="#e0e7ff" strokeWidth="1.5" opacity="0.85" />
      <line x1="100" y1="25" x2="30" y2="145" stroke="#c084fc" strokeWidth="1" opacity="0.7" />
      <line x1="100" y1="25" x2="170" y2="145" stroke="#818cf8" strokeWidth="1" opacity="0.7" />
    </svg>

    {/* Floating Particles */}
    <div className="absolute top-4 left-6 text-indigo-400/50 text-[10px] transform -rotate-12">▲</div>
    <div className="absolute bottom-5 left-4 text-purple-400/40 text-[10px]">▲</div>
    <div className="absolute top-6 right-6 text-indigo-300/50 text-xs transform rotate-45">▲</div>
  </div>
)

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useApiQuery(
    ['student', 'dashboard'],
    '/student/dashboard',
    undefined,
    { staleTime: 1000 * 60 * 2, refetchOnWindowFocus: true }
  )

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userName = user?.name ? user.name.split(' ')[0] : 'Platform'

  // Recent Activity Pagination State
  const [activityPage, setActivityPage] = useState(1)
  const activityPerPage = 10

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

  const analytics = data?.analytics || { hours_learned: 0.1, lessons_completed: 0, courses_completed: 0, current_streak: 1, longest_streak: 1, weekly_activity: [] }
  const resume = data?.resume
  const enrolledCourses = data?.enrolled_courses || []
  const history = data?.history || []

  const paginatedHistory = history.slice((activityPage - 1) * activityPerPage, activityPage * activityPerPage)

  // Real or fallback details for Continue Watching Hero
  const resumeTitle = resume?.lesson?.title || 'Session 1: Sets, Relations & Functions'
  const moduleTitle = resume?.module?.title || 'Foundations of Matrices & Determinants'
  const courseTitle = resume?.course?.title || 'Matrices & Determinants'
  const watchPercentage = resume?.watch_percentage ?? 8
  const resumePosSeconds = resume?.resume_position ?? 113
  const lastActiveText = `${Math.floor(resumePosSeconds / 60)}m ${resumePosSeconds % 60}s ago`
  const resumeUrl = resume?.course?.id && resume?.lesson?.id 
    ? `/student/courses/${resume.course.id}/lessons/${resume.lesson.id}`
    : `/student/courses`

  // Default weekly activity for 7 days bar chart if not present
  const defaultWeeklyActivity = [
    { day: 'Sat', percentage: 10 },
    { day: 'Sun', percentage: 20 },
    { day: 'Mon', percentage: 0 },
    { day: 'Tue', percentage: 15 },
    { day: 'Wed', percentage: 8 },
    { day: 'Thu', percentage: 12 },
    { day: 'Fri', percentage: 30 },
  ]
  const weeklyBars = analytics.weekly_activity?.length > 0 ? analytics.weekly_activity : defaultWeeklyActivity

  return (
    <div className="space-y-5">
      {/* Header Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-[Outfit] tracking-tight text-[rgb(var(--text-primary))] flex items-center gap-2">
            Good evening, {userName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))] mt-1 font-[Inter]">
            Let's continue building your knowledge today.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] px-3 py-1.5 rounded-full text-xs font-semibold text-[rgb(var(--text-secondary))] shadow-xs self-start sm:self-auto cursor-pointer">
          <History size={13} className="text-[rgb(var(--text-muted))]" />
          <span>Student Workspace</span>
          <ChevronDown size={13} className="text-[rgb(var(--text-muted))]" />
        </div>
      </div>

      {/* Hero Banner: Continue Watching Video Card */}
      <Card className="p-4 sm:p-5 md:p-6 overflow-hidden relative border border-indigo-500/20 bg-[rgb(var(--bg-surface))] shadow-md">
        <div className="flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center gap-5 sm:gap-6">
          {/* 3D Video Thumbnail Box (Click to Play) */}
          <div 
            onClick={() => navigate(resumeUrl)}
            className="w-full sm:w-64 lg:w-72 h-44 rounded-xl overflow-hidden relative cursor-pointer group shrink-0 border border-indigo-500/30 shadow-lg shadow-indigo-500/10 transition-transform hover:scale-[1.01]"
          >
            {/* Graphic or Thumbnail Image */}
            {resume?.lesson?.thumbnail_url || resume?.course?.thumbnail ? (
              <img 
                src={resume?.lesson?.thumbnail_url || resume?.course?.thumbnail} 
                alt={resumeTitle} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
            ) : (
              <Pyramid3DGraphic />
            )}

            {/* Top Left Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-indigo-500/40">
                Continue Watching
              </span>
            </div>

            {/* Bottom Right Play Button Overlay */}
            <div className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-white/20">
              <PlayCircle size={22} className="fill-indigo-600/20 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>

          {/* Banner Details */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[rgb(var(--text-muted))] font-medium flex items-center gap-1.5 bg-[rgb(var(--bg-elevated))] px-2.5 py-0.5 rounded-md border border-[rgb(var(--border))]">
                  <Clock size={12} className="text-indigo-400" /> Last active: {lastActiveText}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[rgb(var(--text-primary))] font-[Outfit]">
                {resumeTitle}
              </h2>

              <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                Module: <span className="font-semibold text-[rgb(var(--text-primary))]">{moduleTitle}</span> &bull; Course: <span className="font-semibold text-[rgb(var(--text-primary))]">{courseTitle}</span>
              </p>
            </div>

            <div className="space-y-1.5 max-w-lg">
              <div className="flex justify-between text-xs font-bold text-[rgb(var(--text-secondary))]">
                <span>Lesson Progress</span>
                <span className="text-indigo-400">{watchPercentage}% Complete</span>
              </div>
              <div className="w-full bg-[rgb(var(--border))] h-2 rounded-full overflow-hidden">
                <div 
                  className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-500 shadow-sm" 
                  style={{ width: `${watchPercentage}%` }} 
                />
              </div>
              <p className="text-[11px] text-[rgb(var(--text-muted))] font-medium pt-0.5">
                Keep going! You're making great progress.
              </p>
            </div>
          </div>

          {/* Resume Action Button */}
          <Button 
            size="md" 
            className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 cursor-pointer w-full sm:w-auto shrink-0 self-stretch sm:self-start lg:self-center"
            onClick={() => navigate(resumeUrl)}
          >
            Resume Lesson <ChevronRight size={14} />
          </Button>
        </div>
      </Card>

      {/* Top 4 KPI Metrics Sparkline Cards Row */}
      <div className="admin-stats-row">
        {/* Card 1: Learning Streak */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Flame className="animate-pulse" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Learning Streak</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{analytics.current_streak} day</h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Best: {analytics.longest_streak} day</p>
            </div>
          </div>
          <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Hours Learned */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Clock size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Hours Learned</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{analytics.hours_learned} hrs</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">Video stream time</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Lessons Finished */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <BookOpenCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Lessons Finished</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{analytics.lessons_completed}</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">Completed lessons</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Courses Completed */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[220px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Award size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Courses Completed</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{analytics.courses_completed}</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Certificates issued</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q25,35 50,15 T100,25" />
            </svg>
          </div>
        </Card>
      </div>

      {/* Main Responsive Grid Layout matching snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* Column 1: Active Enrolled Courses (md:col-span-1 lg:col-span-4) */}
        <div className="md:col-span-1 lg:col-span-4 space-y-4">
          <Card className="p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-[rgb(var(--text-primary))] font-[Outfit] flex items-center gap-2 mb-4">
                <Edit3 size={16} className="text-indigo-400" /> My Active Enrolled Courses
              </h2>

              {enrolledCourses.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FolderOpen size={32} />
                  </div>
                  <p className="text-xs text-[rgb(var(--text-muted))] max-w-[200px]">
                    You are not enrolled in any active courses yet.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2 rounded-full text-xs font-bold shadow-md cursor-pointer mt-2"
                    onClick={() => navigate('/student/courses')}
                  >
                    Explore Courses
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map((course: any) => (
                    <div key={course.id} className="p-4 border border-[rgb(var(--border))] rounded-xl space-y-3 hover:border-indigo-500/40 transition-colors">
                      <div className="flex gap-3 items-center">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt={course.title} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-extrabold font-[Outfit] flex-shrink-0">
                            {course.title.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-1">{course.title}</h3>
                          <span className="text-[10px] text-[rgb(var(--text-muted))]">Curriculum active</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-[rgb(var(--text-secondary))]">
                          <span>Syllabus complete</span>
                          <span>{course.completed_percentage ?? 0}%</span>
                        </div>
                        <div className="w-full bg-[rgb(var(--border))] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[rgb(var(--primary))] h-1.5 rounded-full" style={{ width: `${course.completed_percentage ?? 0}%` }} />
                        </div>
                      </div>
                      <Button size="sm" variant="primary" className="w-full justify-center flex gap-1 items-center text-xs"
                        onClick={() => navigate(`/student/courses/${course.id}`)}>
                        Continue Learning <ChevronRight size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Column 2: Weekly Learning Progress (md:col-span-1 lg:col-span-5) */}
        <div className="md:col-span-1 lg:col-span-5 space-y-4">
          <Card className="p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] font-[Outfit] flex items-center gap-2">
                  <Edit3 size={16} className="text-indigo-400" /> Weekly Learning Progress
                </h3>
                <div className="flex items-center gap-1.5 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] px-2.5 py-1 rounded-xl">
                  <Clock size={12} className="text-indigo-400" />
                  <select className="bg-transparent text-[11px] font-bold text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer">
                    <option value="7_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 7 Days</option>
                    <option value="30_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 30 Days</option>
                  </select>
                </div>
              </div>

              {/* 7 Bars Layout matching snapshot */}
              <div className="flex justify-between items-end h-44 pt-6 px-1 border-b border-[rgb(var(--border))]/40 pb-3">
                {weeklyBars.map((bar: any, idx: number) => {
                  const dayName = bar.day || ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][idx % 7]
                  const pct = bar.percentage !== undefined ? bar.percentage : [10, 20, 0, 15, 8, 12, 30][idx % 7]
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                      <span className="text-[10px] font-bold text-[rgb(var(--text-muted))]">{pct}%</span>
                      <div className="w-full max-w-[28px] bg-[rgb(var(--bg-elevated))] h-28 rounded-t-lg relative flex items-end overflow-hidden">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600/50 via-indigo-500 to-indigo-400 transition-all duration-500"
                          style={{ height: `${Math.max(6, pct * 2.5)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[rgb(var(--text-muted))]">{dayName}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom Motivation Banner inside card */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
              <Sparkles size={18} className="text-indigo-400 shrink-0" />
              <div className="text-[11px]">
                <p className="font-bold text-[rgb(var(--text-primary))]">Great start! Stay consistent to build momentum.</p>
                <p className="text-[rgb(var(--text-muted))]">Your learning habit is the key to success.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Column 3: Right Sidebar (md:col-span-2 lg:col-span-3) */}
        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
          {/* Recent Activity Logs */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[rgb(var(--text-primary))]">
                <History size={15} className="text-indigo-400" />
                <h3 className="font-bold text-xs font-[Outfit]">Recent Activity Logs</h3>
              </div>
              <button 
                onClick={() => navigate('/student/progress')}
                className="text-[10px] font-bold text-[rgb(var(--text-muted))] hover:text-indigo-400 transition-colors bg-[rgb(var(--bg-elevated))] px-2 py-0.5 rounded-md border border-[rgb(var(--border))]"
              >
                View All
              </button>
            </div>

            {history.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] flex items-center justify-center">
                  <History size={20} />
                </div>
                <p className="text-[11px] text-[rgb(var(--text-muted))] max-w-[180px]">
                  No recent activity records. Start learning to see your activity here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedHistory.map((h: any, idx: number) => (
                  <div key={h.id || idx} className="flex gap-2.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-[rgb(var(--text-primary))] font-medium text-[11px]">
                        {h.action === 'lesson_completed' && 'Completed Lesson'}
                        {h.action === 'lesson_opened' && 'Opened Lesson'}
                        {h.action === 'resume' && 'Resumed Playback'}
                        {h.action === 'bookmark_added' && 'Added Bookmark'}
                        <span className="font-bold block text-[10px] text-indigo-400 line-clamp-1">{h.lesson_title}</span>
                      </p>
                      <span className="text-[9px] text-[rgb(var(--text-muted))]">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}

                {history.length > activityPerPage && (
                  <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))] text-xs">
                    <span className="text-[rgb(var(--text-muted))] text-[9px]">
                      {activityPage}/{Math.ceil(history.length / activityPerPage)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5" 
                        disabled={activityPage === 1}
                        onClick={() => setActivityPage(p => p - 1)}
                      >
                        <ChevronLeft size={11} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5" 
                        disabled={activityPage >= Math.ceil(history.length / activityPerPage)}
                        onClick={() => setActivityPage(p => p + 1)}
                      >
                        <ChevronRight size={11} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Quick Links */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-1.5 text-[rgb(var(--text-primary))]">
              <LinkIcon size={15} className="text-indigo-400" />
              <h3 className="font-bold text-xs font-[Outfit]">Quick Links</h3>
            </div>
            {[
              { label: 'View All Courses', path: '/student/courses' },
              { label: 'My Assignments', path: '/student/assignments', badge: '2', badgeColor: 'bg-purple-500/20 text-purple-400' },
              { label: 'Upcoming Exams', path: '/student/exams', badge: '1', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
              { label: 'My Progress', path: '/student/progress' },
              { label: 'Certificates', path: '/student/certificates' },
            ].map(link => (
              <button 
                key={link.path}
                onClick={() => navigate(link.path)}
                className="w-full flex items-center justify-between text-xs font-medium text-[rgb(var(--text-secondary))] hover:text-indigo-400 transition-colors py-1.5 border-b border-[rgb(var(--border))]/40 last:border-0 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {link.label}
                  {link.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  )}
                </span>
                <ChevronRight size={12} />
              </button>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
