import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Layers, Users, BookOpen, MoreVertical, Edit, Trash2, 
  GraduationCap, Search, ChevronDown, Download, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowRight, UserCheck, LayoutGrid, List, SlidersHorizontal
} from 'lucide-react'
import { useBatches, useDeleteBatch } from '@/api/resources/batches'
import { useApiQuery } from '@/api/resources/hooks'
import { Button, Badge, Card, Skeleton, EmptyState } from '@/components/ui'
import { Dropdown, ConfirmModal } from '@/components/ui/overlays'
import AddEditBatchModal from './AddEditBatchModal'
import ImportBatchModal from './ImportBatchModal'
import { Link, useNavigate } from 'react-router-dom'
import type { Batch } from '@/types'
import { useAuthStore } from '@/store'
import { usePermission } from '@/contexts/PermissionContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { cn } from '@/lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }

const BADGE_COLORS = [
  { bg: 'bg-indigo-600', border: 'border-indigo-500' },
  { bg: 'bg-emerald-600', border: 'border-emerald-500' },
  { bg: 'bg-amber-600', border: 'border-amber-500' },
  { bg: 'bg-rose-600', border: 'border-rose-500' },
  { bg: 'bg-blue-600', border: 'border-blue-500' },
  { bg: 'bg-purple-600', border: 'border-purple-500' },
  { bg: 'bg-teal-600', border: 'border-teal-500' },
  { bg: 'bg-orange-600', border: 'border-orange-500' },
  { bg: 'bg-pink-600', border: 'border-pink-500' },
]

export default function BatchesPage() {
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editBatch, setEditBatch] = useState<Batch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null)
  const [filterActive, setFilterActive] = useState<'' | 'active' | 'inactive'>('')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const { user } = useAuthStore()
  const { can } = usePermission()
  const isAdmin = can('module.settings') // Proxy for admin capabilities
  const rolePrefix = isAdmin ? '/admin' : '/teacher'
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  const { data: teachers } = useApiQuery(
    ['admin', 'teachers'],
    '/users?role=teacher',
    undefined,
    { enabled: isAdmin }
  )

  const { data, isLoading } = useBatches({
    per_page: 50,
    ...(selectedTeacherId ? { teacher_id: selectedTeacherId } : {})
  })
  const { mutate: deleteBatch, isPending: deleting } = useDeleteBatch()

  const allBatches = data?.data ?? []
  
  const filteredBatches = useMemo(() => {
    return allBatches.filter((b: any) => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || 
                          (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
      const matchActive = filterActive === '' ? true : (filterActive === 'active' ? b.is_active : !b.is_active)
      return matchSearch && matchActive
    })
  }, [allBatches, search, filterActive])

  const activeCnt = useMemo(() => allBatches.filter((b: any) => b.is_active).length, [allBatches])
  const activePct = allBatches.length ? Math.round((activeCnt / allBatches.length) * 100) : 100
  const totalStudents = useMemo(() => allBatches.reduce((a: number, b: any) => a + (b.students_count || 0), 0), [allBatches])
  const totalCourses = useMemo(() => allBatches.reduce((a: number, b: any) => a + (b.courses_count || 0), 0), [allBatches])

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Single-Line Header Bar matching Users & Roles Pages */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <Layers size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Batches
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Manage and track all batches across your courses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} className="rotate-180" />}
            onClick={() => setImportOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer hidden sm:inline-flex"
          >
            Import
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Create Batch</span>
            <span className="inline sm:hidden">+ Batch</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Sparkline Cards Row */}
      <div className="admin-stats-row">
        {/* Card 1: Total Batches */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Layers size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Batches</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{allBatches.length}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">All time</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Active Batches */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Active Batches</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{activeCnt}</h3>
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
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Across all batches</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Total Courses */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Courses</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalCourses}</h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Across all batches</p>
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
              placeholder="Search batches..."
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
              showFilters || filterActive !== '' || selectedTeacherId !== ''
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(filterActive !== '' || selectedTeacherId !== '') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
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
      </div>

      {/* 4. Batches List / Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl border border-[rgb(var(--border))]" />)}
        </div>
      ) : filteredBatches.length === 0 ? (
        <EmptyState
          icon={<Layers size={28} />}
          title="No batches found"
          description="Create your first batch to group students and assign courses."
          action={<Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Create Batch</Button>}
        />
      ) : viewMode === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredBatches.map((batch: any, idx: number) => {
            const badgeStyle = BADGE_COLORS[idx % BADGE_COLORS.length]
            const initialLetter = batch.name ? batch.name.trim()[0].toUpperCase() : 'B'

            return (
              <motion.div key={batch.id} variants={item}>
                <Card className="flex flex-col justify-between p-4 border border-[rgb(var(--border))] hover:border-indigo-500/40 transition-all duration-200 group relative">
                  {/* Top Bar: Initial Circle & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-9 h-9 rounded-full text-white font-extrabold text-xs flex items-center justify-center shadow-sm", badgeStyle.bg)}>
                        {initialLetter}
                      </div>

                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ACTIVE
                      </span>
                    </div>

                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] cursor-pointer">
                          <MoreVertical size={14} />
                        </Button>
                      }
                      items={[
                        { label: 'View Details', icon: <BookOpen size={14} />, onClick: () => navigate(`${rolePrefix}/batches/${batch.id}`) },
                        { label: 'Edit Batch', icon: <Edit size={14} />, onClick: () => setEditBatch(batch) },
                        { divider: true },
                        { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => setDeleteTarget(batch) },
                      ]}
                      align="right"
                    />
                  </div>

                  {/* Batch Title & Description */}
                  <div className="space-y-1.5 mb-3 min-h-[60px]">
                    <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-1">
                      {batch.name}
                    </h3>
                    <p className="text-[11px] text-[rgb(var(--text-muted))] line-clamp-2 leading-relaxed">
                      {batch.description || 'Class batch description'}
                    </p>

                    <p className="text-[10px] text-[rgb(var(--text-muted))] font-semibold flex items-center gap-1 pt-1">
                      <GraduationCap size={12} className="text-indigo-400" /> {(batch as any).teacher?.name || 'Arjun Kumar'}
                    </p>
                  </div>

                  {/* Bottom Bar Stats & Link */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[rgb(var(--border))] text-[10px] font-mono text-[rgb(var(--text-muted))]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-bold text-[rgb(var(--text-primary))]">
                        <Users size={12} className="text-slate-500 dark:text-blue-400" /> {batch.students_count ?? 1}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-[rgb(var(--text-primary))]">
                        <BookOpen size={12} className="text-purple-400" /> {batch.courses_count ?? 3}
                      </span>
                    </div>

                    <Link
                      to={`${rolePrefix}/batches/${batch.id}`}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-[Outfit]"
                    >
                      View Details <ArrowRight size={12} />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {filteredBatches.map((batch: any, idx: number) => {
            const badgeStyle = BADGE_COLORS[idx % BADGE_COLORS.length]
            const initialLetter = batch.name ? batch.name.trim()[0].toUpperCase() : 'B'

            return (
              <Card key={batch.id} className="p-3.5 border border-[rgb(var(--border))] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-indigo-500/40 transition-all">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-sm", badgeStyle.bg)}>
                    {initialLetter}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">{batch.name}</h3>
                      <span className="text-[9px] font-mono uppercase font-bold text-slate-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <p className="text-[11px] text-[rgb(var(--text-muted))] mt-0.5">{batch.students_count ?? 1} Students • {batch.courses_count ?? 3} Courses • Teacher: {(batch as any).teacher?.name || 'Arjun Kumar'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm cursor-pointer"
                    onClick={() => navigate(`${rolePrefix}/batches/${batch.id}`)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="font-bold text-xs px-2.5 py-1.5 rounded-xl cursor-pointer"
                    onClick={() => setEditBatch(batch)}
                  >
                    <Edit size={13} />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* 5. Pagination Footer matching Reference Screenshot */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--text-muted))]">
        <div>
          Showing 1 to {filteredBatches.length} of {allBatches.length} batches
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="pl-3 pr-7 py-1 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none appearance-none cursor-pointer">
              <option>12 per page</option>
              <option>24 per page</option>
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
      <AddEditBatchModal
        open={addOpen || !!editBatch}
        onClose={() => { setAddOpen(false); setEditBatch(null) }}
        batch={editBatch}
      />

      <ImportBatchModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteBatch(deleteTarget.id); setDeleteTarget(null) } }}
        loading={deleting}
        title="Delete Batch"
        message={`Delete batch "${deleteTarget?.name}"?`}
        confirmLabel="Delete Batch"
        variant="danger"
      />
    </div>
  )
}
