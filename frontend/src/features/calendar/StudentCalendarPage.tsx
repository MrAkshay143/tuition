import React, { useState } from 'react'
import { useApiQuery } from '@/api/resources/hooks'
import { startOfWeek, addDays, isSameDay } from 'date-fns'
import { Spinner, Badge, Button, Card } from '@/components/ui'
import {
  ChevronLeft, ChevronRight, Video, FileText, Calendar as CalIcon,
  Clock, Sparkles, X, ExternalLink, Calendar
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const getStartOfWeek = (date: Date) => startOfWeek(date, { weekStartsOn: 1 })

export const StudentCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'agenda'>('week')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedMobileDayIdx, setSelectedMobileDayIdx] = useState(0)
  const navigate = useNavigate()

  const { data: dashboardData, isLoading: loadingDashboard } = useApiQuery(
    ['student', 'dashboard'],
    '/bundle/student-dashboard'
  )

  const { data: assignmentsData, isLoading: loadingAssignments } = useApiQuery(
    ['student', 'assignments'],
    '/student/assignments'
  )

  if (loadingDashboard || loadingAssignments) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner size={36} />
        <p className="text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider">Loading student schedule...</p>
      </div>
    )
  }

  const liveClasses = dashboardData?.upcoming_classes || []
  const assignments = assignmentsData?.data || assignmentsData || []

  const handleToday = () => setCurrentDate(new Date())
  const handlePrev = () => setCurrentDate(addDays(currentDate, -7))
  const handleNext = () => setCurrentDate(addDays(currentDate, 7))

  const startOfWeek = getStartOfWeek(currentDate)
  const weekDays = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek, i))
  }, [startOfWeek])

  React.useEffect(() => {
    const todayIdx = weekDays.findIndex(d => isSameDay(d, new Date()))
    setSelectedMobileDayIdx(todayIdx !== -1 ? todayIdx : 0)
  }, [weekDays])

  const eventsByDay = React.useMemo(() => {
    return weekDays.map(day => {
      const dayClasses = liveClasses.filter((c: any) => c.scheduled_at && isSameDay(new Date(c.scheduled_at), day))
      const dayAssignments = assignments.filter((a: any) => (a.due_date || a.due_at) && isSameDay(new Date(a.due_date || a.due_at), day))
      return {
        date: day,
        classes: dayClasses,
        assignments: dayAssignments
      }
    })
  }, [weekDays, liveClasses, assignments])

  const activeMobileDay = eventsByDay[selectedMobileDayIdx] || eventsByDay[0]
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const totalEventsThisWeek = eventsByDay.reduce((acc, d) => acc + d.classes.length + d.assignments.length, 0)
  const classesThisWeek = eventsByDay.reduce((acc, d) => acc + d.classes.length, 0)
  const assignmentsThisWeek = eventsByDay.reduce((acc, d) => acc + d.assignments.length, 0)

  return (
    <div className="space-y-5 pb-16 font-[Outfit]">
      {/* 1. Minimalist Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Learning Calendar</span>
          </div>
        </div>
        <Badge variant="neutral" className="text-xs font-mono bg-[rgb(var(--bg-elevated))] px-2.5 py-1 border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]">
          {monthName}
        </Badge>
      </div>

      {/* 2. Compact One-Line Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Calendar size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Weekly Events</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{totalEventsThisWeek}</h3>
            <p className="text-[10px] text-indigo-500 font-semibold mt-1">Scheduled for this week</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Video size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Live Sessions</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{classesThisWeek}</h3>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">Classes this week</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[70%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <FileText size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Homework Due</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{assignmentsThisWeek}</h3>
            <p className="text-[10px] text-amber-500 font-semibold mt-1">Deadlines this week</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[80%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 2. Navigation & View Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[rgb(var(--bg-surface))] p-3 rounded-2xl border border-[rgb(var(--border))] shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
          {(['week', 'agenda'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold capitalize transition-all cursor-pointer whitespace-nowrap ${
                viewMode === mode
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
              }`}
            >
              {mode === 'week' ? 'Weekly Grid View' : 'Agenda List View'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 bg-[rgb(var(--bg-elevated))] p-1.5 rounded-xl border border-[rgb(var(--border))]">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:bg-[rgb(var(--bg-surface))] rounded-lg transition-all cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center gap-1 border-l border-[rgb(var(--border))] pl-2">
            <button
              onClick={handlePrev}
              className="w-7 h-7 rounded-lg bg-[rgb(var(--bg-surface))] hover:bg-indigo-500/10 text-[rgb(var(--text-primary))] flex items-center justify-center transition-all cursor-pointer border border-[rgb(var(--border))]"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs font-extrabold font-mono text-[rgb(var(--text-primary))] min-w-[120px] text-center px-1">
              {monthName}
            </span>
            <button
              onClick={handleNext}
              className="w-7 h-7 rounded-lg bg-[rgb(var(--bg-surface))] hover:bg-indigo-500/10 text-[rgb(var(--text-primary))] flex items-center justify-center transition-all cursor-pointer border border-[rgb(var(--border))]"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Calendar View */}
      {viewMode === 'week' ? (
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
                      <div className="w-1 h-full bg-indigo-500 absolute left-0 top-0 rounded-l" />
                      <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold text-[10px] pl-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} className="text-indigo-500" />
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
                          <FileText size={11} className="text-amber-500" />
                          Due {new Date(a.due_date || a.due_at).toLocaleTimeString([], { timeStyle: 'short' })}
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
          <div className="hidden md:grid grid-cols-7 gap-4">
            {eventsByDay.map((dayData, idx) => {
            const isToday = isSameDay(dayData.date, new Date())

            return (
              <div
                key={idx}
                className={`flex flex-col min-h-[520px] rounded-2xl border overflow-hidden transition-all shadow-xs ${
                  isToday
                    ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]'
                }`}
              >
                <div
                  className={`p-3 text-center border-b transition-colors ${
                    isToday
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] border-[rgb(var(--border))]'
                  }`}
                >
                  <div className={`text-[10px] font-extrabold uppercase tracking-widest ${isToday ? 'text-indigo-100' : 'text-[rgb(var(--text-muted))]'}`}>
                    {dayData.date.toLocaleString('default', { weekday: 'short' })}
                  </div>
                  <div className="text-xl font-black font-[Outfit] mt-0.5">
                    {dayData.date.getDate()}
                  </div>
                </div>

                <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[460px]">
                  {dayData.classes.length === 0 && dayData.assignments.length === 0 && (
                    <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-[rgb(var(--border))] rounded-xl my-4">
                      <span className="text-[10px] text-[rgb(var(--text-muted))] font-semibold">No events today</span>
                    </div>
                  )}

                  {dayData.classes.map((c: any) => (
                    <div
                      key={`c-${c.id}`}
                      onClick={() => setSelectedEvent({ type: 'class', ...c })}
                      className="bg-[rgb(var(--bg-elevated))] hover:bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl space-y-1.5 cursor-pointer transition-all shadow-2xs group relative overflow-hidden"
                    >
                      <div className="w-1 h-full bg-indigo-500 absolute left-0 top-0 rounded-l" />
                      <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] pl-1.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} className="text-indigo-500" />
                          {new Date(c.scheduled_at).toLocaleTimeString([], { timeStyle: 'short' })}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          Class
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-[rgb(var(--text-primary))] line-clamp-2 leading-snug pl-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {c.title}
                      </h4>
                    </div>
                  ))}

                  {dayData.assignments.map((a: any) => (
                    <div
                      key={`a-${a.id}`}
                      onClick={() => setSelectedEvent({ type: 'assignment', ...a })}
                      className="bg-[rgb(var(--bg-elevated))] hover:bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-1.5 cursor-pointer transition-all shadow-2xs group relative overflow-hidden"
                    >
                      <div className="w-1 h-full bg-amber-500 absolute left-0 top-0 rounded-l" />
                      <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-extrabold text-[10px] pl-1.5">
                        <span className="flex items-center gap-1 font-mono">
                          <FileText size={11} className="text-amber-500" />
                          Due {new Date(a.due_date || a.due_at).toLocaleTimeString([], { timeStyle: 'short' })}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Due
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-[rgb(var(--text-primary))] line-clamp-2 leading-snug pl-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {a.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        </>
      ) : (
        <div className="space-y-4">
          {eventsByDay.every(d => d.classes.length === 0 && d.assignments.length === 0) ? (
            <div className="py-16 flex flex-col items-center justify-center text-center p-8 bg-[rgb(var(--bg-surface))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl">
              <CalIcon size={48} className="text-[rgb(var(--text-muted))] mb-3 opacity-50" />
              <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] mb-1">No scheduled events this week</h3>
              <p className="text-xs text-[rgb(var(--text-secondary))]">Use the arrow buttons above to navigate to future academic weeks.</p>
            </div>
          ) : (
            eventsByDay.map((dayData, idx) => {
              if (dayData.classes.length === 0 && dayData.assignments.length === 0) return null;
              return (
                <div key={idx} className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[rgb(var(--border))]">
                    <span className="font-black text-base text-indigo-600 dark:text-indigo-400 font-[Outfit]">
                      {dayData.date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dayData.classes.map((c: any) => (
                      <div
                        key={`agenda-c-${c.id}`}
                        onClick={() => setSelectedEvent({ type: 'class', ...c })}
                        className="p-3.5 rounded-xl border border-indigo-500/20 bg-[rgb(var(--bg-elevated))] hover:border-indigo-500 flex items-center justify-between gap-3 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <Video size={16} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-[rgb(var(--text-primary))] truncate">{c.title}</h4>
                            <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono">{new Date(c.scheduled_at).toLocaleTimeString([], { timeStyle: 'short' })} ({c.duration_minutes} mins)</p>
                          </div>
                        </div>
                        <Badge variant="primary" className="text-[9px] font-extrabold shrink-0">CLASS</Badge>
                      </div>
                    ))}
                    {dayData.assignments.map((a: any) => (
                      <div
                        key={`agenda-a-${a.id}`}
                        onClick={() => setSelectedEvent({ type: 'assignment', ...a })}
                        className="p-3.5 rounded-xl border border-amber-500/20 bg-[rgb(var(--bg-elevated))] hover:border-amber-500 flex items-center justify-between gap-3 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-[rgb(var(--text-primary))] truncate">{a.title}</h4>
                            <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono">Due: {new Date(a.due_date || a.due_at).toLocaleTimeString([], { timeStyle: 'short' })}</p>
                          </div>
                        </div>
                        <Badge variant="warning" className="text-[9px] font-extrabold shrink-0">HOMEWORK</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-6 max-w-md w-full text-left space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-3">
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${selectedEvent.type === 'class' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                {selectedEvent.type === 'class' ? 'Live Session Event' : 'Assignment Deadline'}
              </span>
              <button onClick={() => setSelectedEvent(null)} className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--border))] text-[rgb(var(--text-primary))] flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{selectedEvent.title}</h3>
              <p className="text-xs text-[rgb(var(--text-secondary))] mt-1 leading-relaxed">{selectedEvent.description || 'No detailed description available for this event.'}</p>
            </div>

            <div className="bg-[rgb(var(--bg-elevated))] p-3.5 rounded-xl border border-[rgb(var(--border))] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[rgb(var(--text-muted))]">Date & Time:</span>
                <span className="font-bold font-mono text-[rgb(var(--text-primary))]">{new Date(selectedEvent.scheduled_at || selectedEvent.due_date || selectedEvent.due_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              {selectedEvent.duration_minutes && (
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--text-muted))]">Duration:</span>
                  <span className="font-bold text-[rgb(var(--text-primary))]">{selectedEvent.duration_minutes} minutes</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {selectedEvent.type === 'class' ? (
                <Button onClick={() => { setSelectedEvent(null); navigate('/student/live-classes'); }} className="w-full font-extrabold text-xs py-2.5">
                  Go to Live Sessions <ExternalLink size={14} className="ml-1.5 inline" />
                </Button>
              ) : (
                <Button onClick={() => { setSelectedEvent(null); navigate('/student/assignments'); }} className="w-full font-extrabold text-xs py-2.5 bg-amber-600 hover:bg-amber-700 text-white">
                  Go to Assignments <ExternalLink size={14} className="ml-1.5 inline" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
