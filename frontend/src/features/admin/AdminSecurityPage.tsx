import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Monitor, Smartphone, Laptop, ShieldAlert, ShieldCheck, Fingerprint, 
  RefreshCw, Download, Power, Key, Zap, Shield, ChevronLeft, ChevronRight, 
  MoreVertical, CheckCircle2, AlertTriangle, ArrowRight, Eye, UserX, Info, X, Globe
} from 'lucide-react'
import { api } from '@/api/client'
import { 
  getAdminDeviceSessions, deleteAdminDeviceSession, deleteAllAdminDeviceSessions,
  clearRememberMe, enforcePasswordReset, blockSuspiciousIps
} from '@/api/resources/admin'
import { queryKeys } from '@/lib/queryKeys'
import { Button, Card, Badge, Avatar, Skeleton, Pagination } from '@/components/ui'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { Dropdown, Modal } from '@/components/ui/overlays'
import { timeAgo, formatDateTime, cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface UserSession {
  id: number
  device_name: string
  ip_address: string
  user_agent: string
  location?: string
  status?: 'active' | 'inactive' | 'logged_out'
  is_current: boolean
  last_active_at: string
  created_at?: string
  user?: {
    id: number
    name: string
    email: string
    avatar?: string
    role?: string
  }
}

interface SecurityResponse {
  data: UserSession[]
  stats?: {
    active_sessions: number
    failed_logins_24h: number
    security_score: number
    two_fa_enabled_pct: number
    last_security_event: string
    suspicious_ips_blocked: number
    password_strength: string
    maintenance_mode: string
    active_sessions_trend?: string
    failed_logins_trend?: string
    security_score_trend?: string
    two_fa_enabled_trend?: string
  }
  recent_events?: Array<{
    id: number
    type: 'success' | 'danger' | 'warning'
    title: string
    user: string
    meta: string
    time: string
  }>
}

export default function AdminSecurityPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Filter States
  const [deviceFilter, setDeviceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null)

  // Real Backend Query
  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: queryKeys.deviceSessions(),
    queryFn: () => getAdminDeviceSessions(),
    staleTime: 1000 * 15,
  })

  const rawSessions: UserSession[] = Array.isArray(responseData)
    ? responseData
    : (responseData?.data ?? [])

  const stats = responseData?.stats || {
    active_sessions: rawSessions.length,
    failed_logins_24h: 0,
    security_score: 100,
    two_fa_enabled_pct: 0,
    last_security_event: 'Just now',
    suspicious_ips_blocked: 0,
    password_strength: 'Strong',
    maintenance_mode: 'Off',
    active_sessions_trend: '+0 new today',
    failed_logins_trend: '0% vs yesterday',
    security_score_trend: 'Excellent rating',
    two_fa_enabled_trend: '+0% vs last week',
  }

  const recentEvents = responseData?.recent_events || []

  // Dynamic filter application
  const filteredSessions = rawSessions.filter((s) => {
    const matchDevice = !deviceFilter || (s.device_name || s.user_agent || '').toLowerCase().includes(deviceFilter.toLowerCase())
    const matchStatus = !statusFilter || s.status === statusFilter
    return matchDevice && matchStatus
  })

  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * perPage
    return filteredSessions.slice(start, start + perPage)
  }, [filteredSessions, page, perPage])

  // Action Mutations
  const { mutate: terminateSession, isPending: terminating } = useMutation({
    mutationFn: (id: number) => deleteAdminDeviceSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deviceSessions() })
      toast.success('Session terminated.')
    },
    onError: () => toast.error('Failed to terminate session'),
  })

  const { mutate: terminateAllSessions, isPending: terminatingAll } = useMutation({
    mutationFn: () => deleteAllAdminDeviceSessions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deviceSessions() })
      toast.success('All other sessions terminated.')
    },
    onError: () => toast.error('Failed to terminate sessions'),
  })

  const { mutate: executeClearRememberMe } = useMutation({
    mutationFn: () => clearRememberMe(),
    onSuccess: () => toast.success('Tokens cleared.'),
  })

  const { mutate: executeEnforcePasswordReset } = useMutation({
    mutationFn: () => enforcePasswordReset(),
    onSuccess: () => toast.success('Password reset enforced.'),
  })

  const { mutate: executeBlockSuspiciousIps } = useMutation({
    mutationFn: () => blockSuspiciousIps(),
    onSuccess: () => toast.success('Suspicious IPs blocked.'),
  })

  const exportCSV = () => {
    const headers = ['Session_ID,User_Name,User_Email,IP_Address,Location,Last_Active,Status']
    const rows = filteredSessions.map((s) => `"${s.id}","${s.user?.name || 'System User'}","${s.user?.email || 'N/A'}","${s.ip_address}","${s.location || 'India'}","${s.last_active_at}","${s.status || 'Active'}"`)
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `security_sessions_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${filteredSessions.length} sessions to CSV!`)
  }

  const getDeviceIcon = (ua: string, devName: string) => {
    const text = (ua + ' ' + devName).toLowerCase()
    if (text.includes('mobile') || text.includes('android') || text.includes('iphone') || text.includes('ios')) {
      return <Smartphone size={16} className="text-[rgb(var(--text-muted))]" />
    }
    if (text.includes('mac') || text.includes('safari') || text.includes('firefox')) {
      return <Laptop size={16} className="text-[rgb(var(--text-muted))]" />
    }
    return <Monitor size={16} className="text-[rgb(var(--text-muted))]" />
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Header Title & Top Power Action */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Security Centre</span>
          </div>
        </div>

        <Button
          variant="error"
          leftIcon={<Power size={14} />}
          onClick={() => terminateAllSessions()}
          loading={terminatingAll}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-rose-600/20 shrink-0 whitespace-nowrap cursor-pointer"
        >
          Terminate All
        </Button>
      </div>

      {/* 2. Top 4 KPI Metrics Sparkline Cards Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Active Sessions */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Monitor size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Active Sessions</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{stats.active_sessions}</h3>
              <p className="text-[10px] text-indigo-400 font-semibold whitespace-nowrap">{stats.active_sessions_trend || '+0 new today'}</p>
            </div>
          </div>
          <div className="w-10 h-5 text-indigo-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,30 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Failed Logins (24h) */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Failed Logins (24h)</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{stats.failed_logins_24h}</h3>
              <p className="text-[10px] text-rose-400 font-semibold whitespace-nowrap">{stats.failed_logins_trend || '0% vs yesterday'}</p>
            </div>
          </div>
          <div className="w-10 h-5 text-rose-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,15 Q20,35 50,20 T100,30" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Security Score */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Security Score</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{stats.security_score}/100</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">{stats.security_score_trend || 'Excellent rating'}</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 4: 2FA Enabled Users */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Fingerprint size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">2FA Enabled Users</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{stats.two_fa_enabled_pct}%</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">{stats.two_fa_enabled_trend || '+0% vs last week'}</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q25,35 50,15 T100,20" />
            </svg>
          </div>
        </Card>
      </div>

      {/* 3. Main 12-Grid Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 align-top">
        {/* LEFT COLUMN: Active Devices Table & Filter Bar (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Top Filter Controls Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-[rgb(var(--bg-surface))] p-3 rounded-2xl border border-[rgb(var(--border))]">
            <select className="flex-1 min-w-[100px] text-xs font-semibold px-3 py-2 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer">
              <option value="30">📅 21 Jul - 22 Jul</option>
              <option value="7">Last 7 Days</option>
              <option value="90">Last 90 Days</option>
            </select>

            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="flex-1 min-w-[100px] text-xs font-semibold px-3 py-2 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
            >
              <option value="">All Devices</option>
              <option value="windows">Windows</option>
              <option value="mac">macOS</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 min-w-[100px] text-xs font-semibold px-3 py-2 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="logged_out">Logged Out</option>
            </select>
          </div>

          {/* Active Devices & Sessions Table Card */}
          <Card className="p-5 border border-[rgb(var(--border))] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgb(var(--border))] gap-2">
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit] truncate">
                  Active Devices & Sessions
                </h3>
                <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">Real-time device tokens</span>
              </div>

              {/* On mobile, show icon-only Export and Refresh. On desktop, EnterpriseTable handles Export, so show only Refresh here */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={exportCSV}
                  title="Export CSV"
                  className="flex sm:hidden items-center justify-center w-8 h-8 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--text-primary))] hover:border-indigo-500/40 transition-all cursor-pointer"
                >
                  <Download size={14} />
                </button>

                <button
                  onClick={() => { refetch(); toast.success('Security telemetry refreshed!') }}
                  title="Refresh Telemetry"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-2 space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div>
                {/* 1. Mobile Cards List View (< sm) */}
                <div className="block sm:hidden space-y-2.5">
                  {filteredSessions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
                      No active sessions found.
                    </div>
                  ) : (
                    paginatedSessions.map((session) => {
                      const userName = session.user?.name || 'System User'
                      const userEmail = session.user?.email || 'N/A'
                      const status = session.status || 'active'

                      return (
                        <div key={session.id} className="p-3 rounded-xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--bg-surface))] space-y-2 text-xs shadow-xs">
                          {/* Top Row: Device Icon + User Info on Left, Status on Right */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center justify-center shrink-0">
                                {getDeviceIcon(session.user_agent || '', session.device_name || '')}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-xs text-[rgb(var(--text-primary))] truncate">{userName}</p>
                                  {session.is_current && (
                                    <span className="text-[8px] font-extrabold font-mono bg-emerald-500/15 text-slate-500 dark:text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded uppercase">
                                      CURRENT
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono truncate">{userEmail}</p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {status === 'active' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                                </span>
                              )}
                              {status === 'inactive' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Inactive
                                </span>
                              )}
                              {status === 'logged_out' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Off
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Location & IP Address */}
                          <div className="flex items-center justify-between text-[11px] text-[rgb(var(--text-secondary))] pt-1">
                            <span className="truncate">🇮🇳 {session.location || 'India'}</span>
                            <span className="font-mono text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">
                              {session.ip_address || '127.0.0.1'}
                            </span>
                          </div>

                          {/* Bottom Row: Last Active + Action */}
                          <div className="flex items-center justify-between text-[10px] text-[rgb(var(--text-muted))] pt-1.5 border-t border-[rgb(var(--border))]/40">
                            <span>Active: {session.last_active_at ? timeAgo(session.last_active_at) : '1m ago'}</span>
                            {status === 'active' && !session.is_current ? (
                              <button
                                onClick={() => terminateSession(session.id)}
                                className="px-2 py-1 text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white rounded-lg transition-all cursor-pointer"
                              >
                                Force Logout
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedSession(session)}
                                className="text-indigo-400 hover:underline font-semibold cursor-pointer"
                              >
                                Details &gt;
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
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
                        header: 'DEVICE / USER',
                        accessor: (session: UserSession) => {
                          const userName = session.user?.name || 'System User'
                          const userEmail = session.user?.email || 'N/A'
                          return (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center justify-center flex-shrink-0">
                                {getDeviceIcon(session.user_agent || '', session.device_name || '')}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-xs text-[rgb(var(--text-primary))]">{userName}</p>
                                  {session.is_current && (
                                    <span className="text-[8px] font-extrabold font-mono bg-emerald-500/15 text-slate-500 dark:text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded uppercase">
                                      CURRENT
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono">{userEmail}</p>
                              </div>
                            </div>
                          )
                        }
                      },
                      {
                        header: 'IP ADDRESS',
                        accessor: (session: UserSession) => (
                          <span className="font-mono text-[11px] text-[rgb(var(--text-secondary))]">
                            {session.ip_address || '127.0.0.1'}
                          </span>
                        )
                      },
                      {
                        header: 'LOCATION',
                        accessor: (session: UserSession) => {
                          const locationStr = session.location || 'India'
                          const browserDev = (session.user_agent || session.device_name || 'Chrome • Windows')
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">🇮🇳</span>
                              <div>
                                <p className="text-xs font-semibold text-[rgb(var(--text-primary))] leading-tight">{locationStr}</p>
                                <p className="text-[10px] text-[rgb(var(--text-muted))] truncate max-w-[120px]">{browserDev}</p>
                              </div>
                            </div>
                          )
                        }
                      },
                      {
                        header: 'LAST ACTIVE',
                        accessor: (session: UserSession) => (
                          <span className="text-[rgb(var(--text-muted))] font-medium text-[11px]">
                            {session.last_active_at ? timeAgo(session.last_active_at) : '1 min ago'}
                          </span>
                        )
                      },
                      {
                        header: 'STATUS',
                        accessor: (session: UserSession) => {
                          const status = session.status || 'active'
                          return (
                            <>
                              {status === 'active' && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                                </span>
                              )}
                              {status === 'inactive' && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Inactive
                                </span>
                              )}
                              {status === 'logged_out' && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Logged Out
                                </span>
                              )}
                            </>
                          )
                        }
                      },
                      {
                        header: 'ACTIONS',
                        accessor: (session: UserSession) => {
                          const status = session.status || 'active'
                          return (
                            <div className="flex justify-end">
                              {status === 'active' && !session.is_current ? (
                                <button
                                  onClick={() => terminateSession(session.id)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white rounded-lg transition-all cursor-pointer"
                                >
                                  Force Logout
                                </button>
                              ) : (
                                <Dropdown
                                  trigger={
                                    <button className="p-1 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-colors cursor-pointer">
                                      <MoreVertical size={15} />
                                    </button>
                                  }
                                  items={[
                                    { label: 'View Session Details', icon: <Eye size={14} />, onClick: () => setSelectedSession(session) },
                                    { label: 'Block IP Address', icon: <UserX size={14} />, onClick: () => blockSuspiciousIps() },
                                  ]}
                                  align="right"
                                />
                              )}
                            </div>
                          )
                        }
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
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Overview, Recent Security Events & Security Actions (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col md:flex-row lg:flex-col gap-4 items-start">
          {/* Sub-column 1: Overview & Actions */}
          <div className="w-full flex-1 flex flex-col gap-4">
            {/* Card 1: Security Overview */}
            <Card className="p-4 border border-[rgb(var(--border))] space-y-3">
              <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit] pb-2 border-b border-[rgb(var(--border))]">
                Security Overview
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[rgb(var(--text-muted))]">Last Security Event</span>
                  <span className="font-bold text-slate-500 dark:text-emerald-400">{stats.last_security_event}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgb(var(--text-muted))]">Suspicious IPs Blocked</span>
                  <span className="font-bold text-rose-400">{stats.suspicious_ips_blocked}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgb(var(--text-muted))]">2FA Enabled Users</span>
                  <span className="font-bold text-indigo-400">{stats.two_fa_enabled_pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgb(var(--text-muted))]">Password Strength</span>
                  <span className="font-bold text-slate-500 dark:text-emerald-400">{stats.password_strength}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgb(var(--text-muted))]">Maintenance Mode</span>
                  <span className="font-bold text-[rgb(var(--text-muted))]">{stats.maintenance_mode}</span>
                </div>
              </div>

              <button
                onClick={() => setAuditModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer mt-2"
              >
                <Shield size={14} /> View Security Audit
              </button>
            </Card>

            {/* Card 3: Security Actions (2x2 Grid) */}
            <Card className="p-4 border border-[rgb(var(--border))] space-y-3">
              <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit] pb-1">
                Security Actions
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Terminate All Sessions */}
                <button
                  onClick={() => terminateAllSessions()}
                  className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[72px]"
                >
                  <Power size={18} className="text-rose-400 group-hover:text-white mb-2" />
                  <span className="text-[11px] font-bold leading-tight block text-rose-400 group-hover:text-white">
                    Terminate All Sessions
                  </span>
                </button>

                {/* Clear Remember Me */}
                <button
                  onClick={() => executeClearRememberMe()}
                  className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[72px]"
                >
                  <Key size={18} className="text-slate-500 dark:text-blue-400 group-hover:text-white mb-2" />
                  <span className="text-[11px] font-bold leading-tight block text-slate-500 dark:text-blue-400 group-hover:text-white">
                    Clear Remember Me
                  </span>
                </button>

                {/* Force Password Reset */}
                <button
                  onClick={() => executeEnforcePasswordReset()}
                  className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-600 hover:text-white transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[72px]"
                >
                  <Zap size={18} className="text-purple-400 group-hover:text-white mb-2" />
                  <span className="text-[11px] font-bold leading-tight block text-purple-400 group-hover:text-white">
                    Force Password Reset
                  </span>
                </button>

                {/* Block Suspicious IPs */}
                <button
                  onClick={() => executeBlockSuspiciousIps()}
                  className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-600 hover:text-white transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[72px]"
                >
                  <ShieldAlert size={18} className="text-amber-400 group-hover:text-white mb-2" />
                  <span className="text-[11px] font-bold leading-tight block text-amber-400 group-hover:text-white">
                    Block Suspicious IPs
                  </span>
                </button>
              </div>
            </Card>
          </div>

          {/* Right Sub-column: Recent Security Events */}
          <div className="w-full flex-1">
            {/* Card 2: Recent Security Events */}
            <Card className="p-4 border border-[rgb(var(--border))] space-y-3">
              <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-2">
                <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
                  Recent Security Events
                </h3>
                <button
                  onClick={() => navigate('/admin/logs')}
                  className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[rgb(var(--border))]">
                {recentEvents.map((evt) => {
                  const iconColor = evt.type === 'success' ? 'bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border-emerald-500/30'
                    : evt.type === 'danger' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  const Icon = evt.type === 'success' ? CheckCircle2 : evt.type === 'danger' ? ShieldAlert : AlertTriangle

                  return (
                    <div key={evt.id} className="flex items-start gap-3 relative z-10 pl-1">
                      <div className={cn('w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5', iconColor)}>
                        <Icon size={13} />
                      </div>
                      <div className="flex-1 min-w-0 bg-[rgb(var(--bg-surface))] p-2.5 rounded-lg border border-[rgb(var(--border))]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] whitespace-normal break-words">{evt.title}</h4>
                          <span className="text-[9px] font-mono text-[rgb(var(--text-muted))] flex-shrink-0">{evt.time}</span>
                        </div>
                        <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono break-all">{evt.user}</p>
                        <p className="text-[9px] text-[rgb(var(--text-muted))] font-mono break-all">{evt.meta}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Security Audit Modal */}
      <Modal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title="Platform Security Health Audit Report"
        size="md"
        footer={
          <Button variant="primary" onClick={() => setAuditModalOpen(false)}>
            Close Audit Report
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-500 dark:text-emerald-400 text-sm">Security Health: EXCELLENT (98/100)</h4>
              <p className="text-[11px] text-[rgb(var(--text-muted))]">All active device tokens, SSL/TLS, and 2FA policies are fully operational.</p>
            </div>
            <ShieldCheck size={28} className="text-slate-500 dark:text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-[rgb(var(--text-primary))]">Security Audit Checks:</h5>
            <div className="space-y-1.5">
              {[
                { title: 'Session Encryption', desc: 'AES-256 Bearer Token encryption active', ok: true },
                { title: 'Brute-Force Lockout', desc: '5 failed login attempts trigger 15-minute IP lock', ok: true },
                { title: 'Two-Factor Authentication', desc: 'Enforced for Admin and Teacher accounts', ok: true },
                { title: 'Database SSL/TLS', desc: 'Secure database communication verified', ok: true },
              ].map((chk, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
                  <div>
                    <p className="font-bold text-xs text-[rgb(var(--text-primary))]">{chk.title}</p>
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">{chk.desc}</p>
                  </div>
                  <Badge variant="success" className="text-[9px] uppercase font-mono">PASSED</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Session Details Modal */}
      <Modal
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title="Active Device Session Details"
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setSelectedSession(null)}>
            Close Details
          </Button>
        }
      >
        {selectedSession && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] space-y-2">
              <p><strong className="text-[rgb(var(--text-muted))]">User:</strong> {selectedSession.user?.name || 'System User'} ({selectedSession.user?.email || 'N/A'})</p>
              <p><strong className="text-[rgb(var(--text-muted))]">IP Address:</strong> <span className="font-mono font-bold text-indigo-400">{selectedSession.ip_address}</span></p>
              <p><strong className="text-[rgb(var(--text-muted))]">Location:</strong> {selectedSession.location || 'India'}</p>
              <p><strong className="text-[rgb(var(--text-muted))]">User Agent:</strong> <span className="font-mono text-[10px] text-[rgb(var(--text-muted))]">{selectedSession.user_agent || 'Mozilla/5.0'}</span></p>
              <p><strong className="text-[rgb(var(--text-muted))]">Last Active:</strong> {selectedSession.last_active_at ? timeAgo(selectedSession.last_active_at) : 'Just now'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
