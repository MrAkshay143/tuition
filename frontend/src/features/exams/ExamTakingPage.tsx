import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Button, Card, Spinner, Textarea } from '@/components/ui'
import { Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/overlays'
import { useApiMutation } from '@/api/resources/hooks'

export const ExamTakingPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const submitExamMutation = useApiMutation<any, any>(
    `/student/exams/${id}/submit`,
    'post'
  )

  const startExamMutation = useApiMutation<any, any>(
    `/student/exams/${id}/start`,
    'post'
  )

  const submitAnswerMutation = useApiMutation<any, any>(
    `/student/exams/${id}/answer`,
    'post'
  )

  const [isLoading, setIsLoading] = useState(true)
  const [examData, setExamData] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [attempt, setAttempt] = useState<any>(null)
  
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false)

  useEffect(() => {
    startExamMutation.mutateAsync({}).then(res => {
      const data = res.data?.data || res.data
      setExamData(data.exam)
      setQuestions(data.questions)
      setAttempt(data.attempt)
      if (data.attempt?.answers) {
        setAnswers(data.attempt.answers)
      }

      const startedAt = new Date(data.attempt.started_at).getTime()
      const durationMs = data.exam.duration_minutes * 60 * 1000
      const endsAt = startedAt + durationMs
      const now = new Date().getTime()
      
      const remaining = Math.max(0, Math.floor((endsAt - now) / 1000))
      setTimeLeft(remaining)
      setIsLoading(false)

      if (remaining === 0) {
        handleAutoSubmit()
      }
    }).catch(err => {
      toast.error(err.response?.data?.message || 'Failed to load exam')
      navigate('/student/exams')
    })
  }, [id])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      handleAutoSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev !== null ? prev - 1 : null)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Prevent leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handleSubmit = () => {
    submitExamMutation.mutate({ answers }, {
      onSuccess: (res: any) => {
        setIsSubmitConfirmOpen(false)
        const showResult = res.data?.data?.show_result ?? res.data?.show_result
        if (showResult) {
          navigate(`/student/exams/${id}/result`, { replace: true })
        } else {
          navigate('/student/exams', { replace: true })
        }
      }
    })
  }

  const handleAutoSubmit = () => {
    if (submitExamMutation.isPending) return
    toast.error('Time is up! Auto-submitting exam...')
    handleSubmit()
  }

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[rgb(var(--bg-body))]"><Spinner /></div>

  const q = questions[currentQIdx]
  const isAnswered = (qId: number) => !!answers[qId]

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-[100dvh] bg-[rgb(var(--bg-body))] flex flex-col font-[Inter]">
      {/* HEADER */}
      <header className="h-16 bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border))] flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="font-bold font-[Outfit] text-lg text-[rgb(var(--text-primary))]">{examData?.title}</div>
        <div className={`flex items-center gap-2 font-bold px-4 py-1.5 rounded-full ${timeLeft && timeLeft < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-indigo-50 text-indigo-700'}`}>
          <Clock size={18} />
          {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
        </div>
        <Button variant="primary" onClick={() => setIsSubmitConfirmOpen(true)}>Submit Exam</Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <div className="w-64 bg-[rgb(var(--bg-surface))] border-r border-[rgb(var(--border))] overflow-y-auto p-4 flex flex-col gap-2 shrink-0">
          <div className="text-xs font-bold text-[rgb(var(--text-muted))] uppercase mb-2 tracking-wider">Questions Map</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {questions.map((question, idx) => (
              <button
                key={question.id}
                onClick={() => setCurrentQIdx(idx)}
                className={`h-10 rounded text-sm font-bold flex items-center justify-center transition-colors border
                  ${currentQIdx === idx 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' 
                    : isAnswered(question.id)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-body))] text-[rgb(var(--text-secondary))] hover:border-gray-400'
                  }
                `}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-[rgb(var(--border))] space-y-2">
            <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]"><div className="w-3 h-3 bg-green-50 border border-green-500 rounded"></div> Answered</div>
            <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]"><div className="w-3 h-3 bg-[rgb(var(--bg-body))] border border-[rgb(var(--border))] rounded"></div> Unanswered</div>
          </div>
        </div>

        {/* QUESTION AREA */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Question {currentQIdx + 1} of {questions.length}</h2>
              <span className="text-sm font-bold bg-[rgb(var(--bg-surface))] px-3 py-1 rounded border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]">{q?.marks} Marks</span>
            </div>
            
            <Card className="p-8 shadow-sm">
              <div className="text-lg text-[rgb(var(--text-primary))] mb-8 leading-relaxed whitespace-pre-wrap">{q?.question}</div>

              {q?.type === 'mcq' && (
                <div className="space-y-3">
                  {q.options?.map((opt: string, i: number) => (
                    <label 
                      key={i} 
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${answers[q.id] === opt 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                          : 'border-[rgb(var(--border))] hover:border-indigo-300 bg-[rgb(var(--bg-surface))]'
                        }
                      `}
                    >
                      <input 
                        type="radio" 
                        name={`q-${q.id}`} 
                        className="mt-1 w-5 h-5 text-indigo-600 focus:ring-indigo-600"
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                      />
                      <span className="text-[rgb(var(--text-primary))] leading-tight pt-1">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q?.type === 'subjective' && (
                <Textarea 
                  placeholder="Type your answer here..."
                  rows={10}
                  className="text-slate-500 dark:text-slate-400 text-base"
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
            </Card>

            <div className="flex justify-between items-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => setCurrentQIdx(prev => Math.max(0, prev - 1))}
                disabled={currentQIdx === 0}
              >
                <ArrowLeft size={18} className="mr-2" /> Previous
              </Button>
              
              {currentQIdx < questions.length - 1 ? (
                <Button 
                  variant="primary" 
                  onClick={() => setCurrentQIdx(prev => Math.min(questions.length - 1, prev + 1))}
                >
                  Next <ArrowRight size={18} className="ml-2" />
                </Button>
              ) : (
                <Button 
                  variant="success" 
                  onClick={() => setIsSubmitConfirmOpen(true)}
                >
                  Finish Exam
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        title="Submit Exam"
        message={`Submit exam with ${Object.keys(answers).length} of ${questions.length} questions answered?`}
        confirmText="Yes, Submit"
        confirmVariant="primary"
        onConfirm={handleSubmit}
      />
    </div>
  )
}

