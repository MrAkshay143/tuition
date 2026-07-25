import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Lock, Star, ChevronLeft, ChevronDown, ChevronUp, Download, FileText, CheckCircle2,
  AlertCircle, Shield, Globe, Award, BookOpen, Layers, Users, X, HelpCircle, ArrowLeft
} from 'lucide-react'
import { Button, Badge, Spinner, PremiumVideoPlayer } from '@/components/ui'
import { formatBytes } from '@/lib/utils'
import { PlaybackProvider, usePlayback } from '@/lib/PlaybackController'

interface MediaItem {
  id: number
  uuid: string
  name: string
  original_name: string
  provider: 'local' | 'youtube'
  mime: string | null
  extension: string | null
  size: number
  path: string
  url: string
  thumbnail_url?: string | null
}

interface Lesson {
  id: number
  title: string
  type: string
  is_free_preview: boolean
  duration_seconds?: number
  primary_media?: MediaItem | null
  download_media?: MediaItem | null
  student_progress?: { completed: boolean; watched_seconds: number } | null
  dependencies?: { prerequisite_lesson_id: number; prerequisite_lesson?: { title: string } }[]
}

interface Module {
  id: number
  title: string
  lessons: Lesson[]
}

interface CourseProgram {
  id: number
  name: string
  slug: string
}

interface CourseSubject {
  id: number
  name: string
  slug: string
}

interface Course {
  id: number
  title: string
  description: string
  thumbnail: string | null
  modules_count: number
  lessons_count: number
  modules: Module[]
  program?: CourseProgram | null
  subject?: CourseSubject | null
}

interface ExploreResponse {
  courses: Course[]
}

export default function CourseDetails() {
  return (
    <PlaybackProvider>
      <CourseDetailsInner />
    </PlaybackProvider>
  )
}

function CourseDetailsInner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const { notifyLessonStart, notifyLessonClose } = usePlayback()

  // Active Video Player states
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [activeLessonTitle, setActiveLessonTitle] = useState<string | null>(null)
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null)
  const [activeLessonDuration, setActiveLessonDuration] = useState<number | undefined>(undefined)

  // Tracking states
  const [completedLessons, setCompletedLessons] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<string>('lessons')
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({})

  const [seekTarget, setSeekTarget] = useState<number | undefined>(undefined)
  const autoResumeDone = useRef(false)

  // Fetch Course details from Explore API
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'explore'],
    queryFn: async () => {
      const res = await api.get<{ data: ExploreResponse }>('/public/explore')
      return res.data
    },
  })

  // Find course or default mock course
  const foundCourse = data?.courses.find((c) => c.id === Number(id))

  const course = foundCourse
  if (!isLoading && !course) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-900 dark:text-white">Course not found.</div>
  }

  const modulesList = course?.modules || []

  // Default module expand states on mount
  useEffect(() => {
    if (modulesList.length > 0 && Object.keys(openModules).length === 0) {
      const initial: Record<number, boolean> = {}
      modulesList.forEach((m, idx) => {
        initial[m.id] = idx === 0
      })
      setOpenModules(initial)
    }
  }, [modulesList])

  // Set default active lesson ID on mount without opening video player automatically
  useEffect(() => {
    if (!activeLessonId && modulesList.length > 0) {
      const allLessons = modulesList.flatMap((m) => m.lessons || [])
      const savedLessonId = localStorage.getItem(`last_played_course_${id}`)
      const targetLesson = (savedLessonId && allLessons.find((l) => String(l.id) === savedLessonId)) || allLessons[0]

      if (targetLesson) {
        setActiveLessonTitle(targetLesson.title)
        setActiveLessonId(targetLesson.id)
      }
    }
  }, [modulesList, activeLessonId, id])

  // Course-level auto-resume: when course data loads, start last watched lesson & restore completed checkmarks
  useEffect(() => {
    if (!isAuthenticated || !course || autoResumeDone.current) return
    autoResumeDone.current = true
    const fetchCourseResume = async () => {
      try {
        const res = await api.get(`/courses/${id}/resume`)
        const data = res?.data
        if (data?.completed_lesson_ids && Array.isArray(data.completed_lesson_ids)) {
          setCompletedLessons(data.completed_lesson_ids)
        }
        if (!data?.lesson_id || activeVideoUrl) return
        const allLessons = course.modules.flatMap((m) => m.lessons || [])
        const lesson = allLessons.find((l) => l.id === data.lesson_id)
        if (lesson && data.watched_seconds > 5) {
          // Auto-start last watched lesson silently
          handleLessonClick(lesson)
        }
      } catch { /* No progress or not enrolled — show hero */ }
    }
    fetchCourseResume()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, isAuthenticated])

  // Handles clicking a lesson item - Plays video immediately and scrolls up to player
  const handleLessonClick = async (lesson: Lesson) => {
    // GUEST / UNAUTHENTICATED: only allow free preview lessons
    if (!isAuthenticated && !lesson.is_free_preview) {
      toast.error('This lesson is locked. Please log in or enroll to watch.')
      navigate('/login')
      return
    }

    setActiveLessonTitle(lesson.title)
    setActiveLessonId(lesson.id)
    setActiveLessonDuration(lesson.duration_seconds || undefined)
    localStorage.setItem(`last_played_course_${id}`, String(lesson.id))

    // PlaybackController fetches resume position (IndexedDB → server conflict resolution)
    const resumeSeconds = await notifyLessonStart({
      lessonId:       lesson.id,
      courseId:       Number(id),
      knownDuration:  lesson.duration_seconds || undefined,
    })
    setSeekTarget(resumeSeconds > 0 ? resumeSeconds : undefined)

    // Smooth scroll up to video player
    window.scrollTo({ top: 120, behavior: 'smooth' })

    // Fetch secure signed stream URL dynamically
    try {
      const endpoint = lesson.is_free_preview
        ? `/public/lessons/${lesson.id}/stream`
        : `/lessons/${lesson.id}/stream`

      const res = await api.get(endpoint)
      const streamUrl = res?.data?.stream_url || res?.stream_url
      if (streamUrl) { setActiveVideoUrl(streamUrl); return }
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401) { toast.error('Please log in to watch this lesson.'); navigate('/login'); return }
      if (status === 403) { toast.error('You must be enrolled in this course to watch this lesson.'); return }
    }

    // Fallback: use media URL directly (e.g., YouTube embed links)
    const videoUrlToPlay = lesson.primary_media?.url || (lesson as any).video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    setActiveVideoUrl(videoUrlToPlay)
  }

  // UI-only: marks lesson as visually complete in the lesson list.
  // Storage/server sync is handled by PlaybackController via 'ended' bus event.
  const handleLessonEnded = () => {
    const lessonId = activeLessonId
    if (!lessonId) return
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons((prev) => [...prev, lessonId])
    }
  }

  const closeVideoPlayer = () => {
    notifyLessonClose()
    setActiveVideoUrl(null)
    setActiveLessonTitle(null)
    setActiveLessonId(null)
  }

  const totalLessonsCount = modulesList.reduce((acc, m) => acc + (m.lessons || []).length, 0)

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 bg-[#f8fafc] dark:bg-[#050614] text-slate-900 dark:text-white font-sans min-h-[100dvh] pb-16 transition-colors duration-200">
      
      {/* Top Navigation Row */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 flex items-center justify-between">
        <Link to="/courses" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-[#9396b8] hover:text-slate-900 dark:text-white transition-colors">
          <ChevronLeft size={15} /> Back to Catalog
        </Link>
        <span className="px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-slate-500 dark:text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
          ENROLLMENT OPEN
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* DYNAMIC HEADER SECTION:
              1. If VIDEO IS PLAYING: Replaced with Video Player & TITLE ONLY ABOVE PLAYER
              2. If NO VIDEO: Exact match Hero Banner Card matching attached reference snapshot
          */}
          {activeVideoUrl ? (
            <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-[24px] p-5 sm:p-6 space-y-4 text-left shadow-2xl overflow-hidden">
              
              {/* TITLE ONLY ABOVE PLAYER */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b1c3d] pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-[9.5px] font-extrabold uppercase bg-[#594fe6] text-white px-2.5 py-0.5 rounded-full tracking-wider">
                    NOW PLAYING
                  </span>
                  <h2 className="text-slate-500 dark:text-slate-400 text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-[Outfit] line-clamp-1">
                    {activeLessonTitle || 'Course Video Lesson'}
                  </h2>
                </div>

                <button
                  onClick={closeVideoPlayer}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-[#8e91b5] hover:text-slate-900 dark:text-white transition-colors cursor-pointer px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#131433] border border-indigo-100 dark:border-[#2b2d5c]"
                >
                  <X size={14} /> Close Video
                </button>
              </div>

              {/* Dynamic Large Video Player */}
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-[#1b1d3d] bg-black shadow-inner">
                <PremiumVideoPlayer
                  videoUrl={activeVideoUrl}
                  title={activeLessonTitle || 'Course Video Lesson'}
                  lessonId={activeLessonId || undefined}
                  initialSeekSeconds={seekTarget}
                  durationSeconds={activeLessonDuration}
                  onEnded={handleLessonEnded}
                />
              </div>

            </div>
          ) : (
            /* EXACT MATCH HERO BANNER CARD (Vibrant Multi-Tone Light Mode Gradient) */
            <div className="bg-gradient-to-br from-indigo-100/90 via-purple-100/60 to-pink-100/80 dark:from-[#0c0d24] dark:via-[#0c0d24] dark:to-[#07081a] border border-indigo-200/80 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-4 sm:p-7 md:p-8 relative overflow-hidden text-left shadow-xl shadow-indigo-500/10">
              
              {/* Soft Ambient Light Glow */}
              <div className="absolute -top-12 -left-12 w-56 h-56 bg-gradient-to-r from-indigo-500/25 via-purple-500/30 to-pink-500/25 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

              {/* Glowing 3D Orb Graphic matching reference image */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden md:flex items-center justify-center">
                <div className="w-52 h-52 bg-purple-600/20 rounded-full blur-3xl" />
                <svg className="w-48 h-48 text-[#6c63ff] opacity-90" viewBox="0 0 400 400" fill="none">
                  <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" strokeOpacity="0.4" />
                  <circle cx="200" cy="200" r="90" stroke="currentColor" strokeWidth="2" strokeOpacity="0.6" />
                  <circle cx="200" cy="200" r="40" fill="url(#hero-orb-grad)" />
                  <circle cx="120" cy="140" r="6" fill="#a855f7" />
                  <circle cx="280" cy="260" r="5" fill="#6366f1" />
                  <circle cx="160" cy="300" r="7" fill="#818cf8" />
                  <defs>
                    <radialGradient id="hero-orb-grad">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>

              {/* Hero Card Text & Meta */}
              <div className="relative z-10 space-y-2.5 sm:space-y-3.5 max-w-xl">
                <span className="inline-flex items-center bg-gradient-to-r from-[#594fe6] to-[#7964ff] text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md shadow-indigo-500/20">
                  {course.program?.name || 'JEE MAIN 2027'}
                </span>

                <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-[Outfit] tracking-tight leading-tight">
                  {course.title}
                </h1>

                <p className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {course.subject?.name || 'Physical Sciences Division (JEE Syllabus)'}
                </p>

                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-[#9396b8] leading-relaxed">
                  {course.description || 'Comprehensive course covering core physics concepts for board and entrance exams with concept clarity and problem solving.'}
                </p>

                {/* Vibrant Feature Pills in Light Theme */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 pt-1 sm:pt-2">
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 dark:bg-[#131433] dark:text-[#c4c6e5] dark:border-[#2b2d5c] text-[10px] sm:text-[11px] font-semibold shadow-xs">
                    <Play size={11} className="text-indigo-600 dark:text-indigo-400 sm:w-[12px] sm:h-[12px]" fill="currentColor" /> Video Lessons
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-50/90 text-blue-700 border border-blue-200/80 dark:bg-[#131433] dark:text-[#c4c6e5] dark:border-[#2b2d5c] text-[10px] sm:text-[11px] font-semibold shadow-xs">
                    <FileText size={11} className="text-blue-600 dark:text-blue-400 sm:w-[12px] sm:h-[12px]" /> Study Materials
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50/90 text-emerald-700 border border-emerald-200/80 dark:bg-[#131433] dark:text-[#c4c6e5] dark:border-[#2b2d5c] text-[10px] sm:text-[11px] font-semibold shadow-xs">
                    <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 sm:w-[12px] sm:h-[12px]" /> Practice Tests
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-purple-50/90 text-purple-700 border border-purple-200/80 dark:bg-[#131433] dark:text-[#c4c6e5] dark:border-[#2b2d5c] text-[10px] sm:text-[11px] font-semibold shadow-xs">
                    <CheckCircle2 size={11} className="text-purple-600 dark:text-purple-400 sm:w-[12px] sm:h-[12px]" /> Doubt Support
                  </div>
                </div>

                {/* Structured & Colorful Bottom Stats Grid */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 p-2 sm:p-2.5 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#080918] border border-indigo-100/90 dark:border-[#1b1d3d] mt-3 sm:mt-4 text-left shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={12} className="sm:w-[13px] sm:h-[13px]" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-none">{modulesList.length}</span>
                      <span className="text-[8px] sm:text-[9.5px] text-slate-500 dark:text-[#8e91b5] font-semibold truncate block mt-0.5">Modules</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Play size={10} fill="currentColor" className="sm:w-[12px] sm:h-[12px]" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-none">{totalLessonsCount || course.lessons_count || 10}</span>
                      <span className="text-[8px] sm:text-[9.5px] text-slate-500 dark:text-[#8e91b5] font-semibold truncate block mt-0.5">Lessons</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Star size={11} fill="currentColor" className="sm:w-[13px] sm:h-[13px]" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-none">4.8/5</span>
                      <span className="text-[8px] sm:text-[9.5px] text-slate-500 dark:text-[#8e91b5] font-semibold truncate block mt-0.5">Rating</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Users size={12} className="sm:w-[13px] sm:h-[13px]" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-none">10K+</span>
                      <span className="text-[8px] sm:text-[9.5px] text-slate-500 dark:text-[#8e91b5] font-semibold truncate block mt-0.5">Enrolled</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. Navigation Tabs (Horizontal Scroll on Mobile, Full Row on Desktop) */}
          <div className="border-b border-slate-200 dark:border-[#1f2147] flex items-center gap-3 sm:gap-8 overflow-x-auto scrollbar-hide flex-nowrap text-xs font-extrabold font-[Outfit] text-left pt-1">
            {['Overview', 'Lessons', 'Materials', 'Practice Tests', 'FAQ'].map((tab) => {
              const tabKey = tab.toLowerCase().replace(' ', '')
              const isActive = activeTab === tabKey
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tabKey)}
                  className={`pb-2.5 sm:pb-3 whitespace-nowrap transition-colors cursor-pointer relative shrink-0 text-xs ${
                    isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#8e91b5] hover:text-slate-900 dark:text-white'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#594fe6] rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Notice Login Banner */}
          {!isAuthenticated && (
            <div className="bg-slate-50 dark:bg-[#0e0f2b] border border-slate-200 dark:border-[#1b1c3d] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 px-4 sm:px-5 text-left text-[11px] sm:text-xs text-slate-500 dark:text-[#9396b8] flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Lock size={12} className="sm:w-[13px] sm:h-[13px]" />
              </div>
              <span>
                <Link to="/login" className="text-indigo-500 dark:text-indigo-400 font-extrabold underline hover:text-indigo-300">Login</Link> to access all lessons. You can preview free lessons below.
              </span>
            </div>
          )}

          {/* 3. DYNAMIC TAB CONTENTS */}
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 shadow-xl text-left">
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-[Outfit]">Course Overview & Learning Objectives</h3>
                <p className="text-xs text-slate-500 dark:text-[#9396b8] leading-relaxed">
                  {course.description || 'Master core concepts through structured video lectures, step-by-step problem solving, interactive practice sessions, and comprehensive study guides.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-[#080918] border border-slate-200 dark:border-[#1b1c3d] space-y-2">
                  <h4 className="text-[11px] sm:text-xs font-extrabold text-indigo-500 dark:text-indigo-400 font-[Outfit] uppercase tracking-wider">What You Will Learn</h4>
                  <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-slate-700 dark:text-[#c4c6e5]">
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-slate-500 dark:text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> Fundamental laws and mathematical derivations</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-slate-500 dark:text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> High-yield competitive exam question strategies</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-slate-500 dark:text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> Real-world application of formulas & units</li>
                  </ul>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-[#080918] border border-slate-200 dark:border-[#1b1c3d] space-y-2">
                  <h4 className="text-[11px] sm:text-xs font-extrabold text-indigo-500 dark:text-indigo-400 font-[Outfit] uppercase tracking-wider">Target Audience & Prerequisites</h4>
                  <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-slate-700 dark:text-[#c4c6e5]">
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" /> Designed for Class 11th, 12th & Target Batches</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" /> Basic understanding of high-school algebra & science</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" /> Includes board exam + entrance level prep</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-3 sm:space-y-4 text-left">
              {modulesList.map((mod, mIdx) => {
                const isExpanded = !!openModules[mod.id]
                const modNumber = (mIdx + 1).toString().padStart(2, '0')
                const lessonsInMod = mod.lessons || []

                return (
                  <div key={mod.id} className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-xl sm:rounded-[20px] overflow-hidden shadow-xl">
                    {/* Module Header Row */}
                    <div
                      onClick={() => setOpenModules((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                      className="p-3 sm:p-4 px-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-[#101233] transition-colors border-b border-slate-200 dark:border-[#1b1c3d]"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-[#594fe6] text-white text-[11px] sm:text-xs font-extrabold flex items-center justify-center font-mono shadow-xs shrink-0">
                          {modNumber}
                        </span>
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white font-[Outfit] truncate">
                          {mod.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-[#8e91b5] shrink-0">
                        <span>{lessonsInMod.length} Lessons</span>
                        {isExpanded ? <ChevronUp size={14} className="sm:w-[16px] sm:h-[16px]" /> : <ChevronDown size={14} className="sm:w-[16px] sm:h-[16px]" />}
                      </div>
                    </div>

                    {/* Module Lessons List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="divide-y divide-slate-200 dark:divide-[#1b1c3d]/60 bg-slate-50 dark:bg-[#080918]/60"
                        >
                          {lessonsInMod.map((l) => {
                            const isFree = l.is_free_preview
                            const isCompleted = completedLessons.includes(l.id)
                            const isPlaying = activeLessonId === l.id
                            const durationStr = l.duration_seconds ? `${Math.floor(l.duration_seconds / 60)}:${(l.duration_seconds % 60).toString().padStart(2, '0')}` : '12:45'

                            return (
                              <div
                                key={l.id}
                                onClick={() => handleLessonClick(l)}
                                className={`p-3 sm:p-3.5 px-4 sm:px-6 flex items-center justify-between text-xs transition-colors cursor-pointer gap-2 min-w-0 ${
                                  isPlaying
                                    ? 'bg-indigo-50 dark:bg-[#18193f] text-indigo-700 dark:text-white font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-[#101233] text-slate-700 dark:text-[#c4c6e5]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                                  <button className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isPlaying ? 'bg-[#594fe6] text-white' : 'bg-slate-200 dark:bg-[#131433] text-slate-600 dark:text-[#8e91b5] hover:text-slate-900 dark:hover:text-white'
                                  }`}>
                                    <Play size={10} fill="currentColor" className="sm:w-[11px] sm:h-[11px]" />
                                  </button>

                                  <span className="font-semibold text-slate-900 dark:text-white font-[Outfit] text-xs sm:text-sm truncate">
                                    {l.title}
                                  </span>

                                  {isFree && (
                                    <span className="text-[8px] sm:text-[9px] font-extrabold uppercase bg-[#594fe6] text-white px-1.5 sm:px-2 py-0.5 rounded-full tracking-wider shrink-0">
                                      FREE
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono text-slate-500 dark:text-[#8e91b5] shrink-0">
                                  <span>{durationStr}</span>
                                  {isCompleted ? (
                                    <CheckCircle2 size={14} className="text-slate-500 dark:text-emerald-600 dark:text-emerald-400 sm:w-[15px] sm:h-[15px]" />
                                  ) : !isFree && !isAuthenticated ? (
                                    <Lock size={12} className="text-[#5c5f8a] sm:w-[13px] sm:h-[13px]" />
                                  ) : null}
                                </div>
                              </div>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-4 sm:p-6 lg:p-8 space-y-4 shadow-xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#1b1c3d]">
                <div>
                  <h3 className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit]">Downloadable Study Materials</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#8e91b5]">Access formula sheets, lecture notes and revision PDFs.</p>
                </div>
                <span className="self-start sm:self-auto text-[10px] sm:text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2.5 sm:px-3 py-1 rounded-full border border-indigo-500/20">3 Files Available</span>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {[
                  { title: 'Chapter 01 - Formula Sheet & Quick Recap', type: 'PDF', size: '4.2 MB' },
                  { title: 'Session Lecture Notes & Handouts (Annotated)', type: 'PDF', size: '8.7 MB' },
                  { title: 'Top 50 Selected Practice Problems with Solutions', type: 'PDF', size: '5.1 MB' },
                ].map((mat, idx) => (
                  <div key={idx} className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#080918] border border-slate-200 dark:border-[#1b1c3d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-indigo-500/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-[#131433] text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 font-bold text-xs border border-indigo-100 dark:border-[#232552]">
                        {mat.type}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white font-[Outfit]">{mat.title}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-[#8e91b5] font-mono">{mat.size} • Verified PDF Document</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert(`Downloading ${mat.title}...`)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#594fe6] hover:bg-[#6c61f2] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'practicetests' && (
            <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-4 sm:p-6 lg:p-8 space-y-4 shadow-xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#1b1c3d]">
                <div>
                  <h3 className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit]">Practice Tests & Quizzes</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#8e91b5]">Evaluate your conceptual clarity with timed quizzes.</p>
                </div>
                <span className="self-start sm:self-auto text-[10px] sm:text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 sm:px-3 py-1 rounded-full border border-emerald-500/20">2 Quizzes Active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { title: 'Unit Quiz 01: Core Concepts & Units', questions: '20 Questions', duration: '30 Mins' },
                  { title: 'Chapter Assessment: Mock Practice DPP', questions: '30 Questions', duration: '45 Mins' },
                ].map((test, idx) => (
                  <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#080918] border border-slate-200 dark:border-[#1b1c3d] space-y-3 sm:space-y-4 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[8.5px] sm:text-[9px] font-extrabold uppercase text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full tracking-wider border border-indigo-500/20">TIMED PRACTICE</span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white font-[Outfit]">{test.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-[#8e91b5] font-mono pt-1">
                        <span>{test.questions}</span> • <span>{test.duration}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate('/exams')}
                      className="w-full py-2 rounded-xl bg-[#594fe6] hover:bg-[#6c61f2] text-white text-xs font-extrabold transition-colors cursor-pointer text-center"
                    >
                      Start Practice Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-4 sm:p-6 lg:p-8 space-y-3.5 sm:space-y-4 shadow-xl text-left">
              <h3 className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] pb-3 border-b border-slate-200 dark:border-[#1b1c3d]">Frequently Asked Questions</h3>

              <div className="space-y-2.5 sm:space-y-3">
                {[
                  { q: 'Is this course suitable for beginners?', a: 'Yes! The course begins with foundational concepts before progressing to advanced problem-solving.' },
                  { q: 'How long do I have access to video lectures?', a: 'Enrolled students get unlimited lifetime access to all recorded lectures and study materials.' },
                  { q: 'How can I clear my doubts during the course?', a: 'You can submit doubts directly under lesson comments or join weekly live interactive Q&A sessions.' },
                  { q: 'Can I watch videos on mobile devices?', a: 'Yes, our platform is fully responsive and supports mobile browsers, tablets, and desktop devices.' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#080918] border border-slate-200 dark:border-[#1b1c3d] space-y-1">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white font-[Outfit]">{item.q}</h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#8e91b5] leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN - 4 STACKED SIDEBAR CARDS */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 text-left">
          
          {/* CARD 1: UNLOCK FULL ACCESS LOCK CARD / CURRENT LESSON STATUS */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/30 to-white dark:from-[#0c0d24] dark:to-[#08091c] border border-indigo-100/80 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] overflow-hidden shadow-xl">
            {!isAuthenticated ? (
              <div className="p-5 sm:p-7 text-slate-500 dark:text-slate-400 text-center space-y-3 sm:space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#594fe6] to-[#7964ff] text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
                  <Lock size={20} className="sm:w-[22px] sm:h-[22px]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-[Outfit]">Unlock Full Access</h3>
                  <p className="text-xs text-slate-600 dark:text-[#8e91b5] leading-relaxed max-w-xs mx-auto">
                    Login to access all lessons, notes and practice tests.
                  </p>
                </div>

                <div className="pt-0.5">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-auto px-6 sm:px-8 rounded-full bg-gradient-to-r from-[#594fe6] to-[#7964ff] hover:opacity-95 text-white font-extrabold text-xs py-2 sm:py-2.5 border-0 shadow-md shadow-indigo-600/25 cursor-pointer inline-flex items-center justify-center"
                    onClick={() => navigate('/login')}
                  >
                    Login to Explore
                  </Button>
                </div>

                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5]">
                  Need access? Contact coordinator for batch enrollment
                </p>
              </div>
            ) : activeVideoUrl ? (
              <div className="p-4.5 sm:p-6 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                    PLAYING LESSON
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-[#8e91b5]">12:45</span>
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white font-[Outfit] leading-snug">
                  {activeLessonTitle || 'Video Lesson'}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#8e91b5] leading-relaxed">
                  Watching in full HD. Video player is active in the main section.
                </p>
              </div>
            ) : (
              <div className="p-4.5 sm:p-6 space-y-2.5 sm:space-y-3">
                <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                  <Play size={15} fill="currentColor" />
                  <span className="text-xs font-extrabold uppercase font-[Outfit] text-slate-900 dark:text-white tracking-wider">Ready to Learn</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#8e91b5] leading-relaxed">
                  Select any free preview or unlocked lesson from the syllabus on the left to start watching.
                </p>
              </div>
            )}
          </div>

          {/* CARD 2: COURSE CURRICULUM SUMMARY */}
          <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-4.5 sm:p-6 space-y-3 sm:space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <BookOpen size={15} className="text-indigo-500 dark:text-indigo-400" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-[Outfit]">Course Curriculum</h3>
            </div>

            <div className="space-y-2.5 sm:space-y-3 pt-0.5">
              {modulesList.map((m, idx) => (
                <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200 dark:border-[#1b1c3d]/60 last:border-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 font-bold shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-[Outfit] truncate">{m.title}</span>
                  </div>
                  <span className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5] font-semibold flex-shrink-0 ml-2">{(m.lessons || []).length} Lessons</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1b1c3d] text-xs font-bold">
              <span className="text-slate-500 dark:text-[#8e91b5]">Total</span>
              <span className="text-slate-900 dark:text-white">{totalLessonsCount} Lessons</span>
            </div>
          </div>

          {/* CARD 3: WHAT YOU'LL GET */}
          <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-4.5 sm:p-6 space-y-3 sm:space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <CheckCircle2 size={15} className="text-indigo-500 dark:text-indigo-400" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-[Outfit]">What You'll Get</h3>
            </div>

            <ul className="space-y-2 sm:space-y-2.5 text-xs text-slate-700 dark:text-[#c4c6e5] font-medium">
              <li className="flex items-center gap-2 sm:gap-2.5">
                <CheckCircle2 size={14} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <span>High quality video lessons</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-2.5">
                <CheckCircle2 size={14} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <span>Downloadable study materials</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-2.5">
                <CheckCircle2 size={14} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <span>Chapter wise practice tests</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-2.5">
                <CheckCircle2 size={14} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <span>Doubt support from experts</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-2.5">
                <CheckCircle2 size={14} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <span>Regular content updates</span>
              </li>
            </ul>
          </div>

          {/* CARD 4: HAVE DOUBTS? */}
          <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-4.5 sm:p-6 space-y-3 sm:space-y-3.5 shadow-xl">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-[Outfit]">Have Doubts?</h3>
            <p className="text-xs text-slate-500 dark:text-[#8e91b5] leading-relaxed">
              Our support team is here to help you.
            </p>

            <button
              onClick={() => navigate('/contact')}
              className="w-full bg-indigo-50 dark:bg-[#181938] hover:bg-indigo-100 dark:hover:bg-[#20224a] border border-indigo-100 dark:border-[#2b2d5c] text-indigo-700 dark:text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <HelpCircle size={14} className="text-indigo-500 dark:text-indigo-400" /> Ask a Question
            </button>
          </div>

        </div>

      </div>

      {/* 4. Bottom 4 Feature Highlight Cards (2 Columns on Mobile, 4 Columns on Desktop) */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full pt-3 sm:pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-left">
          <div className="p-3 sm:p-4 border border-slate-200 dark:border-[#1f2147] bg-white dark:bg-[#0c0d24] rounded-xl sm:rounded-[20px] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 shadow-md">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-[#181938] text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-[#2b2d5c] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={16} className="sm:w-[20px] sm:h-[20px]" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white font-[Outfit]">Concept Clarity</h4>
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-[#8e91b5] leading-snug mt-0.5">Learn concepts with simple explanations.</p>
            </div>
          </div>

          <div className="p-3 sm:p-4 border border-slate-200 dark:border-[#1f2147] bg-white dark:bg-[#0c0d24] rounded-xl sm:rounded-[20px] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 shadow-md">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-[#181938] text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-[#2b2d5c] flex items-center justify-center flex-shrink-0">
              <Award size={16} className="sm:w-[20px] sm:h-[20px]" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white font-[Outfit]">Exam Focused</h4>
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-[#8e91b5] leading-snug mt-0.5">Aligned with latest exam pattern.</p>
            </div>
          </div>

          <div className="p-3 sm:p-4 border border-slate-200 dark:border-[#1f2147] bg-white dark:bg-[#0c0d24] rounded-xl sm:rounded-[20px] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 shadow-md">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-[#181938] text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-[#2b2d5c] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={16} className="sm:w-[20px] sm:h-[20px]" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white font-[Outfit]">Practice Tests</h4>
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-[#8e91b5] leading-snug mt-0.5">Chapter-wise timed quizzes.</p>
            </div>
          </div>

          <div className="p-3 sm:p-4 border border-slate-200 dark:border-[#1f2147] bg-white dark:bg-[#0c0d24] rounded-xl sm:rounded-[20px] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 shadow-md">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-[#181938] text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-[#2b2d5c] flex items-center justify-center flex-shrink-0">
              <Globe size={16} className="sm:w-[20px] sm:h-[20px]" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white font-[Outfit]">Learn Anytime</h4>
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-[#8e91b5] leading-snug mt-0.5">Access on mobile or desktop anytime.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}


