import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useExam, useExamAttempts } from '@/api/resources/exams'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { ArrowLeft, CheckCircle, XCircle, Users, TrendingUp, BarChart2, Target } from 'lucide-react'

export const ExamAttemptsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: exam, isLoading: isExamLoading } = useExam(id || '')
  const { data: attempts, isLoading: isAttemptsLoading } = useExamAttempts(id || '')

  const [attemptPage, setAttemptPage] = React.useState(1)
  const [attemptPerPage, setAttemptPerPage] = React.useState(10)

  const attemptsData = React.useMemo(() => {
    return Array.isArray(attempts) ? attempts : (attempts?.data || [])
  }, [attempts])

  const totalAttemptCount = attemptsData.length
  const lastAttemptPage = Math.max(1, Math.ceil(totalAttemptCount / attemptPerPage))
  const paginatedAttempts = React.useMemo(() => {
    const start = (attemptPage - 1) * attemptPerPage
    return attemptsData.slice(start, start + attemptPerPage)
  }, [attemptsData, attemptPage, attemptPerPage])

  if (isExamLoading || isAttemptsLoading) return <div className="flex justify-center p-12"><Spinner /></div>
  const totalAttempts = attemptsData.length
  const passedAttempts = attemptsData.filter((a: any) => a.passed).length
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0
  const avgScore = totalAttempts > 0 ? Math.round(attemptsData.reduce((acc: number, a: any) => acc + (Number(a.score) || 0), 0) / totalAttempts) : 0
  const highestScore = totalAttempts > 0 ? Math.max(...attemptsData.map((a: any) => Number(a.score) || 0)) : 0
  const lowestScore = totalAttempts > 0 ? Math.min(...attemptsData.map((a: any) => Number(a.score) || 0)) : 0



  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/exams')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Exam Attempts</h2>
          <p className="text-sm text-[rgb(var(--text-muted))]">{exam?.title}</p>
        </div>
      </div>

      {/* Top 4 KPI Metrics Sparkline Cards Row */}
      <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
        {/* Card 1: Total Attempts */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden min-w-[240px] sm:min-w-0 sm:flex-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Attempts</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{totalAttempts}</h3>
              <p className="text-[10px] text-slate-500 dark:text-blue-400 font-semibold whitespace-nowrap">All submissions</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Pass Rate */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden min-w-[240px] sm:min-w-0 sm:flex-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Pass Rate</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{passRate}%</h3>
              <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold whitespace-nowrap">{passedAttempts} passed</p>
            </div>
          </div>
          <div className="w-10 h-5 text-slate-500 dark:text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Average Score */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden min-w-[240px] sm:min-w-0 sm:flex-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Average Score</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{avgScore} / {exam?.total_marks || 100}</h3>
              <p className="text-[10px] text-purple-400 font-semibold whitespace-nowrap">Mean mark</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: High / Low */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden min-w-[240px] sm:min-w-0 sm:flex-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Target size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">High / Low</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{highestScore} / {lowestScore}</h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Score range</p>
            </div>
          </div>
          <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q25,35 50,15 T100,25" />
            </svg>
          </div>
        </Card>
      </div>

      {/* Attempts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <EnterpriseTable
            columns={[
              {
                header: '',
                accessor: (attempt: any) => (
                  <div className="hidden sm:block w-0"></div>
                )
              },
              {
                header: 'Student',
                accessor: (attempt: any) => (
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-3 font-medium text-[rgb(var(--text-primary))]">
                      {(attempt.student?.avatar || attempt.student?.avatar_url) ? (
                        <img src={attempt.student?.avatar || attempt.student?.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[rgb(var(--primary)/0.1)] flex items-center justify-center text-[rgb(var(--primary))] font-bold text-xs flex-shrink-0">
                          {attempt.student?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="truncate">{attempt.student?.name}</span>
                    </div>
                  </div>
                )
              },
              {
                header: 'Score',
                accessor: (attempt: any) => (
                  <div className="font-bold text-[rgb(var(--text-primary))] whitespace-nowrap">
                    {attempt.submitted_at ? (
                      <>{Number(attempt.score) || 0} <span className="text-[10px] font-normal text-[rgb(var(--text-muted))]">({Math.round(Number(attempt.percentage) || 0)}%)</span></>
                    ) : '-'}
                  </div>
                )
              },
              {
                header: 'Status',
                accessor: (attempt: any) => (
                  attempt.submitted_at ? (
                    attempt.passed
                      ? <Badge variant="success" className="flex items-center gap-1 w-fit"><CheckCircle size={10} /> Passed</Badge>
                      : <Badge variant="error" className="flex items-center gap-1 w-fit"><XCircle size={10} /> Failed</Badge>
                  ) : (
                    <Badge variant="warning" className="w-fit">Pending</Badge>
                  )
                )
              },
              {
                header: 'Submitted',
                accessor: (attempt: any) => (
                  <span className="text-[10px] sm:text-xs text-[rgb(var(--text-secondary))] whitespace-nowrap">
                    {attempt.submitted_at
                      ? new Date(attempt.submitted_at).toLocaleDateString()
                      : <span className="text-[rgb(var(--warning))] font-medium">In Progress</span>
                    }
                  </span>
                )
              },
              {
                header: '',
                accessor: () => <div className="hidden" />
              }
            ]}
            onRowClick={(row) => {
              const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/teacher';
              navigate(`${basePath}/exams/${id}/attempts/${row.id}`)
            }}
            data={paginatedAttempts}
            meta={{
              current_page: attemptPage,
              last_page: lastAttemptPage,
              per_page: attemptPerPage,
              total: totalAttemptCount,
            }}
            onPageChange={(p) => setAttemptPage(p)}
            onPerPageChange={(pp) => {
              setAttemptPerPage(pp)
              setAttemptPage(1)
            }}
          />
        </div>
      </Card>
    </div>
  )
}

