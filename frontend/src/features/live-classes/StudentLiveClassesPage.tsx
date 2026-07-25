import React, { useState } from 'react'
import { useStudentLiveClasses, useRecordAttendance } from '@/api/resources/liveClasses'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { Calendar, Clock, Video, PlayCircle, ExternalLink, Radio, Search } from 'lucide-react'

export const StudentLiveClassesPage = () => {
  const { data: classes, isLoading } = useStudentLiveClasses()
  const recordAttendanceMutation = useRecordAttendance()

  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'past'>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')

  if (isLoading) return <div className="flex justify-center p-16"><Spinner /></div>

  const classList = classes?.data || classes || []
  
  const upcomingClasses = classList.filter((c: any) => c.status === 'scheduled' || c.status === 'live')
  const pastClasses = classList.filter((c: any) => c.status === 'ended' || c.status === 'cancelled')

  const baseClasses = statusFilter === 'upcoming' ? upcomingClasses : pastClasses
  const displayedClasses = baseClasses.filter((c: any) => 
    !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleJoinClass = (id: number, url: string | null) => {
    recordAttendanceMutation.mutate(id)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const liveNowCount = classList.filter((c: any) => c.status === 'live').length

  return (
    <div className="space-y-5 pb-12 font-[Outfit]">
      {/* 1. Minimalist Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Live Sessions</span>
          </div>
        </div>
        {liveNowCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full animate-pulse shadow-xs">
            {liveNowCount} LIVE NOW
          </span>
        )}
      </div>

      {/* 2. Compact One-Line Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Video size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Sessions</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{classList.length}</h3>
            <p className="text-[10px] text-indigo-500 font-semibold mt-1">Enrolled lectures</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Calendar size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Upcoming</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{upcomingClasses.length}</h3>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">Scheduled sessions</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[70%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Past Replays</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{pastClasses.length}</h3>
            <p className="text-[10px] text-amber-500 font-semibold mt-1">Available recordings</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[90%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 2. One-Line Search Input & Filter Tabs Bar */}
      <div className="flex items-center justify-between gap-2.5 bg-[rgb(var(--bg-surface))] p-2 sm:p-2.5 rounded-2xl border border-[rgb(var(--border))] shadow-2xs">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--text-muted))]" />
          <input 
            type="text" 
            placeholder="Search sessions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition-all"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] shrink-0">
          <button 
            className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'upcoming' ? 'bg-indigo-600 text-white shadow-xs' : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
            onClick={() => setStatusFilter('upcoming')}
          >
            Upcoming ({upcomingClasses.length})
          </button>
          <button 
            className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'past' ? 'bg-indigo-600 text-white shadow-xs' : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
            onClick={() => setStatusFilter('past')}
          >
            Past ({pastClasses.length})
          </button>
        </div>
      </div>

      {/* 3. Responsive Compact Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {displayedClasses.map((c: any) => (
          <Card key={c.id} className={`p-3.5 sm:p-4 flex flex-col justify-between gap-3 group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl ${c.status === 'live' ? 'ring-2 ring-red-500 bg-red-500/5 dark:bg-red-950/10' : ''}`}>
            {c.status === 'live' && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl-xl animate-pulse uppercase tracking-wider shadow-sm">
                Live Now
              </div>
            )}
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant={
                  c.status === 'scheduled' ? 'primary' : 
                  c.status === 'live' ? 'danger' : 
                  'neutral'
                } className="uppercase text-[9px] font-extrabold tracking-wider px-2 py-0.5">
                  {c.status}
                </Badge>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-[rgb(var(--text-primary))] pr-6 group-hover:text-indigo-500 transition-colors line-clamp-1">{c.title}</h3>
              {c.description && <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-2 leading-relaxed">{c.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-elevated))] p-2.5 rounded-xl border border-[rgb(var(--border))]">
              <div className="flex items-center gap-1.5 sm:col-span-2 text-[rgb(var(--text-primary))] font-bold">
                <Calendar size={13} className="text-indigo-500 shrink-0" /> 
                <span className="truncate">{new Date(c.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[11px]">
                <Clock size={13} className="text-indigo-500 shrink-0" /> <span>{c.duration_minutes} mins</span>
              </div>
              <div className="flex items-center gap-1.5 capitalize font-medium text-[11px]">
                <Video size={13} className="text-indigo-500 shrink-0" /> <span className="truncate">{c.provider}</span>
              </div>
            </div>

            <div>
              {c.status === 'live' && (
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 font-extrabold rounded-xl py-1.5 h-8 text-xs"
                  onClick={() => handleJoinClass(c.id, c.meeting_url)}
                >
                  <PlayCircle size={15} className="mr-1.5" /> Join Session Now
                </Button>
              )}
              {c.status === 'scheduled' && (
                <Button className="w-full font-bold rounded-xl py-1.5 h-8 text-xs" variant="outline" disabled>
                  Waiting for host to start...
                </Button>
              )}
              {c.status === 'ended' && c.recording_url && (
                <Button 
                  className="w-full font-bold rounded-xl py-1.5 h-8 text-xs bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20"
                  variant="outline"
                  onClick={() => window.open(c.recording_url, '_blank')}
                >
                  <ExternalLink size={14} className="mr-1.5" /> Watch Recording
                </Button>
              )}
              {c.status === 'ended' && !c.recording_url && (
                <div className="w-full text-center text-xs font-semibold text-[rgb(var(--text-muted))] py-1.5 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
                  No recording available
                </div>
              )}
            </div>
          </Card>
        ))}

        {displayedClasses.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center p-6 bg-[rgb(var(--bg-surface))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-3 shadow-xs">
              <Video size={24} />
            </div>
            <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] mb-1">No {statusFilter} sessions found</h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] max-w-sm">
              {searchQuery ? "No live classes match your search query." : "You're all caught up with your live sessions!"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
