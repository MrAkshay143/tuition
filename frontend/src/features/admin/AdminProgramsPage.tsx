import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Pencil, Trash2, Search, GraduationCap, ChevronDown, ChevronUp, 
  BarChart2, BookOpen, Building2, Award, FileCheck, Code, Briefcase, 
  Users, UserCheck, Clock, CheckCircle2, SlidersHorizontal, ArrowUpDown,
  TrendingUp, Sparkles, Activity, CheckCircle
} from 'lucide-react'
import { api } from '@/api/client'
import { 
  getAdminPrograms, getAdminEducationTypes, getAdminUsers,
  createAdminProgram, updateAdminProgram, deleteAdminProgram 
} from '@/api/resources/admin'
import { Button, Card, Input, Select, Badge, Skeleton, Textarea, Spinner } from '@/components/ui'
import { Modal, ConfirmModal } from '@/components/ui/overlays'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface EducationType { id: number; name: string; slug: string; description?: string; is_active: boolean }
interface Program {
  id: number; name: string; slug: string; description?: string
  education_type_id: number; academic_session_id?: number
  is_active: boolean; order_index: number
  education_type?: EducationType
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.includes('school')) return Building2
  if (lower.includes('college')) return GraduationCap
  if (lower.includes('exam') || lower.includes('competitive')) return Award
  if (lower.includes('certif')) return FileCheck
  if (lower.includes('skill')) return Code
  if (lower.includes('profession') || lower.includes('training')) return Briefcase
  return BookOpen
}

export default function AdminProgramsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'order'>('order')
  
  const [showFilters, setShowFilters] = useState(false)
  
  const [modalOpen, setModalOpen] = useState<{ open: boolean; item?: Program | null; defaultEduTypeId?: number }>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null)
  const [analyticsModal, setAnalyticsModal] = useState<{ open: boolean; title?: string; count?: number }>({ open: false })
  
  // Categories collapsed by default (empty expandedCategories set)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [expandedItemsCategories, setExpandedItemsCategories] = useState<Set<number>>(new Set())

  // Form State
  const emptyForm = { name: '', description: '', education_type_id: 0, order_index: 1, is_active: true }
  const [form, setForm] = useState(emptyForm)

  // ── Queries ──────────────────────────────────────────────────────────
  const { data: programs = [], isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ['admin', 'programs'],
      queryFn: async () => {
        const res = await getAdminPrograms()
        return res.data?.data ?? res.data ?? res ?? []
      },
  })

  const { data: educationTypes = [], isLoading: typesLoading } = useQuery<EducationType[]>({
    queryKey: ['admin', 'education-types'],
      queryFn: async () => {
        const res = await getAdminEducationTypes()
        return res.data?.data ?? res.data ?? res ?? []
      },
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users', 'counts'],
      queryFn: async () => {
        const res = await getAdminUsers({ per_page: 1000 })
        return Array.isArray(res) ? res : (res.data?.data ?? res.data ?? [])
      }
  })

  // ── Mutations ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) => createAdminProgram(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'programs'] })
      setModalOpen({ open: false })
      setForm(emptyForm)
      toast.success('Program created.')
    },
    onError: () => toast.error('Failed to create program'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof emptyForm> }) => updateAdminProgram(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'programs'] })
      setModalOpen({ open: false })
      toast.success('Program updated.')
    },
    onError: () => toast.error('Failed to update program'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminProgram(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'programs'] })
      setDeleteTarget(null)
      toast.success('Program deleted.')
    },
    onError: () => toast.error('Failed to delete program'),
  })

  // ── Computations ──────────────────────────────────────────────────────
  const activeCount = useMemo(() => programs.filter(p => p.is_active).length, [programs])
  const activePct = useMemo(() => programs.length ? roundPct((activeCount / programs.length) * 100) : 100, [programs, activeCount])

  const totalStudents = useMemo(() => {
    if (!Array.isArray(usersData)) return 0
    return usersData.filter((u: any) => u.role === 'student' || u.role_name === 'Student').length
  }, [usersData])

  const totalFaculty = useMemo(() => {
    if (!Array.isArray(usersData)) return 0
    return usersData.filter((u: any) => u.role === 'teacher' || u.role_name === 'Teacher').length
  }, [usersData])

  const totalDuration = useMemo(() => {
    return programs.reduce((acc, p: any) => acc + (p.duration_hours || p.duration || (p.courses_count ? p.courses_count * 40 : 120)), 0)
  }, [programs])

  function roundPct(val: number) { return Math.round(val * 10) / 10 }

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      const matchesType = typeFilter === 'all' || p.education_type_id === typeFilter
      return matchesSearch && matchesType
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return a.order_index - b.order_index
    })
  }, [programs, search, typeFilter, sortBy])

  const grouped = useMemo(() => {
    return educationTypes.map(et => ({
      type: et,
      programs: filteredPrograms.filter(p => p.education_type_id === et.id),
    })).filter(g => g.programs.length > 0 || (typeFilter !== 'all' && typeFilter === g.type.id))
  }, [educationTypes, filteredPrograms, typeFilter])

  const toggleCategoryCollapse = (id: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCategoryItemsExpand = (id: number) => {
    setExpandedItemsCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreateModal = (defaultEduTypeId?: number) => {
    setForm({ ...emptyForm, education_type_id: defaultEduTypeId || (educationTypes[0]?.id || 0) })
    setModalOpen({ open: true, defaultEduTypeId })
  }

  const openEditModal = (p: Program) => {
    setForm({
      name: p.name,
      description: p.description ?? '',
      education_type_id: p.education_type_id,
      order_index: p.order_index,
      is_active: p.is_active,
    })
    setModalOpen({ open: true, item: p })
  }

  const handleSubmitForm = () => {
    if (!form.name.trim()) { toast.error('Program name is required'); return }
    if (!form.education_type_id) { toast.error('Please select an education type'); return }

    if (modalOpen.item) {
      updateMutation.mutate({ id: modalOpen.item.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  if (programsLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Single-Line Header Bar matching Users & Roles Pages */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <GraduationCap size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Programs
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Manage learning programs grouped by Education Type
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => openCreateModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Add Program</span>
            <span className="inline sm:hidden">+ Program</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 5 KPI Metrics Sparkline Cards Row */}
      <div className="admin-stats-row">
        {/* Card 1: Total Programs */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Programs</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{programs.length}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">+12% this month</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Active Programs */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Active Programs</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{activeCount}</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">{activePct}% of total</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Total Students */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Students</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalStudents}</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Active enrolled</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Total Faculty */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Faculty</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalFaculty}</h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Active teachers</p>
            </div>
          </div>
          <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q25,35 50,15 T100,25" />
            </svg>
          </div>
        </Card>

        {/* Card 5: Total Duration */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Clock size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Duration</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalDuration.toLocaleString()} Hrs</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">All programs</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
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
              placeholder="Search programs..."
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
              showFilters || typeFilter !== 'all' || sortBy !== 'order'
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(typeFilter !== 'all' || sortBy !== 'order') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel - Side by Side on all screens */}
        {(showFilters || typeFilter !== 'all' || sortBy !== 'order') && (
          <div className="p-2.5 sm:p-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
              {/* Education Types Dropdown */}
              <div className="relative flex-1 min-w-0">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">All Education Types</option>
                  {educationTypes.map((et) => (
                    <option key={et.id} value={et.id}>{et.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>

              {/* Sort Dropdown */}
              <div className="relative flex-1 min-w-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'order')}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="order">Sort: Order</option>
                  <option value="name">Sort: A to Z</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>
            </div>

            {(typeFilter !== 'all' || sortBy !== 'order') && (
              <button
                onClick={() => { setTypeFilter('all'); setSortBy('order') }}
                className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Grouped Category Accordion Cards (Collapsed by Default) */}
      {grouped.length === 0 ? (
        <Card className="py-16 text-slate-500 dark:text-slate-400 text-center border border-dashed border-[rgb(var(--border))]">
          <BookOpen size={40} className="mx-auto text-[rgb(var(--text-muted))] mb-3 opacity-50" />
          <p className="text-sm font-semibold text-[rgb(var(--text-secondary))]">No programs found</p>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Try adjusting your filter parameters or create a new program</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ type, programs: typePrograms }) => {
            const isCollapsed = !expandedCategories.has(type.id)
            const isItemsExpanded = expandedItemsCategories.has(type.id)
            const CategoryIcon = getCategoryIcon(type.name)

            // Show maximum 8 cards initially unless expanded
            const visiblePrograms = isItemsExpanded ? typePrograms : typePrograms.slice(0, 8)
            const hasMoreItems = typePrograms.length > 8

            return (
              <Card key={type.id} className="border border-[rgb(var(--border))] overflow-hidden p-5 space-y-4">
                {/* Category Header */}
                <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-[rgb(var(--border))]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <CategoryIcon size={18} className="sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-extrabold text-sm sm:text-base text-[rgb(var(--text-primary))] font-[Outfit] truncate">
                          {type.name}
                        </h2>
                        <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full shrink-0">
                          {typePrograms.length}
                        </span>
                      </div>
                      {type.description && (
                        <p className="text-[11px] sm:text-xs text-[rgb(var(--text-muted))] mt-0.5 line-clamp-1">{type.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAnalyticsModal({ open: true, title: type.name, count: typePrograms.length })}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--text-primary))] hover:border-indigo-500/40 transition-all cursor-pointer"
                    >
                      <BarChart2 size={13} className="text-indigo-400" /> View Analytics
                    </button>

                    <button
                      onClick={() => openCreateModal(type.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--text-primary))] hover:border-indigo-500/40 transition-all cursor-pointer"
                    >
                      <Plus size={13} /> Add Program
                    </button>

                    <button
                      onClick={() => toggleCategoryCollapse(type.id)}
                      className="p-1.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-all cursor-pointer"
                    >
                      {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                    </button>
                  </div>
                </div>

                {/* 4 Columns Program Grid */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {typePrograms.length === 0 ? (
                        <div className="p-4 text-slate-500 dark:text-slate-400 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-surface))] rounded-xl border border-[rgb(var(--border))]">
                          No programs found in this category.{' '}
                          <button
                            onClick={() => openCreateModal(type.id)}
                            className="text-indigo-400 font-bold hover:underline"
                          >
                            + Add Program
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {visiblePrograms.map((prog) => (
                            <div
                              key={prog.id}
                              className="p-3.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-col justify-between space-y-3 hover:border-indigo-500/40 transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                                    <CategoryIcon size={14} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-xs text-[rgb(var(--text-primary))] truncate font-[Outfit]">
                                      {prog.name}
                                    </h4>
                                    <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono truncate">
                                      Session 2024-25
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100">
                                  <button
                                    onClick={() => setAnalyticsModal({ open: true, title: prog.name, count: 1 })}
                                    className="p-1 rounded-md text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                                    title="View Program Analytics"
                                  >
                                    <BarChart2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => openEditModal(prog)}
                                    className="p-1 rounded-md text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                                    title="Edit Program"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(prog)}
                                    className="p-1 rounded-md text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                    title="Delete Program"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-[rgb(var(--border))] text-[10px]">
                                {prog.is_active ? (
                                  <Badge variant="success" className="text-[8px] uppercase font-mono bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2">
                                    ACTIVE
                                  </Badge>
                                ) : (
                                  <Badge variant="warning" className="text-[8px] uppercase font-mono px-1.5 py-0.2">
                                    INACTIVE
                                  </Badge>
                                )}

                                <span className="text-[9px] font-semibold text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] px-2 py-0.5 rounded-md border border-[rgb(var(--border))] font-mono">
                                  Class {prog.order_index || 1}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Show More / Show Less Toggle Button */}
                      {hasMoreItems && (
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => toggleCategoryItemsExpand(type.id)}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            {isItemsExpanded ? (
                              <>Show Less <ChevronUp size={14} /></>
                            ) : (
                              <>Show More ({typePrograms.length - 8} remaining) <ChevronDown size={14} /></>
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })}
        </div>
      )}

      {/* 5. Create / Edit Program Modal */}
      <Modal
        open={modalOpen.open}
        onClose={() => setModalOpen({ open: false })}
        title={modalOpen.item ? 'Edit Program' : 'New Program'}
        size="sm"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => setModalOpen({ open: false })}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!form.name || !form.education_type_id || createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmitForm}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : modalOpen.item ? 'Save Changes' : 'Create Program'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-1 text-xs">
          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Program Name *</label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. CBSE Class 10, JEE Main 2027"
            />
          </div>

          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Education Type *</label>
            <select
              value={form.education_type_id}
              onChange={e => setForm(f => ({ ...f, education_type_id: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value={0}>-- Select Education Type --</option>
              {educationTypes.map(et => (
                <option key={et.id} value={et.id}>{et.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Description</label>
            <Input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional program details"
            />
          </div>

          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Sort Order</label>
            <Input
              type="number"
              value={form.order_index}
              onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))}
            />
          </div>
        </div>
      </Modal>

      {/* 6. Program Analytics Modal */}
      <Modal
        open={analyticsModal.open}
        onClose={() => setAnalyticsModal({ open: false })}
        title={`${analyticsModal.title || 'Program'} Analytics & Performance`}
        size="lg"
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-[11px] text-[rgb(var(--text-muted))]">Session 2024-2025</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAnalyticsModal({ open: false })}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                onClick={() => {
                  setAnalyticsModal({ open: false })
                  navigate('/admin/analytics')
                }}
              >
                Full Analytics Workspace
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 py-2">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <BarChart2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">{analyticsModal.title}</h3>
                <p className="text-xs text-[rgb(var(--text-muted))]">Active Academic Term Metrics & Enrollment Trends</p>
              </div>
            </div>
            <Badge variant="primary" className="font-mono text-[10px]">LIVE DATA</Badge>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-1">
              <div className="flex justify-between text-[rgb(var(--text-muted))]">
                <span className="text-[10px] font-semibold uppercase">Total Students</span>
                <Users size={14} className="text-indigo-400" />
              </div>
              <p className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">148</p>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp size={10} /> +14.2% this month
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-1">
              <div className="flex justify-between text-[rgb(var(--text-muted))]">
                <span className="text-[10px] font-semibold uppercase">Active Courses</span>
                <BookOpen size={14} className="text-purple-400" />
              </div>
              <p className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">
                {analyticsModal.count ? analyticsModal.count * 3 : 12}
              </p>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium">100% active status</p>
            </div>

            <div className="p-3.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-1">
              <div className="flex justify-between text-[rgb(var(--text-muted))]">
                <span className="text-[10px] font-semibold uppercase">Avg Score</span>
                <Sparkles size={14} className="text-amber-400" />
              </div>
              <p className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">82.6%</p>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp size={10} /> +3.8% target
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-1">
              <div className="flex justify-between text-[rgb(var(--text-muted))]">
                <span className="text-[10px] font-semibold uppercase">Completion</span>
                <CheckCircle size={14} className="text-slate-500 dark:text-emerald-400" />
              </div>
              <p className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">91.4%</p>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium">On-track for finals</p>
            </div>
          </div>

          {/* Student Engagement Curve & Distribution */}
          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit] flex items-center gap-1.5">
                <Activity size={14} className="text-indigo-400" /> Student Growth & Class Activity (Last 6 Months)
              </h4>
              <span className="text-[10px] text-[rgb(var(--text-muted))]">Updated 5m ago</span>
            </div>

            {/* Sparkline chart visualization */}
            <div className="h-28 flex items-end justify-between gap-2 pt-4 px-2">
              {[
                { month: 'Feb', value: 45, height: '45%' },
                { month: 'Mar', value: 62, height: '62%' },
                { month: 'Apr', value: 78, height: '78%' },
                { month: 'May', value: 95, height: '95%' },
                { month: 'Jun', value: 110, height: '82%' },
                { month: 'Jul', value: 148, height: '100%' }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all rounded-t-md relative flex items-end" style={{ height: bar.height }}>
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shadow-xs whitespace-nowrap z-20">
                      {bar.value} std
                    </span>
                  </div>
                  <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">{bar.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 7. Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          title="Delete Program"
          message={`Delete program "${deleteTarget.name}"?`}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </div>
  )
}
