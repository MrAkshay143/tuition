import React, { useState } from 'react'
import { useStudentAssignments, useSubmitAssignment } from '@/api/resources/assignments'
import { Button, Card, Badge, Spinner, Textarea } from '@/components/ui'
import { UploadCloud, Clock, CheckCircle, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { AssetPickerDrawer } from '@/features/media/AssetPickerDrawer'

export const StudentAssignmentsPage = () => {
  const { data: assignments, isLoading } = useStudentAssignments()
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'graded'>('pending')
  
  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  const now = new Date()
  const assignmentsList = assignments?.data || []

  // Derived statuses based on submission records
  const pending = assignmentsList.filter((a: any) => !a.submissions?.length || a.submissions[0].status === 'pending')
  const submitted = assignmentsList.filter((a: any) => a.submissions?.length > 0 && a.submissions[0].status === 'submitted')
  const graded = assignmentsList.filter((a: any) => a.submissions?.length > 0 && a.submissions[0].status === 'reviewed')

  const getActiveList = () => {
    if (activeTab === 'pending') return pending
    if (activeTab === 'submitted') return submitted
    return graded
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-[Outfit] text-[rgb(var(--text-primary))]">My Assignments</h1>
      </div>

      <div className="flex items-center gap-1 border-b border-[rgb(var(--border))] overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          className={`px-3.5 py-2 font-semibold text-xs border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending <Badge variant="muted" className="ml-1.5 text-[10px]">{pending.length}</Badge>
        </button>
        <button
          className={`px-3.5 py-2 font-semibold text-xs border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'submitted' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
          onClick={() => setActiveTab('submitted')}
        >
          Submitted <Badge variant="muted" className="ml-1.5 text-[10px]">{submitted.length}</Badge>
        </button>
        <button
          className={`px-3.5 py-2 font-semibold text-xs border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'graded' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
          onClick={() => setActiveTab('graded')}
        >
          Graded <Badge variant="muted" className="ml-1.5 text-[10px]">{graded.length}</Badge>
        </button>
      </div>

      <div className="space-y-6">
        {getActiveList().map((assignment: any) => (
          <AssignmentCard key={assignment.id} assignment={assignment} tab={activeTab} now={now} />
        ))}

        {getActiveList().length === 0 && (
          <div className="text-slate-500 dark:text-slate-400 text-center py-12 text-[rgb(var(--text-muted))] border-2 border-dashed border-[rgb(var(--border))] rounded-xl font-medium">
            No assignments found in this category.
          </div>
        )}
      </div>
    </div>
  )
}

const AssignmentCard = ({ assignment, tab, now }: { assignment: any, tab: string, now: Date }) => {
  const submitMutation = useSubmitAssignment(assignment.id)
  const [answer, setAnswer] = useState('')
  const [attachment, setAttachment] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  
  const dueDate = new Date(assignment.due_at)
  const isOverdue = dueDate < now && tab === 'pending'
  const submission = assignment.submissions?.[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim() && !attachment) {
      toast.error('Please provide an answer or upload a file')
      return
    }
    submitMutation.mutate({ answer, media_id: attachment || undefined }, {
      onSuccess: () => {
        setAnswer('')
        setAttachment(null)
      }
    })
  }

  return (
    <Card className={`p-6 ${isOverdue ? 'border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/20' : ''}`}>
      <div className="flex flex-col md:flex-row gap-6 md:justify-between md:items-start">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">{assignment.title}</h3>
            {isOverdue && <Badge variant="error" className="text-xs font-bold uppercase"><AlertCircle size={12} className="mr-1"/> Overdue</Badge>}
            {tab === 'graded' && <Badge variant="success" className="text-xs font-bold uppercase"><CheckCircle size={12} className="mr-1"/> Graded</Badge>}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm font-medium text-[rgb(var(--text-secondary))]">
            <span className="flex items-center gap-1">
              <Clock size={16} /> 
              Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
            <span className="flex items-center gap-1">
              <FileText size={16} /> Max Marks: {assignment.max_marks}
            </span>
          </div>

          <div className="text-sm text-[rgb(var(--text-primary))] mt-4 bg-[rgb(var(--bg-surface))] p-4 rounded-lg border border-[rgb(var(--border))]">
            {assignment.description || 'No description provided.'}
          </div>
          
          {assignment.attached_media?.[0] && (
            <a href={assignment.attached_media[0].file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline mt-2">
              <DownloadIcon /> Download Reference Material
            </a>
          )}
        </div>

        <div className="w-full md:w-1/3 flex-shrink-0">
          {tab === 'pending' && (
            <form onSubmit={handleSubmit} className="space-y-4 bg-[rgb(var(--bg-body))] p-4 rounded-xl border border-[rgb(var(--border))]">
              <h4 className="font-bold text-sm text-[rgb(var(--text-primary))]">Your Submission</h4>
              <Textarea 
                placeholder="Type your answer here..."
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-[rgb(var(--text-secondary))] block mb-1.5">Attachment (Optional)</label>
                {attachment ? (
                  <div className="flex items-center justify-between p-3 border border-[rgb(var(--border))] rounded-lg">
                    <span className="text-sm">Media Selected</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setAttachment(null)}>Remove</Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
                    Choose from Content Library
                  </Button>
                )}
                <AssetPickerDrawer
                  open={pickerOpen}
                  onClose={() => setPickerOpen(false)}
                  onSelect={(media) => {
                    setAttachment(media.id);
                    setPickerOpen(false);
                  }}
                  typeFilter="document"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                <UploadCloud size={16} className="mr-2" />
                {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </form>
          )}

          {tab === 'submitted' && (
            <div className="space-y-4 bg-[rgb(var(--bg-body))] p-4 rounded-xl border border-[rgb(var(--border))] border-l-4 border-l-yellow-400">
              <h4 className="font-bold text-sm text-[rgb(var(--text-primary))] flex items-center gap-2">
                <Clock size={16} className="text-yellow-500" /> Under Review
              </h4>
              <p className="text-xs text-[rgb(var(--text-secondary))]">
                Submitted on {new Date(submission.submitted_at).toLocaleDateString()} {new Date(submission.submitted_at).toLocaleTimeString()}
              </p>
            </div>
          )}

          {tab === 'graded' && (
            <div className="space-y-4 bg-[rgb(var(--bg-body))] p-4 rounded-xl border border-[rgb(var(--border))] border-l-4 border-l-green-500">
              <h4 className="font-bold text-sm text-[rgb(var(--text-primary))] flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" /> Graded
              </h4>
              
              <div className="text-3xl font-black text-[rgb(var(--text-primary))]">
                {submission.grade} <span className="text-sm font-medium text-[rgb(var(--text-muted))]">/ {assignment.max_marks}</span>
              </div>

              {submission.feedback && (
                <div className="text-sm bg-[rgb(var(--bg-surface))] p-3 rounded text-[rgb(var(--text-primary))] border border-[rgb(var(--border))]">
                  <strong>Teacher Feedback:</strong><br/>
                  {submission.feedback}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>



