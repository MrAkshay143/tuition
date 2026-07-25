import React, { useState } from 'react'
import { useApiQuery } from '@/api/resources/hooks'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { Spinner } from '@/components/ui'
import {
  ChevronLeft, ChevronRight, Video, FileText, Calendar as CalIcon,
  Clock, Sparkles, X, ExternalLink
} from 'lucide-react'

// Helper date utilities
const getStartOfWeek = (date: Date) => startOfWeek(date, { weekStartsOn: 1 })

export const StudentCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'agenda'>('week')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // Fetch Dashboard (for live classes)
  const { data: dashboardData, isLoading: loadingDashboard } = useApiQuery(
    ['student', 'dashboard'],
    '/bundle/student-dashboard'
  )

  // Fetch Assignments
  const { data: assignmentsData, isLoading: loadingAssignments } = useApiQuery(
    ['student', 'assignments'],
    '/student/assignments'
  )

  if (loadingDashboard || loadingAssignments) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner size={36} />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading student schedule...</p>
      </div>
    )
  }

  const liveClasses = dashboardData?.upcoming_classes || []
  const assignments = assignmentsData?.data || assignmentsData || []

  // Date Nav controls
  const handleToday = () => setCurrentDate(new Date())
  const handlePrev = () => setCurrentDate(addDays(currentDate, -7))
  const handleNext = () => setCurrentDate(addDays(currentDate, 7))

  const startOfWeek = getStartOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek, i))

  // Map events to days
  const eventsByDay = weekDays.map(day => {
    const dayClasses = liveClasses.filter((c: any) => c.scheduled_at && isSameDay(new Date(c.scheduled_at), day))
    const dayAssignments = assignments.filter((a: any) => a.due_date && isSameDay(new Date(a.due_date), day))
    return {
      date: day,
      classes: dayClasses,
      assignments: dayAssignments
    }
  })

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-left">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1b1c3d] rounded-[24px] p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-[#17183d] border border-indigo-100 dark:border-[#2b2d5c] text-indigo-400 text-xs font-bold shadow-md">
            <Sparkles size={13} className="text-amber-400" /> Student Schedule
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-[Outfit] tracking-tight">
            My Learning Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8e91b5] max-w-xl">
            Keep track of live classes, upcoming homework deadlines, and study sessions.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="bg-slate-50 dark:bg-[#121330] p-1 rounded-2xl border border-slate-200 dark:border-[#232554] flex items-center shadow-inner">
            {(['week', 'agenda'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-[#594fe6] text-white shadow-lg'
                    : 'text-slate-500 dark:text-[#8e91b5] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#121330] p-1.5 rounded-2xl border border-slate-200 dark:border-[#232554]">
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-extrabold text-indigo-300 hover:text-white bg-slate-100 dark:bg-[#1b1d47] hover:bg-slate-200 dark:hover:bg-[#252861] rounded-xl transition-all cursor-pointer"
            >
              Today
            </button>

            <div className="flex items-center gap-1 pl-1">
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1b1d47] hover:bg-slate-200 dark:hover:bg-[#252861] text-indigo-600 dark:text-[#a594ff] flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-extrabold font-mono text-white min-w-[110px] text-slate-500 dark:text-slate-400 text-center px-1">
                {monthName}
              </span>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1b1d47] hover:bg-slate-200 dark:hover:bg-[#252861] text-indigo-600 dark:text-[#a594ff] flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {eventsByDay.map((dayData, idx) => {
          const isToday = isSameDay(dayData.date, new Date())

          return (
            <div
              key={idx}
              className={`flex flex-col min-h-[560px] rounded-[22px] border overflow-hidden transition-all shadow-2xl ${
                isToday
                  ? 'border-indigo-500/80 bg-slate-50 dark:bg-[#0e1030] ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-[#1b1c3d] bg-white dark:bg-[#0c0d24]'
              }`}
            >
              <div
                className={`p-3.5 text-slate-500 dark:text-slate-400 text-center border-b transition-colors ${
                  isToday
                    ? 'bg-gradient-to-r from-[#594fe6] to-[#7964ff] text-white border-indigo-400/40 shadow-md'
                    : 'bg-slate-50 dark:bg-[#121330] text-indigo-600 dark:text-[#a594ff] border-slate-200 dark:border-[#1b1c3d]'
                }`}
              >
                <div className="text-[11px] font-extrabold uppercase tracking-widest">
                  {dayData.date.toLocaleString('default', { weekday: 'short' })}
                </div>
                <div className="text-2xl font-extrabold font-[Outfit] mt-0.5">
                  {dayData.date.getDate()}
                </div>
              </div>

              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[500px]">
                {dayData.classes.length === 0 && dayData.assignments.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center p-4 border border-dashed border-slate-200 dark:border-[#1b1c3d] rounded-2xl">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-[#5b5e8c] font-semibold">No events today</span>
                  </div>
                )}

                {dayData.classes.map((c: any) => (
                  <div
                    key={`c-${c.id}`}
                    onClick={() => setSelectedEvent({ type: 'class', ...c })}
                    className="bg-white dark:bg-[#141538] hover:bg-slate-50 dark:hover:bg-[#1a1c47] border border-indigo-500/30 p-3 rounded-2xl space-y-2 cursor-pointer transition-all shadow-md group relative overflow-hidden"
                  >
                    <div className="w-1 h-full bg-[#594fe6] absolute left-0 top-0 rounded-l" />
                    <div className="flex items-center justify-between text-indigo-300 font-extrabold text-[11px] pl-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock size={11} className="text-indigo-400" />
                        {new Date(c.scheduled_at).toLocaleTimeString([], { timeStyle: 'short' })}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300">
                        Class
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-white font-[Outfit] line-clamp-2 leading-snug pl-1">
                      {c.title}
                    </h4>
                  </div>
                ))}

                {dayData.assignments.map((a: any) => (
                  <div
                    key={`a-${a.id}`}
                    onClick={() => setSelectedEvent({ type: 'assignment', ...a })}
                    className="bg-amber-50 dark:bg-[#241814] hover:bg-amber-100 dark:hover:bg-[#2e1f1a] border border-amber-500/30 p-3 rounded-2xl space-y-2 cursor-pointer transition-all shadow-md group relative overflow-hidden"
                  >
                    <div className="w-1 h-full bg-amber-500 absolute left-0 top-0 rounded-l" />
                    <div className="flex items-center justify-between text-amber-300 font-extrabold text-[11px] pl-1">
                      <span className="flex items-center gap-1 font-mono">
                        <FileText size={11} className="text-amber-400" />
                        Due {new Date(a.due_date).toLocaleTimeString([], { timeStyle: 'short' })}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-white font-[Outfit] line-clamp-2 leading-snug pl-1">
                      {a.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0c0d24] border border-indigo-100 dark:border-[#2b2d5c] rounded-[24px] p-6 max-w-md w-full text-left space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b1c3d] pb-3">
              <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {selectedEvent.type === 'class' ? 'Live Session' : 'Assignment'}
              </span>
              <button onClick={() => setSelectedEvent(null)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#131433] hover:bg-slate-200 dark:hover:bg-[#1f214d] text-white flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <h3 className="text-lg font-extrabold text-white font-[Outfit]">{selectedEvent.title}</h3>
            <button onClick={() => setSelectedEvent(null)} className="w-full py-2.5 rounded-xl bg-[#594fe6] text-white font-extrabold text-xs">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


