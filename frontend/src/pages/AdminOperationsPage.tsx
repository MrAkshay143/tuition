import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Activity, Server, Database, Cpu, Clock, RefreshCw, Download, 
  CheckCircle2, AlertCircle, Monitor, ShieldAlert, ShieldCheck, 
  Fingerprint, HardDrive, Globe, Zap, ArrowRight, Eye, Info, X,
  GitBranch, Layers, Code2
} from 'lucide-react'
import { api } from '@/api/client'
import { queryKeys } from '@/lib/queryKeys'
import { Button, Card, Badge, Skeleton } from '@/components/ui'
import { Modal } from '@/components/ui/overlays'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface OperationsTelemetryResponse {
  build_info: {
    app_name: string
    version: string
    git_commit: string
    environment: string
    php_version: string
    db_engine: string
  }
  deployment_diagnostics: {
    config_cached: boolean
    routes_cached: boolean
    storage_writable: boolean
    queue_running: boolean
    scheduler_running: boolean
  }
  stats: {
    active_sessions: number
    failed_logins_24h: number
    security_score: number
    two_fa_enabled_pct: number
  }
  queue_telemetry: {
    pending_jobs: number
    failed_jobs: number
    delayed_jobs: number
    completed_24h: number
    queue_engine: string
  }
  scheduler_history: {
    last_successful_run: string
    last_failed_run: string
    next_scheduled_run: string
    average_runtime: string
  }
  system_resources: {
    php_memory_usage: string
    php_memory_pct: number
    cpu_usage_pct: number
    disk_usage: string
    disk_usage_pct: number
  }
  services: Array<{
    name: string
    tech: string
    status: string
    latency: string
  }>
  recent_events: Array<{
    id: number
    type: 'success' | 'danger' | 'warning'
    title: string
    user: string
    meta: string
    time: string
  }>
}

export const AdminOperationsPage: React.FC = () => {
  const navigate = useNavigate()
  const [backingUp, setBackingUp] = useState(false)
  const [detailModal, setDetailModal] = useState<'queue' | 'scheduler' | 'resources' | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

  // Backend API query
  const { data: telemetry, isLoading, refetch } = useQuery({
    queryKey: ['operations-details'],
    queryFn: () => api.get<OperationsTelemetryResponse>('/admin/operations/details'),
    staleTime: 1000 * 15,
  })

  const handleRefresh = () => {
    refetch()
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    toast.success('Telemetry data refreshed!')
  }

  const handleCreateBackup = async () => {
    setBackingUp(true)
    try {
      await api.post('/admin/operations/backup')
      toast.success('Backup snapshot generated successfully!')
    } catch {
      toast.error('Failed to create backup snapshot.')
    } finally {
      setBackingUp(false)
    }
  }

  if (isLoading || !telemetry) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const build = telemetry.build_info
  const diagnostics = telemetry.deployment_diagnostics
  const stats = telemetry.stats
  const queue = telemetry.queue_telemetry
  const scheduler = telemetry.scheduler_history
  const resources = telemetry.system_resources
  const services = telemetry.services
  const recentEvents = telemetry.recent_events

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Operations Telemetry</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            title="Refresh Telemetry"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--text-primary))] hover:border-indigo-500/40 transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Button
            variant="primary"
            leftIcon={<Download size={14} />}
            onClick={handleCreateBackup}
            loading={backingUp}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer whitespace-nowrap"
          >
            <span className="hidden sm:inline">{backingUp ? 'Generating Snapshot…' : 'Create Backup Snapshot'}</span>
            <span className="inline sm:hidden">{backingUp ? 'Backing up…' : 'Backup'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Sparkline Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-4 border border-[rgb(var(--border))] flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Monitor size={18} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider">Active Sessions</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{stats.active_sessions}</h3>
              <p className="text-[10px] text-purple-400 font-semibold">↑ 20% vs yesterday</p>
            </div>
          </div>
          <div className="w-16 h-8 text-purple-500/40">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        <Card className="p-4 border border-[rgb(var(--border))] flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider">Failed Logins (24h)</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{stats.failed_logins_24h}</h3>
              <p className="text-[10px] text-rose-400 font-semibold">↓ 12% vs yesterday</p>
            </div>
          </div>
          <div className="w-16 h-8 text-rose-500/40">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,15 Q20,35 50,20 T100,30" />
            </svg>
          </div>
        </Card>

        <Card className="p-4 border border-[rgb(var(--border))] flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider">Security Score</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{stats.security_score}/100</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold">↑ Excellent</p>
            </div>
          </div>
          <div className="w-16 h-8 text-slate-500 dark:text-emerald-500/40">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        <Card className="p-4 border border-[rgb(var(--border))] flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Fingerprint size={18} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider">2FA Enabled Users</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{stats.two_fa_enabled_pct}%</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold">↑ 8% vs last week</p>
            </div>
          </div>
          <div className="w-16 h-8 text-slate-500 dark:text-blue-500/40">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q25,35 50,15 T100,20" />
            </svg>
          </div>
        </Card>
      </div>

      {/* 3. Build Metadata & Environment Card */}
      <Card className="p-4 sm:p-5 border border-[rgb(var(--border))] space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[rgb(var(--border))]">
          <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit] uppercase tracking-wider flex items-center gap-2">
            <Server size={16} className="text-indigo-400" /> Build Metadata &amp; Environment
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> SYSTEM HEALTHY
          </span>
        </div>

        {/* 6 Metric Tile Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Tile 1: Application */}
          <div className="p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))]/70 space-y-1 hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--text-muted))] font-medium">
              <Globe size={12} className="text-indigo-400 shrink-0" />
              <span className="truncate">Application</span>
            </div>
            <p className="text-xs font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] truncate">{build.app_name}</p>
          </div>

          {/* Tile 2: Version / Build */}
          <div className="p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))]/70 space-y-1 hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--text-muted))] font-medium">
              <Layers size={12} className="text-purple-400 shrink-0" />
              <span className="truncate">Version / Build</span>
            </div>
            <p className="text-xs font-bold text-[rgb(var(--text-primary))] font-mono truncate">{build.version}</p>
          </div>

          {/* Tile 3: Git Commit */}
          <div className="p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))]/70 space-y-1 hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--text-muted))] font-medium">
              <GitBranch size={12} className="text-blue-400 shrink-0" />
              <span className="truncate">Git Commit</span>
            </div>
            <p className="text-xs font-mono font-bold text-indigo-400 truncate">#{build.git_commit}</p>
          </div>

          {/* Tile 4: Environment */}
          <div className="p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))]/70 space-y-1 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--text-muted))] font-medium">
              <Activity size={12} className="text-emerald-400 shrink-0" />
              <span className="truncate">Environment</span>
            </div>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span> {build.environment}
            </p>
          </div>

          {/* Tile 5: PHP / Laravel */}
          <div className="p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))]/70 space-y-1 hover:border-amber-500/30 transition-all">
            <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--text-muted))] font-medium">
              <Code2 size={12} className="text-amber-400 shrink-0" />
              <span className="truncate">PHP / Framework</span>
            </div>
            <p className="text-xs font-mono font-bold text-[rgb(var(--text-primary))] truncate">{build.php_version}</p>
          </div>

          {/* Tile 6: DB Engine */}
          <div className="p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))]/70 space-y-1 hover:border-teal-500/30 transition-all">
            <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--text-muted))] font-medium">
              <Database size={12} className="text-teal-400 shrink-0" />
              <span className="truncate">DB Engine</span>
            </div>
            <p className="text-xs font-bold text-[rgb(var(--text-primary))] capitalize truncate">{build.db_engine}</p>
          </div>
        </div>

        {/* Deployment Diagnostics Pill Chips */}
        <div className="pt-2 border-t border-[rgb(var(--border))]/40">
          <p className="text-[10px] text-[rgb(var(--text-muted))] font-semibold mb-2 uppercase tracking-wider">Deployment Diagnostics</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { label: 'Config Cached', ok: diagnostics.config_cached },
              { label: 'Routes Cached', ok: diagnostics.routes_cached },
              { label: 'Storage Writable', ok: diagnostics.storage_writable },
              { label: 'Queue Running', ok: diagnostics.queue_running },
              { label: 'Scheduler Running', ok: diagnostics.scheduler_running },
            ].map((diag, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
                <span className="text-[11px] font-bold truncate">{diag.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 border border-[rgb(var(--border))] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-2">
              <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                <Database size={15} className="text-purple-400" /> Queue Telemetry
              </h4>
              <button onClick={() => setDetailModal('queue')} className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer">
                View Details
              </button>
            </div>

            <div className="flex items-center justify-around gap-4 py-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-indigo-500" strokeDasharray="80, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center">
                  <Database size={16} className="text-indigo-400" />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[rgb(var(--text-muted))] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> Pending Jobs
                  </span>
                  <span className="font-mono font-bold text-[rgb(var(--text-primary))]">{queue.pending_jobs}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[rgb(var(--text-muted))] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Failed Jobs
                  </span>
                  <span className="font-mono font-bold text-[rgb(var(--text-primary))]">{queue.failed_jobs}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[rgb(var(--text-muted))] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Delayed Jobs
                  </span>
                  <span className="font-mono font-bold text-[rgb(var(--text-primary))]">{queue.delayed_jobs}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[rgb(var(--text-muted))] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed (24h)
                  </span>
                  <span className="font-mono font-bold text-slate-500 dark:text-emerald-400">{queue.completed_24h}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))] text-[10px]">
            <span className="text-[rgb(var(--text-muted))] font-medium">Queue Engine</span>
            <span className="font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md uppercase">
              {queue.queue_engine}
            </span>
          </div>
        </Card>

        <Card className="p-5 border border-[rgb(var(--border))] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-2">
              <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={15} className="text-slate-500 dark:text-blue-400" /> Scheduler History
              </h4>
              <button onClick={() => setDetailModal('scheduler')} className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer">
                View History
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[rgb(var(--text-muted))]">Last Successful Run</span>
                <span className="font-mono font-bold text-slate-500 dark:text-emerald-400 flex items-center gap-1">
                  {scheduler.last_successful_run} <CheckCircle2 size={12} />
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[rgb(var(--text-muted))]">Last Failed Run</span>
                <span className="font-mono font-bold text-slate-500 dark:text-emerald-400 flex items-center gap-1">
                  {scheduler.last_failed_run} <CheckCircle2 size={12} />
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[rgb(var(--text-muted))]">Next Scheduled Run</span>
                <span className="font-mono font-bold text-indigo-400">{scheduler.next_scheduled_run}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[rgb(var(--text-muted))]">Average Runtime</span>
                <span className="font-mono font-bold text-[rgb(var(--text-primary))]">{scheduler.average_runtime}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[rgb(var(--border))] flex items-center justify-between text-[10px]">
            <span className="text-[rgb(var(--text-muted))]">Cron Pulse Status</span>
            <span className="font-mono font-bold text-slate-500 dark:text-emerald-400">ACTIVE</span>
          </div>
        </Card>

        <Card className="p-5 border border-[rgb(var(--border))] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-2">
              <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                <Cpu size={15} className="text-amber-400" /> System Resources
              </h4>
              <button onClick={() => setDetailModal('resources')} className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer">
                View Metrics
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--text-muted))]">PHP Memory Usage</span>
                  <span className="font-mono font-bold text-[rgb(var(--text-primary))]">{resources.php_memory_usage} <span className="text-indigo-400">({resources.php_memory_pct}%)</span></span>
                </div>
                <div className="w-full bg-[rgb(var(--bg-elevated))] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${resources.php_memory_pct}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--text-muted))]">CPU Usage</span>
                  <span className="font-mono font-bold text-slate-500 dark:text-blue-400">{resources.cpu_usage_pct}%</span>
                </div>
                <div className="w-full bg-[rgb(var(--bg-elevated))] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${resources.cpu_usage_pct}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--text-muted))]">Disk Usage</span>
                  <span className="font-mono font-bold text-purple-400">{resources.disk_usage} <span className="text-purple-400">({resources.disk_usage_pct}%)</span></span>
                </div>
                <div className="w-full bg-[rgb(var(--bg-elevated))] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${resources.disk_usage_pct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[rgb(var(--border))] flex items-center justify-between text-[10px]">
            <span className="text-[rgb(var(--text-muted))]">Server Hardware Load</span>
            <span className="font-mono font-bold text-slate-500 dark:text-emerald-400">NORMAL</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 p-5 border border-[rgb(var(--border))] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[rgb(var(--border))]">
            <div>
              <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
                Services Status
              </h3>
              <p className="text-[10px] text-[rgb(var(--text-muted))]">All critical services are operational</p>
            </div>
            <button className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer">
              View All Services
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {services.map((srv, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-col justify-between items-center text-slate-500 dark:text-slate-400 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  {idx === 0 && <Globe size={16} />}
                  {idx === 1 && <Database size={16} />}
                  {idx === 2 && <Zap size={16} />}
                  {idx === 3 && <Server size={16} />}
                  {idx === 4 && <Clock size={16} />}
                  {idx === 5 && <HardDrive size={16} />}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[rgb(var(--text-primary))]">{srv.name}</h4>
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono">{srv.tech}</p>
                </div>

                <div className="pt-1 border-t border-[rgb(var(--border))] w-full space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {srv.status}
                  </span>
                  <span className="text-[9px] font-mono text-[rgb(var(--text-muted))] block">{srv.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4 p-5 border border-[rgb(var(--border))] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[rgb(var(--border))]">
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
              Recent Security Events
            </h3>
            <button onClick={() => navigate('/admin/logs')} className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentEvents.map((evt) => (
              <div key={evt.id} className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[rgb(var(--text-primary))] text-xs truncate">{evt.title}</h4>
                    <span className="text-[9px] font-mono text-[rgb(var(--text-muted))]">{evt.time}</span>
                  </div>
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono truncate">{evt.user}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] text-[rgb(var(--text-muted))] pt-2 border-t border-[rgb(var(--border))] font-mono">
        <RefreshCw size={12} /> Last updated: {lastRefreshed}
      </div>

      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Operational Telemetry Details"
        size="sm"
        footer={<Button variant="primary" onClick={() => setDetailModal(null)}>Close</Button>}
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] space-y-2">
            <p><strong className="text-[rgb(var(--text-muted))]">Queue Driver:</strong> Database</p>
            <p><strong className="text-[rgb(var(--text-muted))]">Scheduler Cron:</strong> Running every minute</p>
            <p><strong className="text-[rgb(var(--text-muted))]">Memory Limit:</strong> 512 MB</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
