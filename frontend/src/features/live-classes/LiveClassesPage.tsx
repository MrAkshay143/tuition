import { useState } from 'react'
import { useApiQuery, useApiMutation } from '@/api/resources/hooks'
import { useQueryClient } from '@tanstack/react-query'
import {
  Video, Plus, Search, Filter, Calendar, Clock, Users,
  Bookmark, MoreVertical, PlayCircle, Radio, ChevronsLeft,
  ChevronLeft, ChevronRight, ChevronsRight, ChevronDown, LayoutGrid, List, SlidersHorizontal,
  Pencil, Trash2
} from 'lucide-react'
import { Button, Card, Skeleton, ConfirmModal } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store'
import { CreateLiveClassModal } from './CreateLiveClassModal'

export function LiveClassesPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isAdmin = (user?.role as string) === 'admin' || (user?.role as string) === 'superadmin'
  const rolePrefix = isAdmin ? '/admin' : '/teacher'

  const [search, setSearch] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'scheduled' | 'ended'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editTargetData, setEditTargetData] = useState<any>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  // API Queries
  const { data: teachers } = useApiQuery(
    ['admin', 'teachers'],
    '/users?role=teacher',
    undefined,
    { enabled: isAdmin }
  )

  // For live classes, we can still use useQuery because of dynamic fallback behavior.
  // Actually, we can use useApiQuery but the fallback behavior is tricky.
  // Let's just create a direct API request via standard useQuery for this exceptional case.
  const { data: liveClasses = [], isLoading } = useApiQuery(
    ['live-classes', selectedTeacherId],
    isAdmin ? '/admin/live-classes' : '/teacher/live-classes',
    selectedTeacherId ? { teacher_id: selectedTeacherId } : undefined
  )

  const deleteMutation = useApiMutation<any, number>(
    (id: number) => isAdmin ? `/admin/live-classes/${id}` : `/teacher/live-classes/${id}`,
    'delete',
    { invalidateKeys: [['live-classes']] }
  )

  const handleStartClass = (id: number, meetingUrl?: string) => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank')
    } else {
      window.location.href = `${rolePrefix}/live-classes/${id}/room`
    }
  }

  const classList = Array.isArray(liveClasses) ? liveClasses : []

  const filteredClasses = classList.filter((c: any) => {
    const matchesSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase())
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'live'
        ? c.status === 'live'
        : activeTab === 'scheduled'
        ? c.status === 'scheduled'
        : c.status === 'ended'
    return matchesSearch && matchesTab
  })

  const liveNowCount = classList.filter((c: any) => c.status === 'live').length
  const scheduledCount = classList.filter((c: any) => c.status === 'scheduled').length
  const totalDurationMinutes = classList.reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0)

  return (
    <div className="space-y-6">
      {/* 1. Single-Line Header Bar matching Users & Roles Pages */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <Video size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Live Classes
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Schedule and host live interactive student sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => { setEditTargetData(null); setIsCreateModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Schedule Class</span>
            <span className="inline sm:hidden">+ Schedule</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Cards Row matching Users & Roles Pages */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Classes */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Video size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Classes</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{classList.length}</h3>
            <p className="text-[10px] text-purple-400 font-semibold mt-1">All time</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-purple-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 2: Live Now */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Radio size={15} className="animate-pulse" />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Live Now</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{liveNowCount}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">Active sessions</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[100%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 3: Upcoming */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Calendar size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Upcoming</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{scheduledCount}</h3>
            <p className="text-[10px] text-blue-400 font-semibold mt-1">Scheduled</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-500 h-full w-[70%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 4: Total Hours */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Hours</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{Math.round(totalDurationMinutes / 60)} hrs</h3>
            <p className="text-[10px] text-amber-400 font-semibold mt-1">Stream time</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[80%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 3. Search & Workable Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Left Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              placeholder="Search live classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Workable Filter Toggle Button on Right Side */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0",
              showFilters || selectedTeacherId !== '' || activeTab !== 'all'
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(selectedTeacherId !== '' || activeTab !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* View Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5 rounded-lg text-[rgb(var(--text-muted))] cursor-pointer', viewMode === 'grid' && 'bg-indigo-600 text-white')}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded-lg text-[rgb(var(--text-muted))] cursor-pointer', viewMode === 'list' && 'bg-indigo-600 text-white')}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel - Side by Side */}
        {(showFilters || selectedTeacherId !== '' || activeTab !== 'all') && (
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
                    {(Array.isArray(teachers) ? teachers : []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
                </div>
              )}

              {/* Status Selector */}
              <div className="relative min-w-[120px] flex-1">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as any)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">All Status</option>
                  <option value="live">Live Now</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="ended">Ended</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>
            </div>

            {(selectedTeacherId !== '' || activeTab !== 'all') && (
              <button
                onClick={() => { setSelectedTeacherId(''); setActiveTab('all') }}
                className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Live Classes List / Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-44 sm:h-52 rounded-2xl border border-[rgb(var(--border))]" />
          ))}
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card className="py-12 text-slate-500 dark:text-slate-400 text-center border border-dashed border-[rgb(var(--border))]">
          <Radio size={32} className="mx-auto text-[rgb(var(--text-muted))] mb-2 opacity-40" />
          <p className="text-xs sm:text-sm font-semibold text-[rgb(var(--text-secondary))]">No live classes found</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredClasses.map((c: any) => {
            const dateStr = c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '23 Jul'
            const timeStr = c.scheduled_at ? new Date(c.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '11:30 AM'
            const batchTag = c.batches?.[0]?.name || 'JEE 2026'

            return (
              <Card
                key={c.id}
                className={cn(
                  'p-2.5 sm:p-3.5 border border-[rgb(var(--border))] flex flex-col justify-between space-y-2 sm:space-y-3 hover:border-indigo-500/40 transition-all group relative',
                  c.status === 'live' && 'border-emerald-500/40 shadow-md shadow-emerald-500/5'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  {c.status === 'live' ? (
                    <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span> LIVE NOW
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 sm:px-2 py-0.5 rounded-full truncate">
                      SCHEDULED
                    </span>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => { setEditTargetData(c); setIsCreateModalOpen(true); }} className="p-1 text-[rgb(var(--text-muted))] hover:text-indigo-400 shrink-0 cursor-pointer" title="Edit Class">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTargetId(c.id)} className="p-1 text-[rgb(var(--text-muted))] hover:text-rose-400 shrink-0 cursor-pointer" title="Cancel Class">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-1 sm:line-clamp-2 leading-snug">{c.title}</h3>
                  <span className="inline-block mt-1 text-[8px] sm:text-[9px] font-mono uppercase font-bold text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] px-1.5 sm:px-2 py-0.5 rounded-md truncate max-w-full">
                    {batchTag}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 sm:px-2.5 rounded-lg bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[9px] sm:text-[10px] font-mono">
                  <div>
                    <span className="text-[rgb(var(--text-muted))]">{dateStr}, </span>
                    <span className="font-bold text-[rgb(var(--text-primary))]">{timeStr}</span>
                  </div>
                  <span className="font-bold text-indigo-400">{c.duration_minutes || 90} mins</span>
                </div>

                <Button
                  variant="primary"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 truncate"
                  onClick={() => handleStartClass(c.id, c.meeting_url)}
                >
                  <PlayCircle size={12} className="shrink-0" />
                  <span className="truncate">{c.status === 'live' ? 'Join Live' : 'Start Session'}</span>
                </Button>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredClasses.map((c: any) => {
            const dateStr = c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '23 Jul 2026'
            const timeStr = c.scheduled_at ? new Date(c.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '11:30 AM'

            return (
              <Card key={c.id} className="p-3.5 border border-[rgb(var(--border))] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-indigo-500/40 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Video size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">{c.title}</h3>
                    <p className="text-[11px] text-[rgb(var(--text-muted))] mt-0.5">Scheduled: {dateStr}, {timeStr} • {c.duration_minutes || 90} mins</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Button
                    variant="primary"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm cursor-pointer"
                    onClick={() => handleStartClass(c.id, c.meeting_url)}
                  >
                    Start Session
                  </Button>
                  <div className="flex gap-1.5 ml-2">
                    <button onClick={() => { setEditTargetData(c); setIsCreateModalOpen(true); }} className="p-2 hover:text-indigo-400 text-[rgb(var(--text-muted))]" title="Edit Class">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTargetId(c.id)} className="p-2 hover:text-rose-400 text-[rgb(var(--text-muted))]" title="Cancel Class">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Centralized & Mobile Responsive Bottom Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[rgb(var(--border))] mt-6 text-xs text-[rgb(var(--text-muted))]">
        <span className="font-medium text-center sm:text-left">
          Showing 1 to {filteredClasses.length} of {classList.length} sessions
        </span>

        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer">
            &lt;
          </button>
          <button className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-xs">
            1
          </button>
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer">
            &gt;
          </button>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <CreateLiveClassModal
        open={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setEditTargetData(null); }}
        initialData={editTargetData}
      />

      <ConfirmModal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Cancel Live Class"
        message="Cancel and delete this live class session?"
        confirmLabel="Cancel Class"
        variant="danger"
        onConfirm={() => {
          if (deleteTargetId) { deleteMutation.mutate(deleteTargetId); setDeleteTargetId(null) }
        }}
      />
    </div>
  )
}

export default LiveClassesPage

