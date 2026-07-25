import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Search, Download, Calendar, Filter, Users, ShieldCheck, ShieldAlert, 
  ListFilter, MoreVertical, ChevronLeft, ChevronRight, ArrowRight, 
  Activity, CheckCircle2, Clock, Eye, X, Globe, UserCheck
} from 'lucide-react'
import { api } from '@/api/client'
import { getAdminActivityLogs } from '@/api/resources/admin'
import { queryKeys } from '@/lib/queryKeys'
import { Button, Card, Badge, Avatar, Skeleton, Input, Pagination } from '@/components/ui'
import { Dropdown, Modal } from '@/components/ui/overlays'
import { formatDateTime, cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { useNavigate } from 'react-router-dom'
import type { ActivityLog, PaginatedResponse } from '@/types'

const EVENT_BADGES: Record<string, { label: string; color: string }> = {
  created: { label: 'CREATED', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  course_created: { label: 'COURSE_CREATED', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  module_created: { label: 'MODULE_CREATED', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  deleted: { label: 'DELETED', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  course_deleted: { label: 'COURSE_DELETED', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  updated: { label: 'UPDATED', color: 'bg-blue-500/15 text-slate-500 dark:text-blue-400 border-blue-500/30' },
  course_updated: { label: 'COURSE_UPDATED', color: 'bg-blue-500/15 text-slate-500 dark:text-blue-400 border-blue-500/30' },
  course_published: { label: 'COURSE_PUBLISHED', color: 'bg-emerald-500/15 text-slate-500 dark:text-emerald-400 border-emerald-500/30' },
  batch_assigned: { label: 'BATCH_ASSIGNED', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  login: { label: 'LOGIN', color: 'bg-emerald-500/15 text-slate-500 dark:text-emerald-400 border-emerald-500/30' },
  file_uploaded: { label: 'FILE_UPLOADED', color: 'bg-blue-500/15 text-slate-500 dark:text-blue-400 border-blue-500/30' },
  live_class: { label: 'LIVE_CLASS', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  settings_updated: { label: 'SETTINGS_UPDATED', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  backup_completed: { label: 'BACKUP_COMPLETED', color: 'bg-emerald-500/15 text-slate-500 dark:text-emerald-400 border-emerald-500/30' },
}

export default function AdminLogsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [dateRange, setDateRange] = useState('30')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)

  const [showFilters, setShowFilters] = useState(false)

  // Real backend API query
  const { data: responseData, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.activityLogs({ search, event: eventFilter, page, perPage }),
    queryFn: () => getAdminActivityLogs({
      search: search || undefined,
      event: eventFilter || undefined,
      page,
      per_page: perPage,
    }),
    staleTime: 1000 * 30,
  })

  const rawLogs: ActivityLog[] = Array.isArray(responseData) ? responseData : (responseData?.data ?? [])
  const meta = responseData?.meta || { current_page: 1, last_page: 1, per_page: 10, total: rawLogs.length }

  // Dynamic filter application
  const logs = rawLogs.filter((l) => {
    const q = search.toLowerCase().trim()
    const matchesSearch = !q || 
      (l.description || '').toLowerCase().includes(q) ||
      (l.event || '').toLowerCase().includes(q) ||
      (l.ip_address || '').toLowerCase().includes(q) ||
      (l.user?.name || '').toLowerCase().includes(q)

    const matchesEvent = !eventFilter || l.event === eventFilter
    const matchesRole = !userRoleFilter || l.user?.role === userRoleFilter

    return matchesSearch && matchesEvent && matchesRole
  })

  // Real backend statistics from API
  const backendStats = (responseData as any)?.stats
  const totalEvents = backendStats?.total_events ?? meta.total ?? rawLogs.length ?? 0
  const uniqueUsersCount = backendStats?.unique_users ?? Array.from(new Set(rawLogs.map((l) => l.user_id || l.user?.name))).length ?? 0
  const failedEventsCount = backendStats?.failed_actions ?? rawLogs.filter((l) => (l.event || '').includes('deleted') || (l.event || '').includes('failed')).length ?? 0
  const successEventsCount = backendStats?.successful_actions ?? (totalEvents - failedEventsCount)
  const successRate = Math.round((successEventsCount / (totalEvents || 1)) * 100)
  const failureRate = (100 - successRate).toFixed(1)
  const totalEventsTrend = backendStats?.total_events_trend || '+0 this month'
  const uniqueUsersTrend = backendStats?.unique_users_trend || '+0 active this month'

  const topUsersList = useMemo(() => {
    if (backendStats?.top_users && backendStats.top_users.length > 0) {
      const maxCount = Math.max(...backendStats.top_users.map((u: any) => u.count || 1), 1)
      return backendStats.top_users.map((u: any) => ({
        ...u,
        pct: `${Math.round((u.count / maxCount) * 100)}%`
      }))
    }
    const map = new Map<string, { name: string; role: string; count: number }>()
    rawLogs.forEach((l) => {
      const uName = l.user?.name || 'Platform Admin'
      const uRole = l.user?.role || 'Admin'
      if (!map.has(uName)) {
        map.set(uName, { name: uName, role: uRole, count: 1 })
      } else {
        map.get(uName)!.count++
      }
    })
    const sorted = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 4)
    const maxCount = sorted[0]?.count || 1
    return sorted.map((u) => ({
      ...u,
      pct: `${Math.round((u.count / maxCount) * 100)}%`
    }))
  }, [backendStats, rawLogs])

  const topEventsList = useMemo(() => {
    if (backendStats?.top_events && backendStats.top_events.length > 0) {
      const maxCount = Math.max(...backendStats.top_events.map((e: any) => e.count || 1), 1)
      return backendStats.top_events.map((e: any) => ({
        type: e.event || e.type,
        count: e.count,
        pct: `${Math.round((e.count / maxCount) * 100)}%`
      }))
    }
    const map = new Map<string, number>()
    rawLogs.forEach((l) => {
      const evt = l.event || 'activity'
      map.set(evt, (map.get(evt) || 0) + 1)
    })
    const sorted = Array.from(map.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 5)
    const maxCount = sorted[0]?.count || 1
    return sorted.map((e) => ({
      ...e,
      pct: `${Math.round((e.count / maxCount) * 100)}%`
    }))
  }, [backendStats, rawLogs])

  const activityHeatmapData = useMemo(() => {
    const counts = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ]

    rawLogs.forEach((l) => {
      if (!l.created_at) return
      const date = new Date(l.created_at)
      if (isNaN(date.getTime())) return

      const jsDay = date.getDay()
      const dayIdx = jsDay === 0 ? 6 : jsDay - 1

      const hour = date.getHours()
      let timeIdx = 0
      if (hour >= 6 && hour < 12) timeIdx = 1
      else if (hour >= 12 && hour < 18) timeIdx = 2
      else if (hour >= 18) timeIdx = 3

      counts[timeIdx][dayIdx] += 1
    })

    let maxVal = 1
    counts.forEach(row => row.forEach(val => { if (val > maxVal) maxVal = val }))

    const labels = ['12 AM', '6 AM', '12 PM', '6 PM']
    return labels.map((label, rIdx) => ({
      time: label,
      cells: counts[rIdx].map((c) => ({
        count: c,
        opacity: c > 0 ? Math.max(0.3, Math.min(1, c / maxVal)) : 0.1
      }))
    }))
  }, [rawLogs])

  const clearAllFilters = () => {
    setSearch('')
    setEventFilter('')
    setUserRoleFilter('')
    setPage(1)
    toast.success('Filters cleared!')
  }

  const exportLogs = () => {
    const headers = ['ID,User,Role,Event,Description,IP_Address,Date_Time']
    const rows = logs.map((l) => `"${l.id}","${l.user?.name || 'System'}","${l.user?.role || 'System'}","${l.event}","${l.description}","${l.ip_address}","${l.created_at}"`)
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `activity_logs_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${logs.length} activity logs to CSV!`)
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Header Breadcrumbs & Action Controls */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Activity Logs</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--text-primary))] hover:border-indigo-500/40 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download size={14} /> Export Logs
          </button>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer hidden sm:block"
          >
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Sparkline Cards Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Events */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <ListFilter size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Events</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalEvents}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">{totalEventsTrend}</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Unique Users */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Unique Users</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{uniqueUsersCount}</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">{uniqueUsersTrend}</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q25,35 50,15 T100,20" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Successful Actions */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Successful Actions</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{successEventsCount}</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">{successRate}% success rate</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,30 Q30,10 60,20 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Failed Actions */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Failed Actions</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{failedEventsCount}</h3>
              <p className="text-[10px] text-rose-400 font-semibold whitespace-nowrap">{failureRate}% failure rate</p>
            </div>
          </div>
          <div className="w-10 h-5 text-rose-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,15 Q20,35 50,20 T100,30" />
            </svg>
          </div>
        </Card>
      </div>

      {/* 3. Search Bar & Interactive Filter Control */}
      <div className="flex flex-col gap-2.5 bg-[rgb(var(--bg-surface))] p-3 rounded-2xl border border-[rgb(var(--border))]">
        {/* Search Input + Filters Toggle Row */}
        <div className="flex flex-row items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by user, event, description or IP address..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap",
              showFilters || eventFilter || userRoleFilter
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                : "bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] border-[rgb(var(--border))] hover:border-indigo-500/40"
            )}
          >
            <Filter size={14} /> Filters
            {(eventFilter || userRoleFilter) && (
              <span className="w-4 h-4 rounded-full bg-white text-indigo-600 text-[10px] flex items-center justify-center font-bold">
                {(eventFilter ? 1 : 0) + (userRoleFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filter Dropdowns Row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[rgb(var(--border))]/60 text-xs">
            <select
              value={eventFilter}
              onChange={(e) => { setEventFilter(e.target.value); setPage(1) }}
              className="px-3 py-1.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Events</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="login">Login</option>
              <option value="live_class">Live Class</option>
            </select>

            <select
              value={userRoleFilter}
              onChange={(e) => { setUserRoleFilter(e.target.value); setPage(1) }}
              className="px-3 py-1.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="admin">Admins</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        )}
      </div>

        {/* Active Filter Pill Badges */}
        {(search || eventFilter || userRoleFilter) && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {search && (
              <Badge variant="muted" className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
                Search: {search} <X size={12} className="cursor-pointer" onClick={() => setSearch('')} />
              </Badge>
            )}
            {eventFilter && (
              <Badge variant="muted" className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
                Event: {eventFilter} <X size={12} className="cursor-pointer" onClick={() => setEventFilter('')} />
              </Badge>
            )}
            {userRoleFilter && (
              <Badge variant="muted" className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
                Role: {userRoleFilter} <X size={12} className="cursor-pointer" onClick={() => setUserRoleFilter('')} />
              </Badge>
            )}
            <button onClick={clearAllFilters} className="text-xs text-indigo-400 hover:underline font-semibold cursor-pointer">
              Clear all
            </button>
          </div>
        )}

      {/* 4. Activity Logs Table Card */}
      <Card className="p-5 border border-[rgb(var(--border))]">
        {isLoading ? (
          <div className="p-2 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div>
            {/* 1. Mobile Cards List View (< sm) */}
            <div className="block sm:hidden space-y-2.5">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
                  No activity logs found.
                </div>
              ) : (
                logs.map((log) => {
                  const userName = log.user?.name || 'Platform Admin'
                  const userRole = log.user?.role || 'Admin'
                  const eventKey = (log.event || 'updated').toLowerCase()
                  const badgeInfo = EVENT_BADGES[eventKey] || { label: (log.event || 'UPDATED').toUpperCase(), color: 'bg-blue-500/15 text-slate-500 dark:text-blue-400 border-blue-500/30' }

                  return (
                    <div key={log.id} className="p-3 rounded-xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--bg-surface))] space-y-2 text-xs shadow-xs">
                      {/* Top Row: User Avatar + Name & Role on Left, Badge & Menu on Right */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={log.user?.avatar} name={userName} size="xs" />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[rgb(var(--text-primary))] truncate">{userName}</p>
                            <p className="text-[10px] text-[rgb(var(--text-muted))] capitalize leading-tight">{userRole}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn('text-[9px] font-bold font-mono px-2 py-0.5 rounded-md border uppercase tracking-wider', badgeInfo.color)}>
                            {badgeInfo.label}
                          </span>
                          <Dropdown
                            trigger={
                              <button className="p-1 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-colors cursor-pointer">
                                <MoreVertical size={14} />
                              </button>
                            }
                            items={[
                              { label: 'View Event Details', icon: <Eye size={14} />, onClick: () => setSelectedLog(log) },
                              { label: `Filter by ${userName}`, icon: <Users size={14} />, onClick: () => setSearch(userName) },
                              { label: `Filter by IP ${log.ip_address || '127.0.0.1'}`, icon: <Globe size={14} />, onClick: () => setSearch(log.ip_address || '127.0.0.1') },
                            ]}
                            align="right"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-[rgb(var(--text-secondary))] leading-snug break-words">
                        {log.description}
                      </p>

                      {/* Bottom Row: IP + Date Time */}
                      <div className="flex items-center justify-between text-[10px] text-[rgb(var(--text-muted))] pt-1.5 border-t border-[rgb(var(--border))]/40 font-mono">
                        <span>IP: {log.ip_address || '127.0.0.1'}</span>
                        <span>{formatDateTime(log.created_at || new Date().toISOString())}</span>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Mobile Pagination */}
              {logs.length > 0 && (
                <div className="pt-2">
                  <Pagination
                    currentPage={page}
                    totalPages={meta.last_page || 1}
                    perPage={perPage}
                    totalItems={meta.total || logs.length}
                    onPageChange={setPage}
                    onPerPageChange={(size) => {
                      setPerPage(size)
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
                    header: 'USER',
                    accessor: (log: ActivityLog) => {
                      const userName = log.user?.name || 'Platform Admin'
                      const userRole = log.user?.role || 'Admin'
                      return (
                        <div className="flex items-center gap-3">
                          <Avatar src={log.user?.avatar} name={userName} size="sm" />
                          <div>
                            <p className="font-bold text-xs text-[rgb(var(--text-primary))]">{userName}</p>
                            <p className="text-[10px] text-[rgb(var(--text-muted))] capitalize">{userRole}</p>
                          </div>
                        </div>
                      )
                    }
                  },
                  {
                    header: 'EVENT',
                    accessor: (log: ActivityLog) => {
                      const eventKey = (log.event || 'updated').toLowerCase()
                      const badgeInfo = EVENT_BADGES[eventKey] || { label: (log.event || 'UPDATED').toUpperCase(), color: 'bg-blue-500/15 text-slate-500 dark:text-blue-400 border-blue-500/30' }
                      return (
                        <span className={cn('text-[9px] font-bold font-mono px-2 py-0.5 rounded-md border uppercase tracking-wider', badgeInfo.color)}>
                          {badgeInfo.label}
                        </span>
                      )
                    }
                  },
                  {
                    header: 'DESCRIPTION',
                    accessor: (log: ActivityLog) => (
                      <span className="text-xs text-[rgb(var(--text-primary))] font-medium block max-w-md break-words flex-wrap whitespace-normal">
                        {log.description}
                      </span>
                    )
                  },
                  {
                    header: 'IP ADDRESS',
                    accessor: (log: ActivityLog) => (
                      <span className="text-[rgb(var(--text-secondary))] font-mono text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </span>
                    )
                  },
                  {
                    header: 'DATE & TIME',
                    sortable: true,
                    sortKey: 'created_at',
                    accessor: (log: ActivityLog) => (
                      <span className="text-[rgb(var(--text-muted))] font-mono text-[11px]">
                        {formatDateTime(log.created_at || new Date().toISOString())}
                      </span>
                    )
                  },
                  {
                    header: '⚙️',
                    accessor: (log: ActivityLog) => {
                      const userName = log.user?.name || 'Platform Admin'
                      return (
                        <div className="text-right">
                          <Dropdown
                            trigger={
                              <button className="p-1 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-colors cursor-pointer">
                                <MoreVertical size={15} />
                              </button>
                            }
                            items={[
                              { label: 'View Event Details', icon: <Eye size={14} />, onClick: () => setSelectedLog(log) },
                              { label: `Filter by ${userName}`, icon: <Users size={14} />, onClick: () => setSearch(userName) },
                              { label: `Filter by IP ${log.ip_address || '127.0.0.1'}`, icon: <Globe size={14} />, onClick: () => setSearch(log.ip_address || '127.0.0.1') },
                            ]}
                            align="right"
                          />
                        </div>
                      )
                    }
                  }
                ]}
                data={logs}
                meta={meta}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
                loading={false}
              />
            </div>
          </div>
        )}
      </Card>

      {/* 5. Lower Section: Top Users / Top Event Types / Activity Heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Top Users */}
        <Card className="p-5 border border-[rgb(var(--border))] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
              Top Users
            </h3>
            <p className="text-[10px] text-[rgb(var(--text-muted))] mb-4">By activity count</p>

            <div className="space-y-4">
              {topUsersList.map((usr: any, i: number) => {
                const color = i === 0 ? 'bg-purple-500' : i === 1 ? 'bg-blue-500' : 'bg-teal-500'
                const pct = usr.pct || `${Math.min(100, Math.round((usr.count / (totalEvents || 1)) * 100 * 2))}%`
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar name={usr.name} size="xs" />
                        <div>
                          <span className="font-bold text-[rgb(var(--text-primary))] block leading-tight">{usr.name}</span>
                          <span className="text-[10px] text-[rgb(var(--text-muted))]">{usr.role}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-[rgb(var(--text-primary))]">{usr.count}</span>
                    </div>
                    <div className="w-full bg-[rgb(var(--bg-elevated))] h-1.5 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', color)} style={{ width: pct }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center justify-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 pt-4 mt-2 border-t border-[rgb(var(--border))] cursor-pointer"
          >
            View All Users <ArrowRight size={14} />
          </button>
        </Card>

        {/* Card 2: Top Event Types */}
        <Card className="p-5 border border-[rgb(var(--border))] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
              Top Event Types
            </h3>
            <p className="text-[10px] text-[rgb(var(--text-muted))] mb-4">By occurrence</p>

            <div className="space-y-3">
              {topEventsList.map((evt: any, i: number) => {
                const colors = ['bg-purple-500', 'bg-blue-500', 'bg-teal-500', 'bg-emerald-500', 'bg-amber-500']
                const color = colors[i % colors.length]
                const eventName = evt.type || evt.event || 'System Activity'
                const pct = evt.pct || `${Math.min(100, Math.round((evt.count / (totalEvents || 1)) * 100 * 2))}%`
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[rgb(var(--text-secondary))] capitalize">{eventName.replace(/_/g, ' ')}</span>
                      <span className="font-mono font-bold text-[rgb(var(--text-primary))]">{evt.count}</span>
                    </div>
                    <div className="w-full bg-[rgb(var(--bg-elevated))] h-1.5 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', color)} style={{ width: pct }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => setEventFilter('')}
            className="flex items-center justify-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 pt-4 mt-2 border-t border-[rgb(var(--border))] cursor-pointer"
          >
            View All Events <ArrowRight size={14} />
          </button>
        </Card>

        {/* Card 3: Activity Heatmap */}
        <Card className="p-5 border border-[rgb(var(--border))] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
              Activity Heatmap
            </h3>
            <p className="text-[10px] text-[rgb(var(--text-muted))] mb-4">User activity over time</p>

            {/* Heatmap Grid */}
            <div className="space-y-2 text-[10px] w-full overflow-hidden">
              <div className="grid grid-cols-8 md:grid-cols-8 gap-1.5 items-center text-[rgb(var(--text-muted))]">
                <span></span>
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>

              {activityHeatmapData.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-8 md:grid-cols-8 gap-1.5 items-center text-[rgb(var(--text-muted))] font-mono">
                  <span>{row.time}</span>
                  {row.cells.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className="w-full h-4 rounded-sm bg-indigo-600 transition-opacity hover:opacity-100 cursor-pointer"
                      style={{ opacity: cell.opacity }}
                      title={`Activity count: ${cell.count} events (${Math.round(cell.opacity * 100)}%)`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/operations')}
            className="flex items-center justify-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 pt-4 mt-2 border-t border-[rgb(var(--border))] cursor-pointer"
          >
            View Detailed Analytics <ArrowRight size={14} />
          </button>
        </Card>
      </div>

      {/* Log Details Modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Activity Log Event Audit Details"
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setSelectedLog(null)}>
            Close Details
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] space-y-2">
              <p><strong className="text-[rgb(var(--text-muted))]">User:</strong> {selectedLog.user?.name || 'Platform Admin'} ({selectedLog.user?.role || 'Admin'})</p>
              <p><strong className="text-[rgb(var(--text-muted))]">Event:</strong> <span className="font-mono font-bold text-indigo-400">{selectedLog.event}</span></p>
              <p><strong className="text-[rgb(var(--text-muted))]">Description:</strong> {selectedLog.description}</p>
              <p><strong className="text-[rgb(var(--text-muted))]">IP Address:</strong> <span className="font-mono">{selectedLog.ip_address || '127.0.0.1'}</span></p>
              <p><strong className="text-[rgb(var(--text-muted))]">User Agent:</strong> <span className="font-mono text-[10px] text-[rgb(var(--text-muted))]">{selectedLog.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}</span></p>
              <p><strong className="text-[rgb(var(--text-muted))]">Timestamp:</strong> {formatDateTime(selectedLog.created_at || new Date().toISOString())}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
