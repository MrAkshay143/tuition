import React, { useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExamResult } from '@/api/resources/exams'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, Activity, Check, X, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const ExamResultPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data, isLoading } = useExamResult(id || '')
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const scrollToQuestion = (qId: string | number) => {
    questionRefs.current[qId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-primary w-8 h-8" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-[rgb(var(--text-muted))]">
        Attempt details not found.
      </div>
    )
  }

  const { summary, result, questions } = data

  const totalQuestions = questions.length
  const correctAnswers = questions.filter((q: any) => q.evaluation.is_correct).length
  const incorrectAnswers = questions.filter((q: any) => !q.evaluation.is_correct && q.student_response.selected_answer).length
  const skippedQuestions = totalQuestions - correctAnswers - incorrectAnswers

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 sm:pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/student/exams`)}
            className="shrink-0 h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-lg font-[Outfit] font-bold text-[rgb(var(--text-primary))]">
              Exam Result
            </h1>
            <p className="text-[rgb(var(--text-secondary))] text-xs">
              {summary.exam.title}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Download size={14} /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => window.print()}>
            <Printer size={14} /> Print
          </Button>
        </div>
      </div>

      {/* Header Info Banner */}
      <Card className="p-3 sm:p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-3">
          {summary.student.avatar ? (
            <img src={summary.student.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-[rgb(var(--border))]" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[rgb(var(--primary)/0.1)] flex items-center justify-center text-[rgb(var(--primary))] font-bold text-sm">
              {summary.student.name?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] leading-tight">{summary.student.name}</h2>
            <p className="text-xs text-[rgb(var(--text-muted))]">{summary.student.email}</p>
          </div>
        </div>

        <div className="w-full md:w-auto overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="flex gap-4 sm:gap-6 bg-[rgb(var(--bg-body))] p-2.5 sm:p-3 rounded-lg border border-[rgb(var(--border))] min-w-max">
          <div>
            <p className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-bold tracking-wider mb-1">Status</p>
            <Badge variant={summary.status === 'Submitted' ? 'success' : 'warning'}>
              {summary.status}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-bold tracking-wider mb-1">Score</p>
            <div className="font-bold text-[rgb(var(--text-primary))]">
              {result.marks_obtained} <span className="text-sm font-normal text-[rgb(var(--text-muted))]">/ {result.total_marks}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-bold tracking-wider mb-1">Grade</p>
            <div className={cn("font-bold", result.passed ? "text-emerald-500" : "text-rose-500")}>
              {result.grade} ({Math.round(result.percentage)}%)
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-bold tracking-wider mb-1">Duration</p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--text-primary))]">
              <Clock size={14} className="text-[rgb(var(--text-muted))]" />
              {summary.time_used_seconds ? `${Math.floor(summary.time_used_seconds / 60)}m ${summary.time_used_seconds % 60}s` : '-'}
            </div>
          </div>
        </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Card className="p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-[rgb(var(--text-muted))] mb-0.5">Total</p>
            <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">{totalQuestions}</h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Activity size={16} />
          </div>
        </Card>
        <Card className="p-3 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-[10px] font-medium text-[rgb(var(--text-muted))] mb-0.5">Correct</p>
            <h3 className="text-lg font-bold text-emerald-500">{correctAnswers}</h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle size={16} />
          </div>
        </Card>
        <Card className="p-3 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-[10px] font-medium text-[rgb(var(--text-muted))] mb-0.5">Incorrect</p>
            <h3 className="text-lg font-bold text-rose-500">{incorrectAnswers}</h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <XCircle size={16} />
          </div>
        </Card>
        <Card className="p-3 flex items-center justify-between border-l-4 border-l-slate-500">
          <div>
            <p className="text-[10px] font-medium text-[rgb(var(--text-muted))] mb-0.5">Skipped</p>
            <h3 className="text-lg font-bold text-slate-500">{skippedQuestions}</h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center">
            <AlertTriangle size={16} />
          </div>
        </Card>
      </div>

      {questions.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 dark:text-slate-400">
          <h2 className="text-xl font-bold mb-4 text-[rgb(var(--text-primary))]">Results Not Available</h2>
          <p>Detailed answer sheets are not available for this exam yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left Column: Question Review List */}
          <div className="w-full lg:w-2/3 space-y-4">
            <h3 className="font-bold text-sm text-[rgb(var(--text-primary))] flex items-center gap-2">
              Detailed Responses
            </h3>
            
            {questions.map((q: any, idx: number) => {
              const isCorrect = q.evaluation.is_correct
              const studentAns = q.student_response.selected_answer
              const isSkipped = !studentAns

              return (
                <Card 
                  key={q.id} 
                  className={cn(
                    "p-3 sm:p-4 relative overflow-hidden transition-all",
                    isCorrect ? "border-l-4 border-l-emerald-500" : (isSkipped ? "border-l-4 border-l-slate-400" : "border-l-4 border-l-rose-500")
                  )}
                  ref={el => { questionRefs.current[q.id] = el }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[rgb(var(--bg-body))] border flex items-center justify-center font-bold text-[rgb(var(--text-primary))] text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <Badge variant="neutral" className="text-[9px] px-1.5 py-0">{q.type.toUpperCase()}</Badge>
                        <span className="text-[10px] text-[rgb(var(--text-muted))] ml-2">{q.marks} Marks</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-bold text-[rgb(var(--text-muted))]">Awarded</p>
                      <p className={cn("font-bold text-sm leading-none", isCorrect ? "text-emerald-500" : "text-[rgb(var(--text-primary))]")}>
                        {q.evaluation.awarded_marks}
                      </p>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none mb-4 text-sm text-[rgb(var(--text-secondary))] dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: q.question_text }} />
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <p className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase mb-2">Options</p>
                    {q.type === 'mcq' && Array.isArray(q.options) && q.options.map((opt: string, oIdx: number) => {
                      const isStudentChoice = String(studentAns) === String(oIdx)
                      const isActualCorrect = String(q.evaluation.correct_answer) === String(oIdx)

                      let optClass = "border-[rgb(var(--border))] bg-[rgb(var(--bg-body))]"
                      let icon = null

                      if (isActualCorrect && isStudentChoice) {
                        optClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                        icon = <Check size={14} className="text-emerald-500" />
                      } else if (isStudentChoice && !isActualCorrect) {
                        optClass = "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        icon = <X size={14} className="text-rose-500" />
                      } else if (isActualCorrect && !isStudentChoice) {
                        optClass = "border-emerald-500/50 bg-emerald-500/5 border-dashed"
                        icon = <Check size={14} className="text-emerald-500 opacity-50" />
                      }

                      return (
                        <div key={oIdx} className={cn("p-2 rounded-lg border flex items-center justify-between gap-2", optClass)}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-[rgb(var(--bg-elevated))] border flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <span className="text-xs">{opt}</span>
                          </div>
                          {icon && <div>{icon}</div>}
                        </div>
                      )
                    })}
                    {isSkipped && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-500/10 text-slate-500 text-xs font-medium">
                        <AlertTriangle size={12} /> You skipped this question
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Right Column: Navigator */}
          <div className="w-full lg:w-1/3 space-y-4 lg:sticky lg:top-4 flex flex-col-reverse lg:flex-col">
            <Card className="p-4">
              <h3 className="font-bold text-sm text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
                <Activity size={16} /> Question Navigator
              </h3>
              <div className="grid grid-cols-7 sm:grid-cols-6 lg:grid-cols-5 gap-1.5">
                {questions.map((q: any, idx: number) => {
                  const isCorrect = q.evaluation.is_correct
                  const studentAns = q.student_response.selected_answer
                  const isSkipped = !studentAns

                  let btnClass = ""
                  if (isCorrect) btnClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                  else if (isSkipped) btnClass = "bg-slate-500/10 text-slate-500 border-slate-500/30 hover:bg-slate-500/20"
                  else btnClass = "bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20"

                  return (
                    <button
                      key={q.id}
                      onClick={() => scrollToQuestion(q.id)}
                      className={cn(
                        "h-8 rounded flex flex-col items-center justify-center gap-0 text-[10px] font-bold transition-all border",
                        btnClass
                      )}
                    >
                      <span>{idx + 1}</span>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
