import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  User, Play, Users, Trophy, Target, ShieldCheck, 
  CheckCircle2, ArrowRight, Video, Award 
} from 'lucide-react'
import { Card, Button, PremiumVideoPlayer } from '@/components/ui'
import { Modal } from '@/components/ui/overlays'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import teacherAvatar from '@/assets/teacher_avatar.png'

interface AboutData {
  teacher?: {
    name: string
    role: string
    bio: string
    avatar_url?: string
    stats: Array<{ value: string; label: string; icon?: string }>
  }
  vision?: string
  mission?: string
  timeline?: Array<{ period: string; title: string; desc: string; active?: boolean }>
  approach?: { 
    title: string
    subtitle: string
    video_url?: string
  }
}

const FALLBACK_ABOUT: AboutData = {
  teacher: {
    name: 'Arjun Kumar',
    role: 'Lead Physics & Science Educator',
    bio: 'I believe that learning science should not be about memorization. It is about visualization and understanding. Over the last 8+ years, I have coached thousands of high-schoolers in offline batches, transitioning to a dedicated private online model to provide interactive personal support.',
    stats: [
      { value: '8+', label: 'Years Experience', icon: 'User' },
      { value: '150+', label: 'Offline Batches', icon: 'Video' },
      { value: '10K+', label: 'Students Mentored', icon: 'Users' },
      { value: '95%', label: 'Successful Selections', icon: 'Trophy' }
    ]
  },
  vision: 'To make top-tier conceptual science coaching accessible directly to private student batches, removing distracting marketplace platforms and focusing purely on progress metrics.',
  mission: 'Guiding students systematically with structured daily video modules, downloadable PDF worksheets, doubts desk chat, and auto-graded mock examinations.',
  timeline: [
    {
      period: '2022 - Present',
      title: 'EduFlow Platform',
      desc: 'Launched a private online portal serving target groups in NEET and JEE preparation, connecting students with structured dashboards.',
      active: true
    },
    {
      period: '2018 - 2022',
      title: 'Senior Faculty - Coaching Institute',
      desc: 'Led the Physics division for national-level medical preparation coaching, guiding batches of 150+ students offline.',
      active: false
    }
  ],
  approach: {
    title: 'Our Teaching Approach',
    subtitle: 'Conceptual • Visual • Interactive',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  }
}

export default function About() {
  const [videoModalOpen, setVideoModalOpen] = useState(false)

  const { data: exploreData } = useQuery({
    queryKey: ['public', 'explore'],
    queryFn: async () => {
      const res = await api.get('/public/explore') as any
      return res.data?.settings?.landing_about_config || res.settings?.landing_about_config
    }
  })

  const about: AboutData = exploreData && exploreData.teacher ? exploreData : FALLBACK_ABOUT
  const teacher = about.teacher || FALLBACK_ABOUT.teacher!
  const timeline = about.timeline || FALLBACK_ABOUT.timeline!
  const approach = about.approach || FALLBACK_ABOUT.approach!

  return (
    <div className="min-h-[100dvh] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] transition-colors duration-300 pb-16">
      
      {/* ── HERO HEADER SECTION ────────────────────────────────────────── */}
      <section 
        className="relative overflow-hidden py-8 sm:py-10 text-center border-b border-indigo-200/80 dark:border-[#1E234D]/50 bg-gradient-to-br from-indigo-100/90 via-purple-100/60 to-pink-100/80 dark:from-[#07091B] dark:via-[#0F1235] dark:to-[#0A0C27] text-slate-900 dark:text-white"
      >
        {/* Soft Ambient Center Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[240px] bg-gradient-to-r from-indigo-500/20 via-purple-500/25 to-pink-500/20 rounded-full blur-[90px] pointer-events-none" />
        
        {/* Left Curved Glow Arc */}
        <div className="absolute -left-12 -bottom-16 w-80 h-80 rounded-full border-t border-r border-purple-500/30 blur-[2px] pointer-events-none" />

        {/* Left Dot Matrix Pattern */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden md:grid grid-cols-1 md:grid-cols-6 gap-2 opacity-15 pointer-events-none">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-purple-400" />
          ))}
        </div>

        {/* Right Dot Matrix Pattern */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:grid grid-cols-1 md:grid-cols-6 gap-2 opacity-15 pointer-events-none">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-purple-400" />
          ))}
        </div>

        {/* Right 3D Line-Art Book & Fountain Pen Graphic */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden lg:block opacity-35 pointer-events-none">
          <svg width="220" height="140" viewBox="0 0 220 140" fill="none" stroke="currentColor" className="text-purple-500 dark:text-purple-400">
            <path d="M20,110 Q60,85 110,100 Q160,85 200,110 L200,122 Q160,95 110,110 Q60,95 20,122 Z" strokeWidth="1.5" />
            <path d="M20,122 Q60,95 110,110 Q160,95 200,122" strokeWidth="1.5" />
            <line x1="110" y1="30" x2="110" y2="110" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M175,20 L195,2 L205,12 L185,30 Z" strokeWidth="1.5" />
            <path d="M195,2 L210,17" strokeWidth="1.5" />
            <line x1="185" y1="30" x2="178" y2="37" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="max-w-3xl mx-auto px-4 relative z-10 space-y-2.5">
          {/* Centered OUR STORY Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-100/80 dark:bg-[#382E78]/70 border border-indigo-200 dark:border-[#5044A3]/50 text-indigo-700 dark:text-[#A5B4FC] text-[10px] font-bold uppercase font-mono tracking-wider shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-pulse" />
            <span>OUR STORY</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-extrabold font-[Outfit] tracking-tight text-slate-900 dark:text-white leading-tight">
            About Our <span className="text-[#6366f1] dark:text-[#A78BFA]">Classroom</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-[#94A3B8] max-w-lg mx-auto font-[Inter] leading-relaxed">
            Learn directly from {teacher.name}. Providing structured coaching for JEE, NEET, and board exams.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* ── TEACHER PROFILE SHOWCASE ──────────────────────────────── */}
        <Card className="p-6 sm:p-8 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left Avatar with Glowing Border */}
          <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-purple-600 shadow-2xl shadow-purple-900/60 overflow-hidden relative flex-shrink-0 bg-gradient-to-br from-purple-600/30 to-indigo-900/40">
            <img 
              src={teacher.avatar_url || teacherAvatar} 
              alt={teacher.name} 
              className="w-full h-full object-cover scale-110" 
            />
          </div>

          {/* Center Details */}
          <div className="space-y-2.5 flex-1 min-w-0 text-slate-500 dark:text-slate-400 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[rgb(var(--text-primary))] font-[Outfit]">
                {teacher.name}
              </h2>
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                ✓
              </div>
            </div>

            <p className="text-xs font-bold text-indigo-400 font-mono tracking-wide">
              {teacher.role}
            </p>

            <p className="text-xs sm:text-[13px] text-[rgb(var(--text-secondary))] leading-relaxed font-[Inter] pt-1">
              {teacher.bio}
            </p>
          </div>

          {/* Right 4 KPI Stats Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3.5 w-full md:w-auto md:flex-1 pt-4 md:pt-0 border-t md:border-t-0 border-l-0 md:border-l border-[rgb(var(--border))] md:pl-6">
            
            {/* Stat 1 */}
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] space-y-1 sm:space-y-1.5 flex flex-col justify-center text-left min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <User size={14} className="sm:w-[16px] sm:h-[16px]" />
                </div>
                <span className="text-sm sm:text-lg font-black font-[Outfit] text-[rgb(var(--text-primary))]">8+</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-[rgb(var(--text-muted))] font-semibold leading-tight">Years Experience</p>
            </div>

            {/* Stat 2 */}
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] space-y-1 sm:space-y-1.5 flex flex-col justify-center text-left min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Video size={14} className="sm:w-[16px] sm:h-[16px]" />
                </div>
                <span className="text-sm sm:text-lg font-black font-[Outfit] text-[rgb(var(--text-primary))]">150+</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-[rgb(var(--text-muted))] font-semibold leading-tight">Offline Batches</p>
            </div>

            {/* Stat 3 */}
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] space-y-1 sm:space-y-1.5 flex flex-col justify-center text-left min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Users size={14} className="sm:w-[16px] sm:h-[16px]" />
                </div>
                <span className="text-sm sm:text-lg font-black font-[Outfit] text-[rgb(var(--text-primary))]">10K+</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-[rgb(var(--text-muted))] font-semibold leading-tight">Students Mentored</p>
            </div>

            {/* Stat 4 */}
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] space-y-1 sm:space-y-1.5 flex flex-col justify-center text-left min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy size={14} className="sm:w-[16px] sm:h-[16px]" />
                </div>
                <span className="text-sm sm:text-lg font-black font-[Outfit] text-[rgb(var(--text-primary))]">95%</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-[rgb(var(--text-muted))] font-semibold leading-tight">Selections</p>
            </div>

          </div>

        </Card>

        {/* ── VISION & MISSION FEATURE CARDS ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Vision Card */}
          <Card className="p-6 sm:p-7 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-3.5 relative overflow-hidden flex flex-col justify-between hover:border-purple-500/40 hover:shadow-xl transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Target size={22} />
              </div>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">
                Our Vision
              </h3>
              <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed font-[Inter]">
                {about.vision}
              </p>
            </div>
            <div className="w-9 h-1 rounded-full bg-purple-500 mt-4" />
          </Card>

          {/* Mission Card */}
          <Card className="p-6 sm:p-7 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-3.5 relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-xl transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">
                Our Mission
              </h3>
              <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed font-[Inter]">
                {about.mission}
              </p>
            </div>
            <div className="w-9 h-1 rounded-full bg-emerald-500 mt-4" />
          </Card>

        </div>

        {/* ── TEACHING TIMELINE & INLINE IN-CONTENT VIDEO PLAYER ─────────────── */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[rgb(var(--text-primary))] font-[Outfit]">
              Teaching Timeline & Methodology
            </h3>
            <Link to="/courses" className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Explore Courses <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Vertical Timeline List */}
            <div className="lg:col-span-6 space-y-7 relative border-l-2 border-slate-200 dark:border-[#1E234D] ml-4 pl-6 pt-1">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative space-y-1.5">
                  {/* Timeline Dot Indicator */}
                  <span className={cn(
                    "w-4 h-4 rounded-full border-4 border-[rgb(var(--bg-surface))] absolute -left-[33px] top-1 transition-all",
                    item.active ? "bg-[#6366F1] shadow-md shadow-indigo-500/50" : "bg-slate-200 dark:bg-[#333966]"
                  )} />
                  
                  {/* Milestone Year Badge */}
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border inline-block",
                    item.active 
                      ? "bg-indigo-50 dark:bg-[#382E78]/80 text-indigo-600 dark:text-[#A5B4FC] border-[#5044A3]/50" 
                      : "bg-slate-100 dark:bg-[#1E234D]/80 text-slate-500 dark:text-[#94A3B8] border-[#2A3166]/50"
                  )}>
                    {item.period}
                  </span>

                  {/* Organization & Position Title */}
                  <h4 className="font-extrabold text-sm sm:text-base text-[rgb(var(--text-primary))] font-[Outfit]">
                    {item.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-[rgb(var(--text-secondary))] font-[Inter] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Right Side Card: INLINE EMBEDDED VIDEO PLAYER (NO POPUP MODAL) */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <Card className="w-full p-4 sm:p-5 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] shadow-xl relative overflow-hidden flex flex-col justify-between text-left space-y-3.5">
                
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-[#1f2048] border border-indigo-200 dark:border-[#383a75] text-indigo-600 dark:text-[#a5b4fc] text-[10px] font-bold font-mono uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Interactive Teaching Walkthrough
                  </div>
                  <h4 className="font-extrabold text-base text-[rgb(var(--text-primary))] font-[Outfit]">
                    {about.approach?.title || 'Our Teaching Approach'}
                  </h4>
                  <p className="text-xs text-[rgb(var(--text-secondary))] font-[Inter]">
                    {about.approach?.subtitle || 'Conceptual • Visual • Interactive'}
                  </p>
                </div>

                {/* Direct Inline Video Player inside the card */}
                <div className="w-full rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-[#2a2c5a] shadow-inner aspect-video">
                  <PremiumVideoPlayer
                    videoUrl={approach.video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
                    title={approach.title || 'Classroom Teaching Methodology'}
                    watermarkText="EduFlow AI • Arjun Kumar"
                    autoPlay={false}
                  />
                </div>

              </Card>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
