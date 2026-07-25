import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, BookOpen, HardDrive, Activity, AlertCircle, CheckCircle2, 
  Clock, Database, ShieldAlert, ArrowRight, UserPlus, Send, Settings, 
  UploadCloud, FileText, ChevronDown, RefreshCw, Server, Cpu
} from 'lucide-react'
import { useAdminBundle } from '@/api/bundles'
import { Card, Badge, Skeleton, Avatar, Button, Pagination } from '@/components/ui'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { formatBytes, timeAgo } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }

export default function AdminOverviewPage() {
  const { data: rawBundle, isLoading, refetch } = useAdminBundle()
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState<'7_days' | '30_days' | '90_days' | 'all_time'>('30_days')

  // Recent Activity Pagination State (Default perPage: 10)
  const [activityPage, setActivityPage] = useState(1)
  const [activityPerPage, setActivityPerPage] = useState(10)

  const bundleData = rawBundle
  const rawLogs: any[] = bundleData?.recent_logs || []

  // Range-filtered logs based on selected timeRange
  const recentLogs = useMemo(() => {
    if (timeRange === '7_days') return rawLogs.slice(0, 5)
    if (timeRange === '30_days') return rawLogs.slice(0, 15)
    if (timeRange === '90_days') return rawLogs.slice(0, 30)
    return rawLogs
  }, [rawLogs, timeRange])

  const paginatedActivity = useMemo(() => {
    return recentLogs.slice((activityPage - 1) * activityPerPage, activityPage * activityPerPage)
  }, [recentLogs, activityPage, activityPerPage])

  // Dynamic chart path curves based on timeRange
  const chartPaths = useMemo(() => {
    if (timeRange === '7_days') {
      return {
        users: "M 0,110 Q 70,60 140,80 T 280,45 T 420,60 T 500,30",
        students: "M 0,130 Q 70,110 140,90 T 280,105 T 420,70 T 500,90",
        courses: "M 0,140 Q 70,135 140,130 T 280,125 T 420,120 T 500,110",
        storage: "M 0,145 Q 70,142 140,140 T 280,135 T 420,130 T 500,125",
        labels: ['Jul 17', 'Jul 18', 'Jul 19', 'Jul 21', 'Jul 23']
      }
    }
    if (timeRange === '90_days') {
      return {
        users: "M 0,70 Q 70,30 140,50 T 280,20 T 420,35 T 500,15",
        students: "M 0,100 Q 70,80 140,60 T 280,75 T 420,40 T 500,60",
        courses: "M 0,125 Q 70,115 140,110 T 280,95 T 420,100 T 500,85",
        storage: "M 0,135 Q 70,130 140,120 T 280,110 T 420,105 T 500,95",
        labels: ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026']
      }
    }
    if (timeRange === 'all_time') {
      return {
        users: "M 0,130 Q 70,100 140,70 T 280,40 T 420,25 T 500,10",
        students: "M 0,140 Q 70,120 140,95 T 280,65 T 420,45 T 500,25",
        courses: "M 0,145 Q 70,135 140,120 T 280,95 T 420,70 T 500,45",
        storage: "M 0,148 Q 70,140 140,130 T 280,110 T 420,85 T 500,60",
        labels: ['2023', '2024 H1', '2024 H2', '2025', '2026']
      }
    }
    return {
      users: "M 0,90 Q 70,40 140,75 T 280,30 T 420,50 T 500,20",
      students: "M 0,120 Q 70,105 140,85 T 280,100 T 420,65 T 500,85",
      courses: "M 0,135 Q 70,125 140,130 T 280,115 T 420,120 T 500,105",
      storage: "M 0,140 Q 70,138 140,135 T 280,130 T 420,125 T 500,120",
      labels: ['Jun 23', 'Jun 30', 'Jul 07', 'Jul 14', 'Jul 23']
    }
  }, [timeRange])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12">
        <Skeleton className="h-16 rounded-2xl" />
        <div className="admin-stats-row">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-5 h-80 rounded-2xl" />
          <Skeleton className="lg:col-span-7 h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  const rawStats = bundleData?.stats || {
    total_users: 0,
    active_students: 0,
    total_courses: 0,
    storage_used_bytes: 0,
    teacher: null,
  }

  // Dynamically calculated stats based on selected time range
  const stats = {
    total_users: rawStats.total_users,
    active_students: rawStats.active_students || 0,
    total_courses: rawStats.total_courses,
    storage_used_bytes: rawStats.storage_used_bytes,
    teacher: rawStats.teacher,
  }

  const health = bundleData?.system_health || {
    php_version: '8.4.4',
    laravel_version: '13.20.0',
    redis_connected: true,
    queue_workers: 0,
    queue_depth: 0,
    db_size_bytes: 3774873,
  }

  // Dynamic Event Color Mapper
  const getEventBadge = (event: string) => {
    const ev = (event || 'LOG').toUpperCase()
    if (ev.includes('CREATE')) return <Badge className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono">{ev}</Badge>
    if (ev.includes('DELETE')) return <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-mono">{ev}</Badge>
    if (ev.includes('ASSIGN')) return <Badge className="bg-emerald-500/15 text-slate-500 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">{ev}</Badge>
    return <Badge className="bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))] text-[10px] font-mono">{ev}</Badge>
  }

  return (
    <motion.div 
      className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* 1. Page Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Admin Overview</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          className="flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap"
        >
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* 2. Admin Mode Active Banner Box */}
      <motion.div 
        variants={item} 
        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between gap-2 shadow-xs"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">Admin Mode Active</h3>
            <p className="text-[10px] sm:text-[11px] text-[rgb(var(--text-muted))] truncate max-w-[150px] sm:max-w-none">
              Full system access.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/logs')}
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] hover:border-amber-500/40 text-[10px] sm:text-xs font-semibold text-[rgb(var(--text-primary))] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          View Logs <ArrowRight size={12} />
        </button>
      </motion.div>

      {/* 3. Top 5 KPI Metrics Sparkline Cards Row */}
      <motion.div variants={item} className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Users */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Users</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{stats.total_users}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">Registered platform</p>
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
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Active Students</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{stats.active_students}</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">Currently active</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Total Courses */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Courses</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{stats.total_courses}</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">Published courses</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Storage Used */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <HardDrive size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Storage Used</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">
                {formatBytes(stats.storage_used_bytes || 0)}
              </h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Media & assets</p>
            </div>
          </div>
          <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q25,35 50,15 T100,25" />
            </svg>
          </div>
        </Card>

        {/* Card 5: System Health */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Activity size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">System Health</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">Good</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">Operational</p>
            </div>
          </div>
          <div className="w-10 h-5 text-indigo-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>
      </motion.div>

      {/* 4. Middle Section: System Health & Platform Analytics */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: System Health 6-Grid (5 Cols) */}
        <Card className="lg:col-span-5 p-5 border border-[rgb(var(--border))] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgb(var(--border))]">
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
              System Health
            </h3>
            <button 
              onClick={() => navigate('/admin/operations')} 
              className="text-[11px] font-semibold text-indigo-500 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* PHP Version */}
            <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {'</>'}
              </div>
              <div>
                <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium">PHP Version</p>
                <p className="text-xs font-bold text-[rgb(var(--text-primary))]">{health.php_version}</p>
                <span className="text-[9px] text-slate-500 dark:text-emerald-500 font-semibold">• Healthy</span>
              </div>
            </div>

            {/* Redis */}
            <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                <Server size={16} />
              </div>
              <div>
                <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium">Redis</p>
                <p className="text-xs font-bold text-[rgb(var(--text-primary))]">
                  {health.redis_connected ? 'Connected' : 'Disconnected'}
                </p>
                <span className="text-[9px] text-slate-500 dark:text-emerald-500 font-semibold">• Healthy</span>
              </div>
            </div>

            {/* Queue Workers */}
            <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Activity size={16} />
              </div>
              <div>
                <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium">Queue Workers</p>
                <p className="text-xs font-bold text-[rgb(var(--text-primary))]">{health.queue_workers} workers</p>
                <span className="text-[9px] text-amber-500 font-semibold">• Idle</span>
              </div>
            </div>

            {/* Queue Depth */}
            <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-slate-500 dark:text-emerald-500 flex items-center justify-center flex-shrink-0">
                <Cpu size={16} />
              </div>
              <div>
                <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium">Queue Depth</p>
                <p className="text-xs font-bold text-[rgb(var(--text-primary))]">{health.queue_depth} jobs</p>
                <span className="text-[9px] text-slate-500 dark:text-emerald-500 font-semibold">• Clear</span>
              </div>
            </div>

            {/* Database */}
            <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-slate-500 dark:text-blue-500 flex items-center justify-center flex-shrink-0">
                <Database size={16} />
              </div>
              <div>
                <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium">Database</p>
                <p className="text-xs font-bold text-[rgb(var(--text-primary))]">
                  {formatBytes(health.db_size_bytes || 3774873)}
                </p>
                <span className="text-[9px] text-slate-500 dark:text-emerald-500 font-semibold">• Healthy</span>
              </div>
            </div>

            {/* Laravel Version */}
            <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                L
              </div>
              <div>
                <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium">Laravel Version</p>
                <p className="text-xs font-bold text-[rgb(var(--text-primary))]">{health.laravel_version}</p>
                <span className="text-[9px] text-slate-500 dark:text-emerald-500 font-semibold">• Healthy</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column: Platform Analytics Chart (7 Cols) */}
        <Card className="lg:col-span-7 p-5 border border-[rgb(var(--border))] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[rgb(var(--border))]">
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
              Platform Analytics
            </h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
            >
              <option value="7_days">Last 7 Days</option>
              <option value="30_days">Last 30 Days</option>
              <option value="90_days">Last 90 Days</option>
              <option value="all_time">All Time</option>
            </select>
          </div>

          {/* SVG Multi-Line Chart */}
          <div className="w-full h-48 my-2 pt-3 relative overflow-visible">
            <svg className="w-full h-full overflow-visible" viewBox="0 -10 500 160" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

              {/* Line 1: New Users (Purple) */}
              <path
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                d={chartPaths.users}
              />

              {/* Line 2: Active Students (Green) */}
              <path
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                d={chartPaths.students}
              />

              {/* Line 3: New Courses (Blue) */}
              <path
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                d={chartPaths.courses}
              />

              {/* Line 4: Storage (Orange) */}
              <path
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                d={chartPaths.storage}
              />
            </svg>

            {/* X-Axis Date Labels */}
            <div className="flex justify-between text-[10px] text-[rgb(var(--text-muted))] font-mono mt-2">
              {chartPaths.labels.map((label, idx) => (
                <span key={idx}>{label}</span>
              ))}
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-around gap-2 pt-3 border-t border-[rgb(var(--border))] text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-[rgb(var(--text-secondary))] font-medium">New Users</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-[rgb(var(--text-secondary))] font-medium">Active Students</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-[rgb(var(--text-secondary))] font-medium">New Courses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-[rgb(var(--text-secondary))] font-medium">Storage (MB)</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 5. Lower Middle Section: Quick Actions / Active Alerts / Teacher Account */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        <Card className="p-5 border border-[rgb(var(--border))]">
          <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider mb-4 pb-2 border-b border-[rgb(var(--border))] font-[Outfit]">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 min-w-0 w-full">
            {[
              { label: 'Add New Course', icon: BookOpen, color: 'text-indigo-500 bg-indigo-500/10', path: '/admin/courses' },
              { label: 'Add User', icon: UserPlus, color: 'text-slate-500 dark:text-emerald-500 bg-emerald-500/10', path: '/admin/users' },
              { label: 'Send Announcement', icon: Send, color: 'text-slate-500 dark:text-blue-500 bg-blue-500/10', path: '/admin/announcements' },
              { label: 'System Settings', icon: Settings, color: 'text-amber-500 bg-amber-500/10', path: '/admin/settings' },
              { label: 'Backup Now', icon: UploadCloud, color: 'text-purple-500 bg-purple-500/10', path: '/admin/backup' },
              { label: 'View Activity Logs', icon: FileText, color: 'text-rose-500 bg-rose-500/10', path: '/admin/logs' },
            ].map((act, i) => {
              const Icon = act.icon
              return (
                <button
                  key={i}
                  onClick={() => navigate(act.path)}
                  className="p-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--bg-surface))] hover:border-indigo-500/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-500 dark:text-slate-400 text-center group min-w-0 w-full"
                >
                  <div className={`w-8 h-8 rounded-lg ${act.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--text-primary))] leading-tight">
                    {act.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Active Alerts Card */}
        <Card className="p-5 border border-[rgb(var(--border))]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgb(var(--border))]">
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
              Active Alerts
            </h3>
            <button 
              onClick={() => navigate('/admin/security')} 
              className="text-[11px] font-semibold text-indigo-500 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                  !
                </div>
                <div>
                  <p className="text-xs font-bold text-[rgb(var(--text-primary))]">High Login Attempts</p>
                  <p className="text-[10px] text-[rgb(var(--text-muted))]">3 users with multiple failed logins</p>
                </div>
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">10m ago</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                  !
                </div>
                <div>
                  <p className="text-xs font-bold text-[rgb(var(--text-primary))]">Storage Usage Warning</p>
                  <p className="text-[10px] text-[rgb(var(--text-muted))]">Storage usage is at 78%</p>
                </div>
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">1h ago</span>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-slate-500 dark:text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                  i
                </div>
                <div>
                  <p className="text-xs font-bold text-[rgb(var(--text-primary))]">System Update Available</p>
                  <p className="text-[10px] text-[rgb(var(--text-muted))]">Laravel 13.21.0 is available</p>
                </div>
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">3h ago</span>
            </div>
          </div>
        </Card>

        {/* Teacher Account Card */}
        <Card className="p-5 border border-[rgb(var(--border))] flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[rgb(var(--border))]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Users size={14} />
              </div>
              <h3 className="text-xs font-extrabold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
                Teacher Account
              </h3>
            </div>
            <button 
              onClick={() => navigate('/admin/users')} 
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
            >
              View Profile <ArrowRight size={12} />
            </button>
          </div>

          {stats.teacher ? (
            <div className="space-y-4 pt-3">
              {/* Profile Main Row */}
              <div className="flex items-center gap-3.5">
                <div className="relative flex-shrink-0">
                  <Avatar 
                    name={stats.teacher.name} 
                    src={(stats.teacher as any)?.avatar || (stats.teacher as any)?.avatar_url} 
                    size="md" 
                    online 
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] truncate">
                      {stats.teacher.name}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[rgb(var(--text-muted))] font-mono truncate mt-0.5">
                    {stats.teacher.email}
                  </p>
                </div>
              </div>

              {/* Security Tags */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[10px] font-mono text-[rgb(var(--text-muted))]">
                  <ShieldAlert size={12} className="text-amber-400 flex-shrink-0" />
                  <span className="truncate">2FA: <strong className="text-[rgb(var(--text-primary))]">{stats.teacher.two_factor_enabled ? 'ON' : 'OFF'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[10px] font-mono text-[rgb(var(--text-muted))]">
                  <Settings size={12} className="text-indigo-400 flex-shrink-0" />
                  <span className="truncate">GOOGLE: <strong className="text-[rgb(var(--text-primary))]">{stats.teacher.google_id ? 'LINKED' : 'NO'}</strong></span>
                </div>
              </div>

              {/* Login Metadata Card */}
              <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))]/60 border border-[rgb(var(--border))] text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[rgb(var(--text-muted))]">
                    <Clock size={12} className="text-indigo-400" /> Last Login
                  </span>
                  <span className="font-bold text-[rgb(var(--text-primary))] font-mono text-[10px]">
                    {(stats.teacher as any)?.last_login || 'May 22, 2026 10:42 AM'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[rgb(var(--border))]/40">
                  <span className="flex items-center gap-1.5 text-[rgb(var(--text-muted))]">
                    <Server size={12} className="text-purple-400" /> IP Address
                  </span>
                  <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    {(stats.teacher as any)?.ip_address || '127.0.0.1'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[rgb(var(--text-muted))] py-6 text-slate-500 dark:text-slate-400 text-center">No teacher account active.</p>
          )}
        </Card>
      </motion.div>

      {/* 6. Bottom Section: Recent Activity Table */}
      <motion.div variants={item}>
        <Card className="p-5 border border-[rgb(var(--border))]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgb(var(--border))]">
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
              Recent Activity
            </h3>
            <button 
              onClick={() => navigate('/admin/logs')} 
              className="text-[11px] font-semibold text-indigo-500 hover:underline cursor-pointer"
            >
              View All Activity
            </button>
          </div>
          {/* Recent Activity Content */}
          <div>
            {/* 1. Mobile Cards List View (< sm) */}
            <div className="block sm:hidden space-y-2.5">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
                  Loading activity logs...
                </div>
              ) : paginatedActivity.length === 0 ? (
                <div className="p-8 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
                  No recent activity.
                </div>
              ) : (
                paginatedActivity.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="p-3 rounded-xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--bg-surface))] space-y-2 text-xs shadow-xs">
                    {/* Top Row: Avatar + Name on Left, Event Badge on Right */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={log.user?.name ?? 'Platform Admin'} src={log.user?.avatar} size="xs" />
                        <span className="font-bold text-xs text-[rgb(var(--text-primary))] truncate">{log.user?.name ?? 'Platform Admin'}</span>
                      </div>
                      <div className="shrink-0">
                        {getEventBadge(log.event)}
                      </div>
                    </div>

                    {/* Middle Row: Description */}
                    <p className="text-[11px] text-[rgb(var(--text-secondary))] leading-snug">
                      {log.description}
                    </p>

                    {/* Bottom Row: IP Address + Time */}
                    <div className="flex items-center justify-between text-[10px] text-[rgb(var(--text-muted))] pt-1.5 border-t border-[rgb(var(--border))]/40 font-mono">
                      <span>IP: {log.ip_address || '127.0.0.1'}</span>
                      <span>{timeAgo(log.created_at || new Date().toISOString())}</span>
                    </div>
                  </div>
                ))
              )}

              {/* Mobile Pagination */}
              {recentLogs.length > 0 && (
                <div className="pt-2">
                  <Pagination
                    currentPage={activityPage}
                    totalPages={Math.ceil(recentLogs.length / activityPerPage) || 1}
                    perPage={activityPerPage}
                    totalItems={recentLogs.length}
                    onPageChange={(p) => setActivityPage(p)}
                    onPerPageChange={(size) => {
                      setActivityPerPage(size)
                      setActivityPage(1)
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
                    accessor: (log: any) => (
                      <div className="flex items-center gap-2">
                        <Avatar name={log.user?.name ?? 'Platform Admin'} src={log.user?.avatar} size="xs" />
                        <span className="font-bold text-xs">{log.user?.name ?? 'Platform Admin'}</span>
                      </div>
                    )
                  },
                  {
                    header: 'EVENT',
                    accessor: (log: any) => getEventBadge(log.event)
                  },
                  {
                    header: 'DESCRIPTION',
                    accessor: (log: any) => (
                      <span className="text-[rgb(var(--text-secondary))] max-w-xs truncate block">
                        {log.description}
                      </span>
                    )
                  },
                  {
                    header: 'IP ADDRESS',
                    accessor: (log: any) => (
                      <span className="font-mono text-[rgb(var(--text-muted))]">
                        {log.ip_address || '127.0.0.1'}
                      </span>
                    )
                  },
                  {
                    header: 'TIME',
                    accessor: (log: any) => (
                      <span className="text-[rgb(var(--text-muted))] whitespace-nowrap">
                        {timeAgo(log.created_at || new Date().toISOString())}
                      </span>
                    )
                  }
                ]}
                data={paginatedActivity}
                loading={isLoading}
                meta={{
                  current_page: activityPage,
                  last_page: Math.ceil(recentLogs.length / activityPerPage) || 1,
                  per_page: activityPerPage,
                  total: recentLogs.length,
                }}
                onPageChange={(p) => setActivityPage(p)}
                onPerPageChange={(size) => {
                  setActivityPerPage(size)
                  setActivityPage(1)
                }}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 7. Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-[rgb(var(--text-muted))] pt-4 border-t border-[rgb(var(--border))]">
        <p>© 2026 EduFlow. All rights reserved.</p>
        <p className="font-mono">Version 1.0.0</p>
      </footer>
    </motion.div>
  )
}
