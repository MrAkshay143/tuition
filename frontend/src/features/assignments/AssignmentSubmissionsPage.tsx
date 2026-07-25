import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssignment, useAssignmentSubmissions, useGradeSubmission } from '@/api/resources/assignments'
import { Button, Card, Badge, Spinner, Modal } from '@/components/ui'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { 
  ArrowLeft, CheckCircle, Clock, FileText, Search, 
  Award, CheckCircle2, UserCheck, AlertCircle, LayoutGrid, List, 
  ExternalLink, MessageSquare, Eye, X
} from 'lucide-react'
import toast from 'react-hot-toast'

export const AssignmentSubmissionsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: assignment, isLoading: isAssignmentLoading } = useAssignment(id || '')
  const { data: submissions, isLoading: isSubmissionsLoading } = useAssignmentSubmissions(id || '')
  const gradeMutation = useGradeSubmission(id || '')

  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'reviewed'>('all')
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table')
  const [previewSub, setPreviewSub] = React.useState<any | null>(null)
  const [gradingState, setGradingState] = React.useState<Record<number, { grade: number | '', feedback: string, openFeedback?: boolean }>>({})

  const subsList = React.useMemo(() => {
    return Array.isArray(submissions) ? submissions : (submissions?.data || [])
  }, [submissions])

  React.useEffect(() => {
    if (subsList.length > 0) {
      const initialState: Record<number, { grade: number | '', feedback: string, openFeedback?: boolean }> = {}
      subsList.forEach((sub: any) => {
        initialState[sub.id] = { grade: sub.grade ?? '', feedback: sub.feedback ?? '', openFeedback: false }
      })
      setGradingState(initialState)
    }
  }, [subsList])

  const [subPage, setSubPage] = React.useState(1)
  const [subPerPage, setSubPerPage] = React.useState(10)

  React.useEffect(() => {
    setSubPage(1)
  }, [searchQuery, statusFilter])

  const filteredSubmissions = React.useMemo(() => {
    return subsList.filter((sub: any) => {
      const matchesSearch = sub.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            sub.student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      const isPending = sub.status !== 'reviewed' && (sub.grade === null || sub.grade === undefined)
      const isReviewed = sub.status === 'reviewed' || (sub.grade !== null && sub.grade !== undefined)

      if (statusFilter === 'pending') return matchesSearch && isPending
      if (statusFilter === 'reviewed') return matchesSearch && isReviewed
      return matchesSearch
    })
  }, [subsList, searchQuery, statusFilter])

  const totalSubmissionsCount = filteredSubmissions.length
  const lastSubPage = Math.max(1, Math.ceil(totalSubmissionsCount / subPerPage))
  const paginatedSubmissions = React.useMemo(() => {
    const start = (subPage - 1) * subPerPage
    return filteredSubmissions.slice(start, start + subPerPage)
  }, [filteredSubmissions, subPage, subPerPage])

  if (isAssignmentLoading || isSubmissionsLoading) {
    return <div className="flex justify-center items-center min-h-[300px]"><Spinner /></div>
  }

  const maxMarks = assignment?.max_marks || 100
  const reviewedList = subsList.filter((s: any) => s.status === 'reviewed' || (s.grade !== null && s.grade !== undefined))
  const pendingCount = subsList.length - reviewedList.length
  
  const avgGrade = reviewedList.length > 0
    ? (reviewedList.reduce((acc: number, curr: any) => acc + (Number(curr.grade) || 0), 0) / reviewedList.length).toFixed(1)
    : '0.0'

  const handleGrade = (submissionId: number) => {
    const state = gradingState[submissionId]
    if (!state || state.grade === '' || state.grade < 0 || state.grade > maxMarks) {
      toast.error(`Grade must be between 0 and ${maxMarks}`)
      return
    }
    gradeMutation.mutate({ submissionId, data: { grade: Number(state.grade), feedback: state.feedback } }, {
      onSuccess: () => {
        if (previewSub?.id === submissionId) {
          setPreviewSub(null)
        }
      }
    })
  }

  const applyPresetGrade = (submissionId: number, percentage: number) => {
    const calculatedGrade = Math.round((maxMarks * percentage) / 100)
    setGradingState(prev => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], grade: calculatedGrade }
    }))
  }

  const toggleFeedback = (submissionId: number) => {
    setGradingState(prev => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], openFeedback: !prev[submissionId]?.openFeedback }
    }))
  }

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto pb-8 relative">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] px-5 py-3.5 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/teacher/assignments')}
            className="hover:bg-[rgb(var(--bg-elevated))] rounded-lg h-8 w-8 p-0"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-[rgb(var(--text-primary))] font-[Outfit] leading-snug">
              {assignment?.title}
            </h1>
            <p className="text-xs text-[rgb(var(--text-muted))]">
              Max Score: <span className="font-semibold text-[rgb(var(--text-primary))]">{maxMarks} Marks</span>
              {assignment?.due_at && (
                <span className="ml-2">· Due: {new Date(assignment.due_at).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 border border-[rgb(var(--border))] p-0.5 rounded-lg bg-[rgb(var(--bg-elevated))]">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'table' 
                ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--primary))] shadow-xs' 
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            <List size={13} /> Table View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'grid' 
                ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--primary))] shadow-xs' 
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            <LayoutGrid size={13} /> Cards View
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="admin-stats-row">
        <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-slate-500 dark:text-blue-600 flex items-center justify-center flex-shrink-0">
            <UserCheck size={16} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">Submissions</div>
            <div className="text-slate-500 dark:text-slate-400 text-base font-bold text-[rgb(var(--text-primary))] font-[Outfit]">{subsList.length}</div>
          </div>
        </div>

        <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">Pending Review</div>
            <div className="text-slate-500 dark:text-slate-400 text-base font-bold text-amber-600 font-[Outfit]">{pendingCount}</div>
          </div>
        </div>

        <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-slate-500 dark:text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">Reviewed</div>
            <div className="text-slate-500 dark:text-slate-400 text-base font-bold text-slate-500 dark:text-emerald-600 font-[Outfit]">{reviewedList.length}</div>
          </div>
        </div>

        <div className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Award size={16} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">Avg Class Score</div>
            <div className="text-slate-500 dark:text-slate-400 text-base font-bold text-purple-600 font-[Outfit]">{avgGrade} <span className="text-[10px] text-[rgb(var(--text-muted))]">/{maxMarks}</span></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] p-3 rounded-xl">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-[rgb(var(--primary))] text-white shadow-xs'
                : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            All ({subsList.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Needs Review ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('reviewed')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              statusFilter === 'reviewed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Graded ({reviewedList.length})
          </button>
        </div>
      </div>

      {/* Main Table / Grid */}
      {viewMode === 'table' ? (
        <Card className="overflow-hidden border border-[rgb(var(--border))]">
          <div className="overflow-x-auto">
            <EnterpriseTable
              columns={[
                {
                  header: 'Student',
                  accessor: (sub: any) => (
                    <div className="flex items-center gap-2.5">
                      {sub.student?.avatar ? (
                        <img src={sub.student.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-[rgb(var(--border))]" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {sub.student?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-xs text-[rgb(var(--text-primary))]">{sub.student?.name}</div>
                        <div className="text-[10px] text-[rgb(var(--text-muted))]">{sub.student?.email}</div>
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Submitted',
                  accessor: (sub: any) => (
                    <div className="whitespace-nowrap text-[rgb(var(--text-secondary))]">
                      <div className="font-medium text-xs">{new Date(sub.submitted_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-[rgb(var(--text-muted))]">{new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  )
                },
                {
                  header: 'Submitted Content',
                  accessor: (sub: any) => (
                    <div className="max-w-xs flex flex-col gap-1.5">
                      {sub.answer && (
                        <div className="text-xs bg-[rgb(var(--bg-elevated))] p-2 rounded-lg text-[rgb(var(--text-secondary))] leading-relaxed max-h-20 overflow-y-auto">
                          {sub.answer}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewSub(sub)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.2)] text-[11px] font-semibold transition-colors"
                        >
                          <Eye size={12} /> Check Answer & Full Preview
                        </button>

                        {sub.attached_media?.[0] && (
                          <a 
                            href={sub.attached_media[0].file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[rgb(var(--primary))] hover:underline text-[11px] font-semibold"
                          >
                            <FileText size={12} /> File <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Status',
                  accessor: (sub: any) => {
                    const isGraded = sub.status === 'reviewed' || (sub.grade !== null && sub.grade !== undefined)
                    return (
                      <div className="whitespace-nowrap">
                        {isGraded ? (
                          <Badge variant="success" className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-slate-500 dark:text-emerald-600 border border-emerald-500/20">
                            <CheckCircle size={11} className="mr-1 inline" /> Graded
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Clock size={11} className="mr-1 inline" /> Needs Review
                          </Badge>
                        )}
                        {isGraded && (
                          <div className="text-[11px] mt-1 font-bold text-[rgb(var(--text-primary))]">
                            {sub.grade} / {maxMarks}
                          </div>
                        )}
                      </div>
                    )
                  }
                },
                {
                  header: 'Review & Grade',
                  accessor: (sub: any) => {
                    const isOpenFeedback = gradingState[sub.id]?.openFeedback
                    return (
                      <div className="flex flex-col gap-1.5 min-w-[240px]">
                        {/* Top Action Row */}
                        <div className="flex items-center gap-1.5">
                          <div className="relative w-24">
                            <input
                              type="number"
                              className="w-full px-2 py-1 text-xs border border-[rgb(var(--border))] rounded-md bg-[rgb(var(--bg-surface))] font-bold text-[rgb(var(--text-primary))]"
                              placeholder="Marks"
                              value={gradingState[sub.id]?.grade ?? ''}
                              onChange={e => setGradingState(prev => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], grade: e.target.value ? Number(e.target.value) : '' }
                              }))}
                              max={maxMarks}
                              min={0}
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[rgb(var(--text-muted))]">
                              /{maxMarks}
                            </span>
                          </div>

                          <Button 
                            size="sm" 
                            variant="primary" 
                            className="font-semibold text-xs h-7 px-2.5"
                            onClick={() => handleGrade(sub.id)}
                            loading={gradeMutation.isPending}
                          >
                            <CheckCircle2 size={12} className="mr-1" /> Save
                          </Button>

                          <button
                            onClick={() => toggleFeedback(sub.id)}
                            className={`p-1.5 rounded-md border border-[rgb(var(--border))] transition-colors ${
                              isOpenFeedback || gradingState[sub.id]?.feedback
                                ? 'bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] border-[rgb(var(--primary)/0.3)]'
                                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
                            }`}
                            title="Add Feedback"
                          >
                            <MessageSquare size={13} />
                          </button>
                        </div>

                        {/* Quick Score Presets */}
                        <div className="flex items-center gap-1 text-[10px] text-[rgb(var(--text-muted))]">
                          <span className="font-medium">Presets:</span>
                          <button onClick={() => applyPresetGrade(sub.id, 100)} className="px-1 py-0.2 rounded bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] font-semibold">100%</button>
                          <button onClick={() => applyPresetGrade(sub.id, 90)} className="px-1 py-0.2 rounded bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] font-semibold">90%</button>
                          <button onClick={() => applyPresetGrade(sub.id, 80)} className="px-1 py-0.2 rounded bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] font-semibold">80%</button>
                        </div>

                        {/* Expandable Feedback Box */}
                        {(isOpenFeedback || gradingState[sub.id]?.feedback) && (
                          <textarea
                            className="w-full px-2 py-1.5 text-xs border border-[rgb(var(--border))] rounded-md bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] resize-none mt-1"
                            placeholder="Feedback notes..."
                            rows={2}
                            value={gradingState[sub.id]?.feedback ?? ''}
                            onChange={e => setGradingState(prev => ({
                              ...prev,
                              [sub.id]: { ...prev[sub.id], feedback: e.target.value }
                            }))}
                          />
                        )}
                      </div>
                    )
                  }
                }
              ]}
              data={paginatedSubmissions}
              meta={{
                current_page: subPage,
                last_page: lastSubPage,
                per_page: subPerPage,
                total: totalSubmissionsCount,
              }}
              onPageChange={(p) => setSubPage(p)}
              onPerPageChange={(pp) => {
                setSubPerPage(pp)
                setSubPage(1)
              }}
              loading={isSubmissionsLoading}
            />
          </div>
        </Card>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((sub: any) => {
            const isGraded = sub.status === 'reviewed' || (sub.grade !== null && sub.grade !== undefined)
            return (
              <Card key={sub.id} className="p-4 flex flex-col justify-between border border-[rgb(var(--border))] shadow-xs hover:shadow-sm">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[rgb(var(--border))]">
                    <div className="flex items-center gap-2.5">
                      {sub.student?.avatar ? (
                        <img src={sub.student.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] flex items-center justify-center font-bold text-xs">
                          {sub.student?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-xs text-[rgb(var(--text-primary))]">{sub.student?.name}</div>
                        <div className="text-[10px] text-[rgb(var(--text-muted))]">{new Date(sub.submitted_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {isGraded ? (
                      <Badge variant="success" className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-slate-500 dark:text-emerald-600">Graded</Badge>
                    ) : (
                      <Badge variant="warning" className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600">Needs Review</Badge>
                    )}
                  </div>

                  <button
                    onClick={() => setPreviewSub(sub)}
                    className="w-full text-left text-xs bg-[rgb(var(--bg-elevated))] p-2.5 rounded-lg mb-2 text-[rgb(var(--text-secondary))] leading-relaxed max-h-24 overflow-y-auto hover:border hover:border-[rgb(var(--primary)/0.3)] transition-all"
                  >
                    {sub.answer || 'Click to preview submitted work...'}
                  </button>

                  {sub.attached_media?.[0] && (
                    <a 
                      href={sub.attached_media[0].file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[rgb(var(--primary))] hover:underline text-xs font-semibold"
                    >
                      <FileText size={12} /> Attachment <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-[rgb(var(--border))] flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 text-xs border border-[rgb(var(--border))] rounded-md bg-[rgb(var(--bg-surface))] font-bold text-[rgb(var(--text-primary))]"
                      placeholder={`Score / ${maxMarks}`}
                      value={gradingState[sub.id]?.grade ?? ''}
                      onChange={e => setGradingState(prev => ({
                        ...prev,
                        [sub.id]: { ...prev[sub.id], grade: e.target.value ? Number(e.target.value) : '' }
                      }))}
                      max={maxMarks}
                      min={0}
                    />
                    <Button 
                      size="sm" 
                      variant="primary" 
                      className="font-semibold text-xs h-7 px-3 flex-shrink-0"
                      onClick={() => handleGrade(sub.id)}
                      loading={gradeMutation.isPending}
                    >
                      Save
                    </Button>
                  </div>

                  <textarea
                    className="w-full px-2 py-1 text-xs border border-[rgb(var(--border))] rounded-md bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] resize-none"
                    placeholder="Feedback..."
                    rows={2}
                    value={gradingState[sub.id]?.feedback ?? ''}
                    onChange={e => setGradingState(prev => ({
                      ...prev,
                      [sub.id]: { ...prev[sub.id], feedback: e.target.value }
                    }))}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Side-by-Side Review Lightbox Modal */}
      <Modal 
        open={!!previewSub} 
        onClose={() => setPreviewSub(null)} 
        size="xl"
        className="!max-w-4xl"
        title={
          previewSub ? (
            <div className="flex items-center gap-3">
              {previewSub.student?.avatar ? (
                <img src={previewSub.student.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-[rgb(var(--border))]" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] flex items-center justify-center font-bold text-sm">
                  {previewSub.student?.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] block leading-none">{previewSub.student?.name}</span>
                <span className="text-xs text-[rgb(var(--text-muted))] font-normal">Submitted on {new Date(previewSub.submitted_at).toLocaleString()}</span>
              </div>
            </div>
          ) : 'Submission Evaluation'
        }
      >
        {previewSub && (
          <div className="-m-6 h-[80vh] max-h-[800px] flex flex-col">
            {/* Modal Body: Left Content vs Right Grading */}
            <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
              {/* Left: Submitted Content */}
              <div className="md:col-span-2 p-6 border-r border-[rgb(var(--border))] flex flex-col gap-4 overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">Student Answer Text</h4>
                  <div className="text-sm bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] p-4 rounded-xl text-[rgb(var(--text-primary))] leading-relaxed min-h-[140px] whitespace-pre-wrap">
                    {previewSub.answer || <span className="italic text-[rgb(var(--text-muted))]">No text answer entered by student.</span>}
                  </div>
                </div>

                {previewSub.attached_media?.[0] && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">Attachment File</h4>
                    <div className="p-4 border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={24} className="text-[rgb(var(--primary))]" />
                        <div>
                          <p className="text-xs font-bold text-[rgb(var(--text-primary))]">{previewSub.attached_media[0].file_name || 'Uploaded File'}</p>
                          <p className="text-[10px] text-[rgb(var(--text-muted))]">Click link to open original file</p>
                        </div>
                      </div>
                      <a
                        href={previewSub.attached_media[0].file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-white text-xs font-semibold flex items-center gap-1 hover:opacity-90"
                      >
                        Open File <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Grading Form */}
              <div className="p-6 bg-[rgb(var(--bg-elevated))/0.3] flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">Evaluate & Award Marks</h4>

                  <div>
                    <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1 block">Marks Awarded</label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full pl-4 pr-12 py-2 text-lg font-bold border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                        placeholder="0"
                        value={gradingState[previewSub.id]?.grade ?? ''}
                        onChange={e => setGradingState(prev => ({
                          ...prev,
                          [previewSub.id]: { ...prev[previewSub.id], grade: e.target.value ? Number(e.target.value) : '' }
                        }))}
                        max={maxMarks}
                        min={0}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[rgb(var(--text-muted))]">
                        / {maxMarks}
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <button onClick={() => applyPresetGrade(previewSub.id, 100)} className="flex-1 py-1 rounded bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] text-xs font-bold text-[rgb(var(--primary))]">100%</button>
                      <button onClick={() => applyPresetGrade(previewSub.id, 90)} className="flex-1 py-1 rounded bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] text-xs font-bold text-[rgb(var(--primary))]">90%</button>
                      <button onClick={() => applyPresetGrade(previewSub.id, 80)} className="flex-1 py-1 rounded bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] text-xs font-bold text-[rgb(var(--primary))]">80%</button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1 block">Feedback Notes</label>
                    <textarea
                      className="w-full p-3 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] resize-none"
                      placeholder="Type comments for the student..."
                      rows={4}
                      value={gradingState[previewSub.id]?.feedback ?? ''}
                      onChange={e => setGradingState(prev => ({
                        ...prev,
                        [previewSub.id]: { ...prev[previewSub.id], feedback: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-[rgb(var(--border))]">
                  <Button variant="ghost" className="flex-1 text-xs font-semibold" onClick={() => setPreviewSub(null)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1 text-xs font-bold py-2.5"
                    onClick={() => handleGrade(previewSub.id)}
                    loading={gradeMutation.isPending}
                  >
                    <CheckCircle2 size={14} className="mr-1" /> Save Evaluation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
