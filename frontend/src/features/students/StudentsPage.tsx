import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Filter, UserCheck, UserX, MoreVertical, Edit, Trash2, KeyRound, Layers, BookOpen, Users } from 'lucide-react'
import { useStudents, useDeleteStudent, useToggleStudentActive } from '@/api/resources/students'
import { Button, Input, Avatar, Badge, Skeleton, EmptyState, Card } from '@/components/ui'
import { Dropdown, ConfirmModal } from '@/components/ui/overlays'
import AddEditStudentModal from './AddEditStudentModal'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import AssignBatchModal from './AssignBatchModal'
import AssignCourseModal from './AssignCourseModal'
import { timeAgo, cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import type { Student } from '@/types'

import { Pagination } from '@/components/ui/Pagination'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<string>('name')
  const [addOpen, setAddOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [assignBatchTarget, setAssignBatchTarget] = useState<Student | null>(null)
  const [assignCourseTarget, setAssignCourseTarget] = useState<Student | null>(null)

  const { data, isLoading } = useStudents({
    search: search || undefined,
    active: filterActive,
    page,
    sort: sortBy,
    include: 'batches,courses',
    fields: 'id,name,email,phone,avatar,active,last_login_at,created_at',
    per_page: perPage,
  })

  // Fetch all students within max allowed pagination limit (100) to calculate global KPI totals
  const { data: allStudentsData } = useStudents({ per_page: 100 })

  const { mutate: deleteStudent, isPending: deleting } = useDeleteStudent()
  const { mutate: toggleActive } = useToggleStudentActive()

  const students = Array.isArray(data) ? data : (data?.data ?? [])
  const allStudents = Array.isArray(allStudentsData) ? allStudentsData : (allStudentsData?.data ?? students)

  const total = useMemo(() => {
    if (Array.isArray(allStudents) && allStudents.length > 0) return allStudents.length
    if ((data as any)?.meta?.total !== undefined) return Number((data as any).meta.total)
    if ((data as any)?.total !== undefined) return Number((data as any).total)
    return students.length
  }, [allStudents, data, students])

  const activeCount = useMemo(() => allStudents.filter((s) => s.active).length, [allStudents])
  const inactiveCount = useMemo(() => allStudents.filter((s) => !s.active).length, [allStudents])
  const newThisMonthCount = useMemo(() => allStudents.filter((s) => {
    const d = new Date(s.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length, [allStudents])

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Single-Line Header Bar matching Users & Roles Pages */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <Users size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Students
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              {total} total enrolled students
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Add Student</span>
            <span className="inline sm:hidden">+ Student</span>
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Sparkline Cards Row */}
      <div className="admin-stats-row">
        {/* Card 1: Total Students */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Students</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{total}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">Enrolled platform</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Active Students */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Active Students</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{activeCount}</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">{allStudents.length ? Math.round((activeCount / allStudents.length) * 100) : 100}% active</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Inactive Students */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <UserX size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Inactive Students</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{inactiveCount}</h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Pending / Inactive</p>
            </div>
          </div>
          <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: New This Month */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Plus size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">New This Month</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{newThisMonthCount}</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Recent signups</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q25,35 50,15 T100,25" />
            </svg>
          </div>
        </Card>
      </div>

      {/* Search & Filter Bar with Workable Filter Button */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Left Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Workable Filter Toggle Button on Right Side */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0",
              showFilters || filterActive !== undefined
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {filterActive !== undefined && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel - Side by Side */}
        {(showFilters || filterActive !== undefined) && (
          <div className="p-2.5 sm:p-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
              {[
                { label: 'All Students', value: undefined },
                { label: 'Active', value: true },
                { label: 'Inactive', value: false },
              ].map((f) => (
                <button
                  key={String(f.label)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0',
                    filterActive === f.value
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] border border-[rgb(var(--border))]',
                  )}
                  onClick={() => { setFilterActive(f.value); setPage(1) }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filterActive !== undefined && (
              <button
                onClick={() => { setFilterActive(undefined); setPage(1) }}
                className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Data View (Mobile Card List + Desktop Table) */}
      <Card className="p-4 sm:p-6 border border-[rgb(var(--border))]">
        {/* 1. Mobile Cards List View (< sm) */}
        <div className="block sm:hidden space-y-2.5">
          {students.length === 0 ? (
            <div className="p-8 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
              No students found.
            </div>
          ) : (
            students.map((s) => (
              <div key={s.id} className="p-3 rounded-xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--bg-surface))] space-y-2.5 text-xs shadow-xs">
                {/* Top Row: Avatar, Name & Status + Action Dropdown */}
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/teacher/students/${s.id}`} className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80">
                    <Avatar src={s.avatar} name={s.name} size="md" online={s.active} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-xs text-[rgb(var(--text-primary))] truncate">{s.name}</p>
                        <Badge variant={s.active ? 'success' : 'error'} dot className="text-[8px]">
                          {s.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">{s.email}</p>
                    </div>
                  </Link>

                  <Dropdown
                    trigger={<Button variant="ghost" size="sm" leftIcon={<MoreVertical size={14} />} />}
                    items={[
                      { label: 'Edit Student', icon: <Edit size={14} />, onClick: () => setEditStudent(s) },
                      { label: 'Assign Batches', icon: <Layers size={14} />, onClick: () => setAssignBatchTarget(s) },
                      { label: 'Assign Courses', icon: <BookOpen size={14} />, onClick: () => setAssignCourseTarget(s) },
                      { label: s.active ? 'Deactivate' : 'Activate', icon: s.active ? <UserX size={14} /> : <UserCheck size={14} />, onClick: () => toggleActive({ id: s.id, active: !s.active }) },
                      { label: 'Delete Student', icon: <Trash2 size={14} />, danger: true, onClick: () => setDeleteTarget(s) },
                    ]}
                  />
                </div>

                {/* Bottom Row Batches & Active Status */}
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[rgb(var(--border))]/40">
                  <div className="flex flex-wrap gap-1">
                    {(s.batches ?? []).map(b => (
                      <Badge key={b.id} variant="primary" className="text-[8px]">{b.name}</Badge>
                    ))}
                    {(!s.batches || s.batches.length === 0) && (
                      <span className="text-[10px] text-[rgb(var(--text-muted))]">No batch</span>
                    )}
                  </div>
                  <span className="text-[10px] text-[rgb(var(--text-muted))]">
                    {s.last_login_at ? timeAgo(s.last_login_at) : 'Never'}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Mobile Pagination */}
          {students.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={data?.meta?.current_page ?? page}
                totalPages={data?.meta?.last_page ?? 1}
                perPage={perPage}
                totalItems={total}
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
                header: 'Student',
                accessor: (s: Student) => (
                  <Link to={`/teacher/students/${s.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <Avatar src={s.avatar} name={s.name} size="md" online={s.active} />
                    <div>
                      <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{s.name}</p>
                      <p className="text-xs text-[rgb(var(--text-muted))]">{s.email}</p>
                    </div>
                  </Link>
                ),
                sortable: true,
                sortKey: 'name',
              },
              {
                header: 'Batch',
                accessor: (s: Student) => (
                  <div className="flex flex-wrap gap-1">
                    {(s.batches ?? []).map(b => (
                      <Badge key={b.id} variant="primary">{b.name}</Badge>
                    ))}
                    {(!s.batches || s.batches.length === 0) && (
                      <span className="text-xs text-[rgb(var(--text-muted))]">No batch</span>
                    )}
                  </div>
                )
              },
              {
                header: 'Status',
                accessor: (s: Student) => (
                  <Badge variant={s.active ? 'success' : 'error'} dot>
                    {s.active ? 'Active' : 'Inactive'}
                  </Badge>
                ),
                sortable: true,
                sortKey: 'active',
              },
              {
                header: 'Last Active',
                accessor: (s: Student) => s.last_login_at ? timeAgo(s.last_login_at) : 'Never',
              },
              {
                header: 'Actions',
                accessor: (s: Student) => (
                  <Dropdown
                    trigger={<Button variant="ghost" size="sm" leftIcon={<MoreVertical size={14} />} />}
                    items={[
                      { label: 'Edit Student', icon: <Edit size={14} />, onClick: () => setEditStudent(s) },
                      { label: 'Assign Batches', icon: <Layers size={14} />, onClick: () => setAssignBatchTarget(s) },
                      { label: 'Assign Courses', icon: <BookOpen size={14} />, onClick: () => setAssignCourseTarget(s) },
                      { label: s.active ? 'Deactivate' : 'Activate', icon: s.active ? <UserX size={14} /> : <UserCheck size={14} />, onClick: () => toggleActive({ id: s.id, active: !s.active }) },
                      { label: 'Delete Student', icon: <Trash2 size={14} />, danger: true, onClick: () => setDeleteTarget(s) },
                    ]}
                  />
                ),
              }
            ]}
            data={students}
            meta={{
              current_page: data?.meta?.current_page ?? 1,
              last_page: data?.meta?.last_page ?? 1,
              per_page: data?.meta?.per_page ?? perPage,
              total: total
            }}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onSortChange={setSortBy}
            loading={isLoading}
          />
        </div>
      </Card>

      {/* Modals */}
      <AddEditStudentModal open={addOpen || !!editStudent} onClose={() => { setAddOpen(false); setEditStudent(null) }} student={editStudent} />
      <AssignBatchModal open={!!assignBatchTarget} onClose={() => setAssignBatchTarget(null)} student={assignBatchTarget} />
      <AssignCourseModal open={!!assignCourseTarget} onClose={() => setAssignCourseTarget(null)} student={assignCourseTarget} />
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteStudent(deleteTarget.id); setDeleteTarget(null) }}
        loading={deleting}
        title="Delete Student"
        message={`Delete student account for ${deleteTarget?.name}?`}
        confirmLabel="Delete"
        variant="error"
      />
    </div>
  )
}

