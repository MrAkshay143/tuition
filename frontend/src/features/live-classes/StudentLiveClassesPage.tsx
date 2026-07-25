import React, { useState } from 'react'
import { useStudentLiveClasses, useRecordAttendance } from '@/api/resources/liveClasses'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { Calendar, Clock, Video, PlayCircle, ExternalLink } from 'lucide-react'

export const StudentLiveClassesPage = () => {
  const { data: classes, isLoading } = useStudentLiveClasses()
  const recordAttendanceMutation = useRecordAttendance()

  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'past'>('upcoming')

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  const classList = classes?.data || classes || []
  
  const upcomingClasses = classList.filter((c: any) => c.status === 'scheduled' || c.status === 'live')
  const pastClasses = classList.filter((c: any) => c.status === 'ended' || c.status === 'cancelled')

  const displayedClasses = statusFilter === 'upcoming' ? upcomingClasses : pastClasses

  const handleJoinClass = (id: number, url: string | null) => {
    // Record attendance asynchronously
    recordAttendanceMutation.mutate(id)

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-[Outfit] text-[rgb(var(--text-primary))]">Live Sessions</h1>
      </div>

      <div className="flex items-center gap-1 border-b border-[rgb(var(--border))] overflow-x-auto scrollbar-none whitespace-nowrap pb-1">
        <button 
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'upcoming' ? 'bg-[rgb(var(--primary))] text-white shadow-xs' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-elevated))]'}`}
          onClick={() => setStatusFilter('upcoming')}
        >Upcoming & Live</button>
        <button 
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'past' ? 'bg-[rgb(var(--primary))] text-white shadow-xs' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-elevated))]'}`}
          onClick={() => setStatusFilter('past')}
        >Past Sessions</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedClasses.map((c: any) => (
          <Card key={c.id} className={`p-5 flex flex-col gap-4 relative overflow-hidden ${c.status === 'live' ? 'ring-2 ring-red-500 bg-red-50/50' : ''}`}>
            {c.status === 'live' && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg animate-pulse uppercase tracking-wider">
                Live Now
              </div>
            )}
            
            <div className="space-y-1">
              <Badge variant={
                c.status === 'scheduled' ? 'primary' : 
                c.status === 'live' ? 'danger' : 
                'neutral'
              } className="uppercase text-[10px] mb-1">
                {c.status}
              </Badge>
              <h3 className="font-bold text-lg text-[rgb(var(--text-primary))] pr-8">{c.title}</h3>
              {c.description && <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-2 mt-1">{c.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4 text-sm text-[rgb(var(--text-secondary))] bg-white dark:bg-[#0c0d24]/50 p-4 rounded-lg border border-[rgb(var(--border))]">
              <div className="flex items-center gap-2 col-span-2 text-[rgb(var(--text-primary))] font-bold">
                <Calendar size={16} className="text-indigo-500" /> 
                {new Date(c.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" /> {c.duration_minutes} mins
              </div>
              <div className="flex items-center gap-2 capitalize">
                <Video size={16} className="text-indigo-500" /> {c.provider}
              </div>
            </div>

            <div className="mt-auto pt-4 flex gap-2">
              {c.status === 'live' && (
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 font-bold"
                  onClick={() => handleJoinClass(c.id, c.meeting_url)}
                >
                  <PlayCircle size={18} className="mr-2" /> Join Session Now
                </Button>
              )}
              {c.status === 'scheduled' && (
                <Button className="w-full" variant="outline" disabled>
                  Waiting for host to start...
                </Button>
              )}
              {c.status === 'ended' && c.recording_url && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open(c.recording_url, '_blank')}
                >
                  <ExternalLink size={16} className="mr-2" /> Watch Recording
                </Button>
              )}
              {c.status === 'ended' && !c.recording_url && (
                <div className="w-full text-slate-500 dark:text-slate-400 text-center text-sm text-[rgb(var(--text-muted))] py-2">
                  Session ended. No recording available.
                </div>
              )}
            </div>
          </Card>
        ))}

        {displayedClasses.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-[rgb(var(--text-muted))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl bg-gray-50/50">
            <Video size={48} className="mb-4 text-gray-300" />
            <h3 className="font-bold text-lg text-gray-500">No {statusFilter} sessions</h3>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  )
}
