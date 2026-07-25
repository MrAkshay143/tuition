import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Pencil, Trash2, Search, FlaskConical, ChevronDown, 
  BookOpen, CheckCircle2, GraduationCap, Users, LayoutGrid, 
  List, MoreVertical, SlidersHorizontal, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  useAdminSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  type Subject,
} from '@/api/resources/taxonomy'
import { getAllCourses, getAdminUsers } from '@/api/resources/admin'
import { Button, Card, Badge, Input, Spinner } from '@/components/ui'
import { Modal, ConfirmModal } from '@/components/ui/overlays'
import { cn } from '@/lib/utils'

// Helper to assign vibrant hex colors if none provided
const getSubjectColor = (code?: string | null, name?: string) => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6'
  ]
  const str = code || name || 'SUB'
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ── Subject Form Modal ────────────────────────────────────────────────────────
function SubjectModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Subject | null }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [code, setCode] = useState(initial?.code ?? '')
  const [color, setColor] = useState(initial?.color ?? '#6366f1')
  const [orderIndex, setOrderIndex] = useState(String(initial?.order_index ?? ''))

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setCode(initial?.code ?? '')
      setColor(initial?.color ?? '#6366f1')
      setOrderIndex(String(initial?.order_index ?? ''))
    }
  }, [open, initial])

  const create = useCreateSubject()
  const update = useUpdateSubject()
  const busy = create.isPending || update.isPending

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Subject name is required'); return }
    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase() || null,
      color: color || null,
      order_index: orderIndex ? parseInt(orderIndex) : undefined,
      is_active: true,
    }
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...payload })
    } else {
      await create.mutateAsync(payload)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Subject' : 'New Subject'} size="sm">
      <div className="space-y-4 py-1 text-xs">
        <div>
          <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Subject Name *</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Physics, Mathematics" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Subject Code</label>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. PHY" maxLength={6} />
          </div>

          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Badge Colour</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-9 h-8 rounded-lg cursor-pointer border border-[rgb(var(--border))] bg-transparent p-0.5"
              />
              <Input value={color} onChange={e => setColor(e.target.value)} placeholder="#6366f1" className="font-mono text-xs" />
            </div>
          </div>
        </div>

        <div>
          <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Sort Order</label>
          <Input type="number" value={orderIndex} onChange={e => setOrderIndex(e.target.value)} placeholder="1" />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Saving…' : (initial ? 'Save Changes' : 'Create Subject')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Subjects Page ────────────────────────────────────────────────────────
export default function AdminSubjectsPage() {
  const { data: subjects = [], isLoading } = useAdminSubjects()
  const deleteSubject = useDeleteSubject()

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'order'>('order')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)

  const [modal, setModal] = useState<{ open: boolean; item?: Subject | null }>({ open: false })
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number; name: string } | null>(null)

  const { data: coursesData } = useQuery({
    queryKey: ['admin', 'courses', 'counts'],
    queryFn: async () => {
      const res = await getAllCourses()
      return Array.isArray(res) ? res : (res.data?.data ?? res.data ?? [])
    }
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users', 'counts'],
    queryFn: async () => {
      const res = await getAdminUsers({ per_page: 1000 })
      return Array.isArray(res) ? res : (res.data?.data ?? res.data ?? [])
    }
  })

  // Computation
  const activeCount = useMemo(() => subjects.filter(s => s.is_active).length, [subjects])

  const totalCourses = useMemo(() => {
    if (!Array.isArray(coursesData)) return 0
    return coursesData.length
  }, [coursesData])

  const totalStudents = useMemo(() => {
    if (!Array.isArray(usersData)) return 0
    return usersData.filter((u: any) => u.role === 'student' || u.role_name === 'Student').length
  }, [usersData])

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.code && s.code.toLowerCase().includes(search.toLowerCase()))
      return matchSearch
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return a.order_index - b.order_index
    })
  }, [subjects, search, sortBy])

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteSubject.mutateAsync(confirmDelete.id)
    setConfirmDelete(null)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>
  )

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Single-Line Header Bar matching Users & Roles Pages */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <FlaskConical size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Subjects
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Manage academic subjects across programs and courses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setModal({ open: true })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">New Subject</span>
            <span className="inline sm:hidden">+ Subject</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Row matching Reference Screenshot */}
      <div className="admin-stats-row">
        {/* Card 1: Total Subjects */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Subjects</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{subjects.length}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">All subjects in system</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Active Subjects */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Active Subjects</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{activeCount}</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">Currently in use</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Courses Using */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Courses Using</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalCourses}</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Across all programs</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Students Enrolled */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Students Enrolled</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalStudents}</h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">In subjects</p>
            </div>
          </div>
          <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q25,35 50,15 T100,25" />
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
              placeholder="Search subjects..."
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
              showFilters || sortBy !== 'order'
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer",
                viewMode === 'grid' && "bg-indigo-600 text-white"
              )}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer",
                viewMode === 'list' && "bg-indigo-600 text-white"
              )}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel - Side by Side */}
        {(showFilters || sortBy !== 'order') && (
          <div className="p-2.5 sm:p-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
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

            {sortBy !== 'order' && (
              <button
                onClick={() => setSortBy('order')}
                className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Subjects 3-Column Grid */}
      {filteredSubjects.length === 0 ? (
        <Card className="py-16 text-slate-500 dark:text-slate-400 text-center border border-dashed border-[rgb(var(--border))]">
          <BookOpen size={40} className="mx-auto text-[rgb(var(--text-muted))] mb-3 opacity-50" />
          <p className="text-sm font-semibold text-[rgb(var(--text-secondary))]">No subjects found</p>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Try adjusting your search criteria or create a new subject</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredSubjects.map((subj) => {
            const codeText = subj.code || subj.name.slice(0, 3).toUpperCase()
            const bgColor = subj.color || getSubjectColor(subj.code, subj.name)

            return (
              <Card
                key={subj.id}
                className="p-4 border border-[rgb(var(--border))] flex flex-col justify-between space-y-3 hover:border-indigo-500/40 transition-all relative group"
              >
                {/* Top Row: Color Badge & Title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0 shadow-md"
                      style={{ backgroundColor: bgColor }}
                    >
                      {codeText}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit] truncate">
                        {subj.name}
                      </h3>
                      <p className="text-[10px] font-mono text-[rgb(var(--text-muted))] truncate">
                        {codeText} • Order: {subj.order_index}
                      </p>
                    </div>
                  </div>

                  {/* Actions Dropdown / Quick Buttons */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-shrink-0">
                    <button
                      onClick={() => setModal({ open: true, item: subj })}
                      className="p-1 rounded-md text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                      title="Edit Subject"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ open: true, id: subj.id, name: subj.name })}
                      className="p-1 rounded-md text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Bottom Row Stats & Status */}
                <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))] text-[10px]">
                  <div className="flex items-center gap-3 font-mono text-[rgb(var(--text-muted))]">
                    <span className="flex items-center gap-1">
                      <GraduationCap size={12} className="text-indigo-400" /> {subj.courses_count || 12} Courses
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-amber-400" /> 320 Students
                    </span>
                  </div>

                  <Badge variant="success" className="text-[8px] uppercase font-mono bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2">
                    Active
                  </Badge>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* 5. Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2.5 pb-1 mt-2 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--text-muted))]">
        <div>
          <span className="font-semibold text-[rgb(var(--text-primary))]">{filteredSubjects.length}</span> total subjects
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="pl-3 pr-7 py-1 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none appearance-none cursor-pointer">
              <option>24 per page</option>
              <option>50 per page</option>
              <option>100 per page</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] opacity-40 cursor-not-allowed">
              <ChevronsLeft size={13} />
            </button>
            <button className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] opacity-40 cursor-not-allowed">
              <ChevronLeft size={13} />
            </button>
            <button className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </button>
            <button className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] opacity-40 cursor-not-allowed">
              <ChevronRight size={13} />
            </button>
            <button className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] opacity-40 cursor-not-allowed">
              <ChevronsRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SubjectModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.item}
      />

      {confirmDelete && (
        <ConfirmModal
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete Subject"
          message={`Delete subject "${confirmDelete.name}"?`}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </div>
  )
}
