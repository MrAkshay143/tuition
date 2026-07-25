import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Plus, Edit, Trash2, UserCheck, UserX, MoreVertical, Search, 
  Users, Download, SlidersHorizontal, ChevronDown, ChevronLeft, 
  ChevronRight, Check, Filter, ShieldCheck, Mail, Calendar, Clock, GraduationCap
} from 'lucide-react'
import { api } from '@/api/client'
import { 
  getAdminUsers, toggleAdminUserActive, deleteAdminUser, createAdminUser, updateAdminUser 
} from '@/api/resources/admin'
import { queryKeys } from '@/lib/queryKeys'
import { Button, Input, Badge, Avatar, Skeleton, Card } from '@/components/ui'
import { Dropdown, ConfirmModal, Modal } from '@/components/ui/overlays'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { timeAgo, cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import type { User, PaginatedResponse } from '@/types'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'

const userSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8).optional().or(z.literal('')),
  role: z.enum(['teacher', 'student', 'admin']),
  active: z.boolean(),
})

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Left Sidebar Filter Checkbox States
  const [activeCheck, setActiveCheck] = useState(true)
  const [inactiveCheck, setInactiveCheck] = useState(true)
  const [studentRoleCheck, setStudentRoleCheck] = useState(true)
  const [teacherRoleCheck, setTeacherRoleCheck] = useState(true)
  const [adminRoleCheck, setAdminRoleCheck] = useState(true)
  const [joinedDateFilter, setJoinedDateFilter] = useState('all')
  const [lastLoginFilter, setLastLoginFilter] = useState('all')

  const qc = useQueryClient()

  // Fetch real users API
  const { data: responseData, isLoading } = useQuery({
    queryKey: queryKeys.users({ search, role: roleFilter === 'all' ? undefined : roleFilter, page, perPage }),
    queryFn: () => getAdminUsers({
      search: search || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter,
      page,
      per_page: perPage,
    }),
    staleTime: 1000 * 60,
  })

  // Mutations
  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      toggleAdminUserActive(id, active),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User status updated.') 
    },
  })

  const { mutate: deleteUser, isPending: deleting } = useMutation({
    mutationFn: (id: number) => deleteAdminUser(id),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User deleted.') 
    },
  })

  const rawUsers: User[] = Array.isArray(responseData) ? responseData : (responseData?.data ?? [])
  const meta = responseData?.meta || { current_page: 1, last_page: 1, per_page: 10, total: rawUsers.length }

  // Apply Real-time Client-Side Filtering
  const users = rawUsers.filter((u) => {
    // Search query filter
    const query = search.toLowerCase().trim()
    const matchesSearch = !query || 
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.phone || '').toLowerCase().includes(query)

    // Role Tab / Dropdown filter
    const matchesRoleTab = roleFilter === 'all' || u.role === roleFilter

    // Role Checkboxes filter
    const isStudent = u.role === 'student' && studentRoleCheck
    const isTeacher = u.role === 'teacher' && teacherRoleCheck
    const isAdmin = u.role === 'admin' && adminRoleCheck
    const matchesRoleCheck = isStudent || isTeacher || isAdmin

    // Status Dropdown & Checkboxes filter
    const isActive = u.active !== false
    const matchesStatusDropdown = statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive)
    const matchesStatusCheck = (isActive && activeCheck) || (!isActive && inactiveCheck)

    return matchesSearch && matchesRoleTab && matchesRoleCheck && matchesStatusDropdown && matchesStatusCheck
  })

  // Dynamic KPI counts computed from real database dataset
  const backendStats = (responseData as any)?.stats
  const totalUsers = backendStats?.total_users ?? meta.total ?? rawUsers.length
  const studentsCount = backendStats?.students_count ?? rawUsers.filter((u) => u.role === 'student').length
  const teachersCount = backendStats?.teachers_count ?? rawUsers.filter((u) => u.role === 'teacher').length
  const adminsCount = backendStats?.admins_count ?? rawUsers.filter((u) => u.role === 'admin').length
  const activeUsersCount = backendStats?.active_users ?? rawUsers.filter((u) => u.active !== false).length
  const usersTrend = backendStats?.users_trend ?? '+0 in last 30 days'

  const activePct = Math.round((activeUsersCount / (totalUsers || 1)) * 100)
  const studentPct = Math.round((studentsCount / (totalUsers || 1)) * 100)
  const teacherPct = Math.round((teachersCount / (totalUsers || 1)) * 100)
  const adminPct = Math.round((adminsCount / (totalUsers || 1)) * 100)

  const resetAllFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
    setActiveCheck(true)
    setInactiveCheck(true)
    setStudentRoleCheck(true)
    setTeacherRoleCheck(true)
    setAdminRoleCheck(true)
    setJoinedDateFilter('all')
    setLastLoginFilter('all')
    setPage(1)
    toast.success('All filters reset')
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(users.map((u) => u.id))
    }
  }

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const exportCSV = () => {
    const headers = ['ID,Name,Email,Role,Active,JoinedAt']
    const rows = users.map((u) => `"${u.id}","${u.name}","${u.email}","${u.role}","${u.active ? 'Active' : 'Disabled'}","${u.created_at}"`)
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `users_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${users.length} filtered users to CSV!`)
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Header & Add User Action */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">User Management</span>
          </div>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={15} />}
          onClick={() => setAddOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 shrink-0 whitespace-nowrap cursor-pointer"
        >
          Add User
        </Button>
      </div>

      {/* 2. Top KPI Metrics Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Users */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Users size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Users</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{totalUsers}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">{usersTrend}</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
          </div>
        </Card>

        {/* Card 2: Active Users */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Active Users</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{activeUsersCount}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">{activePct}% of total users</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${activePct}%` }}></div>
          </div>
        </Card>

        {/* Card 3: Students */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <GraduationCap size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Students</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{studentsCount}</h3>
            <p className="text-[10px] text-amber-400 font-semibold mt-1">{studentPct}% of total users</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${studentPct}%` }}></div>
          </div>
        </Card>

        {/* Card 4: Teachers */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Users size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Teachers</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{teachersCount}</h3>
            <p className="text-[10px] text-cyan-400 font-semibold mt-1">{teacherPct}% of total users</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${teacherPct}%` }}></div>
          </div>
        </Card>
      </div>

      {/* 3. Search Bar & Tab Filters Header Controls */}
      <Card className="p-3 sm:p-4 border border-[rgb(var(--border))] space-y-2.5">
        {/* Top Row: Search Input + Filters Toggle Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, email or phone..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 select-none",
              filtersExpanded
                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                : "border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
          >
            <Filter size={14} className={filtersExpanded ? "text-white" : "text-indigo-400"} /> Filters
          </button>
        </div>

        {/* Second Row: Dropdown Filters & Export CSV (Collapsible when Filters toggle button is clicked) */}
        {filtersExpanded && (
          <div className="flex items-center gap-2 flex-wrap pt-1 animate-in fade-in duration-200">
            <select
              value={roleFilter}
              onChange={(e: any) => setRoleFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--text-primary))] hover:border-indigo-500/40 transition-all cursor-pointer">
              <Download size={14} /> Export CSV
            </button>
          </div>
        )}

        {/* Third Row: Role Pill Badges Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto flex-nowrap scrollbar-hide pt-1">
          {[
            { id: 'all', label: 'All Users', count: totalUsers },
            { id: 'student', label: 'Students', count: studentsCount },
            { id: 'teacher', label: 'Teachers', count: teachersCount },
            { id: 'admin', label: 'Admins', count: adminsCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setRoleFilter(tab.id as any); setPage(1) }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap',
                roleFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] border border-[rgb(var(--border))] hover:text-[rgb(var(--text-primary))]'
              )}
            >
              {tab.label} <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-extrabold', roleFilter === tab.id ? 'bg-indigo-700/80 text-white' : 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-muted))]')}>{tab.count}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 4. Users Table Section */}
      <Card className="p-3 sm:p-4 border border-[rgb(var(--border))] overflow-hidden flex flex-col min-h-[480px]">
        <div className="w-full min-w-0">
          <EnterpriseTable
            columns={[
              {
                header: (
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[rgb(var(--border))] accent-indigo-600"
                  />
                ),
                accessor: (u: User) => (
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.id)}
                    onChange={() => toggleSelectUser(u.id)}
                    className="rounded border-[rgb(var(--border))] accent-indigo-600"
                  />
                )
              },
              {
                header: 'USER',
                sortable: true,
                sortKey: 'name',
                accessor: (u: User) => (
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <div>
                      <p className="font-bold text-xs text-[rgb(var(--text-primary))]">{u.name}</p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">{u.email}</p>
                    </div>
                  </div>
                )
              },
              {
                header: 'ROLE',
                sortable: true,
                sortKey: 'role',
                accessor: (u: User) => (
                  <Badge 
                    variant="neutral"
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5',
                      u.role === 'student' && 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
                      u.role === 'teacher' && 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                      u.role === 'admin' && 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    )}
                  >
                    {u.role || 'STUDENT'}
                  </Badge>
                )
              },
              {
                header: 'STATUS',
                sortable: true,
                sortKey: 'active',
                accessor: (u: User) => (
                  <Badge variant={u.active !== false ? 'success' : 'muted'} className="text-[10px] font-bold bg-emerald-500/10 text-slate-500 dark:text-emerald-500 border border-emerald-500/20">
                    • {u.active !== false ? 'ACTIVE' : 'DISABLED'}
                  </Badge>
                )
              },
              {
                header: 'LAST LOGIN',
                sortable: true,
                sortKey: 'last_login_at',
                accessor: (u: User) => (
                  <span className="text-[rgb(var(--text-secondary))] font-mono text-[11px]">
                    {u.last_login_at ? timeAgo(u.last_login_at) : 'Never'}
                  </span>
                )
              },
              {
                header: 'JOINED',
                sortable: true,
                sortKey: 'created_at',
                accessor: (u: User) => (
                  <span className="text-[rgb(var(--text-muted))] font-mono text-[11px]">
                    {new Date(u.created_at || Date.now()).toLocaleDateString()}
                  </span>
                )
              },
              {
                header: 'ACTIONS',
                accessor: (u: User) => (
                  <div className="text-right">
                    <Dropdown
                      trigger={
                        <button className="p-1 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-colors">
                          <MoreVertical size={15} />
                        </button>
                      }
                      items={[
                        { label: 'Edit Details', icon: <Edit size={14} />, onClick: () => setEditUser(u) },
                        { 
                          label: u.active !== false ? 'Disable Account' : 'Enable Account', 
                          icon: u.active !== false ? <UserX size={14} /> : <UserCheck size={14} />, 
                          onClick: () => toggleActive({ id: u.id, active: u.active === false }) 
                        },
                        { divider: true },
                        { label: 'Delete User', icon: <Trash2 size={14} />, danger: true, onClick: () => setDeleteTarget(u) },
                      ]}
                      align="right"
                    />
                  </div>
                )
              }
            ]}
            data={users}
            meta={meta}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            loading={isLoading}
          />
        </div>
      </Card>

      {/* 5. Quick Summary Card */}
      <Card className="p-4 border border-[rgb(var(--border))]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgb(var(--border))]">
          <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
            Quick Summary
          </h3>
          <a href="/admin/logs" className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View All Reports <ChevronRight size={13} />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]/50 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
            <div>
              <span className="text-[10px] font-medium text-[rgb(var(--text-muted))] block leading-tight mb-1">New users this week</span>
              <span className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">2</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]/50 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[10px] font-medium text-[rgb(var(--text-muted))] block leading-tight mb-1">Users never logged in</span>
              <span className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">0</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]/50 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <div>
              <span className="text-[10px] font-medium text-[rgb(var(--text-muted))] block leading-tight mb-1">Two-factor enabled</span>
              <span className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">4</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]/50 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Mail size={16} />
            </div>
            <div>
              <span className="text-[10px] font-medium text-[rgb(var(--text-muted))] block leading-tight mb-1">Email verified</span>
              <span className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{totalUsers}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* User Add/Edit Modal */}
      <UserFormModal open={addOpen || !!editUser} onClose={() => { setAddOpen(false); setEditUser(null) }} user={editUser} />

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteUser(deleteTarget.id); setDeleteTarget(null) }}
        loading={deleting}
        title="Delete User"
        message={`Delete user account for ${deleteTarget?.name}?`}
        confirmLabel="Delete"
        variant="error"
      />
    </div>
  )
}

function UserFormModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User | null }) {
  const qc = useQueryClient()
  const isEdit = !!user
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student' as const,
      active: true
    },
  })

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name ?? '',
          email: user.email ?? '',
          password: '',
          role: (user.role as 'teacher' | 'student' | 'admin') ?? 'student',
          active: user.active ?? true
        })
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          role: 'student',
          active: true
        })
      }
    }
  }, [user, reset, open])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof userSchema>) => {
      const payload: any = { ...data }
      if (!payload.password) delete payload.password
      return isEdit ? updateAdminUser(user!.id, payload) : createAdminUser(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success(isEdit ? 'User details updated.' : 'User created.')
      onClose()
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit User Profile' : 'Add New User'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit((d) => mutate(d))} loading={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-xs">
        <Input {...register('name')} label="Full Name" placeholder="e.g. Arjun Kumar" error={errors.name?.message} />
        <Input {...register('email')} type="email" label="Email Address" placeholder="arjun@eduflow.ai" error={errors.email?.message} />
        <Input {...register('password')} type="password" label={isEdit ? 'New Password (optional)' : 'Password'} placeholder="Min. 8 characters" error={errors.password?.message} />
        
        <div className="form-group">
          <label className="form-label font-semibold mb-1 block">Account Role</label>
          <select {...register('role')} className="w-full p-2.5 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}
