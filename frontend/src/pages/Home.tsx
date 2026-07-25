import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import {
  Play, Clock, Headphones, Tv, FileText, CheckSquare, BarChart, Users, Star,
  ArrowRight, BookOpen, Layers, GraduationCap, Building2, Award, Code, Briefcase,
  X
} from 'lucide-react'
import { Button, Spinner, PremiumVideoPlayer, Modal } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'
import teacherHero from '@/assets/teacher_hero.png'

interface Course {
  id: number
  title: string
  description: string
  thumbnail: string | null
  modules_count: number
  lessons_count: number
  program?: { name: string }
  subject?: { name: string }
  teacher?: { name: string }
}

interface EducationTypeApi {
  id: number
  name: string
  slug: string
  description: string | null
  programs: Array<{ id: number; name: string; slug: string; courses_count: number }>
  total_courses: number
}

interface ExploreResponse {
  courses: Course[]
  education_types: EducationTypeApi[]
  settings: {
    landing_hero_video_url: string
    landing_testimonials: Array<{ name: string; role: string; quote: string; initials: string; avatar?: string }>
    stats_students?: string
    stats_lectures?: string
    stats_live_classes?: string
    stats_success_rate?: string
  }
}

export default function Home() {
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState({ hrs: 2, mins: 15, secs: 13 })
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false)
  const testimonialScrollRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 }
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 }
        if (prev.hrs > 0) return { hrs: prev.hrs - 1, mins: 59, secs: 59 }
        clearInterval(timer)
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isTestimonialPaused) return

    const interval = setInterval(() => {
      if (testimonialScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = testimonialScrollRef.current
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          testimonialScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          testimonialScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' })
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isTestimonialPaused])

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'explore'],
    queryFn: async () => {
      const res = await api.get<{ data: ExploreResponse }>('/public/explore')
      return res.data
    },
  })

  const courses = data?.courses ?? []
  const educationTypes = data?.education_types ?? []
  const cms = data?.settings
  const heroVideoUrl = cms?.landing_hero_video_url ?? ''

  const formatTimerVal = (num: number) => num.toString().padStart(2, '0')

  // Icon + color palette mapped by slug prefix (covers all taxonomy variants)
  const goalStyles: Record<string, { icon: React.ElementType; boxBg: string; boxBorder: string; iconColor: string; cardBorder: string; glowColor: string; cardBg: string }> = {
    school:       { icon: Building2,    boxBg: 'bg-emerald-500/10 dark:bg-[#102e23]', boxBorder: 'border-emerald-500/30 dark:border-[#1b4e3c]', iconColor: 'text-slate-500 dark:text-emerald-600 dark:text-[#22c55e]', cardBorder: 'border-emerald-100 dark:border-[#18392f]', glowColor: 'from-emerald-500/10 dark:from-[#0f382a]/50', cardBg: 'bg-gradient-to-b from-emerald-50/60 to-white dark:from-[#0a0b1e] dark:to-[#060714]' },
    college:      { icon: GraduationCap, boxBg: 'bg-blue-500/10 dark:bg-[#13244c]', boxBorder: 'border-blue-500/30 dark:border-[#1f3c7d]', iconColor: 'text-slate-500 dark:text-blue-600 dark:text-[#3b82f6]', cardBorder: 'border-blue-100 dark:border-[#1c3873]', glowColor: 'from-blue-500/10 dark:from-[#132d5e]/50', cardBg: 'bg-gradient-to-b from-blue-50/60 to-white dark:from-[#0a0b1e] dark:to-[#060714]' },
    competitive:  { icon: Award,         boxBg: 'bg-purple-500/10 dark:bg-[#241747]', boxBorder: 'border-purple-500/30 dark:border-[#3e2778]', iconColor: 'text-purple-600 dark:text-[#a855f7]', cardBorder: 'border-purple-100 dark:border-[#392473]', glowColor: 'from-purple-500/10 dark:from-[#271a54]/50', cardBg: 'bg-gradient-to-b from-purple-50/60 to-white dark:from-[#0a0b1e] dark:to-[#060714]' },
    certification: { icon: FileText,    boxBg: 'bg-amber-500/10 dark:bg-[#2e2010]', boxBorder: 'border-amber-500/30 dark:border-[#52391b]', iconColor: 'text-amber-600 dark:text-[#f59e0b]', cardBorder: 'border-amber-100 dark:border-[#4a341b]', glowColor: 'from-amber-500/10 dark:from-[#382613]/50', cardBg: 'bg-gradient-to-b from-amber-50/60 to-white dark:from-[#0a0b1e] dark:to-[#060714]' },
    skill:        { icon: Code,          boxBg: 'bg-teal-500/10 dark:bg-[#0f2e36]', boxBorder: 'border-teal-500/30 dark:border-[#1b4d5a]', iconColor: 'text-teal-600 dark:text-[#06b6d4]', cardBorder: 'border-teal-100 dark:border-[#154b57]', glowColor: 'from-teal-500/10 dark:from-[#0f3840]/50', cardBg: 'bg-gradient-to-b from-teal-50/60 to-white dark:from-[#0a0b1e] dark:to-[#060714]' },
    professional: { icon: Briefcase,     boxBg: 'bg-yellow-500/10 dark:bg-[#2e2910]', boxBorder: 'border-yellow-500/30 dark:border-[#4d441b]', iconColor: 'text-yellow-600 dark:text-[#eab308]', cardBorder: 'border-yellow-100 dark:border-[#4a441b]', glowColor: 'from-yellow-500/10 dark:from-[#383313]/50', cardBg: 'bg-gradient-to-b from-yellow-50/60 to-white dark:from-[#0a0b1e] dark:to-[#060714]' },
    default:      { icon: BookOpen,      boxBg: 'bg-indigo-500/10 dark:bg-[#161836]', boxBorder: 'border-indigo-500/30 dark:border-[#2b2e68]', iconColor: 'text-indigo-600 dark:text-[#818cf8]', cardBorder: 'border-indigo-100 dark:border-[#262852]', glowColor: 'from-indigo-500/10 dark:from-[#151640]/50', cardBg: 'bg-gradient-to-b from-indigo-50/60 to-white dark:from-[#0a0b1e] dark:to-[#060714]' },
  }

  // Dynamically derive goals from API education_types; fallback to defaults if empty
  const fallbackGoals = [
    { id: 1, name: 'School',               slug: 'school',               description: 'Batches for Classes 6th to 12th', total_courses: 0, programs: [] },
    { id: 2, name: 'College',              slug: 'college',              description: 'Batches & Courses for UG & PG', total_courses: 0, programs: [] },
    { id: 3, name: 'Competitive Exams',    slug: 'competitive-exam',     description: 'JEE, NEET, UPSC & more', total_courses: 0, programs: [] },
    { id: 4, name: 'Certification',        slug: 'certification',        description: 'Industry-recognized courses', total_courses: 0, programs: [] },
    { id: 5, name: 'Skill Development',    slug: 'skill-development',    description: 'In-demand practical skills', total_courses: 0, programs: [] },
    { id: 6, name: 'Professional Training',slug: 'professional-training', description: 'Corporate upskilling programs', total_courses: 0, programs: [] },
  ] as EducationTypeApi[]

  const goals = (educationTypes.length > 0 ? educationTypes : fallbackGoals).map(et => {
    const slugKey = Object.keys(goalStyles).find(k => et.slug.startsWith(k)) ?? 'default'
    return { id: et.id, slug: et.slug, ...goalStyles[slugKey], title: et.name, desc: et.description ?? '', programs: et.programs, total_courses: et.total_courses }
  })

  const categorySections = React.useMemo(() => {
    if (!courses.length) return []

    // Keyword taxonomy map for matching courses to categories
    const categoryKeywords: Record<string, string[]> = {
      school: ['school', 'class', 'cbse', 'icse', '6th', '7th', '8th', '9th', '10th', '11th', '12th', 'k12', 'biology', 'physics', 'chemistry', 'maths'],
      college: ['college', 'ug', 'pg', 'university', 'btech', 'bsc', 'bcom', 'ba', 'degree'],
      competitive: ['competitive', 'jee', 'neet', 'upsc', 'ssc', 'bank', 'gate', 'exam', 'entrance'],
      certification: ['certification', 'certificate', 'certified', 'diploma'],
      skill: ['skill', 'coding', 'web', 'python', 'java', 'react', 'design', 'development', 'data'],
      professional: ['professional', 'corporate', 'management', 'business', 'training', 'career', 'executive'],
    }

    const sections = goals.map((g) => {
      const catCourses = courses.filter((c: any) => {
        if (g.id > 0 && (c.education_type_id === g.id || c.education_type?.id === g.id || c.program?.education_type_id === g.id)) {
          return true
        }
        
        const slugPrefix = Object.keys(categoryKeywords).find(k => g.slug?.toLowerCase().startsWith(k)) || g.slug?.toLowerCase() || ''
        const keywords = categoryKeywords[slugPrefix] || [g.title.toLowerCase()]
        
        const fullText = [
          c.title,
          c.description,
          c.program?.name,
          c.subject?.name,
          c.education_type?.name,
          c.program?.education_type?.name
        ].filter(Boolean).join(' ')

        return keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(fullText))
      })

      return {
        ...g,
        courses: catCourses.slice(0, 4),
      }
    })

    // ONLY show categories that actually have matching courses in database!
    return sections.filter((s) => s.courses.length > 0)
  }, [courses, goals])

  // Why Students Choose Grid
  const whyChooseGrid = [
    { title: 'Expert Mentors', desc: 'Learn from top educators', icon: GraduationCap },
    { title: 'Live & Interactive', desc: 'Real-time interaction for better learning', icon: Tv },
    { title: 'Structured Learning', desc: 'Step-by-step learning with a clear path', icon: Layers },
    { title: 'Practice & Tests', desc: 'Mock tests & PDFs for perfect preparation', icon: CheckSquare },
    { title: 'Track Progress', desc: 'Detailed analytics to improve consistently', icon: BarChart },
    { title: 'Personal Doubt Solving', desc: 'Instant doubt solving anytime, anywhere', icon: Headphones },
  ]

  // Testimonials - use CMS data when available, fallback to defaults
  const defaultTestimonials = [
    {
      name: 'Aarav Sharma',
      role: 'Student',
      quote: 'This platform has completely transformed the way I study. The live classes and mentorship are excellent!',
      avatar: '/images/default-avatar.svg',
    },
    {
      name: 'Riya Singh',
      role: 'Student',
      quote: 'Concepts are taught so clearly and the test series really helped me improve my understanding.',
      avatar: '/images/default-avatar.svg',
    },
    {
      name: 'Kabir Verma',
      role: 'Student',
      quote: 'Best platform for exam preparation. The current affairs sessions are extremely helpful.',
      avatar: '/images/default-avatar.svg',
    },
  ]
  const cmsTestimonials = cms?.landing_testimonials
  const testimonials = (cmsTestimonials && cmsTestimonials.length > 0) ? cmsTestimonials : defaultTestimonials

  return (
    <div className="flex flex-col gap-6 sm:gap-12 bg-[#f8fafc] dark:bg-[#050614] text-slate-900 dark:text-white selection:bg-indigo-500/30 overflow-hidden font-sans pb-6 sm:pb-8 transition-colors duration-200">
      
      {/* ── 1. Hero & Stats Wrapper (Full Screen on Desktop, Compact on Mobile) ─────────────────────────── */}
      <div className="min-h-0 lg:min-h-[calc(100dvh-4rem)] flex flex-col justify-center gap-2 sm:gap-4 pt-2 sm:pt-1 pb-2 sm:pb-8 w-full">
        
        {/* ── 1. Hero Section ─────────────────────────────────────────── */}
        <section className="relative pt-0 pb-0 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        
        {/* Background Purple Glow Spotlight & Concentric Orbital System Lines */}
        <div className="absolute top-1/2 left-[48%] -translate-x-1/2 -translate-y-1/2 w-full max-w-[720px] h-[720px] pointer-events-none -z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,95,255,0.28)_0%,rgba(89,79,230,0.14)_45%,transparent_70%)] rounded-full blur-3xl opacity-70 dark:opacity-100" />
          
          <svg className="w-full h-full text-[#6c63ff] opacity-40 dark:opacity-100" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="300" cy="300" r="160" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" strokeOpacity="0.22" />
            <circle cx="300" cy="300" r="230" stroke="currentColor" strokeWidth="1" strokeOpacity="0.18" />
            <circle cx="210" cy="120" r="4" fill="#a855f7" fillOpacity="0.8" />
            <circle cx="480" cy="390" r="3.5" fill="#6366f1" fillOpacity="0.8" />
            <circle cx="300" cy="300" r="290" stroke="currentColor" strokeWidth="1" strokeOpacity="0.12" />
            <circle cx="110" cy="390" r="4.5" fill="#818cf8" fillOpacity="0.7" />
          </svg>
        </div>

        <div className="grid grid-cols-12 gap-2 sm:gap-6 lg:gap-12 items-center relative z-10">
          
          {/* Left Column */}
          <div className="col-span-7 lg:col-span-6 space-y-1.5 sm:space-y-4 text-left min-w-0">
            <div>
              <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-0.5 sm:py-1.5 rounded-full border border-indigo-500/30 dark:border-indigo-400/30 bg-indigo-50/80 dark:bg-[#151638] text-indigo-700 dark:text-indigo-300 text-[9px] sm:text-xs font-bold shadow-xs">
                <Star size={10} className="text-amber-400 fill-amber-400 sm:w-[13px] sm:h-[13px]" /> #1 Digital Coaching Platform
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>

            <h1 className="text-base sm:text-4xl lg:text-5xl xl:text-[52px] font-extrabold tracking-tight leading-[1.15] sm:leading-[1.1] font-[Outfit] text-slate-900 dark:text-white">
              Master Concepts. <br />
              <span className="bg-gradient-to-r from-[#594fe6] via-[#7964ff] to-[#a855f7] bg-clip-text text-transparent">
                Achieve Top Ranks.
              </span>
            </h1>

            <p className="text-[10px] sm:text-sm lg:text-base text-slate-600 dark:text-[#9396b8] max-w-xl leading-snug sm:leading-relaxed font-medium">
              Expert live coaching, real-time doubt solving, and high-yield test series for JEE, NEET &amp; Boards.
            </p>

            {/* Feature Highlights Row */}
            <div className="hidden sm:flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-[#c4c6e5] pt-0.5">
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-[#121433] border border-slate-200 dark:border-[#22244f] flex items-center gap-1 sm:gap-1.5">
                <Tv size={11} className="text-indigo-400 sm:w-[12px] sm:h-[12px]" /> Live Interactive Coaching
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-[#121433] border border-slate-200 dark:border-[#22244f] flex items-center gap-1 sm:gap-1.5">
                <FileText size={11} className="text-slate-500 dark:text-emerald-400 sm:w-[12px] sm:h-[12px]" /> Downloadable Notes
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-[#121433] border border-slate-200 dark:border-[#22244f] flex items-center gap-1 sm:gap-1.5">
                <CheckSquare size={11} className="text-amber-400 sm:w-[12px] sm:h-[12px]" /> Timed Test Series
              </span>
            </div>

            <div className="flex flex-row items-center gap-1.5 sm:gap-3.5 pt-1 sm:pt-2">
              <Button
                variant="primary"
                size="lg"
                className="rounded-full bg-gradient-to-r from-[#594fe6] to-[#7964ff] hover:opacity-95 text-white font-extrabold text-[9px] sm:text-xs px-2.5 sm:px-6 lg:px-8 py-1.5 sm:py-2.5 lg:py-3.5 border-0 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                onClick={() => navigate('/courses')}
              >
                Explore Courses <ArrowRight size={10} className="sm:w-[14px] sm:h-[14px]" />
              </Button>
              
              <button
                onClick={() => setPreviewVideoUrl(heroVideoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                className="flex items-center justify-center gap-1 sm:gap-2.5 text-[9px] sm:text-xs font-semibold text-slate-700 dark:text-[#c4c6e5] hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer px-2 sm:px-5 lg:px-6 py-1.5 sm:py-2.5 lg:py-3.5 rounded-full border border-slate-200 dark:border-[#2b2d54] bg-white dark:bg-[#101226] shadow-xs whitespace-nowrap"
              >
                <span className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-indigo-50 dark:bg-[#1e2042] text-indigo-600 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
                  <Play size={7} fill="currentColor" className="ml-[1px] sm:w-[10px] sm:h-[10px]" />
                </span>
                Watch Tour
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 sm:gap-4 pt-2 sm:pt-3 border-t border-slate-200 dark:border-[#1b1d3d]">
              <div className="flex -space-x-2">
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-[#050614] object-cover" src="/images/default-avatar.svg" alt="Student" />
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-[#050614] object-cover" src="/images/default-avatar.svg" alt="Student" />
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-[#050614] object-cover" src="/images/default-avatar.svg" alt="Student" />
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-[#050614] object-cover" src="/images/default-avatar.svg" alt="Student" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="text-amber-400 fill-amber-400 sm:w-[11px] sm:h-[11px]" />
                  ))}
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-white ml-1">4.9/5 Rating</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5] font-medium">Trusted by 10,000+ Students Nationwide</span>
              </div>
            </div>
          </div>

          {/* Right Column: Teacher Image Always on Right Side Side-by-Side */}
          <div className="col-span-5 lg:col-span-6 flex justify-center lg:justify-end relative my-0 sm:my-4 lg:my-0">
            <div className="relative rounded-[12px] sm:rounded-[32px] overflow-hidden border border-slate-200 dark:border-[#2a2b54]/60 bg-gradient-to-b from-indigo-50/50 dark:from-[#131433]/50 to-transparent p-0.5 sm:p-2 shadow-md sm:shadow-[0_20px_50px_rgba(99,95,230,0.2)] z-10 w-full max-w-[130px] sm:max-w-[280px] lg:max-w-[420px]">
              <img
                src={teacherHero}
                alt="Student Portrait"
                className="w-full object-contain rounded-[10px] sm:rounded-[28px]"
              />
            </div>
          </div>

          {/* Right Column: Live Now Card (Hidden as requested) */}
          <div className="hidden space-y-4 sm:space-y-5 relative z-10">
            <div className="bg-white dark:bg-[#0c0e22] border border-slate-200 dark:border-[#24264d] rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-emerald-600 dark:text-[#22c55e] mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Now
              </div>

              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white font-[Outfit]">Next Live Class</h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5] mb-3 sm:mb-4">Today, 7:00 PM</p>

              <div className="grid grid-cols-3 gap-2 text-slate-500 dark:text-slate-400 text-center mb-3 sm:mb-4 bg-slate-50 dark:bg-[#080918] p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-[#1b1d3d]">
                <div>
                  <span className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono">{formatTimerVal(timeLeft.hrs)}</span>
                  <span className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-slate-500 dark:text-[#8e91b5] font-bold">HRS</span>
                </div>
                <div>
                  <span className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono">{formatTimerVal(timeLeft.mins)}</span>
                  <span className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-slate-500 dark:text-[#8e91b5] font-bold">MINS</span>
                </div>
                <div>
                  <span className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono">{formatTimerVal(timeLeft.secs)}</span>
                  <span className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-slate-500 dark:text-[#8e91b5] font-bold">SECS</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full bg-gradient-to-r from-[#594fe6] to-[#7964ff] hover:opacity-95 text-white font-bold text-xs py-2 sm:py-2.5 rounded-xl border-0 shadow-[0_0_20px_rgba(99,95,230,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => navigate('/live-classes')}
              >
                Join Live Class <ArrowRight size={14} />
              </Button>
            </div>

            <div className="space-y-2.5 sm:space-y-3 text-xs font-semibold text-slate-700 dark:text-[#c4c6e5]">
              <div 
                onClick={() => navigate('/live-classes')}
                className="flex items-center gap-2.5 sm:gap-3 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 dark:bg-[#2b1625] text-rose-600 dark:text-[#f43f5e] flex items-center justify-center flex-shrink-0 border border-rose-200 dark:border-[#4d1f33] group-hover:scale-105 transition-transform">
                  <Tv size={13} className="sm:w-[14px] sm:h-[14px]" />
                </div>
                <span>Live Interactive Classes</span>
              </div>

              <div 
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2.5 sm:gap-3 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 dark:bg-[#0f2d2b] text-teal-600 dark:text-[#14b8a6] flex items-center justify-center flex-shrink-0 border border-teal-200 dark:border-[#1b4d48] group-hover:scale-105 transition-transform">
                  <Play size={11} fill="currentColor" className="sm:w-[12px] sm:h-[12px]" />
                </div>
                <span>Recorded Lectures</span>
              </div>

              <div 
                onClick={() => navigate('/study-materials')}
                className="flex items-center gap-2.5 sm:gap-3 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 dark:bg-[#142345] text-slate-500 dark:text-blue-600 dark:text-[#3b82f6] flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-[#1e3b75] group-hover:scale-105 transition-transform">
                  <FileText size={13} className="sm:w-[14px] sm:h-[14px]" />
                </div>
                <span>Notes & Assignments</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. Statistics Bar (Border Removed & Icon+Value in Same Line) ───────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 w-full relative z-20">
        <div className="bg-white/90 dark:bg-[#0b0d24]/90 backdrop-blur-md rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-lg shadow-indigo-500/5">
          <div className="grid grid-cols-5 gap-1 sm:gap-3 items-center">
            
            {/* Stat 1: Students Enrolled */}
            <div onClick={() => navigate('/courses')} className="flex flex-row items-center gap-1.5 sm:gap-2.5 p-1 sm:p-2 rounded-lg sm:rounded-xl hover:bg-slate-100/60 dark:hover:bg-[#131538] transition-all cursor-pointer group text-left min-w-0">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap size={12} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">10K+</h3>
                <p className="text-[7.5px] sm:text-[10.5px] text-slate-500 dark:text-[#8e91b5] font-medium mt-0.5 truncate">Students</p>
              </div>
            </div>

            {/* Stat 2: Video Lectures */}
            <div onClick={() => navigate('/courses')} className="flex flex-row items-center gap-1.5 sm:gap-2.5 p-1 sm:p-2 rounded-lg sm:rounded-xl hover:bg-slate-100/60 dark:hover:bg-[#131538] transition-all cursor-pointer group text-left min-w-0">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20 group-hover:scale-105 transition-transform">
                <Play size={10} fill="currentColor" className="sm:w-[13px] sm:h-[13px]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">200+</h3>
                <p className="text-[7.5px] sm:text-[10.5px] text-slate-500 dark:text-[#8e91b5] font-medium mt-0.5 truncate">Lectures</p>
              </div>
            </div>

            {/* Stat 3: Live Classes */}
            <div onClick={() => navigate('/live-classes')} className="flex flex-row items-center gap-1.5 sm:gap-2.5 p-1 sm:p-2 rounded-lg sm:rounded-xl hover:bg-slate-100/60 dark:hover:bg-[#131538] transition-all cursor-pointer group text-left min-w-0">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/20 group-hover:scale-105 transition-transform">
                <Tv size={11} className="sm:w-[15px] sm:h-[15px]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-none group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">50+</h3>
                <p className="text-[7.5px] sm:text-[10.5px] text-slate-500 dark:text-[#8e91b5] font-medium mt-0.5 truncate">Live Classes</p>
              </div>
            </div>

            {/* Stat 4: Success Rate */}
            <div onClick={() => navigate('/results')} className="flex flex-row items-center gap-1.5 sm:gap-2.5 p-1 sm:p-2 rounded-lg sm:rounded-xl hover:bg-slate-100/60 dark:hover:bg-[#131538] transition-all cursor-pointer group text-left min-w-0">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Award size={12} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-emerald-400 font-[Outfit] leading-none">98%</h3>
                <p className="text-[7.5px] sm:text-[10.5px] text-slate-500 dark:text-[#8e91b5] font-medium mt-0.5 truncate">Success</p>
              </div>
            </div>

            {/* Stat 5: Doubt Support */}
            <div onClick={() => navigate('/contact')} className="flex flex-row items-center gap-1.5 sm:gap-2.5 p-1 sm:p-2 rounded-lg sm:rounded-xl hover:bg-slate-100/60 dark:hover:bg-[#131538] transition-all cursor-pointer group text-left min-w-0">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Clock size={12} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-none group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">24/7</h3>
                <p className="text-[7.5px] sm:text-[10.5px] text-slate-500 dark:text-[#8e91b5] font-medium mt-0.5 truncate">Support</p>
              </div>
            </div>

          </div>
        </div>
      </section>
      </div> {/* End Hero & Stats Wrapper */}

      {/* ── 3. Explore by Learning Goal ────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6">
        <div className="text-left">
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 blur-lg rounded-full pointer-events-none" />
            <h2 className="relative text-lg sm:text-[22px] font-extrabold bg-gradient-to-r from-indigo-700 to-fuchsia-700 dark:from-indigo-300 dark:to-fuchsia-300 bg-clip-text text-transparent font-[Outfit]">Explore by Learning Goal</h2>
          </div>
        </div>

        <div className="flex lg:grid flex-nowrap lg:grid-cols-6 overflow-x-auto lg:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-3 sm:gap-4 pb-2 lg:pb-0">
          {goals.map((g, idx) => {
            const GoalIcon = g.icon
            return (
              <div
                key={idx}
                className={`relative p-3 sm:p-4 sm:pt-5 sm:pb-4 ${g.cardBg || 'bg-white dark:bg-[#060714]'} border ${g.cardBorder} rounded-[16px] sm:rounded-[20px] flex flex-col justify-between items-center text-slate-500 dark:text-slate-400 text-center space-y-2 sm:space-y-2.5 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300 cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-xl overflow-hidden min-w-[125px] sm:min-w-[145px] lg:min-w-0 flex-shrink-0 lg:flex-shrink`}
                onClick={() => navigate(g.id > 0 ? `/courses?education_type_id=${g.id}` : '/courses')}
              >
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-20 bg-gradient-to-b ${g.glowColor} to-transparent blur-xl pointer-events-none`} />

                <div className={`w-9 h-9 sm:w-[44px] sm:h-[44px] rounded-[10px] sm:rounded-xl ${g.boxBg} border ${g.boxBorder} ${g.iconColor} flex items-center justify-center flex-shrink-0 shadow-lg relative z-10`}>
                  <GoalIcon size={18} className="sm:w-[22px] sm:h-[22px]" />
                </div>

                <div className="space-y-1 relative z-10">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white font-[Outfit] tracking-tight">{g.title}</h3>
                  <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5] leading-tight sm:leading-snug max-w-[130px] mx-auto line-clamp-2">{g.desc}</p>
                </div>

                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-[#12132e] border border-slate-200 dark:border-[#262852] flex items-center justify-center text-slate-700 dark:text-white group-hover:bg-[#594fe6] group-hover:text-white group-hover:border-[#594fe6] transition-all relative z-10 mt-0.5 sm:mt-1">
                  <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px]" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 4. Why Students Choose EduFlow ──────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6 pt-2 sm:pt-4">
        <div className="text-slate-500 dark:text-slate-400 text-center space-y-1">
          <h2 className="text-lg sm:text-[22px] font-extrabold text-slate-900 dark:text-white font-[Outfit] inline-block relative">
            Why Students Choose EduFlow
            <span className="block h-0.5 w-full bg-gradient-to-r from-transparent via-[#594fe6] to-transparent mt-1.5" />
          </h2>
        </div>

        <div className="flex lg:grid flex-nowrap lg:grid-cols-6 overflow-x-auto lg:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-2.5 sm:gap-4 pb-2 lg:pb-0">
          {whyChooseGrid.map((w, idx) => {
            const WIcon = w.icon
            return (
              <div 
                key={idx} 
                onClick={() => navigate('/courses')}
                className="p-3 sm:p-4 border border-indigo-50 dark:border-[#1f2147] bg-white dark:bg-[#0c0d24] hover:bg-gradient-to-b hover:from-indigo-50/50 hover:to-fuchsia-50/50 dark:hover:from-indigo-900/10 dark:hover:to-fuchsia-900/10 rounded-[16px] sm:rounded-[20px] flex flex-col items-center text-slate-500 dark:text-slate-400 text-center space-y-2 sm:space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-md cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-[0_8px_25px_rgba(99,102,241,0.15)] transition-all duration-300 group min-w-[135px] sm:min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-shrink"
              >
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-[#151636] text-indigo-600 dark:text-[#818cf8] border border-indigo-200 dark:border-[#2b2d5c] flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <WIcon size={16} className="sm:w-[20px] sm:h-[20px]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-white font-[Outfit] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{w.title}</h4>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-[#8e91b5] leading-snug mt-0.5 sm:mt-1">{w.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 5. Popular Courses Section ─────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6 pt-2 sm:pt-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <div className="relative inline-block">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 blur-lg rounded-full pointer-events-none" />
              <h2 className="relative text-lg sm:text-[22px] font-extrabold bg-gradient-to-r from-indigo-700 to-fuchsia-700 dark:from-indigo-300 dark:to-fuchsia-300 bg-clip-text text-transparent font-[Outfit]">Popular Courses</h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#8e91b5]">Handpicked top trending courses across all categories</p>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-[#c4c6e5] hover:text-indigo-600 dark:hover:text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-200 dark:border-[#24264d] bg-white dark:bg-[#0d0e26] flex items-center gap-1 sm:gap-1.5 cursor-pointer transition-colors shadow-sm dark:shadow-none"
          >
            View All <ArrowRight size={12} className="sm:w-[13px] sm:h-[13px]" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
            {courses.slice(0, 4).map((c: any) => {
              const badgeTag = c.program?.name || c.education_type?.name || 'NEET / JEE'
              const subjectTag = c.subject?.name || 'Academic Course'
              const teacherName = c.teacher?.name || 'By Arjun Kumar'

              return (
                <div
                  key={c.id}
                  className="p-2.5 sm:p-4 border border-indigo-50/80 dark:border-[#1f2147] bg-gradient-to-br from-white to-slate-50 dark:from-[#0c0e25] dark:to-[#080918] flex flex-col justify-between hover:border-indigo-400/50 hover:shadow-[0_12px_35px_rgba(99,102,241,0.12)] transition-all duration-300 cursor-pointer group text-left rounded-[14px] sm:rounded-[22px] shadow-xl space-y-2 sm:space-y-4"
                  onClick={() => navigate(`/courses/${c.id}`)}
                >
                  <div className="w-full h-24 sm:h-36 bg-slate-100 dark:bg-[#080918] relative rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 dark:border-[#1b1d3d]">
                    {c.thumbnail ? (
                      <img src={c.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-400/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-100 dark:via-[#080918] to-slate-100 dark:to-[#080918]">
                        <BookOpen size={28} className="opacity-40 sm:w-[40px] sm:h-[40px]" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[8px] sm:text-[10px] font-bold uppercase bg-[#594fe6] text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md tracking-wider max-w-[90%] truncate">
                      {badgeTag}
                    </span>
                  </div>

                  <div className="space-y-0.5 sm:space-y-1.5 flex-1">
                    <span className="text-[9px] sm:text-[11px] font-medium text-slate-500 dark:text-[#8e91b5] block">{subjectTag}</span>
                    <h3 className="font-extrabold text-xs sm:text-slate-500 dark:text-slate-400 text-base text-slate-900 dark:text-white font-[Outfit] leading-snug line-clamp-2">
                      {c.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-200 dark:border-[#1b1d3d]">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-50 dark:bg-[#1e2042] text-indigo-600 dark:text-indigo-300 text-[8.5px] sm:text-[10px] font-bold flex items-center justify-center border border-indigo-200 dark:border-[#2b2d5c] flex-shrink-0">
                        {teacherName.charAt(3) || 'A'}
                      </div>
                      <span className="text-[9.5px] sm:text-[11px] font-semibold text-slate-700 dark:text-[#c4c6e5] truncate max-w-[70px] sm:max-w-none">{teacherName}</span>
                    </div>

                    <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#3b35b6] hover:bg-[#4c44cf] text-white flex items-center justify-center shadow-md transition-colors flex-shrink-0">
                      <ArrowRight size={11} className="sm:w-[15px] sm:h-[15px]" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 5.1 Dynamic Individual Category Sections ────────────────────── */}
      {categorySections.map((catSection, idx) => (
        <section key={catSection.slug || `cat-sec-${catSection.id}-${idx}`} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6 pt-2 sm:pt-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="relative inline-block">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 blur-lg rounded-full pointer-events-none" />
                <h2 className="relative text-lg sm:text-[22px] font-extrabold bg-gradient-to-r from-indigo-700 to-fuchsia-700 dark:from-indigo-300 dark:to-fuchsia-300 bg-clip-text text-transparent font-[Outfit]">
                  {catSection.title} Courses
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#8e91b5]">
                {catSection.desc || `Top rated courses for ${catSection.title}`}
              </p>
            </div>
            <button
              onClick={() => navigate(catSection.id > 0 ? `/courses?education_type_id=${catSection.id}` : '/courses')}
              className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-[#c4c6e5] hover:text-indigo-600 dark:hover:text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-200 dark:border-[#24264d] bg-white dark:bg-[#0d0e26] flex items-center gap-1 sm:gap-1.5 cursor-pointer transition-colors shadow-sm dark:shadow-none"
            >
              View All <ArrowRight size={12} className="sm:w-[13px] sm:h-[13px]" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
            {catSection.courses.map((c: any) => {
              const badgeTag = c.program?.name || c.education_type?.name || catSection.title
              const subjectTag = c.subject?.name || 'Academic Course'
              const teacherName = c.teacher?.name || 'By Arjun Kumar'

              return (
                <div
                  key={c.id}
                  className="p-2.5 sm:p-4 border border-indigo-50/80 dark:border-[#1f2147] bg-gradient-to-br from-white to-slate-50 dark:from-[#0c0e25] dark:to-[#080918] flex flex-col justify-between hover:border-indigo-400/50 hover:shadow-[0_12px_35px_rgba(99,102,241,0.12)] transition-all duration-300 cursor-pointer group text-left rounded-[14px] sm:rounded-[22px] shadow-xl space-y-2 sm:space-y-4"
                  onClick={() => navigate(`/courses/${c.id}`)}
                >
                  <div className="w-full h-24 sm:h-36 bg-slate-100 dark:bg-[#080918] relative rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 dark:border-[#1b1d3d]">
                    {c.thumbnail ? (
                      <img src={c.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-400/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-100 dark:via-[#080918] to-slate-100 dark:to-[#080918]">
                        <BookOpen size={28} className="opacity-40 sm:w-[40px] sm:h-[40px]" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[8px] sm:text-[10px] font-bold uppercase bg-[#594fe6] text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md tracking-wider max-w-[90%] truncate">
                      {badgeTag}
                    </span>
                  </div>

                  <div className="space-y-0.5 sm:space-y-1.5 flex-1">
                    <span className="text-[9px] sm:text-[11px] font-medium text-slate-500 dark:text-[#8e91b5] block">{subjectTag}</span>
                    <h3 className="font-extrabold text-xs sm:text-slate-500 dark:text-slate-400 text-base text-slate-900 dark:text-white font-[Outfit] leading-snug line-clamp-2">
                      {c.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-200 dark:border-[#1b1d3d]">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-50 dark:bg-[#1e2042] text-indigo-600 dark:text-indigo-300 text-[8.5px] sm:text-[10px] font-bold flex items-center justify-center border border-indigo-200 dark:border-[#2b2d5c] flex-shrink-0">
                        {teacherName.charAt(3) || 'A'}
                      </div>
                      <span className="text-[9.5px] sm:text-[11px] font-semibold text-slate-700 dark:text-[#c4c6e5] truncate max-w-[70px] sm:max-w-none">{teacherName}</span>
                    </div>

                    <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#3b35b6] hover:bg-[#4c44cf] text-white flex items-center justify-center shadow-md transition-colors flex-shrink-0">
                      <ArrowRight size={11} className="sm:w-[15px] sm:h-[15px]" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {/* ── 6. What Our Students Say ────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6 pt-2 sm:pt-4">
        <div className="flex items-center justify-between">
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 blur-lg rounded-full pointer-events-none" />
            <h2 className="relative text-lg sm:text-[22px] font-extrabold bg-gradient-to-r from-indigo-700 to-fuchsia-700 dark:from-indigo-300 dark:to-fuchsia-300 bg-clip-text text-transparent font-[Outfit]">What Our Students Say</h2>
          </div>
          <button
            onClick={() => navigate('/testimonials')}
            className="text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-[#818cf8] hover:underline flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            View All <ArrowRight size={12} className="sm:w-[13px] sm:h-[13px]" />
          </button>
        </div>

        <div
          ref={testimonialScrollRef}
          onMouseEnter={() => setIsTestimonialPaused(true)}
          onMouseLeave={() => setIsTestimonialPaused(false)}
          onTouchStart={() => setIsTestimonialPaused(true)}
          onTouchEnd={() => setIsTestimonialPaused(false)}
          className="flex flex-nowrap overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-3.5 sm:gap-5 py-2 scroll-smooth"
        >
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 border border-indigo-50/50 dark:border-[#1b1c3d] bg-gradient-to-br from-indigo-50/30 to-fuchsia-50/30 dark:from-indigo-950/10 dark:to-fuchsia-950/5 space-y-3.5 sm:space-y-4 rounded-[18px] sm:rounded-[22px] text-left flex flex-col justify-between shadow-xl min-w-[260px] sm:min-w-[320px] max-w-[320px] flex-shrink-0 hover:border-indigo-500/30 hover:shadow-[0_10px_30px_rgba(99,102,241,0.12)] transition-all duration-300"
            >
              <p className="text-xs text-slate-600 dark:text-[#9396b8] italic leading-relaxed font-serif line-clamp-3">
                "{t.quote}"
              </p>

              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-[#1b1d3d]">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar || `/images/default-avatar.svg`}
                    alt={t.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = `/images/default-avatar.svg`
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 dark:border-[#2b2d5c] shadow-sm flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white font-[Outfit] leading-tight truncate">{t.name}</h5>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5] font-medium mt-0.5 truncate">{t.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[#22c55e]">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={12} fill="currentColor" className="sm:w-[13px] sm:h-[13px]" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. CTA Banner ────────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-2 sm:-mt-4">
        <div className="bg-gradient-to-r from-[#4f3ee8] via-[#5c4be9] to-[#725cf5] rounded-[16px] sm:rounded-[20px] py-3 sm:py-4 px-4 sm:px-6 shadow-xl flex flex-row items-center justify-between gap-3 sm:gap-6 relative overflow-hidden border border-[#6b58f8]/30">
          
          <div className="space-y-1 text-left relative z-10 max-w-xl min-w-0">
            <h2 className="text-xs sm:text-xl md:text-2xl font-extrabold text-white font-[Outfit] leading-tight truncate sm:whitespace-normal">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-[9.5px] sm:text-xs text-white/80 font-medium pt-0.5 line-clamp-1 sm:line-clamp-none">
              Join thousands of students and unlock your potential today.
            </p>

            <div className="pt-1.5 sm:pt-3">
              <Button
                variant="secondary"
                size="md"
                className="rounded-full bg-white dark:bg-[#0c0d24] hover:bg-slate-100 text-[#4f3ee8] font-extrabold text-[9.5px] sm:text-xs px-3.5 sm:px-6 py-1.5 sm:py-2.5 border-0 shadow-lg flex items-center gap-1 sm:gap-1.5 cursor-pointer inline-flex whitespace-nowrap"
                onClick={() => navigate('/login')}
              >
                Get Started Now <ArrowRight size={11} className="sm:w-[13px] sm:h-[13px]" />
              </Button>
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
            <div className="relative w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-300/20 rounded-full blur-md sm:blur-lg pointer-events-none" />
              <GraduationCap className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]" />
            </div>
          </div>

        </div>
      </section>

      {/* Video Modal */}
      <Modal
        open={!!previewVideoUrl}
        onClose={() => setPreviewVideoUrl(null)}
        size="xl"
        className="!max-w-4xl !bg-black !border-slate-800 shadow-2xl"
      >
        <div className="-m-6 relative w-full aspect-video overflow-hidden">
          <button
            onClick={() => setPreviewVideoUrl(null)}
            className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors z-10 cursor-pointer"
          >
            <X size={20} />
          </button>
          <PremiumVideoPlayer 
            videoUrl={previewVideoUrl || ''} 
            title="Platform Demo Video" 
          />
        </div>
      </Modal>
    </div>
  )
}
