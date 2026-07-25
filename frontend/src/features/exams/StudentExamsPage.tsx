import React, { useState } from 'react'
import { useStudentExams, useStartExam } from '@/api/resources/exams'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { Clock, FileText, PlayCircle, CheckCircle, XCircle, BookOpenCheck, Search, Calendar, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/overlays'

export const StudentExamsPage = () => {
  const { data: exams, isLoading } = useStudentExams()
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const startMutation = useStartExam('')

  const [confirmExamId, setConfirmExamId] = useState<number | null>(null)
  
  if (isLoading) return <div className="flex justify-center p-16"><Spinner /></div>

  const now = new Date()
  const examsList = exams?.data || []

  const available = examsList.filter((e: any) => !e.attempts?.length || !e.attempts[0].submitted_at)
  const completed = examsList.filter((e: any) => e.attempts?.length > 0 && e.attempts[0].submitted_at)

  const baseList = activeTab === 'available' ? available : completed
  const displayedList = baseList.filter((e: any) =>
    !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartExam = () => {
    if (confirmExamId) {
      startMutation.mutate(confirmExamId as any, {
        onSuccess: () => {
          navigate(`/student/exams/${confirmExamId}/take`)
        }
      })
      setConfirmExamId(null)
    }
  }

  return (
    <div className="space-y-5 pb-12 font-[Outfit]">
      {/* 1. Minimalist Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Exams & Quizzes</span>
          </div>
        </div>
        {available.length > 0 && (
          <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full animate-pulse shadow-xs">
            {available.length} AVAILABLE
          </span>
        )}
      </div>

      {/* 2. Compact One-Line Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <BookOpenCheck size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Assessments</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{examsList.length}</h3>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">Enrolled quizzes</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Available Now</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{available.length}</h3>
            <p className="text-[10px] text-blue-500 font-semibold mt-1">Ready to start</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-500 h-full w-[70%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <CheckCircle size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Completed</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{completed.length}</h3>
            <p className="text-[10px] text-purple-500 font-semibold mt-1">Submitted attempts</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-purple-500 h-full w-[90%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[rgb(var(--bg-surface))] p-3 rounded-2xl border border-[rgb(var(--border))] shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'available' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-surface))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Available Exams <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'available' ? 'bg-emerald-700 text-white' : 'bg-[rgb(var(--border))] text-[rgb(var(--text-secondary))]'}`}>{available.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'completed' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-surface))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Completed Exams <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'completed' ? 'bg-emerald-700 text-white' : 'bg-[rgb(var(--border))] text-[rgb(var(--text-secondary))]'}`}>{completed.length}</span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
          <input 
            type="text" 
            placeholder="Search exams by title or type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition-all"
          />
        </div>
      </div>

      {/* 3. Responsive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedList.map((exam: any) => {
          const startsAt = exam.starts_at ? new Date(exam.starts_at) : null
          const endsAt = exam.ends_at ? new Date(exam.ends_at) : null
          
          const isNotStartedYet = startsAt && now < startsAt
          const isExpired = endsAt && now > endsAt

          return (
            <Card key={exam.id} className={`p-5 flex flex-col justify-between gap-4 group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl ${isExpired && activeTab === 'available' ? 'opacity-60 border-red-500/30 bg-red-500/5' : ''}`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full ${exam.type === 'mcq' ? 'bg-blue-500' : exam.type === 'subjective' ? 'bg-amber-500' : 'bg-purple-500'}`} />
              
              <div className="space-y-2 pl-2">
                <div className="flex items-center justify-between">
                  <Badge variant={exam.type === 'mcq' ? 'primary' : exam.type === 'subjective' ? 'warning' : 'neutral'} className="uppercase text-[10px] font-extrabold tracking-wider px-2.5 py-0.5">
                    {exam.type || 'QUIZ'}
                  </Badge>
                  {isExpired && activeTab === 'available' && (
                    <span className="text-[10px] font-extrabold text-red-500 flex items-center gap-1 uppercase"><AlertTriangle size={12}/> Expired</span>
                  )}
                </div>
                <h3 className="font-extrabold text-lg text-[rgb(var(--text-primary))] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">{exam.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-elevated))] p-3.5 rounded-xl border border-[rgb(var(--border))] pl-3">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-500 shrink-0" /> <span>{exam.duration_minutes} mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-500 shrink-0" /> <span>{exam.total_marks} Marks</span>
                </div>
                {startsAt && (
                  <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-[rgb(var(--text-muted))] pt-1 border-t border-[rgb(var(--border))] mt-1 truncate">
                    <Calendar size={13} className="text-[rgb(var(--text-muted))] shrink-0" />
                    <span className="truncate">Window: {startsAt.toLocaleDateString()} {startsAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 pl-2">
                {activeTab === 'available' ? (
                  <div>
                    {isExpired ? (
                      <Button variant="outline" className="w-full text-xs font-bold rounded-xl py-2 text-red-500 border-red-500/30" disabled>
                        Exam Window Expired
                      </Button>
                    ) : isNotStartedYet ? (
                      <Button variant="outline" className="w-full text-xs font-bold rounded-xl py-2" disabled>
                        Starts in {Math.ceil((startsAt.getTime() - now.getTime()) / (1000 * 60 * 60))} hours
                      </Button>
                    ) : exam.attempts?.length > 0 && !exam.attempts[0].submitted_at ? (
                      <Button className="w-full font-extrabold text-xs rounded-xl py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20" onClick={() => navigate(`/student/exams/${exam.id}/take`)}>
                        Resume In-Progress Exam
                      </Button>
                    ) : (
                      <Button className="w-full font-extrabold text-xs rounded-xl py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20" onClick={() => setConfirmExamId(exam.id)}>
                        <PlayCircle size={16} className="mr-1.5 inline" /> Start Exam Now
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-[rgb(var(--bg-elevated))] p-3 rounded-xl border border-[rgb(var(--border))]">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase">Your Score</span>
                      <div className="font-black text-sm sm:text-base text-[rgb(var(--text-primary))]">
                        {exam.attempts[0].score} <span className="text-[rgb(var(--text-muted))] text-xs font-normal">/ {exam.total_marks}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {exam.attempts[0].passed ? (
                        <Badge variant="success" className="text-xs font-extrabold px-2 py-0.5"><CheckCircle size={13} className="mr-1 inline"/> Passed</Badge>
                      ) : (
                        <Badge variant="error" className="text-xs font-extrabold px-2 py-0.5"><XCircle size={13} className="mr-1 inline"/> Failed</Badge>
                      )}
                      {exam.show_result_immediately && (
                        <Button size="sm" variant="outline" className="text-xs font-bold h-8 rounded-lg" onClick={() => navigate(`/student/exams/${exam.id}/result`)}>Result</Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}

        {displayedList.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center p-8 bg-[rgb(var(--bg-surface))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
              <BookOpenCheck size={32} />
            </div>
            <h3 className="font-extrabold text-lg text-[rgb(var(--text-primary))] mb-1">No {activeTab} exams found</h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] max-w-sm">
              {searchQuery ? "No exams match your search title or type." : `You have no ${activeTab} exams or quizzes at this time.`}
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmExamId}
        onClose={() => setConfirmExamId(null)}
        title="Start Timed Assessment"
        message="Are you ready to start? The exam timer will begin immediately once you confirm and cannot be paused."
        confirmText="Start Exam Now"
        confirmVariant="primary"
        onConfirm={handleStartExam}
      />
    </div>
  )
}
