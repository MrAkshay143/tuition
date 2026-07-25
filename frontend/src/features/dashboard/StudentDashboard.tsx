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

  const analytics = data?.analytics || { hours_learned: 0, lessons_completed: 0, courses_completed: 0, current_streak: 0, longest_streak: 0, weekly_activity: [] }
  const resume = data?.resume
  const enrolledCourses = data?.enrolled_courses || []
  const history = data?.history || []

  const paginatedHistory = history.slice((activityPage - 1) * activityPerPage, activityPage * activityPerPage)

  // Real details for Continue Watching Hero
  const hasResume = !!resume?.lesson
  const resumeTitle = resume?.lesson?.title || ''
  const moduleTitle = resume?.module?.title || ''
  const courseTitle = resume?.course?.title || ''
  const watchPercentage = resume?.watch_percentage ?? 0
  const resumePosSeconds = resume?.resume_position ?? 0
  const lastActiveText = `${Math.floor(resumePosSeconds / 60)}m ${resumePosSeconds % 60}s ago`
  const resumeUrl = resume?.course?.id && resume?.lesson?.id 
    ? `/student/courses/${resume.course.id}/lessons/${resume.lesson.id}`
    : `/student/courses`

  // Convert real weekly activity hours to a percentage (e.g., max 2 hours = 100% bar height)
  const weeklyBars = analytics.weekly_activity?.length > 0 
    ? analytics.weekly_activity.map((bar: any) => ({
        day: bar.day,
        percentage: Math.min(100, Math.round(((bar.hours || 0) / 2) * 100))
      }))
    : [
        { day: 'Mon', percentage: 0 }, { day: 'Tue', percentage: 0 },
        { day: 'Wed', percentage: 0 }, { day: 'Thu', percentage: 0 },
        { day: 'Fri', percentage: 0 }, { day: 'Sat', percentage: 0 },
        { day: 'Sun', percentage: 0 }
      ]

  return (
    <div className="space-y-4">
      {/* Header Greeting Banner */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-[Outfit] tracking-tight text-[rgb(var(--text-primary))] flex items-center gap-2">
            Good evening, {userName}! 👋
          </h1>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 font-[Inter]">
            Let's continue building your knowledge today.
          </p>
        </div>
      </div>

      {/* Hero Banner: Continue Watching Video Card */}
      {hasResume ? (
        <Card className="p-3.5 sm:p-4 overflow-hidden relative border border-indigo-500/20 bg-[rgb(var(--bg-surface))] shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5">
            {/* Thumbnail Box */}
            <div 
              onClick={() => navigate(resumeUrl)}
              className="w-full sm:w-56 h-36 rounded-xl overflow-hidden relative cursor-pointer group shrink-0 border border-indigo-500/30 shadow-md transition-transform hover:scale-[1.01]"
            >
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
              <div className="absolute top-2.5 left-2.5 z-10">
                <span className="bg-indigo-600 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                  Continue Watching
                </span>
              </div>
  
              {/* Bottom Right Play Button */}
              <div className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-indigo-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <PlayCircle size={20} className="fill-indigo-500/20 text-indigo-500" />
              </div>
            </div>
  
            {/* Banner Details */}
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium flex items-center gap-1 bg-[rgb(var(--bg-elevated))] px-2 py-0.5 rounded-md border border-[rgb(var(--border))]">
                    <Clock size={11} className="text-indigo-400" /> Last active: {lastActiveText}
                  </span>
                </div>
  
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[rgb(var(--text-primary))] font-[Outfit]">
                  {resumeTitle}
                </h2>
  
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  {moduleTitle ? <>Module: <span className="font-semibold text-[rgb(var(--text-primary))]">{moduleTitle}</span> &bull; </> : null}
                  Course: <span className="font-semibold text-[rgb(var(--text-primary))]">{courseTitle}</span>
                </p>
              </div>
  
              <div className="space-y-1 max-w-md">
                <div className="flex justify-between text-xs font-bold text-[rgb(var(--text-secondary))]">
                  <span>Lesson Progress</span>
                  <span className="text-indigo-400">{watchPercentage}% Complete</span>
                </div>
                <div className="w-full bg-[rgb(var(--border))] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-purple-500" 
                    style={{ width: `${watchPercentage}%` }} 
                  />
                </div>
              </div>
            </div>
  
            {/* Resume Action Button */}
            <Button 
              size="sm" 
              className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer w-full sm:w-auto shrink-0 self-stretch sm:self-center"
              onClick={() => navigate(resumeUrl)}
            >
              Resume Lesson <ChevronRight size={13} />
            </Button>
          </div>
        </Card>
      ) : enrolledCourses.length > 0 ? (
        <Card className="p-4 overflow-hidden relative border border-indigo-500/20 bg-[rgb(var(--bg-surface))] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[rgb(var(--text-primary))] font-[Outfit]">Ready to start learning?</h2>
            <p className="text-xs text-[rgb(var(--text-muted))]">Jump into your enrolled courses and begin your journey.</p>
          </div>
          <Button onClick={() => navigate(`/student/courses/${enrolledCourses[0].id}`)} className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md cursor-pointer">
            Go to {enrolledCourses[0].title}
          </Button>
        </Card>
      ) : null}

      {/* Top 4 KPI Metrics Sparkline Cards Row */}
      <div className="admin-stats-row">
        {/* Card 1: Learning Streak */}
        <Card className="p-3 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[200px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Flame className="animate-pulse" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Streak</p>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{analytics.current_streak} day</h3>
              <p className="text-[9px] text-amber-400 font-semibold whitespace-nowrap">Best: {analytics.longest_streak} day</p>
            </div>
          </div>
          <div className="w-9 h-4 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Hours Learned */}
        <Card className="p-3 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[200px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Clock size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Hours Learned</p>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{analytics.hours_learned} hrs</h3>
              <p className="text-[9px] text-purple-400 font-semibold whitespace-nowrap">Video stream time</p>
            </div>
          </div>
          <div className="w-9 h-4 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Lessons Finished */}
        <Card className="p-3 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[200px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <BookOpenCheck size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Lessons</p>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{analytics.lessons_completed}</h3>
              <p className="text-[9px] text-emerald-400 font-semibold whitespace-nowrap">Completed</p>
            </div>
          </div>
          <div className="w-9 h-4 text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Courses Completed */}
        <Card className="p-3 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden max-w-[280px] min-w-[200px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Award size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Courses</p>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{analytics.courses_completed}</h3>
              <p className="text-[9px] text-blue-400 font-semibold whitespace-nowrap">Completed</p>
            </div>
          </div>
          <div className="w-9 h-4 text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q25,35 50,15 T100,25" />
            </svg>
          </div>
        </Card>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* Column 1: Active Enrolled Courses (md:col-span-1 lg:col-span-4) */}
        <div className="md:col-span-1 lg:col-span-4 space-y-4">
          <Card className="p-4 flex flex-col justify-between h-full space-y-3">
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-[rgb(var(--text-primary))] font-[Outfit] flex items-center gap-2 mb-3">
                <FolderOpen size={15} className="text-indigo-400" /> Active Enrolled Courses
              </h2>

              {enrolledCourses.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FolderOpen size={24} />
                  </div>
                  <p className="text-xs text-[rgb(var(--text-muted))] max-w-[180px]">
                    No active enrolled courses.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md cursor-pointer mt-1"
                    onClick={() => navigate('/student/courses')}
                  >
                    Explore Courses
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses.map((course: any) => (
                    <div key={course.id} className="p-3 border border-[rgb(var(--border))] rounded-xl space-y-2.5 hover:border-indigo-500/40 transition-colors bg-[rgb(var(--bg-elevated))]">
                      <div className="flex gap-2.5 items-center">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt={course.title} />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-extrabold font-[Outfit] flex-shrink-0">
                            {course.title.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit] truncate">{course.title}</h3>
                          <span className="text-[10px] text-[rgb(var(--text-muted))]">Enrolled</span>
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
                      <Button size="sm" variant="primary" className="w-full justify-center flex gap-1 items-center text-xs py-1 h-7"
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
          <Card className="p-4 flex flex-col justify-between h-full space-y-3">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit] flex items-center gap-2">
                  <Clock size={15} className="text-indigo-400" /> Weekly Learning Activity
                </h3>
                <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] px-2 py-0.5 rounded-md">
                  Last 7 Days
                </span>
              </div>

              {/* 7 Bars Layout */}
              <div className="flex justify-between items-end h-36 pt-4 px-1 border-b border-[rgb(var(--border))]/40 pb-2">
                {weeklyBars.map((bar: any, idx: number) => {
                  const dayName = bar.day
                  const pct = bar.percentage
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[9px] font-bold text-[rgb(var(--text-muted))]">{pct}%</span>
                      <div className="w-full max-w-[24px] bg-[rgb(var(--bg-elevated))] h-24 rounded-t-lg relative flex items-end overflow-hidden">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600/60 via-indigo-500 to-indigo-400 transition-all duration-500"
                          style={{ height: `${Math.max(6, pct * 2.2)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-[rgb(var(--text-muted))]">{dayName}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom Motivation Banner inside card */}
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2.5">
              <Sparkles size={16} className="text-indigo-400 shrink-0" />
              <p className="text-[11px] font-medium text-[rgb(var(--text-secondary))]">
                Great start! Stay consistent to build your streak.
              </p>
            </div>
          </Card>
        </div>

        {/* Column 3: Recent Activity Logs (md:col-span-2 lg:col-span-3) */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card className="p-4 space-y-3 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[rgb(var(--text-primary))]">
                <History size={14} className="text-indigo-400" />
                <h3 className="font-bold text-xs font-[Outfit]">Recent Activity Logs</h3>
              </div>
              <button 
                onClick={() => navigate('/student/progress')}
                className="text-[9px] font-bold text-[rgb(var(--text-muted))] hover:text-indigo-400 transition-colors bg-[rgb(var(--bg-elevated))] px-2 py-0.5 rounded-md border border-[rgb(var(--border))]"
              >
                View All
              </button>
            </div>

            {history.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] flex items-center justify-center">
                  <History size={18} />
                </div>
                <p className="text-[10px] text-[rgb(var(--text-muted))] max-w-[160px]">
                  No recent activity records yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedHistory.map((h: any, idx: number) => (
                  <div key={h.id || idx} className="flex gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[rgb(var(--text-primary))] font-medium text-[11px] leading-tight">
                        {h.action === 'lesson_completed' && 'Completed Lesson'}
                        {h.action === 'lesson_opened' && 'Opened Lesson'}
                        {h.action === 'resume' && 'Resumed Playback'}
                        {h.action === 'bookmark_added' && 'Added Bookmark'}
                        <span className="font-bold block text-[10px] text-indigo-400 truncate">{h.lesson_title}</span>
                      </p>
                      <span className="text-[9px] text-[rgb(var(--text-muted))]">
                        {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        </div>
      </div>
    </div>
  )
}
