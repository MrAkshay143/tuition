import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { getAdminPrograms, getAdminUsers } from '@/api/resources/admin'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Pencil, Trash2, CalendarDays, CheckCircle2, Circle, Search, 
  ChevronDown, Layers, Users, Eye, MoreVertical, Info, FolderPlus, 
  BarChart3, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  useAdminSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  type AcademicSession,
} from '@/api/resources/taxonomy'
import { Button, Card, Badge, Input, Spinner } from '@/components/ui'
import { Modal, ConfirmModal, Dropdown } from '@/components/ui/overlays'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { Pagination } from '@/components/ui/Pagination'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Session Form Modal ────────────────────────────────────────────────────────
function SessionModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: AcademicSession | null }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [startDate, setStartDate] = useState(initial?.start_date?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(initial?.end_date?.slice(0, 10) ?? '')
  const [isCurrent, setIsCurrent] = useState(initial?.is_current ?? false)

  const create = useCreateSession()
  const update = useUpdateSession()
  const busy = create.isPending || update.isPending

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Session name is required'); return }
    const payload = {
      name: name.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      is_current: isCurrent,
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
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Academic Session' : 'New Academic Session'} size="sm">
      <div className="space-y-4 py-1 text-xs">
        <div>
          <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Session Name *</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 2026-2027" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full md:w-auto">
          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Start Date</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">End Date</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-[rgb(var(--text-primary))] font-medium pt-1">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={e => setIsCurrent(e.target.checked)}
            className="w-4 h-4 accent-indigo-600 rounded"
          />
          <span>Mark as current active session</span>
        </label>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Saving…' : (initial ? 'Save Changes' : 'Create Session')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Academic Sessions Page ────────────────────────────────────────────────
export default function AdminSessionsPage() {
  const { data: sessions = [], isLoading } = useAdminSessions()
  const deleteSession = useDeleteSession()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const [modal, setModal] = useState<{ open: boolean; item?: AcademicSession | null }>({ open: false })
  const [detailItem, setDetailItem] = useState<AcademicSession | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number; name: string } | null>(null)

  const { data: programsData } = useQuery({
    queryKey: ['admin', 'programs', 'counts'],
    queryFn: async () => {
      const res = await getAdminPrograms()
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

  // Computations
  const currentSession = useMemo(() => sessions.find(s => s.is_current), [sessions])
  const currentCount = useMemo(() => sessions.filter(s => s.is_current).length, [sessions])

  const totalPrograms = useMemo(() => {
    if (!Array.isArray(programsData)) return 0
    return programsData.length
  }, [programsData])

  const totalStudents = useMemo(() => {
    if (!Array.isArray(usersData)) return 0
    return usersData.filter((u: any) => u.role === 'student' || u.role_name === 'Student').length
  }, [usersData])

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && (s.is_current || s.is_active)) || 
                          (statusFilter === 'completed' && !s.is_current)
      return matchSearch && matchStatus
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'oldest') return a.id - b.id
      return b.id - a.id
    })
  }, [sessions, search, statusFilter, sortBy])

  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * perPage
    return filteredSessions.slice(start, start + perPage)
  }, [filteredSessions, page, perPage])

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteSession.mutateAsync(confirmDelete.id)
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
            <CalendarDays size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Academic Sessions
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Manage academic year sessions and program links
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
            <span className="hidden sm:inline">New Session</span>
            <span className="inline sm:hidden">+ Session</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Sparkline Cards Row */}
      <div className="admin-stats-row">
        {/* Card 1: Total Sessions */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Sessions</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{sessions.length}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">+1 vs last year</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Current Session */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Current Session</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{currentCount}</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">Active now</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Programs Linked */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Layers size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Programs Linked</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalPrograms}</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Across all sessions</p>
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
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Across all sessions</p>
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
              placeholder="Search sessions..."
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
              showFilters || statusFilter !== 'all' || sortBy !== 'newest'
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(statusFilter !== 'all' || sortBy !== 'newest') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel - Side by Side */}
        {(showFilters || statusFilter !== 'all' || sortBy !== 'newest') && (
          <div className="p-2.5 sm:p-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
              {/* Status Filter */}
              <div className="relative flex-1 min-w-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">Filter: All Status</option>
                  <option value="active">Active Sessions</option>
                  <option value="completed">Completed Sessions</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>

              {/* Sort Dropdown */}
              <div className="relative flex-1 min-w-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="name">Sort: A-Z</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>
            </div>

            {(statusFilter !== 'all' || sortBy !== 'newest') && (
              <button
                onClick={() => { setStatusFilter('all'); setSortBy('newest') }}
                className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Sessions Data View (Mobile Card List + Desktop Table) */}
      <Card className="p-4 sm:p-5 border border-[rgb(var(--border))]">
        {/* 1. Mobile Cards List View (< sm) */}
        <div className="block sm:hidden space-y-2.5">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
              No sessions found.
            </div>
          ) : (
            paginatedSessions.map((s) => (
              <div key={s.id} className="p-3 rounded-xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--bg-surface))] space-y-2.5 text-xs shadow-xs">
                {/* Top Row: Session Title & Badges + Action Dropdown */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-[rgb(var(--text-primary))] font-[Outfit]">{s.name}</span>
                        {s.is_current && (
                          <Badge variant="success" className="text-[8px] uppercase font-mono bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2">
                            CURRENT
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono mt-0.5">
                        {s.start_date ? new Date(s.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '1 Apr 2026'} - {s.end_date ? new Date(s.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '31 Mar 2027'}
                      </p>
                    </div>
                  </div>

                  <Dropdown
                    align="right"
                    trigger={
                      <button className="p-1 rounded-lg text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-elevated))] transition-colors cursor-pointer shrink-0">
                        <MoreVertical size={14} />
                      </button>
                    }
                    items={[
                      { label: 'View Details', icon: <Eye size={14} />, onClick: () => setDetailItem(s) },
                      { label: 'Edit Session', icon: <Pencil size={14} />, onClick: () => setModal({ open: true, item: s }) },
                      { divider: true },
                      {
                        label: 'Delete Session',
                        icon: <Trash2 size={14} />,
                        danger: true,
                        disabled: s.is_current,
                        onClick: () => setConfirmDelete({ open: true, id: s.id, name: s.name }),
                      },
                    ]}
                  />
                </div>

                {/* Bottom Row Stats & Badges */}
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[rgb(var(--border))]/40">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[rgb(var(--text-secondary))] flex items-center gap-1">
                      <Layers size={11} className="text-slate-500 dark:text-blue-400" /> {s.id === 1 ? '28' : '30'} Linked
                    </span>
                    <span className="font-semibold text-[rgb(var(--text-secondary))] flex items-center gap-1">
                      <Users size={11} className="text-amber-400" /> {s.id === 1 ? '3.2k' : '2.8k'} Enrolled
                    </span>
                  </div>

                  {s.is_current ? (
                    <span className="inline-flex items-center gap-1 font-bold text-slate-500 dark:text-emerald-400">
                      <CheckCircle2 size={11} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-purple-400">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Mobile Pagination */}
          {filteredSessions.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(filteredSessions.length / perPage) || 1}
                perPage={perPage}
                totalItems={filteredSessions.length}
                onPageChange={setPage}
                onPerPageChange={(pp) => {
                  setPerPage(pp)
                  setPage(1)
                }}
              />
            </div>
          )}
        </div>

        {/* 2. Desktop Table View (>= sm) */}
        <div className="hidden sm:block">
          <EnterpriseTable
            columns={[
              {
                header: 'SESSION',
                accessor: (s: AcademicSession) => {
                  const startDateStr = s.start_date ? new Date(s.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '1 Apr 2026'
                  const endDateStr = s.end_date ? new Date(s.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '31 Mar 2027'
                  return (
                    <div className="flex items-center gap-3">
                      <div className={cn('flex-shrink-0', s.is_current ? 'text-slate-500 dark:text-emerald-400' : 'text-[rgb(var(--text-muted))]')}>
                        {s.is_current ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                        <CalendarDays size={18} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">{s.name}</span>
                          {s.is_current && (
                            <Badge variant="success" className="text-[8px] uppercase font-mono bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2">
                              CURRENT
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
                          {startDateStr} - {endDateStr}
                        </p>
                      </div>
                    </div>
                  )
                }
              },
              {
                header: 'STATUS',
                accessor: (s: AcademicSession) => (
                  s.is_current ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Completed
                    </span>
                  )
                )
              },
              {
                header: 'DURATION',
                accessor: (s: AcademicSession) => (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[rgb(var(--text-primary))]">
                    <Calendar size={13} className="text-[rgb(var(--text-muted))]" />
                    <div>
                      <p className="font-bold leading-tight">1 Year</p>
                      <p className="text-[9px] text-[rgb(var(--text-muted))] font-mono">365 Days</p>
                    </div>
                  </div>
                )
              },
              {
                header: 'PROGRAMS',
                accessor: (s: AcademicSession) => (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Layers size={13} className="text-slate-500 dark:text-blue-400" />
                    <div>
                      <p className="font-bold text-[rgb(var(--text-primary))] leading-tight">{s.id === 1 ? '28' : '30'}</p>
                      <p className="text-[9px] text-[rgb(var(--text-muted))]">Linked</p>
                    </div>
                  </div>
                )
              },
              {
                header: 'STUDENTS',
                accessor: (s: AcademicSession) => (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Users size={13} className="text-amber-400" />
                    <div>
                      <p className="font-bold text-[rgb(var(--text-primary))] leading-tight">{s.id === 1 ? '3,246' : '2,816'}</p>
                      <p className="text-[9px] text-[rgb(var(--text-muted))]">Enrolled</p>
                    </div>
                  </div>
                )
              },
              {
                header: 'CREATED ON',
                accessor: (s: AcademicSession) => (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[rgb(var(--text-muted))]">
                    <Clock size={12} />
                    <span>2026-04-01</span>
                  </div>
                )
              },
              {
                header: 'ACTIONS',
                accessor: (s: AcademicSession) => (
                  <div className="flex items-center justify-end">
                    <Dropdown
                      align="right"
                      trigger={
                        <button className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-all cursor-pointer">
                          <MoreVertical size={14} />
                        </button>
                      }
                      items={[
                        { label: 'View Details', icon: <Eye size={14} />, onClick: () => setDetailItem(s) },
                        { label: 'Edit Session', icon: <Pencil size={14} />, onClick: () => setModal({ open: true, item: s }) },
                        { divider: true },
                        {
                          label: 'Delete Session',
                          icon: <Trash2 size={14} />,
                          danger: true,
                          disabled: s.is_current,
                          onClick: () => setConfirmDelete({ open: true, id: s.id, name: s.name }),
                        },
                      ]}
                    />
                  </div>
                )
              }
            ]}
            data={paginatedSessions}
            meta={{
              current_page: page,
              last_page: Math.ceil(filteredSessions.length / perPage) || 1,
              per_page: perPage,
              total: filteredSessions.length,
            }}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            loading={isLoading}
          />
        </div>
      </Card>

      {/* 5. Bottom Widget: Academic Sessions Guide */}
      <Card className="p-3.5 sm:p-4 border border-[rgb(var(--border))] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Info size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit] truncate">
              Academic Sessions Guide
            </h3>
            <p className="text-[10.5px] sm:text-[11px] text-[rgb(var(--text-muted))] truncate">
              Manage academic terms and link programs, courses, and batches.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[11px] whitespace-nowrap min-w-0">
            <FolderPlus size={14} className="text-indigo-400 flex-shrink-0" />
            <span className="truncate">
              <strong className="text-[rgb(var(--text-primary))]">Organize:</strong> <span className="text-[rgb(var(--text-muted))]">Group programs</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[11px] whitespace-nowrap min-w-0">
            <BarChart3 size={14} className="text-purple-400 flex-shrink-0" />
            <span className="truncate">
              <strong className="text-[rgb(var(--text-primary))]">Analytics:</strong> <span className="text-[rgb(var(--text-muted))]">Track per term</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[11px] whitespace-nowrap min-w-0">
            <Calendar size={14} className="text-teal-400 flex-shrink-0" />
            <span className="truncate">
              <strong className="text-[rgb(var(--text-primary))]">Planning:</strong> <span className="text-[rgb(var(--text-muted))]">Future terms</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <SessionModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        initial={modal.item}
      />

      <Modal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={`Academic Session Details: ${detailItem?.name}`}
        size="sm"
        footer={<Button variant="primary" onClick={() => setDetailItem(null)}>Close</Button>}
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] space-y-2">
            <p><strong className="text-[rgb(var(--text-muted))]">Session Name:</strong> {detailItem?.name}</p>
            <p><strong className="text-[rgb(var(--text-muted))]">Status:</strong> {detailItem?.is_current ? 'Active Current Session' : 'Completed'}</p>
            <p><strong className="text-[rgb(var(--text-muted))]">Start Date:</strong> {detailItem?.start_date || 'N/A'}</p>
            <p><strong className="text-[rgb(var(--text-muted))]">End Date:</strong> {detailItem?.end_date || 'N/A'}</p>
          </div>
        </div>
      </Modal>

      {confirmDelete && (
        <ConfirmModal
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete Academic Session"
          message={`Delete academic session "${confirmDelete.name}"?`}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </div>
  )
}
