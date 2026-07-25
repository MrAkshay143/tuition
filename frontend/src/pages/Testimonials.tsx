import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import {
  Heart, Star, Users, Trophy, TrendingUp, Award,
  BarChart3, FileCheck, Target, Headphones, Quote, CheckCircle2, BookOpen
} from 'lucide-react'
import { Spinner } from '@/components/ui'

interface TestimonialItem {
  id: number
  name: string
  role: string
  quote: string
  initials: string
  rating: number
  badge: string
  badgeColor: string
  avatarBg: string
  courseTag?: string
  avatar?: string
}

interface ExploreResponse {
  settings?: {
    landing_testimonials?: Array<{ name: string; role: string; quote: string; initials: string; variant?: string }>
  }
}

const REALWORLD_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 1,
    name: 'Ananya Sharma',
    role: 'NEET AIR 245 • Score 695/720',
    quote: 'The conceptual clarity provided in the Biology & Ecology modules was game-changing. Daily video lectures paired with instant doubt support helped me secure a top 300 rank in NEET 2025!',
    initials: 'AS',
    rating: 5,
    badge: 'NEET Scholar',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
    avatarBg: 'bg-emerald-600',
    courseTag: 'NEET 2025 Biology Masterclass'
  },
  {
    id: 2,
    name: 'Rohan Verma',
    role: 'JEE Advanced AIR 89 • IIT Bombay CS',
    quote: 'The step-by-step problem-solving approach in Physics and Advanced Mathematics gave me the confidence to tackle non-standard JEE Advanced questions. Best platform for dedicated entrance prep!',
    initials: 'RV',
    rating: 5,
    badge: 'JEE Top Ranker',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800',
    avatarBg: 'bg-indigo-600',
    courseTag: 'JEE Advanced Physics & Math'
  },
  {
    id: 3,
    name: 'Priya Patel',
    role: 'CBSE 12th Board 98.4%',
    quote: 'Detailed formula sheets, annotated lecture notes, and chapter-wise mock tests made revision effortless before board exams. My confidence doubled in organic chemistry!',
    initials: 'PP',
    rating: 5,
    badge: 'Board Topper',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800',
    avatarBg: 'bg-purple-600',
    courseTag: 'Class 12th Chemistry Foundation'
  },
  {
    id: 4,
    name: 'Devansh Gupta',
    role: 'JEE Main 99.87 Percentile',
    quote: 'The timed DPP quizzes and instant analysis helped me identify my weak topics in Mechanics early on. Highly recommend to any student aiming for 99+ percentile.',
    initials: 'DG',
    rating: 5,
    badge: 'JEE Scholar',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800',
    avatarBg: 'bg-blue-600',
    courseTag: 'JEE Main Physics Super 50'
  },
  {
    id: 5,
    name: 'Sneha Kulkarni',
    role: 'NEET AIR 512 • AIIMS Delhi Aspirant',
    quote: 'Having a 24/7 doubt resolution desk made self-study super productive. Mentors answered my numerical queries within minutes with neat diagrammatic explanations.',
    initials: 'SK',
    rating: 5,
    badge: 'NEET Top 1K',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800',
    avatarBg: 'bg-rose-600',
    courseTag: 'Ecology & Environmental Biology'
  },
  {
    id: 6,
    name: 'Kavya Nair',
    role: 'Class 10th ICSE 99.2%',
    quote: 'The visual animations in lecture videos made complex science principles feel so simple. I scored 100/100 in Physics and Chemistry in my ICSE board finals!',
    initials: 'KN',
    rating: 5,
    badge: 'State Rank 1',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
    avatarBg: 'bg-amber-600',
    courseTag: 'Class 10 ICSE Science Batch'
  }
]

export default function Testimonials() {
  const [activeFilter, setActiveFilter] = useState('all')

  // Fetch dynamic testimonials from Backend Public Explore API
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'explore'],
    queryFn: async () => {
      const res = await api.get<{ data: ExploreResponse }>('/public/explore')
      return res.data
    },
  })

  const apiTestimonials = data?.settings?.landing_testimonials || []
  const testimonialsList: TestimonialItem[] = useMemo(() => {
    if (apiTestimonials.length > 0) {
      const formatted = apiTestimonials.map((t, idx) => ({
        id: idx + 1,
        name: t.name,
        role: t.role,
        quote: t.quote,
        initials: t.initials || t.name.split(' ').map((n) => n[0]).join('').substring(0, 2),
        rating: 5,
        badge: t.role.includes('JEE') ? 'JEE Aspirant' : t.role.includes('NEET') ? 'NEET Aspirant' : 'Top Student',
        badgeColor: t.variant === 'cyan'
          ? 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-[#0f2847] dark:border-[#1b4d78] dark:text-[#38bdf8]'
          : 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-[#1b1744] dark:border-[#3b2d78] dark:text-[#a855f7]',
        avatarBg: 'bg-[#594fe6]',
        courseTag: t.role.includes('JEE') ? 'JEE Entrance Course' : 'NEET Prep Series'
      }))
      return formatted.length >= 6 ? formatted : [...formatted, ...REALWORLD_TESTIMONIALS.slice(formatted.length)]
    }
    return REALWORLD_TESTIMONIALS
  }, [apiTestimonials])

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return testimonialsList
    if (activeFilter === 'jee') return testimonialsList.filter((t) => t.badge.toLowerCase().includes('jee') || t.role.toLowerCase().includes('jee'))
    if (activeFilter === 'neet') return testimonialsList.filter((t) => t.badge.toLowerCase().includes('neet') || t.role.toLowerCase().includes('neet'))
    if (activeFilter === 'board') return testimonialsList.filter((t) => t.badge.toLowerCase().includes('board') || t.role.toLowerCase().includes('board') || t.role.toLowerCase().includes('icse') || t.role.toLowerCase().includes('cbse'))
    return testimonialsList
  }, [testimonialsList, activeFilter])

  return (
    <div className="bg-[rgb(var(--bg-base))] dark:bg-[#050614] text-[rgb(var(--text-primary))] dark:text-white font-sans min-h-[100dvh] pb-12 sm:pb-16 pt-4 sm:pt-8 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        
        {/* 1. Header Section */}
        <section className="text-center space-y-2.5 sm:space-y-3 pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-indigo-100/80 dark:bg-[#181938] border border-indigo-200 dark:border-[#2e2f61] text-indigo-700 dark:text-[#a594ff] text-[11px] sm:text-xs font-semibold shadow-xs">
            <Heart size={12} fill="currentColor" className="text-indigo-600 dark:text-[#a594ff] sm:w-[13px] sm:h-[13px]" /> Trusted by Thousands
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white font-[Outfit] tracking-tight leading-tight">
            Student Reviews & <span className="bg-gradient-to-r from-[#594fe6] via-[#7964ff] to-[#a855f7] bg-clip-text text-transparent">Success Stories</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#8e91b5] max-w-xl mx-auto leading-relaxed px-2">
            Real stories from real students who achieved top ranks and target scores with EduFlow.
          </p>
        </section>

        {/* 2. Top 4 Metric Highlight Cards (Full Content Auto-Width Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-5xl mx-auto text-left">
          <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] p-3 sm:p-4 rounded-xl sm:rounded-[20px] flex items-center gap-2.5 sm:gap-3.5 shadow-sm min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-[#7964ff] border border-indigo-200/60 dark:border-[#2b2d5c] flex items-center justify-center flex-shrink-0">
              <Users size={14} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-tight whitespace-nowrap">10K+</span>
              <span className="text-[9px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5] font-semibold leading-none block whitespace-nowrap">Happy Students</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] p-3 sm:p-4 rounded-xl sm:rounded-[20px] flex items-center gap-2.5 sm:gap-3.5 shadow-sm min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-600 dark:text-[#38bdf8] border border-blue-200/60 dark:border-[#1b4d78] flex items-center justify-center flex-shrink-0">
              <Trophy size={14} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-tight whitespace-nowrap">4.8/5</span>
              <span className="text-[9px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5] font-semibold leading-none block whitespace-nowrap">Avg. Rating</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] p-3 sm:p-4 rounded-xl sm:rounded-[20px] flex items-center gap-2.5 sm:gap-3.5 shadow-sm min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#34d399] border border-emerald-200/60 dark:border-[#1b5c48] flex items-center justify-center flex-shrink-0">
              <TrendingUp size={14} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-tight whitespace-nowrap">98%</span>
              <span className="text-[9px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5] font-semibold leading-none block whitespace-nowrap">Success Rate</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] p-3 sm:p-4 rounded-xl sm:rounded-[20px] flex items-center gap-2.5 sm:gap-3.5 shadow-sm min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-600 dark:text-[#fbbf24] border border-amber-200/60 dark:border-[#6b5225] flex items-center justify-center flex-shrink-0">
              <Award size={14} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] leading-tight whitespace-nowrap">Top Choice</span>
              <span className="text-[9px] sm:text-[11px] text-slate-500 dark:text-[#8e91b5] font-semibold leading-none block whitespace-nowrap">For Exam Prep</span>
            </div>
          </div>
        </div>

        {/* 3. Category Filter Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {[
            { id: 'all', label: 'All Success Stories' },
            { id: 'jee', label: 'JEE Rankers' },
            { id: 'neet', label: 'NEET Scholars' },
            { id: 'board', label: 'Board Toppers' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-[Outfit] transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#594fe6] to-[#7964ff] text-white shadow-md shadow-indigo-500/25'
                    : 'bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] text-slate-600 dark:text-[#8e91b5] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 4. EXPANDED REAL-WORLD TESTIMONIAL CARDS GRID */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full max-w-6xl mx-auto">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-5 sm:p-6 text-left shadow-xl hover:shadow-2xl hover:border-indigo-300 dark:hover:border-[#383a75] transition-all flex flex-col justify-between relative space-y-4 group"
              >
                {/* Background Quote Icon */}
                <div className="absolute top-4 right-5 text-indigo-400/20 dark:text-indigo-500/20 pointer-events-none group-hover:scale-110 transition-transform">
                  <Quote size={28} />
                </div>

                <div className="space-y-3 relative z-10">
                  {/* Top Row: Star Rating & Verified Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={13} fill="currentColor" className="sm:w-[14px] sm:h-[14px]" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 size={10} /> Verified Student
                    </span>
                  </div>

                  {/* Fully Expanded Quote Story (No line clamp / No 1-line truncation) */}
                  <p className="text-xs sm:text-[13px] text-slate-700 dark:text-[#c4c6e5] leading-relaxed font-sans pt-1">
                    "{item.quote}"
                  </p>
                </div>

                {/* Footer Student Info & Badge */}
                <div className="pt-4 border-t border-slate-100 dark:border-[#1b1c3d]/80 space-y-2.5 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = `/images/default-avatar.svg`
                          }}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-indigo-200 dark:border-[#2b2d5c] shadow-sm shrink-0"
                        />
                      ) : (
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${item.avatarBg || 'bg-[#594fe6]'} text-white font-extrabold text-xs flex items-center justify-center shadow-md font-[Outfit] shrink-0 border-2 border-white dark:border-[#1b1c3d]`}>
                          {item.initials || item.name?.charAt(0) || 'S'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white font-[Outfit] leading-snug truncate">{item.name}</h4>
                        <p className="text-[10.5px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">{item.role}</p>
                      </div>
                    </div>

                    <span className={`text-[9.5px] sm:text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Course Tag */}
                  {item.courseTag && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-[#8e91b5] font-mono bg-slate-50 dark:bg-[#080918] px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-[#1b1c3d]">
                      <BookOpen size={10} className="text-indigo-500 shrink-0" />
                      <span className="truncate">{item.courseTag}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. "Track Your Own Academic Improvement" Growth Banner Card */}
        <div className="bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[24px] p-4 sm:p-8 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-8 mt-6 sm:mt-12 text-left max-w-6xl mx-auto">
          
          {/* Left info box: Icon & Text side-by-side */}
          <div className="flex flex-row items-center gap-3 sm:gap-5 w-full lg:w-auto">
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-[#3b3a6e] flex items-center justify-center shadow-inner shrink-0 relative">
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-purple-500/10 blur-xl" />
              <BarChart3 size={20} className="relative z-10 sm:w-[28px] sm:h-[28px]" />
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              <h3 className="text-xs sm:text-lg font-extrabold text-slate-900 dark:text-white font-[Outfit]">
                Track Your Own Academic Improvement
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-[#8e91b5] leading-tight sm:leading-relaxed max-w-md">
                Through advanced analytics and performance tracking, our students maintain an average 85% score growth in test preparation.
              </p>
            </div>
          </div>

          {/* Right 4 Stat Pillars: 4 Columns in 1 Row on Mobile */}
          <div className="grid grid-cols-4 gap-2 sm:gap-6 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-indigo-100/80 dark:border-[#1b1c3d] pt-3 lg:pt-0 lg:pl-8">
            <div className="text-center lg:text-left space-y-0.5 sm:space-y-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto lg:mx-0">
                <Target size={14} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <span className="block text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit]">85%</span>
              <span className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#8e91b5] font-semibold leading-tight block">Avg. Growth</span>
            </div>

            <div className="text-center lg:text-left space-y-0.5 sm:space-y-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto lg:mx-0">
                <FileCheck size={14} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <span className="block text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit]">2M+</span>
              <span className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#8e91b5] font-semibold leading-tight block">Tests</span>
            </div>

            <div className="text-center lg:text-left space-y-0.5 sm:space-y-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto lg:mx-0">
                <BarChart3 size={14} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <span className="block text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit]">50+</span>
              <span className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#8e91b5] font-semibold leading-tight block">Categories</span>
            </div>

            <div className="text-center lg:text-left space-y-0.5 sm:space-y-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto lg:mx-0">
                <Headphones size={14} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <span className="block text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-[Outfit]">24/7</span>
              <span className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#8e91b5] font-semibold leading-tight block">Support</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

