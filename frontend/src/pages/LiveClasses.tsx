import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Tv, Users, Calendar, ArrowRight, Search, ChevronDown, 
  BookOpen, Activity, Compass, Calculator, ClipboardList, 
  UserCheck
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'

interface Batch {
  id: number
  name: string
  description: string | null
  color?: string
  category?: string
}

const SAMPLE_BATCHES: Batch[] = [
  { id: 1, name: 'Class 10 - Science (Updated)', description: 'Class 10 Science batch', color: '#8B5CF6', category: 'Foundation' },
  { id: 2, name: 'NEET 2026', description: 'Medical entrance preparation', color: '#10B981', category: 'Medical' },
  { id: 3, name: 'JEE Advanced 2026', description: 'Engineering entrance preparation', color: '#F59E0B', category: 'Engineering' },
  { id: 4, name: 'Class 12 - Commerce', description: 'Class 12 Commerce batch', color: '#EF4444', category: 'Commerce' },
  { id: 5, name: 'Audit Test Batch 1784681791', description: 'Test batch description', color: '#6366F1', category: 'Testing' },
  { id: 6, name: 'Audit Test Batch 1784681802', description: 'Test batch description', color: '#6366F1', category: 'Testing' },
  { id: 7, name: 'Audit Test Batch 1784681826', description: 'Test batch description', color: '#6366F1', category: 'Testing' },
  { id: 8, name: 'Audit Test Batch 1784681857', description: 'Test batch description', color: '#6366F1', category: 'Testing' },
  { id: 9, name: 'Class 10 - Science', description: 'Class 10 Science batch', color: '#8B5CF6', category: 'Foundation' },
]

/* ── REAL LIVE WORKING ANALOG WATCH & 3D CALENDAR COMPONENT ── */
function Working3DCalendarClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = now.getHours()
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()

  const hourDeg = (hours % 12 + minutes / 60) * 30
  const minuteDeg = (minutes + seconds / 60) * 6
  const secondDeg = seconds * 6

  return (
    <div className="relative w-48 h-36 sm:w-56 sm:h-40 transform scale-[0.55] min-[400px]:scale-[0.65] sm:scale-[0.82] lg:scale-90 origin-right shrink-0">
      {/* 3D Adaptive Theme Calendar Card Container */}
      <div 
        className="w-full h-full rounded-2xl bg-gradient-to-br from-white via-indigo-50/90 to-purple-100/80 dark:from-[#2B2363] dark:via-[#1B1647] dark:to-[#141038] border border-indigo-200/90 dark:border-[#483B9B]/60 p-4 shadow-xl shadow-indigo-500/10 dark:shadow-2xl relative overflow-hidden flex flex-col justify-between"
        style={{ perspective: '1000px', transform: 'rotateY(-6deg) rotateX(3deg)' }}
      >
        {/* Binder Rings */}
        <div className="flex justify-around px-4 -mt-2">
          <div className="w-2.5 h-4.5 rounded-full bg-indigo-400 dark:bg-[#5D4EB4] border border-indigo-300 dark:border-[#7B6BD8] shadow-xs" />
          <div className="w-2.5 h-4.5 rounded-full bg-indigo-400 dark:bg-[#5D4EB4] border border-indigo-300 dark:border-[#7B6BD8] shadow-xs" />
          <div className="w-2.5 h-4.5 rounded-full bg-indigo-400 dark:bg-[#5D4EB4] border border-indigo-300 dark:border-[#7B6BD8] shadow-xs" />
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 my-auto pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cell) => {
            const isTodayCell = cell === ((now.getDate() % 12) || 1)
            return (
              <div 
                key={cell}
                className={cn(
                  "h-5 rounded-md transition-all",
                  isTodayCell || cell === 2 || cell === 7
                    ? "bg-gradient-to-r from-[#594fe6] to-[#7964ff] text-white opacity-100 shadow-md shadow-indigo-500/40"
                    : "bg-indigo-100/70 border border-indigo-200/60 dark:bg-[#3B3278]/50 dark:border-[#4A408F]/30"
                )}
              />
            )
          })}
        </div>
      </div>

      {/* Real Live Working Analog Watch Overlay */}
      <div className="absolute -bottom-3 -right-3 w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-indigo-100 via-purple-100 to-white dark:from-[#453797] dark:to-[#1C1649] border-2 border-indigo-300 dark:border-[#6D5AD8] shadow-2xl flex items-center justify-center p-0.5">
        <div className="w-full h-full rounded-full bg-white dark:bg-[#120E33] border border-indigo-200 dark:border-[#5243B5] relative flex items-center justify-center overflow-hidden shadow-inner">
          
          {/* Clock Ticks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <div
              key={deg}
              className="absolute w-0.5 h-1 bg-indigo-400/60 dark:bg-[#6D5AD8]/50"
              style={{
                transform: `rotate(${deg}deg) translateY(-26px)`
              }}
            />
          ))}

          {/* Hour Hand */}
          <div
            className="absolute w-1 h-4 bg-slate-800 dark:bg-[#C7D2FE] rounded-full origin-bottom shadow-sm transition-transform duration-300"
            style={{
              transform: `translateY(-100%) rotate(${hourDeg}deg)`,
              top: '50%',
              left: 'calc(50% - 2px)'
            }}
          />

          {/* Minute Hand */}
          <div
            className="absolute w-0.5 h-6 bg-slate-900 dark:bg-white rounded-full origin-bottom shadow-sm transition-transform duration-300"
            style={{
              transform: `translateY(-100%) rotate(${minuteDeg}deg)`,
              top: '50%',
              left: 'calc(50% - 1px)'
            }}
          />

          {/* Live Ticking Second Hand */}
          <div
            className="absolute w-0.5 h-7 bg-[#EC4899] rounded-full origin-bottom z-10 transition-transform duration-200"
            style={{
              transform: `translateY(-100%) rotate(${secondDeg}deg)`,
              top: '50%',
              left: 'calc(50% - 1px)'
            }}
          />

          {/* Center Pin */}
          <div className="w-2 h-2 rounded-full bg-[#EC4899] border border-white z-20 shadow-md" />
        </div>
      </div>
    </div>
  )
}

export default function LiveClasses() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const { data: remoteBatches = [], isLoading } = useQuery<Batch[]>({
    queryKey: ['public', 'live-batches-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/public/explore') as any
        const list = res.data?.batches ?? res.batches ?? []
        if (Array.isArray(list) && list.length > 0) return list
        
        const fallbackRes = await api.get('/batches') as any
        const bList = fallbackRes.data?.data ?? fallbackRes.data ?? fallbackRes ?? []
        return Array.isArray(bList) && bList.length > 0 ? bList : SAMPLE_BATCHES
      } catch {
        return SAMPLE_BATCHES
      }
    }
  })

  const batchList = remoteBatches.length > 0 ? remoteBatches : SAMPLE_BATCHES

  const filteredBatches = useMemo(() => {
    return batchList.filter((b) => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
                          (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
      const matchCategory = categoryFilter === 'all' || 
                            (b.category && b.category.toLowerCase() === categoryFilter.toLowerCase()) ||
                            b.name.toLowerCase().includes(categoryFilter.toLowerCase())
      return matchSearch && matchCategory
    })
  }, [batchList, search, categoryFilter])

  const getBatchIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('science') || lower.includes('10')) return <BookOpen size={18} />
    if (lower.includes('neet') || lower.includes('medical')) return <Activity size={18} />
    if (lower.includes('jee') || lower.includes('engineering')) return <Compass size={18} />
    if (lower.includes('commerce') || lower.includes('12')) return <Calculator size={18} />
    return <ClipboardList size={18} />
  }

  const getBatchAccentColor = (color?: string, idx: number = 0) => {
    if (color && color.startsWith('#')) return color
    const defaultColors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#6366F1', '#6366F1', '#6366F1', '#8B5CF6']
    return defaultColors[idx % defaultColors.length]
  }

  return (
    <div className="min-h-[100dvh] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] transition-colors duration-300">
      
      {/* ── HERO BANNER SECTION (COMPACT HEIGHT & REAL WORKING CLOCK) ───── */}
      <section 
        className="relative overflow-hidden py-4 sm:py-8 border-b border-indigo-200/80 dark:border-[#1E234D]/50 bg-gradient-to-br from-indigo-100/90 via-purple-100/60 to-pink-100/80 dark:from-[#090B21] dark:via-[#12153B] dark:to-[#0E102E] text-slate-900 dark:text-white"
      >
        {/* Soft Ambient Glow */}
        <div className="absolute top-1/2 right-24 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-500/20 via-purple-500/25 to-pink-500/20 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-12 gap-2 sm:gap-6 items-center">
            
            {/* Left Content Column */}
            <div className="col-span-7 md:col-span-7 space-y-1.5 sm:space-y-3.5 pr-1 sm:pr-0 text-left">
              {/* Live Cohort Schedules Pill */}
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 rounded-full bg-indigo-100/80 dark:bg-[#382E78]/70 border border-indigo-200 dark:border-[#5044A3]/50 text-indigo-700 dark:text-[#A5B4FC] text-[8px] min-[360px]:text-[9px] sm:text-[11px] font-semibold tracking-wide shadow-xs">
                <span className="truncate">Live Cohort Schedules</span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#EC4899] animate-pulse flex-shrink-0" />
              </div>

              {/* Title */}
              <h1 className="text-sm min-[360px]:text-base sm:text-4xl font-extrabold font-[Outfit] text-slate-900 dark:text-white tracking-tight leading-tight">
                Class Live Timings
              </h1>

              {/* Subtitle */}
              <p className="text-[9.5px] min-[360px]:text-[10.5px] sm:text-[13px] text-slate-600 dark:text-[#94A3B8] leading-tight sm:leading-relaxed max-w-lg font-[Inter]">
                <span className="sm:hidden">Access live interactive coaching sessions hosted by expert mentors.</span>
                <span className="hidden sm:inline">Access live interactive coaching sessions hosted directly by expert mentors. Join scheduled private student cohorts, clear your doubts in real-time, and accelerate your academic success.</span>
              </p>

              {/* 3 Compact Feature Pills */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-2.5 pt-0.5 sm:pt-1">
                <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-0.5 sm:py-1.5 rounded-md sm:rounded-xl bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 dark:bg-[#161A42]/60 dark:text-[#CBD5E1] dark:border-[#2E3360] text-[8px] min-[360px]:text-[9px] sm:text-xs font-medium backdrop-blur-md whitespace-nowrap shadow-xs">
                  <Tv size={10} className="text-indigo-600 dark:text-[#818CF8] sm:w-[13px] sm:h-[13px] flex-shrink-0" />
                  <span>Live<span className="hidden min-[380px]:inline"> Interactive</span> Sessions</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-0.5 sm:py-1.5 rounded-md sm:rounded-xl bg-blue-50/90 text-blue-700 border border-blue-200/80 dark:bg-[#161A42]/60 dark:text-[#CBD5E1] dark:border-[#2E3360] text-[8px] min-[360px]:text-[9px] sm:text-xs font-medium backdrop-blur-md whitespace-nowrap shadow-xs">
                  <UserCheck size={10} className="text-blue-600 dark:text-[#818CF8] sm:w-[13px] sm:h-[13px] flex-shrink-0" />
                  <span>Expert Faculty</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-0.5 sm:py-1.5 rounded-md sm:rounded-xl bg-purple-50/90 text-purple-700 border border-purple-200/80 dark:bg-[#161A42]/60 dark:text-[#CBD5E1] dark:border-[#2E3360] text-[8px] min-[360px]:text-[9px] sm:text-xs font-medium backdrop-blur-md whitespace-nowrap shadow-xs">
                  <Users size={10} className="text-purple-600 dark:text-[#818CF8] sm:w-[13px] sm:h-[13px] flex-shrink-0" />
                  <span>Limited Seats</span>
                </div>
              </div>
            </div>

            {/* Right 3D Calendar & LIVE WORKING ANALOG WATCH Graphic */}
            <div className="col-span-5 md:col-span-5 flex justify-end items-center overflow-visible">
              <Working3DCalendarClock />
            </div>

          </div>
        </div>
      </section>

      {/* ── ACTIVE COHORT BATCHES SECTION ────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        
        {/* Header Title & Right Single Line Search/Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <h2 className="text-lg sm:text-xl font-black font-[Outfit] text-slate-900 dark:text-white">
              Active Cohort Batches
            </h2>
            <span className="w-6 h-6 rounded-full bg-[#6366F1] text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {filteredBatches.length}
            </span>
          </div>

          {/* Search and Category Filter in One Single Horizontal Line */}
          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
            {/* Category Dropdown */}
            <div className="relative flex-1 sm:w-44 shrink-0 min-w-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-3 pr-7 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#121433] border border-slate-200 dark:border-[#22244f] text-slate-900 dark:text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer shadow-xs truncate"
              >
                <option value="all">All Categories</option>
                <option value="foundation">Foundation</option>
                <option value="medical">Medical</option>
                <option value="engineering">Engineering</option>
                <option value="commerce">Commerce</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8e91b5] pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 shrink-0 min-w-0">
              <input
                type="text"
                placeholder="Search batches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-[#121433] border border-slate-200 dark:border-[#22244f] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8e91b5] outline-none focus:border-indigo-500 transition-all shadow-xs"
              />
              <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8e91b5]" />
            </div>
          </div>
        </div>

        {/* Batches Cards List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredBatches.length === 0 ? (
          <Card className="py-12 text-slate-500 dark:text-slate-400 text-center border border-dashed border-[rgb(var(--border))]">
            <Tv size={32} className="mx-auto text-[rgb(var(--text-muted))] mb-2 opacity-40" />
            <p className="text-xs font-semibold text-[rgb(var(--text-secondary))] font-[Outfit]">No active batches found</p>
            <p className="text-[11px] text-[rgb(var(--text-muted))] mt-0.5">Try searching with a different keyword.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBatches.map((batch, idx) => {
              const accentColor = getBatchAccentColor(batch.color, idx)
              return (
                <motion.div 
                  key={batch.id}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.1 }}
                >
                  <Card 
                    className="p-3.5 sm:p-4 border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/40 hover:shadow-md transition-all rounded-2xl"
                  >
                    {/* Left Colored Accent Strip */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" 
                      style={{ backgroundColor: accentColor }} 
                    />

                    <div className="flex items-center gap-3.5 pl-2">
                      {/* Pastel Circle Icon Container */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: `${accentColor}18`, 
                          color: accentColor,
                        }}
                      >
                        {getBatchIcon(batch.name)}
                      </div>

                      {/* Title & Subtitle */}
                      <div className="space-y-0.5">
                        <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">
                          {batch.name}
                        </h3>
                        <p className="text-xs text-[rgb(var(--text-muted))] font-[Inter]">
                          {batch.description ?? 'Class 10 Science batch'}
                        </p>
                      </div>
                    </div>

                    {/* Right Private Enrollment & Join Batch Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgb(var(--border))]">
                      <div className="flex items-center gap-1.5 text-[rgb(var(--text-muted))] font-medium text-[11px]">
                        <Users size={14} style={{ color: accentColor }} />
                        <span>Private Enrollment</span>
                      </div>

                      <Link to="/login">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="font-bold text-xs rounded-xl px-3.5 py-1.5 border transition-all cursor-pointer hover:shadow-sm"
                          style={{
                            borderColor: `${accentColor}40`,
                            color: accentColor,
                          }}
                        >
                          Join Batch <ArrowRight size={13} className="ml-1" />
                        </Button>
                      </Link>
                    </div>

                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

      </section>

    </div>
  )
}
