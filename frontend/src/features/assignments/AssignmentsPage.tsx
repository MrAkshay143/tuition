import React, { useState, useMemo } from 'react'
import { useAssignments, useDeleteAssignment } from '@/api/resources/assignments'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { 
  Plus, Trash2, Users, Clock, ClipboardList, Search, ChevronDown, 
  Bookmark, MoreVertical, LayoutGrid, List, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Send, CheckCircle2, FileText, SlidersHorizontal,
  Pencil
} from 'lucide-react'
import { CreateAssignmentModal } from './CreateAssignmentModal'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '@/components/ui/overlays'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store'
import { usePermission } from '@/contexts/PermissionContext'
import { useApiQuery } from '@/api/resources/hooks'

export const AssignmentsPage = () => {
  const { data: assignments, isLoading } = useAssignments()
  const deleteMutation = useDeleteAssignment()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { can } = usePermission()
  const isAdmin = can('module.settings') // Proxy for admin capabilities
  const rolePrefix = isAdmin ? '/admin' : '/teacher'

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'ended'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  const { data: teachers } = useApiQuery(
    ['admin', 'teachers'],
    '/users?role=teacher',
    undefined,
    { enabled: isAdmin }
  )

  const list = assignments || []
  
  const activeCount = useMemo(() => list.filter((a: any) => {
    return !a.due_at || new Date(a.due_at) > new Date()
  }).length, [list])

  const overdueCount = useMemo(() => list.filter((a: any) => {
    return a.due_at && new Date(a.due_at) < new Date()
  }).length, [list])

  const totalSubmissions = useMemo(() => list.reduce((acc: number, item: any) => acc + (item.submissions_count || 0), 0), [list])

  const filtered = useMemo(() => list.filter((a: any) => {
    const matchSearch = !search || (a.title && a.title.toLowerCase().includes(search.toLowerCase())) || 
                        (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
    
    const isPastDue = a.due_at && new Date(a.due_at) < new Date()
    let matchStatus = true
    if (statusFilter === 'active') matchStatus = !isPastDue
    else if (statusFilter === 'inactive' || statusFilter === 'ended') matchStatus = isPastDue

    let matchTeacher = true
    if (selectedTeacherId && a.teacher_id) {
      matchTeacher = String(a.teacher_id) === String(selectedTeacherId)
    }

    return matchSearch && matchStatus && matchTeacher
  }), [list, search, statusFilter, selectedTeacherId])

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <ClipboardList size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Assignments
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Manage, grade and track student assignments easily.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => {
              setEditingAssignment(null)
              setIsCreateModalOpen(true)
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Create Assignment</span>
            <span className="inline sm:hidden">+ Assignment</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Cards Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Assignments */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all min-w-[140px] shrink-0 sm:shrink flex-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <FileText size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Assignments</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{list.length}</h3>
            <p className="text-[10px] text-purple-400 font-semibold mt-1">All time</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-purple-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 2: Active */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all min-w-[140px] shrink-0 sm:shrink flex-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Active</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{activeCount}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">Currently active</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[70%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 3: Overdue */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-rose-500/30 transition-all min-w-[140px] shrink-0 sm:shrink flex-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <Send size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Overdue</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{overdueCount}</h3>
            <p className="text-[10px] text-rose-400 font-semibold mt-1">Need attention</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-rose-500 h-full w-[30%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 4: Total Submissions */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all min-w-[140px] shrink-0 sm:shrink flex-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Users size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Submissions</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{totalSubmissions}</h3>
            <p className="text-[10px] text-amber-400 font-semibold mt-1">Across all</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[80%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Left Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              placeholder="Search assignments by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0 select-none",
              showFilters || selectedTeacherId !== '' || statusFilter !== 'all'
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(selectedTeacherId !== '' || statusFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer",
                viewMode === 'grid' && "bg-indigo-600 text-white shadow-xs"
              )}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer",
                viewMode === 'list' && "bg-indigo-600 text-white shadow-xs"
              )}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {(showFilters || selectedTeacherId !== '' || statusFilter !== 'all') && (
          <div className="p-2.5 sm:p-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              {/* Teacher Selector */}
              {isAdmin && (
                <div className="relative min-w-[130px] flex-1">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                  >
                    <option value="">All Teachers</option>
                    {(teachers || []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
                </div>
              )}

              {/* Status Selector */}
              <div className="relative min-w-[120px] flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active (Ongoing)</option>
                  <option value="inactive">Overdue / Closed</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>
            </div>

            {(selectedTeacherId !== '' || statusFilter !== 'all') && (
              <button
                onClick={() => { setSelectedTeacherId(''); setStatusFilter('all') }}
                className="text-xs font-semibold text-rose-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Assignments Grid or List View */}
      {filtered.length === 0 ? (
        <Card className="py-12 text-slate-500 dark:text-slate-400 text-center border border-dashed border-[rgb(var(--border))]">
          <ClipboardList size={32} className="mx-auto text-[rgb(var(--text-muted))] mb-2 opacity-50" />
          <p className="text-xs sm:text-sm font-semibold text-[rgb(var(--text-secondary))] font-[Outfit]">No assignments found</p>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Try adjusting your search criteria or create a new assignment</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((assignment: any) => {
            const isPastDue = assignment.due_at && new Date(assignment.due_at) < new Date()
            const dateObj = assignment.due_at ? new Date(assignment.due_at) : new Date('2026-07-29')
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }).toLowerCase()
            const batchTag = assignment.batches?.[0]?.name || 'JEE ADVANCED 2026'

            return (
              <Card
                key={assignment.id}
                className={cn(
                  "p-3.5 sm:p-4 border border-[rgb(var(--border))] flex flex-col justify-between space-y-3.5 hover:border-indigo-500/40 transition-all group relative rounded-2xl shadow-xs",
                  isPastDue && "border-rose-500/30"
                )}
              >
                {/* Header Status & Marks Tag */}
                <div className="flex items-center justify-between gap-1">
                  {isPastDue ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full truncate">
                      OVERDUE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full truncate">
                      ACTIVE
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono">
                      {assignment.max_marks || 100}M
                    </span>

                    {/* Explicit Edit & Delete Action Icon Buttons */}
                    <button
                      onClick={() => setEditingAssignment(assignment)}
                      className="p-1.5 rounded-lg text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                      title="Edit Assignment"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(assignment.id)}
                      className="p-1.5 rounded-lg text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Assignment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title & Tag */}
                <div>
                  <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit] leading-snug line-clamp-2">
                    {assignment.title}
                  </h3>
                  <span className="inline-block mt-1 text-[9px] font-mono uppercase font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md truncate max-w-full">
                    {batchTag}
                  </span>
                </div>

                {/* Due Date & Submissions */}
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[10px] font-mono">
                  <div className={cn("truncate", isPastDue ? "text-rose-400 font-bold" : "text-[rgb(var(--text-muted))]")}>
                    Due: {dateStr}, {timeStr}
                  </div>
                  <span className="font-bold text-indigo-400 shrink-0">{assignment.submissions_count ?? 0} subs</span>
                </div>

                {/* Bottom Grade Action Button */}
                <div>
                  <Button
                    variant="primary"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs shadow-xs cursor-pointer truncate"
                    onClick={() => navigate(`${rolePrefix}/assignments/${assignment.id}/submissions`)}
                  >
                    Grade Submissions
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((assignment: any) => {
            const isPastDue = assignment.due_at && new Date(assignment.due_at) < new Date()
            const dateObj = assignment.due_at ? new Date(assignment.due_at) : new Date('2026-07-29')
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            const batchTag = assignment.batches?.[0]?.name || 'JEE ADVANCED 2026'

            return (
              <Card key={assignment.id} className="p-3 sm:p-3.5 border border-[rgb(var(--border))] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-indigo-500/40 transition-all rounded-2xl">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-xs sm:text-sm text-[rgb(var(--text-primary))] font-[Outfit] truncate">{assignment.title}</h3>
                      <span className="text-[8px] sm:text-[9px] font-mono uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full shrink-0">{batchTag}</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-[rgb(var(--text-muted))] mt-0.5 truncate">Due: {dateStr} • {assignment.max_marks || 100} Marks • {assignment.submissions_count ?? 0} Submissions</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <Button
                    variant="primary"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm cursor-pointer"
                    onClick={() => navigate(`${rolePrefix}/assignments/${assignment.id}/submissions`)}
                  >
                    Grade
                  </Button>
                  <button 
                    onClick={() => setEditingAssignment(assignment)} 
                    className="p-1.5 rounded-lg text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                    title="Edit Assignment"
                  >
                    <Pencil size={15} />
                  </button>
                  <button 
                    onClick={() => setDeleteTargetId(assignment.id)} 
                    className="p-1.5 rounded-lg text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Assignment"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <CreateAssignmentModal 
        open={isCreateModalOpen || !!editingAssignment} 
        initialData={editingAssignment}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingAssignment(null)
        }} 
      />

      <ConfirmModal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment and all student submissions? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTargetId) { deleteMutation.mutate(deleteTargetId); setDeleteTargetId(null) }
        }}
      />
    </div>
  )
}
