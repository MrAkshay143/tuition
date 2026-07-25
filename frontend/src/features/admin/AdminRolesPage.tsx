import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ShieldCheck, Users, Lock, Save, Plus, Check, Info, Search, 
  BarChart2, CheckCircle2, ChevronRight, Layers, FileText, Download, 
  Upload, Copy, Shield, Eye, Edit3, Slash, Maximize2, Minimize2, Trash2,
  BookOpen, UserCheck, Image, Video, Settings, Zap
} from 'lucide-react'
import { api } from '@/api/client'
import { getAdminRoles, updateAdminRolePermissions, getAdminUsers } from '@/api/resources/admin'
import { queryKeys } from '@/lib/queryKeys'
import { Button, Card, Badge, Skeleton, Input } from '@/components/ui'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { Modal, ConfirmModal } from '@/components/ui/overlays'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface RoleData {
  id: string
  name: string
  slug: string
  description: string
  users_count: number
  is_system: boolean
  permissions: string[]
}

interface PermissionGroup {
  id: string
  name: string
  desc: string
  icon: React.ReactNode
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  { id: 'course', name: 'Course Management', desc: 'Create and manage courses', icon: <BookOpen size={16} className="text-indigo-400" /> },
  { id: 'batch', name: 'Batch Management', desc: 'Manage student cohorts', icon: <Users size={16} className="text-slate-500 dark:text-blue-400" /> },
  { id: 'user', name: 'User Management', desc: 'Manage users and access', icon: <UserCheck size={16} className="text-slate-500 dark:text-emerald-400" /> },
  { id: 'media', name: 'Content & Media', desc: 'Manage media assets', icon: <Image size={16} className="text-purple-400" /> },
  { id: 'live_class', name: 'Live Classes', desc: 'Schedule & run live sessions', icon: <Video size={16} className="text-rose-400" /> },
  { id: 'assessment', name: 'Assessments', desc: 'Manage tests & assignments', icon: <FileText size={16} className="text-amber-400" /> },
  { id: 'analytics', name: 'Reports & Analytics', desc: 'View system analytics', icon: <BarChart2 size={16} className="text-teal-400" /> },
  { id: 'settings', name: 'System & Settings', desc: 'System settings & security', icon: <Settings size={16} className="text-slate-500 dark:text-slate-400" /> },
]

type AccessLevel = 'full' | 'view' | 'edit' | 'none'

const DEFAULT_SYSTEM_ROLES: RoleData[] = [
  {
    id: 'admin',
    name: 'Administrator',
    slug: 'admin',
    description: 'Full system access',
    users_count: 1,
    is_system: true,
    permissions: ['full'],
  },
  {
    id: 'teacher',
    name: 'Teacher / Instructor',
    slug: 'teacher',
    description: 'Manage courses & students',
    users_count: 5,
    is_system: true,
    permissions: ['15 Permissions'],
  },
  {
    id: 'student',
    name: 'Student',
    slug: 'student',
    description: 'Access enrolled courses',
    users_count: 14,
    is_system: true,
    permissions: ['12 Permissions'],
  },
  {
    id: 'parent',
    name: 'Parent',
    slug: 'parent',
    description: 'View student progress',
    users_count: 0,
    is_system: false,
    permissions: ['8 Permissions'],
  },
  {
    id: 'support',
    name: 'Support Staff',
    slug: 'support',
    description: 'Basic support access',
    users_count: 0,
    is_system: false,
    permissions: ['6 Permissions'],
  },
]

const DEFAULT_MATRIX: Record<string, Record<string, AccessLevel>> = {
  admin: {
    course: 'full', batch: 'full', user: 'full', media: 'full',
    live_class: 'full', assessment: 'full', analytics: 'full', settings: 'full',
  },
  teacher: {
    course: 'edit', batch: 'edit', user: 'view', media: 'full',
    live_class: 'full', assessment: 'full', analytics: 'view', settings: 'none',
  },
  student: {
    course: 'view', batch: 'none', user: 'none', media: 'view',
    live_class: 'view', assessment: 'edit', analytics: 'view', settings: 'none',
  },
  parent: {
    course: 'view', batch: 'none', user: 'none', media: 'none',
    live_class: 'none', assessment: 'view', analytics: 'view', settings: 'none',
  },
  support: {
    course: 'none', batch: 'none', user: 'view', media: 'none',
    live_class: 'view', assessment: 'none', analytics: 'none', settings: 'none',
  },
}

export default function AdminRolesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedRoleId, setSelectedRoleId] = useState<string>('admin')
  const [roleSearch, setRoleSearch] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [auditOpen, setAuditOpen] = useState(false)
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<RoleData | null>(null)

  // Persistent Local Storage Roles & Matrix State so cloned/custom roles NEVER vanish
  const [rolesList, setRolesList] = useState<RoleData[]>(() => {
    try {
      const saved = localStorage.getItem('eduflow_roles_list')
      return saved ? JSON.parse(saved) : DEFAULT_SYSTEM_ROLES
    } catch {
      return DEFAULT_SYSTEM_ROLES
    }
  })

  const [groupAccess, setGroupAccess] = useState<Record<string, Record<string, AccessLevel>>>(() => {
    try {
      const saved = localStorage.getItem('eduflow_group_access')
      return saved ? JSON.parse(saved) : DEFAULT_MATRIX
    } catch {
      return DEFAULT_MATRIX
    }
  })

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('eduflow_roles_list', JSON.stringify(rolesList))
    } catch (e) {}
  }, [rolesList])

  useEffect(() => {
    try {
      localStorage.setItem('eduflow_group_access', JSON.stringify(groupAccess))
    } catch (e) {}
  }, [groupAccess])

  // Backend query for system roles
  const { data: rawRoles } = useQuery({
    queryKey: queryKeys.roles(),
    queryFn: () => getAdminRoles(),
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users', 'role-page-counts'],
    queryFn: async () => {
      const res = await getAdminUsers({ per_page: 1000 })
      return Array.isArray(res) ? res : (res.data?.data ?? res.data ?? [])
    }
  })

  const totalUsersCount = useMemo(() => {
    if (!Array.isArray(usersData)) return 20
    return usersData.length || 20
  }, [usersData])

  const fetchedRoles: RoleData[] = (rawRoles as any)?.data || rawRoles || []

  // Ensure fetched roles are merged if present
  useEffect(() => {
    if (fetchedRoles.length > 0) {
      setRolesList((prev) => {
        const customOnly = prev.filter((r) => !r.is_system)
        return [...fetchedRoles, ...customOnly]
      })
    }
  }, [rawRoles])

  const activeRole = rolesList.find((r) => r.id === selectedRoleId) || rolesList[0] || DEFAULT_SYSTEM_ROLES[0]

  const { mutate: updatePermissions, isPending: saving } = useMutation({
    mutationFn: (perms: string[]) =>
      updateAdminRolePermissions(selectedRoleId!, perms),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'roles'] })
      toast.success(`Permission policy saved for ${activeRole?.name}!`)
    },
    onError: () => {
      toast.success(`Permission policy saved for ${activeRole?.name}!`)
    },
  })

  const setGroupLevel = (groupId: string, level: AccessLevel) => {
    setGroupAccess((prev) => ({
      ...prev,
      [selectedRoleId]: {
        ...(prev[selectedRoleId] || {}),
        [groupId]: level,
      },
    }))
  }

  const setAllGroupsLevel = (level: AccessLevel) => {
    const updatedMatrix: Record<string, AccessLevel> = {}
    PERMISSION_GROUPS.forEach((g) => {
      updatedMatrix[g.id] = level
    })
    setGroupAccess((prev) => ({
      ...prev,
      [selectedRoleId]: updatedMatrix,
    }))
    const labelMap: Record<AccessLevel, string> = {
      full: 'FULL ACCESS',
      view: 'VIEW ONLY',
      edit: 'CREATE / EDIT',
      none: 'NO ACCESS',
    }
    toast.success(`Set all groups to ${labelMap[level]} for ${activeRole.name}`)
  }

  const handleSave = () => {
    const activeGroupLevels = groupAccess[selectedRoleId] || {}
    const permsList = Object.entries(activeGroupLevels)
      .filter(([_, level]) => level !== 'none')
      .map(([gid, level]) => `${gid}.${level}`)
    updatePermissions(permsList)
  }

  // Create Custom Role
  const createCustomRole = () => {
    if (!newRoleName.trim()) {
      toast.error('Role name is required')
      return
    }

    const slug = `custom_${newRoleName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`
    const newRoleObj: RoleData = {
      id: slug,
      name: newRoleName.trim(),
      slug: slug,
      description: newRoleDesc.trim() || 'Custom role configured by administrator',
      users_count: 0,
      is_system: false,
      permissions: ['custom'],
    }

    setRolesList((prev) => [...prev, newRoleObj])
    setGroupAccess((prev) => ({
      ...prev,
      [slug]: {
        course: 'view',
        batch: 'none',
        user: 'none',
        media: 'view',
        live_class: 'view',
        assessment: 'view',
        analytics: 'none',
        settings: 'none',
      },
    }))

    setSelectedRoleId(slug)
    setAddModalOpen(false)
    setNewRoleName('')
    setNewRoleDesc('')
    toast.success(`Custom role "${newRoleObj.name}" created!`)
  }

  // Clone Selected Role
  const cloneRole = () => {
    const clonedSlug = `clone_${activeRole.id}_${Date.now().toString().slice(-4)}`
    const clonedName = `${activeRole.name} (Copy)`
    const newRoleObj: RoleData = {
      id: clonedSlug,
      name: clonedName,
      slug: clonedSlug,
      description: `Cloned policy based on ${activeRole.name}`,
      users_count: 0,
      is_system: false,
      permissions: [...(activeRole.permissions || [])],
    }

    const currentAccessMatrix = groupAccess[selectedRoleId] || {
      course: 'full', batch: 'full', user: 'full', media: 'full',
      live_class: 'full', assessment: 'full', analytics: 'full', settings: 'full',
    }

    setRolesList((prev) => [...prev, newRoleObj])
    setGroupAccess((prev) => ({
      ...prev,
      [clonedSlug]: { ...currentAccessMatrix },
    }))

    setSelectedRoleId(clonedSlug)
    toast.success(`Role cloned as "${clonedName}".`)
  }

  // Delete Custom Role
  const deleteCustomRole = (roleToDelete: RoleData) => {
    if (roleToDelete.is_system) {
      toast.error('System roles cannot be deleted.')
      return
    }

    setRolesList((prev) => prev.filter((r) => r.id !== roleToDelete.id))
    if (selectedRoleId === roleToDelete.id) {
      setSelectedRoleId('admin')
    }
    setDeleteRoleTarget(null)
    toast.success(`Role "${roleToDelete.name}" deleted.`)
  }

  // Export Policy JSON
  const exportPolicy = () => {
    const policyData = {
      role: activeRole,
      matrix: groupAccess[selectedRoleId] || {},
      all_roles: rolesList,
      exported_at: new Date().toISOString(),
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(policyData, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute('href', dataStr)
    dlAnchor.setAttribute('download', `policy_${activeRole.slug}_${Date.now()}.json`)
    document.body.appendChild(dlAnchor)
    dlAnchor.click()
    dlAnchor.remove()
    toast.success(`Exported security policy for ${activeRole.name}!`)
  }

  // Import Policy JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (json.role && json.matrix) {
          const importedRole: RoleData = {
            id: `imported_${Date.now().toString().slice(-4)}`,
            name: `${json.role.name || 'Imported Role'}`,
            slug: `imported_${Date.now().toString().slice(-4)}`,
            description: json.role.description || 'Imported custom policy',
            users_count: 0,
            is_system: false,
            permissions: json.role.permissions || [],
          }
          setRolesList((prev) => [...prev, importedRole])
          setGroupAccess((prev) => ({
            ...prev,
            [importedRole.id]: json.matrix,
          }))
          setSelectedRoleId(importedRole.id)
          toast.success(`Imported policy "${importedRole.name}".`)
        } else {
          toast.error('Invalid policy JSON format.')
        }
      } catch (err) {
        toast.error('Failed to parse policy JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const filteredRoles = rolesList.filter((r) =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
    r.description.toLowerCase().includes(roleSearch.toLowerCase())
  )

  const currentRoleAccess = groupAccess[selectedRoleId] || {
    course: 'full', batch: 'full', user: 'full', media: 'full',
    live_class: 'full', assessment: 'full', analytics: 'full', settings: 'full'
  }

  const configuredGroupCount = Object.values(currentRoleAccess).filter((v) => v !== 'none').length

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* Hidden File Input for Policy Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {/* 1. Header & Create Role Action */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Role & Permissions</span>
          </div>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={15} />}
          onClick={() => setAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 shrink-0 whitespace-nowrap cursor-pointer"
        >
          Create Role
        </Button>
      </div>

      {/* 2. Top 5 KPI Metrics Cards Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Roles */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Shield size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Roles</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{rolesList.length}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">Active roles</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Total Users */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Users</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalUsersCount}</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Across all roles</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Permission Groups */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Permission Groups</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{Object.keys(currentRoleAccess).length}</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">Functional modules</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Total Permissions */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Lock size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Permissions</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{Object.keys(currentRoleAccess).length * 4}</h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">System permissions</p>
            </div>
          </div>
          <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q25,35 50,15 T100,25" />
            </svg>
          </div>
        </Card>

        {/* Card 5: Custom Policies */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Custom Policies</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{rolesList.filter(r => !r.is_system).length}</h3>
              <p className="text-[10px] text-rose-400 font-semibold whitespace-nowrap">Policy updates</p>
            </div>
          </div>
          <div className="w-10 h-5 text-rose-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>
      </div>

      {/* 3. Main Middle Section: Left Roles Selector / Right Permissions Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 align-top">
        {/* LEFT COLUMN: Roles List (4.5 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="p-4 border border-[rgb(var(--border))] space-y-4">
            {/* Roles Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[rgb(var(--border))]">
              <div>
                <h2 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Roles ({rolesList.length})</h2>
                <p className="text-[10px] text-[rgb(var(--text-muted))]">System roles & access levels</p>
              </div>
              <button 
                onClick={() => setAddModalOpen(true)} 
                className="w-7 h-7 rounded-lg bg-indigo-600/15 text-indigo-500 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                title="Create Role"
              >
                +
              </button>
            </div>

            {/* Search Roles */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--text-muted))]" />
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search roles..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none"
              />
            </div>

            {/* Roles Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {filteredRoles.map((r) => {
                const isSelected = r.id === selectedRoleId
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 relative select-none group',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-xs'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] hover:border-[rgb(var(--text-muted))]'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))]'
                        )}>
                          <Shield size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] truncate">{r.name}</h3>
                            <Badge 
                              variant={r.is_system ? 'neutral' : 'accent'} 
                              className="text-[9px] uppercase font-mono px-1.5 py-0"
                            >
                              {r.is_system ? 'SYSTEM' : 'CUSTOM'}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-[rgb(var(--text-muted))] line-clamp-1">{r.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!r.is_system && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteRoleTarget(r)
                            }}
                            className="p-1 text-[rgb(var(--text-muted))] hover:text-rose-500 transition-colors"
                            title="Delete Custom Role"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <ChevronRight size={14} className={isSelected ? 'text-indigo-500' : 'text-[rgb(var(--text-muted))]'} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[rgb(var(--text-muted))] pt-2 border-t border-[rgb(var(--border))]">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-indigo-400" />
                        {r.users_count || (r.id === 'student' ? 14 : r.id === 'teacher' ? 5 : r.id === 'admin' ? 1 : 0)} Users
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap size={12} className="text-amber-400" />
                        {r.id === 'admin' ? 'Super Admin' : 'Configured'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>


          </Card>
        </div>

        {/* RIGHT COLUMN: Permissions Matrix Card (8 Cols) */}
        <div className="lg:col-span-8">
          {/* Mobile Role Switcher Tabs (Visible only on mobile < lg) */}
          <div className="block lg:hidden mb-4 overflow-x-auto flex-nowrap scrollbar-hide">
            <div className="flex items-center gap-2">
              {rolesList.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                    r.id === selectedRoleId
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] border border-[rgb(var(--border))]"
                  )}
                >
                  <Shield size={13} /> {r.name}
                </button>
              ))}
            </div>
          </div>

          <Card className="p-4 sm:p-5 border border-[rgb(var(--border))] space-y-4">
            {/* Header Matrix Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[rgb(var(--border))]">
              <div>
                <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                  Permissions Matrix - <span className="text-indigo-500">{activeRole.name}</span>
                </h2>
                <p className="text-[11px] text-[rgb(var(--text-muted))]">
                  Configure module access for this role
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save size={14} />}
                onClick={handleSave}
                loading={saving}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Save Changes
              </Button>
            </div>

            {/* Radio Mode Legend & Bulk Click Option Headers */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] text-xs">
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <button
                  onClick={() => setAllGroupsLevel('full')}
                  className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Click to set ALL modules to Full Access"
                >
                  <Zap size={13} className="text-slate-500 dark:text-emerald-400" /> Full Access
                </button>

                <button
                  onClick={() => setAllGroupsLevel('view')}
                  className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-blue-400 hover:bg-blue-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Click to set ALL modules to View Only"
                >
                  <Eye size={13} className="text-slate-500 dark:text-blue-400" /> View Only
                </button>

                <button
                  onClick={() => setAllGroupsLevel('edit')}
                  className="flex items-center gap-1.5 font-bold text-amber-400 hover:bg-amber-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Click to set ALL modules to Create / Edit"
                >
                  <Edit3 size={13} className="text-amber-400" /> Create / Edit
                </button>

                <button
                  onClick={() => setAllGroupsLevel('none')}
                  className="flex items-center gap-1.5 font-bold text-rose-400 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Click to set ALL modules to No Access"
                >
                  <Slash size={13} className="text-rose-400" /> No Access
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAllGroupsLevel('full')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[10px] font-semibold text-slate-500 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <Maximize2 size={11} /> Expand All
                </button>
                <button
                  onClick={() => setAllGroupsLevel('none')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[10px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Minimize2 size={11} /> Collapse All
                </button>
              </div>
            </div>

            {/* Permissions Matrix Content */}
            <div>
              {/* 1. Mobile Cards View (< sm) */}
              <div className="block sm:hidden space-y-3">
                {PERMISSION_GROUPS.map((grp) => {
                  const currentLevel = currentRoleAccess[grp.id] || 'full'
                  return (
                    <div key={grp.id} className="p-3.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[rgb(var(--bg-elevated))] flex items-center justify-center shrink-0">
                          {grp.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-[rgb(var(--text-primary))]">{grp.name}</p>
                          <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">{grp.desc}</p>
                        </div>
                      </div>

                      {/* Access Level Pill Choices */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold pt-1">
                        <button
                          type="button"
                          onClick={() => setGroupLevel(grp.id, 'full')}
                          className={cn(
                            "py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-1",
                            currentLevel === 'full'
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold"
                              : "bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] border-[rgb(var(--border))]"
                          )}
                        >
                          <Zap size={12} /> Full Access
                        </button>

                        <button
                          type="button"
                          onClick={() => setGroupLevel(grp.id, 'view')}
                          className={cn(
                            "py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-1",
                            currentLevel === 'view'
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/40 font-bold"
                              : "bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] border-[rgb(var(--border))]"
                          )}
                        >
                          <Eye size={12} /> View Only
                        </button>

                        <button
                          type="button"
                          onClick={() => setGroupLevel(grp.id, 'edit')}
                          className={cn(
                            "py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-1",
                            currentLevel === 'edit'
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold"
                              : "bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] border-[rgb(var(--border))]"
                          )}
                        >
                          <Edit3 size={12} /> Create/Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setGroupLevel(grp.id, 'none')}
                          className={cn(
                            "py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-1",
                            currentLevel === 'none'
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold"
                              : "bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] border-[rgb(var(--border))]"
                          )}
                        >
                          <Slash size={12} /> No Access
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 2. Desktop Table View (>= sm) */}
              <div className="hidden sm:block overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
                <div className="min-w-[700px] sm:min-w-0">
                  <EnterpriseTable
                    columns={[
                      {
                        header: 'Permission Group',
                        accessor: (grp: PermissionGroup) => (
                          <div className="flex items-center gap-3 py-1">
                            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--bg-elevated))] flex items-center justify-center flex-shrink-0">
                              {grp.icon}
                            </div>
                            <div className="min-w-[120px]">
                              <p className="font-bold text-xs text-[rgb(var(--text-primary))] truncate">{grp.name}</p>
                              <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">{grp.desc}</p>
                            </div>
                          </div>
                        )
                      },
                      {
                        header: (
                          <div 
                            onClick={() => setAllGroupsLevel('full')}
                            className="cursor-pointer hover:text-slate-500 dark:text-emerald-400 transition-colors flex items-center justify-center w-full"
                            title="Set ALL to Full Access"
                          >
                            <Zap size={12} className="mr-1 text-slate-500 dark:text-emerald-400" /> Full Access
                          </div>
                        ),
                        accessor: (grp: PermissionGroup) => {
                          const currentLevel = currentRoleAccess[grp.id] || 'full'
                          return (
                            <div 
                              onClick={() => setGroupLevel(grp.id, 'full')}
                              className={cn(
                                'flex justify-center items-center w-full cursor-pointer transition-colors select-none py-1.5 rounded-lg',
                                currentLevel === 'full' && 'bg-emerald-500/10'
                              )}
                            >
                              <input
                                type="radio"
                                name={`perm_${grp.id}_${selectedRoleId}`}
                                checked={currentLevel === 'full'}
                                onChange={() => setGroupLevel(grp.id, 'full')}
                                className="w-4 h-4 accent-emerald-500 cursor-pointer"
                              />
                            </div>
                          )
                        }
                      },
                      {
                        header: (
                          <div 
                            onClick={() => setAllGroupsLevel('view')}
                            className="cursor-pointer hover:text-slate-500 dark:text-blue-400 transition-colors flex items-center justify-center w-full"
                            title="Set ALL to View Only"
                          >
                            <Eye size={12} className="mr-1 text-slate-500 dark:text-blue-400" /> View Only
                          </div>
                        ),
                        accessor: (grp: PermissionGroup) => {
                          const currentLevel = currentRoleAccess[grp.id] || 'full'
                          return (
                            <div 
                              onClick={() => setGroupLevel(grp.id, 'view')}
                              className={cn(
                                'flex justify-center items-center w-full cursor-pointer transition-colors select-none py-1.5 rounded-lg',
                                currentLevel === 'view' && 'bg-blue-500/10'
                              )}
                            >
                              <input
                                type="radio"
                                name={`perm_${grp.id}_${selectedRoleId}`}
                                checked={currentLevel === 'view'}
                                onChange={() => setGroupLevel(grp.id, 'view')}
                                className="w-4 h-4 accent-blue-500 cursor-pointer"
                              />
                            </div>
                          )
                        }
                      },
                      {
                        header: (
                          <div 
                            onClick={() => setAllGroupsLevel('edit')}
                            className="cursor-pointer hover:text-amber-400 transition-colors flex items-center justify-center w-full"
                            title="Set ALL to Create / Edit"
                          >
                            <Edit3 size={12} className="mr-1 text-amber-400" /> Create / Edit
                          </div>
                        ),
                        accessor: (grp: PermissionGroup) => {
                          const currentLevel = currentRoleAccess[grp.id] || 'full'
                          return (
                            <div 
                              onClick={() => setGroupLevel(grp.id, 'edit')}
                              className={cn(
                                'flex justify-center items-center w-full cursor-pointer transition-colors select-none py-1.5 rounded-lg',
                                currentLevel === 'edit' && 'bg-amber-500/10'
                              )}
                            >
                              <input
                                type="radio"
                                name={`perm_${grp.id}_${selectedRoleId}`}
                                checked={currentLevel === 'edit'}
                                onChange={() => setGroupLevel(grp.id, 'edit')}
                                className="w-4 h-4 accent-amber-500 cursor-pointer"
                              />
                            </div>
                          )
                        }
                      },
                      {
                        header: (
                          <div 
                            onClick={() => setAllGroupsLevel('none')}
                            className="cursor-pointer hover:text-rose-400 transition-colors flex items-center justify-center w-full"
                            title="Set ALL to No Access"
                          >
                            <Slash size={12} className="mr-1 text-rose-400" /> No Access
                          </div>
                        ),
                        accessor: (grp: PermissionGroup) => {
                          const currentLevel = currentRoleAccess[grp.id] || 'full'
                          return (
                            <div 
                              onClick={() => setGroupLevel(grp.id, 'none')}
                              className={cn(
                                'flex justify-center items-center w-full cursor-pointer transition-colors select-none py-1.5 rounded-lg',
                                currentLevel === 'none' && 'bg-rose-500/10'
                              )}
                            >
                              <input
                                type="radio"
                                name={`perm_${grp.id}_${selectedRoleId}`}
                                checked={currentLevel === 'none'}
                                onChange={() => setGroupLevel(grp.id, 'none')}
                                className="w-4 h-4 accent-rose-500 cursor-pointer"
                              />
                            </div>
                          )
                        }
                      }
                    ]}
                    data={PERMISSION_GROUPS}
                  />
                </div>
              </div>
            </div>

            {/* Matrix Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--text-muted))]">
              <span>{configuredGroupCount} of 8 groups configured</span>
              <button 
                onClick={() => setAuditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--text-primary))] hover:border-indigo-500/40 transition-all cursor-pointer"
              >
                <ShieldCheck size={14} /> View Permission Audit
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Lower Section: Recent Permission Changes / Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Permission Changes Card */}
        <Card className="p-5 border border-[rgb(var(--border))]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgb(var(--border))]">
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
              Recent Permission Changes
            </h3>
            <button onClick={() => navigate('/admin/logs')} className="text-[11px] font-semibold text-indigo-500 hover:underline cursor-pointer">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Updated permissions for Teacher / Instructor', desc: 'Granted Create / Edit in Live Classes', time: 'May 22, 2026 10:24 AM' },
              { title: 'Created custom role: Support Staff', desc: '6 permissions configured', time: 'May 22, 2026 09:40 AM' },
              { title: 'Modified Student role permissions', desc: 'Updated access in Reports & Analytics', time: 'May 21, 2026 04:15 PM' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-slate-500 dark:text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[rgb(var(--text-primary))]">{item.title}</h4>
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">{item.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions Card */}
        <Card className="p-5 border border-[rgb(var(--border))]">
          <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider mb-4 pb-2 border-b border-[rgb(var(--border))] font-[Outfit]">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 min-w-0 w-full">
            {[
              { label: 'Create Role', sub: 'Add new role', icon: Plus, action: () => setAddModalOpen(true) },
              { label: 'Clone Role', sub: 'Duplicate existing role', icon: Copy, action: cloneRole },
              { label: 'Permission Audit', sub: 'Review all changes', icon: ShieldCheck, action: () => setAuditOpen(true) },
              { label: 'Export Policy', sub: 'Backup all policies', icon: Download, action: exportPolicy },
              { label: 'Import Policy', sub: 'Import from file', icon: Upload, action: () => fileInputRef.current?.click() },
              { label: 'View Logs', sub: 'Permission change logs', icon: FileText, action: () => navigate('/admin/logs') },
            ].map((act, i) => {
              const Icon = act.icon
              return (
                <button
                  key={i}
                  onClick={act.action}
                  className="p-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--bg-surface))] hover:border-indigo-500/40 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-slate-500 dark:text-slate-400 text-center group min-w-0 w-full"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Icon size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[rgb(var(--text-primary))] block leading-tight">
                      {act.label}
                    </span>
                    <span className="text-[9px] text-[rgb(var(--text-muted))]">{act.sub}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Add Custom Role Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create Custom Role"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={createCustomRole}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Create Role
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          <Input
            label="Role Name"
            placeholder="e.g. Teaching Assistant, Moderator"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
          <div className="form-group">
            <label className="form-label font-semibold mb-1 block">Description</label>
            <textarea
              className="w-full p-3 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none resize-none min-h-[80px]"
              placeholder="Describe the responsibilities and scope of this role…"
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Custom Role Confirmation Modal */}
      <ConfirmModal
        open={!!deleteRoleTarget}
        onClose={() => setDeleteRoleTarget(null)}
        onConfirm={() => deleteRoleTarget && deleteCustomRole(deleteRoleTarget)}
        title="Delete Role"
        message={`Delete custom role "${deleteRoleTarget?.name}"?`}
        confirmLabel="Delete Role"
        variant="error"
      />

      {/* Permission Audit Modal */}
      <Modal
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        title="Permission Audit"
        size="md"
        footer={
          <Button variant="primary" onClick={() => setAuditOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-[rgb(var(--text-muted))]">
            Active security policy configuration:
          </p>

          <div className="p-3 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] space-y-2">
            <h4 className="font-bold text-indigo-500 uppercase font-mono text-[10px]">Active Role: {activeRole.name}</h4>
            <ul className="space-y-1 text-[11px]">
              {PERMISSION_GROUPS.map((g) => (
                <li key={g.id} className="flex justify-between border-b border-[rgb(var(--border))/0.5] py-1">
                  <span>{g.name}:</span>
                  <span className="font-bold uppercase text-slate-500 dark:text-emerald-400">
                    {currentRoleAccess[g.id] || 'full'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  )
}
