import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Send, Bell, Mail, Smartphone, Users, Calendar, AlertCircle, CheckCircle2, 
  History, Filter, Eye, Clock, Megaphone, Trash2, ArrowUpRight, 
  Search, ShieldAlert, FileText, ChevronRight, Lightbulb, X, TrendingUp, Check, RotateCcw, Copy, Gift
} from 'lucide-react'
import { Button, Card, Badge, Spinner, Toggle, Modal, Pagination } from '@/components/ui'
import { ConfirmModal } from '@/components/ui/overlays'
import { useBatches } from '@/api/resources/batches'
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '@/api/resources/announcements'
import { cn, formatDateTime } from '@/lib/utils'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().min(3, 'Title requires at least 3 characters'),
  body: z.string().min(10, 'Message body requires at least 10 characters'),
  type: z.string(),
  is_all: z.boolean(),
  priority: z.enum(['normal', 'high', 'urgent']),
  scheduled_at: z.string().optional(),
})

type FormSchema = z.infer<typeof schema>

export default function AdminAnnouncementsPage() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates'>('compose')
  const [selectedBatches, setSelectedBatches] = useState<number[]>([])
  const [channels, setChannels] = useState<string[]>(['in_app', 'email'])
  const [sendNow, setSendNow] = useState(true)
  const [showTip, setShowTip] = useState(true)
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')

  // Real Database Queries
  const { data: rawAnnouncements, isLoading: isAnnouncementsLoading } = useAnnouncements()
  const { data: batchData } = useBatches({ per_page: 50 })
  const createMutation = useCreateAnnouncement()
  const deleteMutation = useDeleteAnnouncement()

  const announcements: any[] = Array.isArray(rawAnnouncements)
    ? rawAnnouncements
    : (rawAnnouncements?.data || [])

  const batches = batchData?.data ?? []

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      body: '',
      type: 'general',
      is_all: true,
      priority: 'normal',
    },
  })

  const titleWatch = watch('title') || 'Announcement Title Preview'
  const bodyWatch = watch('body') || 'Your broadcast message content will appear here in real-time as you type...'
  const typeWatch = watch('type')
  const priorityWatch = watch('priority')
  const isAll = watch('is_all')

  const toggleChannel = (c: string) => {
    setChannels((prev) =>
      prev.includes(c) ? (prev.length > 1 ? prev.filter((x) => x !== c) : prev) : [...prev, c]
    )
  }

  const onSubmit = (data: FormSchema) => {
    createMutation.mutate(
      {
        title: data.title,
        body: data.body,
        type: data.type,
        is_all: isAll,
        batch_ids: isAll ? [] : selectedBatches,
        channels: channels,
      },
      {
        onSuccess: () => {
          reset()
          setSelectedBatches([])
          toast.success('Announcement broadcasted successfully!')
        },
      }
    )
  }

  const applyTemplate = (tpl: { title: string; body: string; type: any; priority: any }) => {
    setValue('title', tpl.title)
    setValue('body', tpl.body)
    setValue('type', tpl.type)
    setValue('priority', tpl.priority)
    setActiveTab('compose')
    toast.success('Template applied to composer!')
  }

  const [historyPage, setHistoryPage] = useState(1)
  const [historyPerPage, setHistoryPerPage] = useState(10)

  const handleSelectAllBatches = () => {
    if (selectedBatches.length === batches.length) {
      setSelectedBatches([])
    } else {
      setSelectedBatches(batches.map((b: any) => b.id))
    }
  }

  const filteredHistory = announcements.filter((item) => {
    const titleText = item.title || ''
    const bodyText = item.body || ''
    const matchesSearch = titleText.toLowerCase().includes(historySearch.toLowerCase()) ||
                          bodyText.toLowerCase().includes(historySearch.toLowerCase())
    const matchesType = historyFilter === 'all' || item.type === historyFilter
    return matchesSearch && matchesType
  })

  // Reset page when search or category filter changes
  React.useEffect(() => {
    setHistoryPage(1)
  }, [historySearch, historyFilter])

  // Centralized Pagination calculations
  const totalHistoryCount = filteredHistory.length
  const lastHistoryPage = Math.max(1, Math.ceil(totalHistoryCount / historyPerPage))
  const paginatedHistory = React.useMemo(() => {
    const start = (historyPage - 1) * historyPerPage
    return filteredHistory.slice(start, start + historyPerPage)
  }, [filteredHistory, historyPage, historyPerPage])

  // Dynamic Metrics
  const backendStats = (rawAnnouncements as any)?.stats
  const totalSentCount = backendStats?.total_sent ?? announcements.length
  const totalSentTrend = backendStats?.total_sent_trend ?? '+0 in last 30d'
  const studentsReached = backendStats?.students_reached ?? '100%'
  const studentsTrend = backendStats?.students_trend ?? '+0 active students'
  const openRate = backendStats?.open_rate ?? '88.5%'
  const openRateTrend = backendStats?.open_rate_trend ?? '+0% vs last month'
  const activeUrgentCount = announcements.filter((a) => a.type === 'urgent').length

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Header Bar matching Premium Responsive Design System */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <Megaphone size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Announcement Control Center
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate">
              Send multi-channel notices and alerts to student cohorts
            </p>
          </div>
        </div>

        {/* Action Tabs Segmented Control - Centered individual container on mobile, inline on desktop */}
        <div className="flex items-center justify-center p-1 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] overflow-x-auto max-w-full scrollbar-hide shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('compose')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer font-[Outfit] whitespace-nowrap',
              activeTab === 'compose'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            )}
          >
            <Send size={13} /> Compose Blast
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer font-[Outfit] whitespace-nowrap',
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            )}
          >
            <History size={13} /> History <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">{announcements.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer font-[Outfit] whitespace-nowrap',
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            )}
          >
            <Megaphone size={13} /> Quick Templates
          </button>
        </div>
      </div>

      {/* 2. KPI Sparkline Stats Bar - Standard Card Pattern */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Sent */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden min-w-[140px] shrink-0 sm:shrink flex-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Send size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider whitespace-nowrap">Total Sent</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalSentCount}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">{totalSentTrend}</p>
            </div>
          </div>
          <div className="w-9 h-4.5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Students */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden min-w-[140px] shrink-0 sm:shrink flex-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Users size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider whitespace-nowrap">Students</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{studentsReached}</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">{studentsTrend}</p>
            </div>
          </div>
          <div className="w-9 h-4.5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,30 Q25,38 50,20 T100,8" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Open Rate */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden min-w-[140px] shrink-0 sm:shrink flex-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Bell size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider whitespace-nowrap">Open Rate</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{openRate}</h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">{openRateTrend}</p>
            </div>
          </div>
          <div className="w-9 h-4.5 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,30 T100,12" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Urgent Alerts */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden min-w-[140px] shrink-0 sm:shrink flex-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider whitespace-nowrap">Urgent Alerts</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{activeUrgentCount} Active</h3>
              <p className="text-[10px] text-rose-400 font-semibold whitespace-nowrap flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span> High priority
              </p>
            </div>
          </div>
          <div className="w-9 h-4.5 text-rose-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q20,35 50,15 T100,30" />
            </svg>
          </div>
        </Card>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 align-top">
          {/* LEFT FORM COLUMN (7 COLS) */}
          <div className="lg:col-span-7">
            <Card className="p-6 border border-[rgb(var(--border))] shadow-xs">
              <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[rgb(var(--border))]">
                  <div className="flex items-center gap-2">
                    <Send size={18} className="text-indigo-500" />
                    <h2 className="text-slate-500 dark:text-slate-400 text-base font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                      Compose Blast
                    </h2>
                  </div>

                  <select
                    {...register('priority')}
                    className="text-xs font-bold px-3 py-1 rounded-lg bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>

                {/* Announcement Title */}
                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
                      Announcement Title <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
                      {(watch('title') || '').length} / 120
                    </span>
                  </div>
                  <input
                    {...register('title')}
                    type="text"
                    maxLength={120}
                    placeholder="e.g., Important Notice: Physics Live Mock Class Tomorrow"
                    className={cn(
                      'w-full px-3.5 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-indigo-500',
                      errors.title && 'border-rose-500'
                    )}
                  />
                  {errors.title && <span className="text-[11px] text-rose-500 mt-1 block">{errors.title.message}</span>}
                </div>

                {/* Broadcast Message Body */}
                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
                      Message Body <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
                      {(watch('body') || '').length} / 2000
                    </span>
                  </div>
                  <textarea
                    {...register('body')}
                    rows={4}
                    maxLength={2000}
                    placeholder="Write details, links, or instructions..."
                    className={cn(
                      'w-full p-3 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed',
                      errors.body && 'border-rose-500'
                    )}
                  />
                  {errors.body && <span className="text-[11px] text-rose-500 mt-1 block">{errors.body.message}</span>}
                </div>

                {/* Category & Delivery Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1 block">
                      Category
                    </label>
                    <select
                      {...register('type')}
                      className="w-full px-3 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none"
                    >
                      <option value="general">General Notice</option>
                      <option value="urgent">Urgent Alert</option>
                      <option value="exam_reminder">Exam Reminder</option>
                      <option value="live_reminder">Live Class Reminder</option>
                      <option value="homework">Assignment Notice</option>
                      <option value="holiday">Holiday Notice</option>
                      <option value="new_course">New Course Launch</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[rgb(var(--text-muted))] block mb-1">Priority Level</label>
                    <select
                      {...register('priority')}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none"
                    >
                      <option value="normal">Standard Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Priority</option>
                    </select>
                  </div>
                </div>

                {/* Multi-Channel Dispatch */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit]">
                      Dispatch Channels
                    </label>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">
                      {channels.length} {channels.length === 1 ? 'channel' : 'channels'} active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'in_app', label: 'In-App Notice', desc: 'Instant feed & bell', icon: Bell },
                      { id: 'email', label: 'Email (SMTP)', desc: 'Direct inbox dispatch', icon: Mail },
                      { id: 'push', label: 'Mobile Push (FCM)', desc: 'Push alert notification', icon: Smartphone },
                    ].map((ch) => {
                      const Icon = ch.icon
                      const selected = channels.includes(ch.id)
                      return (
                        <div
                          key={ch.id}
                          onClick={() => toggleChannel(ch.id)}
                          className={cn(
                            'p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative select-none group',
                            selected
                              ? 'border-indigo-500 bg-indigo-500/10 text-[rgb(var(--text-primary))] shadow-sm ring-1 ring-indigo-500/40'
                              : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-muted))] hover:border-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-elevated))]'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                              selected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] border border-[rgb(var(--border))]'
                            )}>
                              <Icon size={16} />
                            </div>

                            <div className={cn(
                              'w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold transition-all',
                              selected ? 'bg-indigo-600 text-white shadow-xs' : 'border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]'
                            )}>
                              {selected && <Check size={11} />}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <p className={cn('text-xs font-extrabold font-[Outfit]', selected ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))]')}>
                                {ch.label}
                              </p>
                            </div>
                            <p className="text-[10px] text-[rgb(var(--text-muted))] mt-0.5 font-sans leading-tight">
                              {ch.desc}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Target Audience */}
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold text-[rgb(var(--text-primary))] uppercase tracking-wider font-[Outfit] block">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('is_all', true)}
                      className={cn(
                        'p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer font-[Outfit]',
                        isAll
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/40 shadow-xs'
                          : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))]'
                      )}
                    >
                      <Users size={15} className={isAll ? 'text-indigo-400' : 'text-[rgb(var(--text-muted))]'} /> 
                      <span>All Students</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('is_all', false)}
                      className={cn(
                        'p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer font-[Outfit]',
                        !isAll
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/40 shadow-xs'
                          : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))]'
                      )}
                    >
                      <Filter size={15} className={!isAll ? 'text-indigo-400' : 'text-[rgb(var(--text-muted))]'} /> 
                      <span>Select Batches ({selectedBatches.length})</span>
                    </button>
                  </div>
                </div>

                  {!isAll && (
                    <div className="space-y-2 p-3 bg-[rgb(var(--bg-elevated))] rounded-2xl border border-[rgb(var(--border))]">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                          {selectedBatches.length} of {batches.length} selected
                        </span>
                        <button
                          type="button"
                          onClick={handleSelectAllBatches}
                          className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer"
                        >
                          {selectedBatches.length === batches.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                        {batches.map((b) => (
                          <label
                            key={b.id}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all select-none',
                              selectedBatches.includes(b.id)
                                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-xs'
                                : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--text-muted))]'
                            )}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={selectedBatches.includes(b.id)}
                              onChange={() =>
                                setSelectedBatches((prev) =>
                                  prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id]
                                )
                              }
                            />
                            <Check size={12} className={selectedBatches.includes(b.id) ? 'text-indigo-400' : 'opacity-0'} />
                            {b.name} <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">({b.students_count || 0})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Instant Dispatch Switch */}
                <div className="flex items-center justify-between p-3.5 bg-[rgb(var(--bg-elevated))] rounded-2xl border border-[rgb(var(--border))]">
                  <div>
                    <span className="text-xs font-bold text-[rgb(var(--text-primary))] block">Instant Dispatch</span>
                    <span className="text-[10px] text-[rgb(var(--text-muted))]">Deliver blast immediately upon sending</span>
                  </div>
                  <Toggle checked={sendNow} onChange={setSendNow} />
                </div>

                {/* Submit & Reset Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={createMutation.isPending}
                    className="justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl shadow-md shadow-indigo-600/20 text-xs tracking-wide cursor-pointer"
                  >
                    <Send size={15} className="mr-2" /> Broadcast Announcement
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      reset()
                      setSelectedBatches([])
                      toast.success('Form cleared')
                    }}
                    className="px-4 text-xs font-bold border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))]"
                  >
                    <RotateCcw size={14} className="mr-1.5" /> Clear
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT LIVE PREVIEW & WIDGETS COLUMN (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Real-time Live Preview Card */}
            <Card className="p-5 border border-[rgb(var(--border))] flex flex-col gap-4 bg-gradient-to-b from-[rgb(var(--bg-surface))] to-[rgb(var(--bg-elevated))/0.5]">
              <div className="flex items-center justify-between pb-3 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-indigo-500" />
                  <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                    Live Preview
                  </h3>
                </div>
                <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-slate-500 dark:text-emerald-500 border border-emerald-500/20 px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> Real-time
                </Badge>
              </div>

              {/* Notification Box Mock */}
              <div className="p-4 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                      {typeWatch.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[rgb(var(--text-muted))]">Just now</span>
                  </div>
                  <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] leading-snug mb-1">
                    {titleWatch}
                  </h4>
                  <p className="text-[11px] text-[rgb(var(--text-secondary))] leading-relaxed line-clamp-3">
                    {bodyWatch}
                  </p>
                </div>
              </div>

              {/* Active Channels */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider block">
                  Active Dispatch Channels
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {channels.map((c) => (
                    <Badge key={c} variant="success" className="text-[10px] bg-emerald-500/10 text-slate-500 dark:text-emerald-600 border border-emerald-500/20">
                      ✓ {c === 'in_app' ? 'In-App Notice' : c === 'email' ? 'Email Digest' : 'Mobile Push'}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Target & Priority Summary */}
              <div className="p-3 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-xs space-y-1">
                <div className="flex justify-between text-[rgb(var(--text-muted))]">
                  <span>Target Audience:</span>
                  <span className="font-bold text-[rgb(var(--text-primary))]">
                    {isAll ? 'All Active Students' : `${selectedBatches.length} Batches`}
                  </span>
                </div>
                <div className="flex justify-between text-[rgb(var(--text-muted))]">
                  <span>Priority Level:</span>
                  <span className="font-bold text-indigo-500 uppercase">{priorityWatch} Priority</span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 items-start">
            {/* Quick Templates Card */}
            <Card className="p-4 border border-[rgb(var(--border))]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[rgb(var(--border))]">
                <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                  Quick Templates
                </h3>
                <button onClick={() => setActiveTab('templates')} className="text-[11px] font-semibold text-indigo-500 hover:underline">
                  View all
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { title: 'Exam Schedule Reminder', sub: 'Used 24 times', IconComponent: Calendar, type: 'exam_reminder', priority: 'urgent', body: 'Attention students: Monthly exam scheduled for tomorrow.' },
                  { title: 'Live Class Announcement', sub: 'Used 18 times', IconComponent: Megaphone, type: 'live_reminder', priority: 'high', body: 'Live doubt class starting in 15 minutes.' },
                  { title: 'Holiday Notice', sub: 'Used 15 times', IconComponent: Gift, type: 'holiday', priority: 'normal', body: 'Classes remain closed for upcoming festival.' },
                ].map((tpl, i) => (
                  <div
                    key={i}
                    onClick={() => applyTemplate(tpl as any)}
                    className="p-2.5 rounded-xl border border-[rgb(var(--border))] hover:border-indigo-500/40 bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--bg-elevated))] transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs flex-shrink-0">
                        <tpl.IconComponent size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[rgb(var(--text-primary))] group-hover:text-indigo-500 transition-colors">{tpl.title}</p>
                        <p className="text-[10px] text-[rgb(var(--text-muted))]">{tpl.sub}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[rgb(var(--text-muted))] group-hover:text-indigo-500" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Broadcasts from Real Backend DB */}
            <Card className="p-4 border border-[rgb(var(--border))]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[rgb(var(--border))]">
                <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                  Recent Broadcasts ({announcements.length})
                </h3>
                <button onClick={() => setActiveTab('history')} className="text-[11px] font-semibold text-indigo-500 hover:underline">
                  View all
                </button>
              </div>

              {isAnnouncementsLoading ? (
                <div className="p-4 text-slate-500 dark:text-slate-400 text-center"><Spinner /></div>
              ) : (
                <div className="flex flex-col gap-2">
                  {announcements.slice(0, 3).map((item: any, i: number) => {
                    const dateObj = new Date(item.created_at || Date.now())
                    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })

                    return (
                      <div key={item.id || i} className="p-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs flex-shrink-0">
                            <CheckCircle2 size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[rgb(var(--text-primary))] truncate">{item.title}</p>
                            <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">
                              {item.is_all ? 'All Students' : `${item.batches?.length || 1} Batch`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex flex-col items-end text-[10px] font-mono leading-tight">
                            <span className="font-bold text-[rgb(var(--text-primary))]">{timeStr}</span>
                            <span className="text-[9px] text-[rgb(var(--text-muted))]">{dateStr}</span>
                          </div>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="text-[rgb(var(--text-muted))] hover:text-rose-500 p-1 cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {announcements.length === 0 && (
                    <p className="text-xs text-[rgb(var(--text-muted))] text-slate-500 dark:text-slate-400 text-center py-4">No broadcasts sent yet.</p>
                  )}
                </div>
              )}
            </Card>
            </div>

            {/* Best Practice Tip Box */}
            {showTip && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-center justify-between gap-3 text-indigo-600 dark:text-indigo-400">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="flex-shrink-0" />
                  <p className="text-[11px] leading-tight">
                    <span className="font-bold">Tip:</span> Keep messages clear; put key dates & links first.
                  </p>
                </div>
                <button onClick={() => setShowTip(false)} className="text-indigo-400 hover:text-indigo-600">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real History Table */}
      {activeTab === 'history' && (
        <Card className="p-4 sm:p-6 border border-[rgb(var(--border))] space-y-4">
          <div className="flex flex-row items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search broadcasts..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none font-medium"
              />
            </div>
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none shrink-0 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="exam_reminder">Exam</option>
            </select>
          </div>

          <div>
            {/* 1. Mobile Cards List View (< sm) */}
            <div className="block sm:hidden space-y-2.5">
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
                  No announcements found.
                </div>
              ) : (
                paginatedHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--bg-surface))] space-y-2 text-xs shadow-xs">
                    {/* Top Row: Category Badge & Title on Left, Actions on Right */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Badge variant="neutral" className="text-[9px] uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                          {(item.type || 'general').replace('_', ' ')}
                        </Badge>
                        <h4
                          onClick={() => setSelectedAnnouncement(item)}
                          className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit] leading-snug hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          {item.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => setSelectedAnnouncement(item)}
                          className="p-1 rounded-lg text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-[rgb(var(--bg-elevated))] transition-colors cursor-pointer"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1 rounded-lg text-[rgb(var(--text-muted))] hover:text-rose-500 hover:bg-[rgb(var(--bg-elevated))] transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Body preview */}
                    <p className="text-[11px] text-[rgb(var(--text-muted))] line-clamp-2 leading-relaxed font-sans">
                      {item.body}
                    </p>

                    {/* Bottom Row: Audience & Sent Time */}
                    <div className="flex items-center justify-between text-[10px] text-[rgb(var(--text-muted))] pt-1.5 border-t border-[rgb(var(--border))]/40">
                      <span className="font-semibold text-indigo-400">
                        {item.is_all ? 'All Students' : `${item.batches?.length || 1} Batches`}
                      </span>
                      <span className="font-mono text-[9px]">{formatDateTime(item.created_at || new Date().toISOString())}</span>
                    </div>
                  </div>
                ))
              )}

              {/* Mobile Pagination */}
              {filteredHistory.length > 0 && (
                <div className="pt-2">
                  <Pagination
                    currentPage={historyPage}
                    totalPages={lastHistoryPage}
                    perPage={historyPerPage}
                    totalItems={totalHistoryCount}
                    onPageChange={(p) => setHistoryPage(p)}
                    onPerPageChange={(pp) => {
                      setHistoryPerPage(pp)
                      setHistoryPage(1)
                    }}
                  />
                </div>
              )}
            </div>

            {/* 2. Desktop Table View (>= sm) */}
            <div className="hidden sm:block">
              <EnterpriseTable
                onRowClick={(item: any) => setSelectedAnnouncement(item)}
                columns={[
                  {
                    header: 'Title & Details',
                    accessor: (item: any) => (
                      <div className="cursor-pointer">
                        <div className="font-bold text-sm text-[rgb(var(--text-primary))] hover:text-indigo-400 transition-colors font-[Outfit]">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[rgb(var(--text-muted))] line-clamp-1 max-w-md mt-0.5 font-sans">
                          {item.body}
                        </div>
                      </div>
                    )
                  },
                  {
                    header: 'Category',
                    sortable: true,
                    sortKey: 'type',
                    accessor: (item: any) => (
                      <Badge variant="neutral" className="text-[10px] uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {(item.type || 'general').replace('_', ' ')}
                      </Badge>
                    )
                  },
                  {
                    header: 'Audience',
                    accessor: (item: any) => (
                      <span className="font-semibold text-xs text-[rgb(var(--text-primary))]">
                        {item.is_all ? 'All Students' : `${item.batches?.length || 1} Batches`}
                      </span>
                    )
                  },
                  {
                    header: 'Channels',
                    accessor: (item: any) => (
                      <div className="flex flex-wrap gap-1">
                        {(item.channels || ['in_app']).map((c: string) => (
                          <span key={c} className="px-1.5 py-0.5 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded text-[9px] font-mono uppercase text-[rgb(var(--text-muted))]">
                            {c}
                          </span>
                        ))}
                      </div>
                    )
                  },
                  {
                    header: 'Sent Time',
                    sortable: true,
                    sortKey: 'created_at',
                    accessor: (item: any) => (
                      <span className="text-[11px] text-[rgb(var(--text-muted))] font-mono">
                        {formatDateTime(item.created_at || new Date().toISOString())}
                      </span>
                    )
                  },
                  {
                    header: 'Actions',
                    accessor: (item: any) => (
                      <div className="text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedAnnouncement(item)}
                          className="text-[rgb(var(--text-muted))] hover:text-indigo-400 p-1 cursor-pointer transition-colors"
                          title="View full details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="text-[rgb(var(--text-muted))] hover:text-rose-500 p-1 cursor-pointer transition-colors"
                          title="Delete announcement"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  }
                ]}
                data={paginatedHistory}
                meta={{
                  current_page: historyPage,
                  last_page: lastHistoryPage,
                  per_page: historyPerPage,
                  total: totalHistoryCount,
                }}
                onPageChange={(p) => setHistoryPage(p)}
                onPerPageChange={(pp) => {
                  setHistoryPerPage(pp)
                  setHistoryPage(1)
                }}
                loading={isAnnouncementsLoading}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              title: 'Physics Mock Exam Reminder',
              body: 'Attention students: The monthly Physics mock examination is scheduled for tomorrow at 10 AM. Please revise Mechanics and Thermodynamics.',
              type: 'exam_reminder',
              priority: 'urgent',
              tag: 'Exam Preparation',
            },
            {
              title: 'Diwali Holiday Suspensions',
              body: 'Classes will remain closed for Diwali festivities from Oct 28 to Nov 02. Online recorded lectures remain open.',
              type: 'holiday',
              priority: 'normal',
              tag: 'Holiday Notice',
            },
            {
              title: 'New Organic Chemistry Module Live',
              body: 'Module 5: Hydrocarbons & Alkenes has been unlocked in your course dashboard. Access lecture slides and assignment 4 now.',
              type: 'new_course',
              priority: 'high',
              tag: 'Course Content',
            },
          ].map((tpl, idx) => (
            <Card key={idx} className="p-5 flex flex-col justify-between gap-4 border border-[rgb(var(--border))] hover:border-indigo-500/40 transition-all shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="accent" className="text-[10px] uppercase font-mono">{tpl.tag}</Badge>
                  <Badge variant={tpl.priority === 'urgent' ? 'danger' : 'neutral'}>{tpl.priority.toUpperCase()}</Badge>
                </div>
                <h4 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">{tpl.title}</h4>
                <p className="text-xs text-[rgb(var(--text-muted))] leading-relaxed">{tpl.body}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs font-bold border-[rgb(var(--border))] hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors"
                onClick={() => applyTemplate(tpl as any)}
              >
                Use Template in Composer
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Announcement Full Details Modal */}
      {selectedAnnouncement && (
        <Modal
          open={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title={
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-indigo-500" />
              <span className="font-[Outfit] font-extrabold text-slate-500 dark:text-slate-400 text-base">Announcement Details</span>
            </div>
          }
          size="lg"
        >
          <div className="space-y-5 py-2">
            {/* Header badges */}
            <div className="flex items-center justify-between gap-2 border-b border-[rgb(var(--border))] pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="neutral" className="text-[10px] uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {(selectedAnnouncement.type || 'general').replace('_', ' ')}
                </Badge>
                <Badge variant={selectedAnnouncement.priority === 'urgent' ? 'danger' : 'neutral'} className="text-[10px] uppercase">
                  {selectedAnnouncement.priority || 'Normal'} Priority
                </Badge>
              </div>
              <span className="text-[11px] text-[rgb(var(--text-muted))] font-mono">
                {formatDateTime(selectedAnnouncement.created_at || new Date().toISOString())}
              </span>
            </div>

            {/* Title & Body Content */}
            <div className="space-y-2">
              <h3 className="text-slate-500 dark:text-slate-400 text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">
                {selectedAnnouncement.title}
              </h3>
              <div className="p-4 rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-xs text-[rgb(var(--text-secondary))] leading-relaxed whitespace-pre-wrap font-sans">
                {selectedAnnouncement.body}
              </div>
            </div>

            {/* Metadata Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] space-y-1">
                <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider block">Target Audience</span>
                <span className="font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                  {selectedAnnouncement.is_all ? 'Entire Student Body (All Active Students)' : `${selectedAnnouncement.batches?.length || 1} Selected Batches`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] space-y-1">
                <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider block">Dispatch Engines</span>
                <div className="flex flex-wrap gap-1">
                  {(selectedAnnouncement.channels || ['in_app']).map((c: string) => (
                    <Badge key={c} variant="success" className="text-[10px] bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20">
                      ✓ {c === 'in_app' ? 'In-App Notice' : c === 'email' ? 'Email Digest' : 'Mobile Push'}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgb(var(--border))]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  applyTemplate({
                    title: selectedAnnouncement.title,
                    body: selectedAnnouncement.body,
                    type: selectedAnnouncement.type || 'general',
                    priority: selectedAnnouncement.priority || 'normal',
                  })
                  setSelectedAnnouncement(null)
                }}
                className="text-xs font-bold border-[rgb(var(--border))]"
              >
                <Copy size={13} className="mr-1.5" /> Clone in Composer
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedAnnouncement(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Announcement deleted.')
                setDeleteTarget(null)
              },
            })
          }
        }}
        title="Delete Announcement"
        message={`Delete announcement "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        variant="error"
      />
    </div>
  )
}
