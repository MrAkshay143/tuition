import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useExams, useDeleteExam } from '@/api/resources/exams'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { 
  Plus, Trash2, Users, Clock, Settings, FileText, GraduationCap, 
  Search, ChevronDown, Bookmark, MoreVertical, LayoutGrid, List, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, Briefcase,
  Sparkles, CheckCircle2, AlertCircle, Folder, Copy, Edit3, SlidersHorizontal
} from 'lucide-react'
import { CreateExamModal } from './CreateExamModal'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '@/components/ui/overlays'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store'
import { usePermission } from '@/contexts/PermissionContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

export const ExamsPage = () => {
  const { data: exams, isLoading } = useExams()
  const deleteMutation = useDeleteExam()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { can } = usePermission()
  const isAdmin = can('module.settings') // Proxy for admin capabilities
  const rolePrefix = isAdmin ? '/admin' : '/teacher'

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const list = exams?.data || exams || []

  const activeCount = useMemo(() => list.filter((e: any) => e.is_active || e.status === 'published').length, [list])
  const upcomingCount = useMemo(() => list.filter((e: any) => e.starts_at && new Date(e.starts_at) > new Date()).length, [list])
  const completedCount = useMemo(() => list.filter((e: any) => e.ends_at && new Date(e.ends_at) < new Date()).length, [list])

  const filtered = useMemo(() => list.filter((e: any) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || e.type === typeFilter
    return matchSearch && matchType
  }), [list, search, typeFilter])

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Single-Line Header Bar matching Users & Roles Pages */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <FileText size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Exams & Quizzes
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Create and manage exams, quizzes and question sets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Create Exam</span>
            <span className="inline sm:hidden">+ Exam</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Cards Row matching Users & Roles Pages */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Exams */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <FileText size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Exams</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{list.length}</h3>
            <p className="text-[10px] text-purple-400 font-semibold mt-1">All time created</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-purple-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 2: Active Exams */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Active Exams</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{activeCount}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">Live for students</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[65%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 3: Upcoming Exams */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Upcoming</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{upcomingCount}</h3>
            <p className="text-[10px] text-blue-400 font-semibold mt-1">Scheduled next</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-500 h-full w-[50%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 4: Completed Exams */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Briefcase size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Completed</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{completedCount}</h3>
            <p className="text-[10px] text-amber-400 font-semibold mt-1">Evaluated & archived</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[40%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 3. Search & Workable Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Left Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              placeholder="Search exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Workable Filter Toggle Button on Right Side */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0",
              showFilters || typeFilter !== 'all' || statusFilter !== 'all'
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(typeFilter !== 'all' || statusFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer", viewMode === 'grid' && "bg-indigo-600 text-white")}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer", viewMode === 'list' && "bg-indigo-600 text-white")}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel - Side by Side */}
        {(showFilters || typeFilter !== 'all' || statusFilter !== 'all') && (
          <div className="p-2.5 sm:p-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              {/* Type Selector */}
              <div className="relative min-w-[120px] flex-1">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">All Types</option>
                  <option value="mcq">MCQ</option>
                  <option value="subjective">Subjective</option>
                  <option value="mixed">Mixed</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>

              {/* Status Selector */}
              <div className="relative min-w-[120px] flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="finished">Finished</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>
            </div>

            {(typeFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setTypeFilter('all'); setStatusFilter('all') }}
                className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Exams List / Grid View */}
      {filtered.length === 0 ? (
        <Card className="py-12 text-slate-500 dark:text-slate-400 text-center border border-dashed border-[rgb(var(--border))]">
          <GraduationCap size={32} className="mx-auto text-[rgb(var(--text-muted))] mb-2 opacity-50" />
          <p className="text-xs sm:text-sm font-semibold text-[rgb(var(--text-secondary))] font-[Outfit]">No exams found</p>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Try adjusting your search criteria or create a new exam</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((exam: any) => {
            const isPastDue = exam.ends_at && new Date(exam.ends_at) < new Date()
            const dateObj = exam.ends_at ? new Date(exam.ends_at) : new Date('2026-07-29')
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }).toLowerCase()
            const batchTag = exam.batches?.[0]?.name || 'JEE 2026'

            return (
              <motion.div
                key={exam.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  className={cn(
                    "p-2.5 sm:p-3.5 border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-col justify-between space-y-2 sm:space-y-3 hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 group relative overflow-hidden rounded-2xl",
                    isPastDue && "border-rose-500/30 bg-rose-500/5"
                  )}
                >
                  {/* Glassmorphic Gradient Overlay Effect */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                  {/* Header Type & Action Buttons */}
                  <div className="flex items-center justify-between pt-1 gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 sm:px-2 py-0.5 rounded-full font-mono truncate">
                        <Sparkles size={10} className="text-indigo-400 shrink-0" />
                        {exam.type || 'MCQ'}
                      </span>

                      {exam.is_active || exam.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded-full truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          LIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 sm:px-2 py-0.5 rounded-full truncate">
                          DRAFT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Tag */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-xs sm:text-sm text-[rgb(var(--text-primary))] font-[Outfit] leading-snug line-clamp-1 sm:line-clamp-2 group-hover:text-indigo-400 transition-colors">
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-mono uppercase font-bold text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] px-1.5 sm:px-2 py-0.5 rounded-md truncate max-w-full">
                        <Folder size={9} className="text-purple-400 shrink-0" />
                        {batchTag}
                      </span>
                    </div>
                  </div>

                  {/* Due Date & Info Box */}
                  <div className="py-1.5 px-2 sm:px-2.5 rounded-lg bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] flex items-center justify-between text-[9px] sm:text-[10px] font-mono">
                    <span className="text-[rgb(var(--text-muted))] truncate">Due: {dateStr}, {timeStr}</span>
                    <span className="font-bold text-indigo-400 shrink-0">{exam.duration_minutes || 30}m • {exam.total_marks || 50}M</span>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-[rgb(var(--border))] mt-1 sm:mt-2">
                    <button
                      onClick={() => setEditTarget(exam)}
                      className="p-1.5 sm:p-2 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer shrink-0"
                      title="Edit Exam"
                    >
                      <Edit3 size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 font-bold text-[10px] sm:text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-1.5 shadow-xs cursor-pointer truncate"
                      onClick={() => navigate(`${rolePrefix}/exams/${exam.id}/questions`)}
                    >
                      <Settings size={12} className="shrink-0" />
                      <span className="hidden sm:inline">Questions</span>
                      <span className="inline sm:hidden">Edit</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      className="font-bold text-[10px] sm:text-xs px-2 sm:px-3 rounded-xl py-1.5 cursor-pointer border border-[rgb(var(--border))] truncate shrink-0"
                      onClick={() => navigate(`${rolePrefix}/exams/${exam.id}/attempts`)}
                    >
                      Attempts ({exam.attempts_count || 0})
                    </Button>
                    <button
                      onClick={() => setDeleteTargetId(exam.id)}
                      className="p-1.5 sm:p-2 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
                      title="Delete Exam"
                    >
                      <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((exam: any) => {
            const dateObj = exam.ends_at ? new Date(exam.ends_at) : new Date('2026-07-29')
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            const batchTag = exam.batches?.[0]?.name || 'JEE ADVANCED 2026'

            return (
              <motion.div
                key={exam.id}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="p-3 sm:p-3.5 border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-indigo-500/50 hover:shadow-md transition-all rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-xs sm:text-sm text-[rgb(var(--text-primary))] font-[Outfit] truncate">{exam.title}</h3>
                        <span className="text-[8px] sm:text-[9px] font-mono uppercase font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full shrink-0">
                          {batchTag}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-mono uppercase font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full shrink-0">
                          {exam.type || 'MCQ'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[rgb(var(--text-muted))] mt-0.5 font-mono flex items-center gap-2 truncate">
                        <span>Due: {dateStr}</span>
                        <span>•</span>
                        <span>{exam.duration_minutes || 30} mins</span>
                        <span>•</span>
                        <span>{exam.total_marks || 50} Marks</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                      onClick={() => navigate(`${rolePrefix}/exams/${exam.id}/questions`)}
                    >
                      <Settings size={13} /> Questions
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer border border-[rgb(var(--border))]"
                      onClick={() => navigate(`${rolePrefix}/exams/${exam.id}/attempts`)}
                    >
                      Attempts ({exam.attempts_count || 0})
                    </Button>
                    <button
                      onClick={() => setEditTarget(exam)}
                      className="p-2 rounded-xl text-[rgb(var(--text-muted))] hover:text-indigo-400 transition-all cursor-pointer"
                      title="Edit Exam"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(exam.id)}
                      className="p-2 rounded-xl text-[rgb(var(--text-muted))] hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete Exam"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* 5. Centralized & Mobile Responsive Bottom Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[rgb(var(--border))] mt-6 text-xs text-[rgb(var(--text-muted))]">
        <span className="font-medium text-center sm:text-left">
          Showing 1 to {filtered.length} of {list.length} exams
        </span>

        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer">
            &lt;
          </button>
          <button className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-xs">
            1
          </button>
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer">
            &gt;
          </button>
        </div>
      </div>

      {/* Modals */}
      <CreateExamModal 
        open={isCreateModalOpen || !!editTarget} 
        onClose={() => { setIsCreateModalOpen(false); setEditTarget(null) }} 
        initial={editTarget} 
      />

      <ConfirmModal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Exam"
        message="Delete this exam and all student attempts?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTargetId) { deleteMutation.mutate(deleteTargetId); setDeleteTargetId(null) }
        }}
      />
    </div>
  )
}
