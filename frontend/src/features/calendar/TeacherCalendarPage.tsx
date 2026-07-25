import React, { useState } from 'react'
import { useApiQuery } from '@/api/resources/hooks'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { Spinner, Badge } from '@/components/ui'
import {
  ChevronLeft, ChevronRight, Video, FileText, Calendar as CalIcon,
  Users, Clock, Plus, CheckCircle2, Sparkles, Filter, Info, X, ExternalLink
} from 'lucide-react'

// Helper date utilities
const getStartOfWeek = (date: Date) => startOfWeek(date, { weekStartsOn: 1 })

export const TeacherCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'agenda'>('week')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedMobileDayIdx, setSelectedMobileDayIdx] = useState(0)

  // Fetch Live Classes
  const { data: liveClassesData, isLoading: isLoadingClasses } = useApiQuery(
    ['teacher', 'live-classes'],
    '/live-classes'
  )

  // Fetch Assignments
  const { data: assignmentsData, isLoading: isLoadingAssig } = useApiQuery(
    ['teacher', 'assignments'],
    '/assignments'
  )

  const liveClasses = liveClassesData?.data || liveClassesData || []
  const assignments = assignmentsData?.data || assignmentsData || []

  // Date Nav controls
  const handleToday = () => setCurrentDate(new Date())
  const handlePrev = () => setCurrentDate(addDays(currentDate, viewMode === 'week' ? -7 : -30))
  const handleNext = () => setCurrentDate(addDays(currentDate, viewMode === 'week' ? 7 : 30))

  const startOfWeekDate = getStartOfWeek(currentDate)
  const weekDays = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfWeekDate, i))
  }, [startOfWeekDate])

  // Sync mobile selected day when weekDays change
  React.useEffect(() => {
    const todayIdx = weekDays.findIndex(d => isSameDay(d, new Date()))
    setSelectedMobileDayIdx(todayIdx !== -1 ? todayIdx : 0)
  }, [weekDays])

  // Map events to days
  const eventsByDay = React.useMemo(() => {
    return weekDays.map(day => {
      const dayClasses = liveClasses.filter((c: any) => c.scheduled_at && isSameDay(new Date(c.scheduled_at), day))
      const dayAssignments = assignments.filter((a: any) => a.due_date && isSameDay(new Date(a.due_date), day))
      return {
        date: day,
        classes: dayClasses,
        assignments: dayAssignments
      }
    })
  }, [weekDays, liveClasses, assignments])

  // Stats summary
  const totalClassesThisWeek = eventsByDay.reduce((acc, d) => acc + d.classes.length, 0)
  const totalAssignmentsThisWeek = eventsByDay.reduce((acc, d) => acc + d.assignments.length, 0)

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const activeMobileDay = eventsByDay[selectedMobileDayIdx] || eventsByDay[0]

  if (isLoadingClasses || isLoadingAssig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner size={36} />
        <p className="text-xs font-medium text-[rgb(var(--text-muted))]">Loading teaching schedule...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12 text-left">
      {/* Top Banner Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-3 sm:p-3.5 shadow-xs">
        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <h1 className="text-sm sm:text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] shrink-0">
            Teaching Calendar
          </h1>
          <span className="hidden sm:inline text-[rgb(var(--text-muted))] text-xs">•</span>
          <p className="hidden sm:block text-xs text-[rgb(var(--text-muted))] truncate">
            Track live sessions, batch deadlines, and student submissions.
          </p>
        </div>

        {/* Control Bar: View Switcher & Month Navigation (Inline Row on Mobile) */}
        <div className="flex flex-row items-center justify-between sm:justify-start gap-2 relative z-10 w-full lg:w-auto shrink-0 pt-1 lg:pt-0 border-t border-[rgb(var(--border))] lg:border-none">
          {/* View Mode Pills */}
          <div className="bg-[rgb(var(--bg-elevated))] p-1 rounded-xl border border-[rgb(var(--border))] flex items-center shrink-0">
            {(['week', 'month', 'agenda'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-1 bg-[rgb(var(--bg-elevated))] p-1 rounded-xl border border-[rgb(var(--border))] shrink-0">
            <button
              onClick={handleToday}
              className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-[rgb(var(--bg-surface))] rounded-lg transition-all cursor-pointer"
            >
              Today
            </button>

            <div className="flex items-center gap-0.5">
              <button
                onClick={handlePrev}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--border))] text-[rgb(var(--text-primary))] flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="text-[11px] sm:text-xs font-bold text-[rgb(var(--text-primary))] min-w-[75px] sm:min-w-[95px] text-center px-1 truncate">
                {monthName}
              </span>

              <button
                onClick={handleNext}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--border))] text-[rgb(var(--text-primary))] flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Summary Metric Cards ───────────────────────────────────────────── */}
      <div className="admin-stats-row">
        {/* Card 1 */}
        <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-xl p-3.5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Video size={20} />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{totalClassesThisWeek}</span>
            <span className="text-[11px] text-[rgb(var(--text-muted))] font-medium">Live Classes This Week</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-xl p-3.5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{totalAssignmentsThisWeek}</span>
            <span className="text-[11px] text-[rgb(var(--text-muted))] font-medium">Assignment Deadlines</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-xl p-3.5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">Active</span>
            <span className="text-[11px] text-[rgb(var(--text-muted))] font-medium">Batch Schedule Live</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-xl p-3.5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <CalIcon size={20} />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">7 Days</span>
            <span className="text-[11px] text-[rgb(var(--text-muted))] font-medium">Weekly View Horizon</span>
          </div>
        </div>
      </div>

      {/* ── 3. Main Schedule View (Week / Month / Agenda) ──────────────────────── */}
      {viewMode === 'week' && (
        <>
          {/* MOBILE VIEW (< md): Horizontal Day Picker Bar + Selected Day Events */}
          <div className="block md:hidden space-y-4">
            {/* Horizontal Day Selector Pills */}
            <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {eventsByDay.map((dayData, idx) => {
                const isToday = isSameDay(dayData.date, new Date())
                const isSelected = selectedMobileDayIdx === idx
                const totalEvents = dayData.classes.length + dayData.assignments.length

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedMobileDayIdx(idx)}
                    className={`flex-1 min-w-[50px] p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md font-bold'
                        : isToday
                        ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border))]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold">
                      {dayData.date.toLocaleString('default', { weekday: 'short' })}
                    </span>
                    <span className="text-base font-extrabold font-[Outfit]">
                      {dayData.date.getDate()}
                    </span>
                    {totalEvents > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected Day Agenda Header & Content */}
            <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-2.5">
                <div>
                  <h3 className="font-bold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">
                    {activeMobileDay?.date.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <p className="text-[10px] text-[rgb(var(--text-muted))]">
                    {activeMobileDay?.classes.length || 0} class{(activeMobileDay?.classes.length || 0) !== 1 ? 'es' : ''}, {activeMobileDay?.assignments.length || 0} assignment deadline{(activeMobileDay?.assignments.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                {isSameDay(activeMobileDay?.date, new Date()) && (
                  <Badge variant="primary" className="text-[9px] uppercase font-bold">Today</Badge>
                )}
              </div>

              {activeMobileDay?.classes.length === 0 && activeMobileDay?.assignments.length === 0 ? (
                <div className="py-10 text-center text-[rgb(var(--text-muted))] text-xs font-medium border border-dashed border-[rgb(var(--border))] rounded-xl">
                  No events scheduled for this day.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Classes */}
                  {activeMobileDay?.classes.map((c: any) => (
                    <div
                      key={`m-class-${c.id}`}
                      onClick={() => setSelectedEvent({ type: 'class', ...c })}
                      className="bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--border))] border border-indigo-500/30 p-3 rounded-xl space-y-2 cursor-pointer transition-all relative overflow-hidden"
                    >
                      <div className="w-1 h-full bg-indigo-600 absolute left-0 top-0 rounded-l" />
                      <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold text-[10px] pl-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} />
                          {new Date(c.scheduled_at).toLocaleTimeString([], { timeStyle: 'short' })}
                        </span>
                        <Badge variant="primary" className="text-[9px] uppercase">{c.status || 'Live'}</Badge>
                      </div>
                      <h4 className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit] pl-1">{c.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-[rgb(var(--text-muted))] pt-1 border-t border-[rgb(var(--border))] pl-1">
                        <span>{c.batches?.map((b: any) => b.name).join(', ') || 'General Batch'}</span>
                        <ExternalLink size={12} className="text-indigo-500" />
                      </div>
                    </div>
                  ))}

                  {/* Assignments */}
                  {activeMobileDay?.assignments.map((a: any) => (
                    <div
                      key={`m-assig-${a.id}`}
                      onClick={() => setSelectedEvent({ type: 'assignment', ...a })}
                      className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-2 cursor-pointer transition-all relative overflow-hidden"
                    >
                      <div className="w-1 h-full bg-amber-500 absolute left-0 top-0 rounded-l" />
                      <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-[10px] pl-1">
                        <span className="flex items-center gap-1 font-mono">
                          <FileText size={11} />
                          Due {new Date(a.due_date).toLocaleTimeString([], { timeStyle: 'short' })}
                        </span>
                        <Badge variant="warning" className="text-[9px] uppercase">Assignment</Badge>
                      </div>
                      <h4 className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit] pl-1">{a.title}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP VIEW (>= md): Full 7-Column Week Grid */}
          <div className="hidden md:grid grid-cols-7 gap-3">
            {eventsByDay.map((dayData, idx) => {
              const isToday = isSameDay(dayData.date, new Date())

              return (
                <div
                  key={idx}
                  className={`flex flex-col min-h-[500px] rounded-2xl border overflow-hidden transition-all shadow-xs ${
                    isToday
                      ? 'border-indigo-500 bg-[rgb(var(--bg-surface))] ring-2 ring-indigo-500/20'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]'
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`p-3 text-center border-b transition-colors ${
                      isToday
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] border-[rgb(var(--border))]'
                    }`}
                  >
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-indigo-100' : 'text-[rgb(var(--text-muted))]'}`}>
                      {dayData.date.toLocaleString('default', { weekday: 'short' })}
                    </div>
                    <div className="text-xl font-extrabold font-[Outfit] mt-0.5">
                      {dayData.date.getDate()}
                    </div>
                  </div>

                  {/* Day Events Container */}
                  <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[460px]">
                    {dayData.classes.length === 0 && dayData.assignments.length === 0 && (
                      <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-[rgb(var(--border))] rounded-xl">
                        <span className="text-[10px] text-[rgb(var(--text-muted))] font-semibold">No scheduled events</span>
                      </div>
                    )}

                    {/* Live Class Cards */}
                    {dayData.classes.map((c: any) => (
                      <div
                        key={`class-${c.id}`}
                        onClick={() => setSelectedEvent({ type: 'class', ...c })}
                        className="bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--bg-surface))] border border-indigo-500/30 p-2.5 rounded-xl space-y-1.5 cursor-pointer transition-all shadow-xs group relative overflow-hidden"
                      >
                        <div className="w-1 h-full bg-indigo-600 absolute left-0 top-0 rounded-l" />

                        <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold text-[10px] pl-1">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock size={10} />
                            {new Date(c.scheduled_at).toLocaleTimeString([], { timeStyle: 'short' })}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                            {c.status || 'Live'}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-2 leading-snug pl-1">
                          {c.title}
                        </h4>

                        <div className="flex items-center justify-between pt-1 border-t border-[rgb(var(--border))] text-[9px] text-[rgb(var(--text-muted))] pl-1">
                          <span className="truncate max-w-[100px]">
                            {c.batches?.map((b: any) => b.name).join(', ') || 'General Batch'}
                          </span>
                          <ExternalLink size={10} className="text-indigo-500" />
                        </div>
                      </div>
                    ))}

                    {/* Assignment Cards */}
                    {dayData.assignments.map((a: any) => (
                      <div
                        key={`assig-${a.id}`}
                        onClick={() => setSelectedEvent({ type: 'assignment', ...a })}
                        className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl space-y-1.5 cursor-pointer transition-all shadow-xs group relative overflow-hidden"
                      >
                        <div className="w-1 h-full bg-amber-500 absolute left-0 top-0 rounded-l" />

                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-[10px] pl-1">
                          <span className="flex items-center gap-1 font-mono">
                            <FileText size={10} />
                            Due {new Date(a.due_date).toLocaleTimeString([], { timeStyle: 'short' })}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Due
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-2 leading-snug pl-1">
                          {a.title}
                        </h4>

                        <div className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold truncate pl-1">
                          {a.course?.title || 'Course Deadline'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Agenda List View ─────────────────────────────────────────────────── */}
      {viewMode === 'agenda' && (
        <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
          <h3 className="text-base font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Upcoming Timeline Events</h3>
          <div className="space-y-4">
            {eventsByDay.map((dayData, idx) => (
              <div key={idx} className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg font-mono">
                    {dayData.date.toDateString()}
                  </span>
                  <div className="h-px bg-[rgb(var(--border))] flex-1" />
                </div>

                {dayData.classes.length === 0 && dayData.assignments.length === 0 ? (
                  <p className="text-xs text-[rgb(var(--text-muted))] italic pl-2">No scheduled sessions or deadlines.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                    {dayData.classes.map((c: any) => (
                      <div
                        key={`c-${c.id}`}
                        onClick={() => setSelectedEvent({ type: 'class', ...c })}
                        className="p-3.5 bg-[rgb(var(--bg-elevated))] border border-indigo-500/30 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-all"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
                            Live Class • {new Date(c.scheduled_at).toLocaleTimeString([], { timeStyle: 'short' })}
                          </span>
                          <h5 className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit]">{c.title}</h5>
                        </div>
                        <ExternalLink size={15} className="text-indigo-500" />
                      </div>
                    ))}

                    {dayData.assignments.map((a: any) => (
                      <div
                        key={`a-${a.id}`}
                        onClick={() => setSelectedEvent({ type: 'assignment', ...a })}
                        className="p-3.5 bg-amber-500/5 border border-amber-500/30 rounded-xl flex items-center justify-between cursor-pointer hover:border-amber-500 transition-all"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md">
                            Assignment Due • {new Date(a.due_date).toLocaleTimeString([], { timeStyle: 'short' })}
                          </span>
                          <h5 className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit]">{a.title}</h5>
                        </div>
                        <ExternalLink size={15} className="text-amber-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Event Detail Modal ──────────────────────────────────────────────── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-5 max-w-md w-full text-left space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-3">
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${
                selectedEvent.type === 'class'
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                {selectedEvent.type === 'class' ? 'Live Class Session' : 'Assignment Deadline'}
              </span>

              <button
                onClick={() => setSelectedEvent(null)}
                className="w-7 h-7 rounded-lg bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                {selectedEvent.title}
              </h3>
              <p className="text-xs text-[rgb(var(--text-muted))] leading-relaxed">
                {selectedEvent.description || 'No additional description provided for this session.'}
              </p>
            </div>

            <div className="space-y-2 text-xs bg-[rgb(var(--bg-elevated))] p-3.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--text-primary))]">
              <div className="flex items-center justify-between">
                <span className="text-[rgb(var(--text-muted))]">Scheduled Time:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {new Date(selectedEvent.scheduled_at || selectedEvent.due_date).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[rgb(var(--text-muted))]">Associated Batches:</span>
                <span className="font-bold">
                  {selectedEvent.batches?.map((b: any) => b.name).join(', ') || selectedEvent.course?.title || 'All Enrolled'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer text-center"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
