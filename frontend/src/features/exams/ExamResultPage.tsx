import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExamResult } from '@/api/resources/exams'
import { Button, Card, Spinner, Badge } from '@/components/ui'
import { ArrowLeft, CheckCircle, XCircle, Award } from 'lucide-react'

export const ExamResultPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: result, isLoading } = useExamResult(id || '')

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  if (!result || !result.attempt) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-slate-500 dark:text-slate-400 text-center">
        <Card className="p-8">
          <h2 className="text-xl font-bold mb-4">Results Not Available</h2>
          <p className="text-[rgb(var(--text-secondary))] mb-6">The results for this exam are either not yet available or you have not completed it.</p>
          <Button onClick={() => navigate('/student/exams')}>Back to Exams</Button>
        </Card>
      </div>
    )
  }

  const { exam, attempt } = result
  const isPassed = attempt.passed

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="p-2" onClick={() => navigate('/student/exams')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-[Outfit] text-[rgb(var(--text-primary))]">Exam Result</h1>
          <p className="text-[rgb(var(--text-secondary))] text-sm">{exam?.title}</p>
        </div>
      </div>

      <Card className={`p-8 text-slate-500 dark:text-slate-400 text-center border-t-8 ${isPassed ? 'border-t-green-500' : 'border-t-red-500'}`}>
        <div className="flex justify-center mb-4">
          {isPassed ? (
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <Award size={40} />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <XCircle size={40} />
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
          {isPassed ? 'Congratulations! You Passed' : 'Keep Practicing. You Failed'}
        </h2>
        
        <div className="text-slate-500 dark:text-slate-400 text-xl font-black text-[rgb(var(--text-primary))] my-6">
          {attempt.score} <span className="text-2xl text-[rgb(var(--text-muted))]">/ {exam.total_marks}</span>
        </div>
        
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant={isPassed ? 'success' : 'danger'} className="text-sm px-4 py-1">
            {Math.round(attempt.percentage)}% Score
          </Badge>
          <Badge variant="muted" className="text-sm px-4 py-1">
            Pass Mark: {exam.pass_marks}
          </Badge>
        </div>

        <p className="text-[rgb(var(--text-secondary))] text-sm">
          Submitted on: {new Date(attempt.submitted_at).toLocaleString()}
        </p>
      </Card>

      {/* Optional: Detailed breakdown if show_result_immediately and questions are returned */}
      {result.questions && result.questions.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-bold font-[Outfit] text-[rgb(var(--text-primary))]">Answer Review</h3>
          {result.questions.map((q: any, idx: number) => {
            const userAnswer = attempt.answers?.[q.id]
            const isCorrect = q.type === 'mcq' && String(userAnswer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
            const isUnanswered = !userAnswer

            return (
              <Card key={q.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold text-[rgb(var(--text-primary))]"><span className="text-indigo-500 mr-2">Q{idx + 1}.</span>{q.question}</div>
                  <div>
                    {q.type === 'mcq' ? (
                      isUnanswered ? (
                        <Badge variant="warning">Unanswered (0/{q.marks})</Badge>
                      ) : isCorrect ? (
                        <Badge variant="success">Correct ({q.marks}/{q.marks})</Badge>
                      ) : (
                        <Badge variant="error">Incorrect (0/{q.marks})</Badge>
                      )
                    ) : (
                      <Badge variant="muted">Subjective (Pending Review)</Badge>
                    )}
                  </div>
                </div>

                <div className="bg-[rgb(var(--bg-surface))] p-4 rounded-lg border border-[rgb(var(--border))] space-y-2">
                  <div className="text-sm">
                    <span className="font-bold text-[rgb(var(--text-secondary))]">Your Answer: </span>
                    <span className={`font-medium ${q.type === 'mcq' ? (isCorrect ? 'text-green-600' : 'text-red-600') : 'text-[rgb(var(--text-primary))]'}`}>
                      {userAnswer || 'No answer provided'}
                    </span>
                  </div>
                  {q.type === 'mcq' && !isCorrect && (
                    <div className="text-sm">
                      <span className="font-bold text-[rgb(var(--text-secondary))]">Correct Answer: </span>
                      <span className="font-medium text-green-600">{q.correct_answer}</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
