import React, { useState } from 'react'
import { useStudentExams, useStartExam } from '@/api/resources/exams'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { Clock, FileText, PlayCircle, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/overlays'

export const StudentExamsPage = () => {
  const { data: exams, isLoading } = useStudentExams()
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available')
  const navigate = useNavigate()
  const startMutation = useStartExam('')

  const [confirmExamId, setConfirmExamId] = useState<number | null>(null)
  
  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  const now = new Date()
  const examsList = exams?.data || []

  const available = examsList.filter((e: any) => !e.attempts?.length || !e.attempts[0].submitted_at)
  const completed = examsList.filter((e: any) => e.attempts?.length > 0 && e.attempts[0].submitted_at)

  const getActiveList = () => activeTab === 'available' ? available : completed

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
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-[Outfit] text-[rgb(var(--text-primary))]">My Exams & Quizzes</h1>
      </div>

      <div className="flex items-center gap-1 border-b border-[rgb(var(--border))] overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          className={`px-3.5 py-2 font-semibold text-xs border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'available' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
          onClick={() => setActiveTab('available')}
        >
          Available <Badge variant="muted" className="ml-1.5 text-[10px]">{available.length}</Badge>
        </button>
        <button
          className={`px-3.5 py-2 font-semibold text-xs border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'completed' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed <Badge variant="muted" className="ml-1.5 text-[10px]">{completed.length}</Badge>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {getActiveList().map((exam: any) => {
          const startsAt = exam.starts_at ? new Date(exam.starts_at) : null
          const endsAt = exam.ends_at ? new Date(exam.ends_at) : null
          
          const isNotStartedYet = startsAt && now < startsAt
          const isExpired = endsAt && now > endsAt

          return (
            <Card key={exam.id} className={`p-6 flex flex-col gap-4 relative overflow-hidden ${isExpired && activeTab === 'available' ? 'opacity-60' : ''}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${exam.type === 'mcq' ? 'bg-blue-500' : exam.type === 'subjective' ? 'bg-orange-500' : 'bg-purple-500'}`} />
              
              <div>
                <Badge variant={exam.type === 'mcq' ? 'primary' : exam.type === 'subjective' ? 'warning' : 'neutral'} className="mb-2 uppercase text-[10px]">
                  {exam.type}
                </Badge>
                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">{exam.title}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-semibold text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-surface))] p-3 rounded-lg border border-[rgb(var(--border))]">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-indigo-500" /> {exam.duration_minutes} mins
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" /> {exam.total_marks} Marks
                </div>
              </div>

              {startsAt && (
                <div className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Window: {startsAt.toLocaleString()} - {endsAt ? endsAt.toLocaleString() : 'No end date'}
                </div>
              )}

              {activeTab === 'available' ? (
                <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
                  {isExpired ? (
                    <Button variant="outline" className="w-full text-red-500" disabled>
                      Exam Expired
                    </Button>
                  ) : isNotStartedYet ? (
                    <Button variant="outline" className="w-full" disabled>
                      Starts in {Math.ceil((startsAt.getTime() - now.getTime()) / (1000 * 60 * 60))} hours
                    </Button>
                  ) : exam.attempts?.length > 0 && !exam.attempts[0].submitted_at ? (
                    <Button variant="primary" className="w-full" onClick={() => navigate(`/student/exams/${exam.id}/take`)}>
                      Resume Exam
                    </Button>
                  ) : (
                    <Button variant="primary" className="w-full" onClick={() => setConfirmExamId(exam.id)}>
                      <PlayCircle size={18} className="mr-2" /> Start Exam
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-[rgb(var(--border))] flex justify-between items-center bg-[rgb(var(--bg-surface))] p-3 rounded-lg">
                  <div className="flex items-center gap-2 font-bold text-[rgb(var(--text-primary))]">
                    Score: {exam.attempts[0].score} <span className="text-[rgb(var(--text-muted))] text-xs">/ {exam.total_marks}</span>
                  </div>
                  <div>
                    {exam.attempts[0].passed ? (
                      <Badge variant="success" className="flex items-center gap-1"><CheckCircle size={14}/> Passed</Badge>
                    ) : (
                      <Badge variant="error" className="flex items-center gap-1"><XCircle size={14}/> Failed</Badge>
                    )}
                  </div>
                  {exam.show_result_immediately && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/student/exams/${exam.id}/result`)}>View Result</Button>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {getActiveList().length === 0 && (
        <div className="text-slate-500 dark:text-slate-400 text-center py-12 text-[rgb(var(--text-muted))] border-2 border-dashed border-[rgb(var(--border))] rounded-xl font-medium">
          No exams found in this category.
        </div>
      )}

      <ConfirmModal
        open={!!confirmExamId}
        onClose={() => setConfirmExamId(null)}
        title="Start Exam"
        message="Start exam now? Timer will begin immediately."
        confirmText="Start Exam"
        confirmVariant="primary"
        onConfirm={handleStartExam}
      />
    </div>
  )
}
