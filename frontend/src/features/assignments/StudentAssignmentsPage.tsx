import React, { useState } from 'react'
import { useStudentAssignments, useSubmitAssignment } from '@/api/resources/assignments'
import { Button, Card, Badge, Spinner, Textarea } from '@/components/ui'
import { UploadCloud, Clock, CheckCircle, FileText, AlertCircle, ClipboardList, Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/api/client'
import { AssetPickerDrawer } from '@/features/media/AssetPickerDrawer'

export const StudentAssignmentsPage = () => {
  const { data: assignments, isLoading } = useStudentAssignments()
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'graded'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  
  if (isLoading) return <div className="flex justify-center p-16"><Spinner /></div>

  const now = new Date()
  const assignmentsList = assignments?.data || []

  // Derived statuses based on submission records
  const pending = assignmentsList.filter((a: any) => !a.submissions?.length || a.submissions[0].status === 'pending')
  const submitted = assignmentsList.filter((a: any) => a.submissions?.length > 0 && a.submissions[0].status === 'submitted')
  const graded = assignmentsList.filter((a: any) => a.submissions?.length > 0 && a.submissions[0].status === 'reviewed')

  const baseList = activeTab === 'pending' ? pending : activeTab === 'submitted' ? submitted : graded
  const displayedList = baseList.filter((a: any) => 
    !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-5 pb-12 font-[Outfit]">
      {/* 1. Minimalist Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">My Assignments</span>
          </div>
        </div>
        {pending.length > 0 && (
          <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full animate-pulse shadow-xs">
            {pending.length} PENDING
          </span>
        )}
      </div>

      {/* 2. Compact One-Line Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <ClipboardList size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Assigned</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{assignmentsList.length}</h3>
            <p className="text-[10px] text-blue-500 font-semibold mt-1">Course homework</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Pending Action</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{pending.length}</h3>
            <p className="text-[10px] text-amber-500 font-semibold mt-1">Needs submission</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[65%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Graded & Done</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{graded.length}</h3>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">Reviewed by teacher</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[90%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[rgb(var(--bg-surface))] p-3 rounded-2xl border border-[rgb(var(--border))] shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-surface))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Pending <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'pending' ? 'bg-blue-700 text-white' : 'bg-[rgb(var(--border))] text-[rgb(var(--text-secondary))]'}`}>{pending.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'submitted' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-surface))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Submitted <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'submitted' ? 'bg-blue-700 text-white' : 'bg-[rgb(var(--border))] text-[rgb(var(--text-secondary))]'}`}>{submitted.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('graded')}
            className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'graded' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-surface))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Graded <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'graded' ? 'bg-blue-700 text-white' : 'bg-[rgb(var(--border))] text-[rgb(var(--text-secondary))]'}`}>{graded.length}</span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
          <input 
            type="text" 
            placeholder="Search assignments..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition-all"
          />
        </div>
      </div>

      {/* 3. Assignments List */}
      <div className="space-y-6">
        {displayedList.map((assignment: any) => (
          <AssignmentCard key={assignment.id} assignment={assignment} tab={activeTab} now={now} />
        ))}

        {displayedList.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center p-8 bg-[rgb(var(--bg-surface))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 shadow-sm">
              <ClipboardList size={32} />
            </div>
            <h3 className="font-extrabold text-lg text-[rgb(var(--text-primary))] mb-1">No {activeTab} assignments</h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] max-w-sm">
              {searchQuery ? "No assignments match your search filter." : `You have no ${activeTab} assignments at this moment.`}
            </p>
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
    <Card className={`p-6 transition-all duration-300 hover:shadow-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl ${isOverdue ? 'border-red-500/50 bg-red-500/5 dark:bg-red-950/10' : ''}`}>
      <div className="flex flex-col lg:flex-row gap-6 lg:justify-between lg:items-start">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))]">{assignment.title}</h3>
            {isOverdue && <Badge variant="error" className="text-[10px] font-extrabold uppercase px-2 py-0.5"><AlertCircle size={12} className="mr-1 inline"/> Overdue</Badge>}
            {tab === 'graded' && <Badge variant="success" className="text-[10px] font-extrabold uppercase px-2 py-0.5"><CheckCircle size={12} className="mr-1 inline"/> Graded</Badge>}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[rgb(var(--text-secondary))]">
            <span className="flex items-center gap-1.5 bg-[rgb(var(--bg-elevated))] px-2.5 py-1 rounded-lg border border-[rgb(var(--border))]">
              <Clock size={14} className="text-indigo-500" /> 
              Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
            <span className="flex items-center gap-1.5 bg-[rgb(var(--bg-elevated))] px-2.5 py-1 rounded-lg border border-[rgb(var(--border))]">
              <FileText size={14} className="text-indigo-500" /> Max Marks: {assignment.max_marks}
            </span>
          </div>

          <div className="text-xs sm:text-sm text-[rgb(var(--text-primary))] mt-2 bg-[rgb(var(--bg-elevated))] p-4 rounded-xl border border-[rgb(var(--border))] leading-relaxed">
            {assignment.description || 'No instructions provided.'}
          </div>
          
          {assignment.attached_media?.[0] && (
            <button 
              type="button" 
              onClick={async () => {
                const toastId = toast.loading('Downloading reference material...');
                try {
                  const mediaId = assignment.attached_media[0].id;
                  const response = await api.get(`/media/${mediaId}/download`, { responseType: 'blob' });
                  
                  if ((response as any).url) {
                    window.open((response as any).url, '_blank');
                  } else {
                    const blob = new Blob([response as any]);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = assignment.attached_media[0].original_name || 'reference_material';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  }
                  toast.success('Download started', { id: toastId });
                } catch (error) {
                  toast.error('Failed to download material', { id: toastId });
                }
              }}
              className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline mt-1 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 cursor-pointer"
            >
              <Download size={14} /> Download Reference Material ({assignment.attached_media[0].original_name})
            </button>
          )}
        </div>

        <div className="w-full lg:w-96 flex-shrink-0">
          {tab === 'pending' && (
            <form onSubmit={handleSubmit} className="space-y-4 bg-[rgb(var(--bg-elevated))] p-5 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
              <h4 className="font-extrabold text-sm text-[rgb(var(--text-primary))] flex items-center gap-2">
                <UploadCloud size={16} className="text-blue-500" /> Your Submission
              </h4>
              <Textarea 
                placeholder="Type your explanation or answer here..."
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="text-xs bg-[rgb(var(--bg-surface))] rounded-xl border-[rgb(var(--border))]"
              />
              <div>
                <label className="text-xs font-bold text-[rgb(var(--text-secondary))] block mb-1.5">Attachment (Optional)</label>
                {attachment ? (
                  <div className="flex items-center justify-between p-3 border border-blue-500/30 bg-blue-500/10 rounded-xl text-xs font-semibold">
                    <span className="text-blue-600 dark:text-blue-400">File Selected (# {attachment})</span>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] font-bold" onClick={() => setAttachment(null)}>Remove</Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full text-xs font-bold py-2 rounded-xl border-dashed border-2" onClick={() => setPickerOpen(true)}>
                    Choose File from Library
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
              <Button type="submit" className="w-full font-extrabold rounded-xl py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" disabled={submitMutation.isPending}>
                <UploadCloud size={16} className="mr-2" />
                {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment Now'}
              </Button>
            </form>
          )}

          {tab === 'submitted' && (
            <div className="space-y-3 bg-[rgb(var(--bg-elevated))] p-5 rounded-2xl border border-[rgb(var(--border))] border-l-4 border-l-amber-500">
              <h4 className="font-extrabold text-sm text-[rgb(var(--text-primary))] flex items-center gap-2">
                <Clock size={16} className="text-amber-500" /> Under Review
              </h4>
              <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
                Your submission was recorded on <strong className="text-[rgb(var(--text-primary))]">{new Date(submission.submitted_at).toLocaleDateString()} at {new Date(submission.submitted_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</strong>. Awaiting teacher grading.
              </p>
            </div>
          )}

          {tab === 'graded' && (
            <div className="space-y-4 bg-[rgb(var(--bg-elevated))] p-5 rounded-2xl border border-[rgb(var(--border))] border-l-4 border-l-emerald-500">
              <h4 className="font-extrabold text-sm text-[rgb(var(--text-primary))] flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" /> Graded Result
              </h4>
              
              <div className="flex items-baseline gap-2 bg-[rgb(var(--bg-surface))] p-3 rounded-xl border border-[rgb(var(--border))]">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{submission.grade}</span>
                <span className="text-xs font-bold text-[rgb(var(--text-muted))]">/ {assignment.max_marks} Total Marks</span>
              </div>

              {submission.feedback && (
                <div className="text-xs bg-[rgb(var(--bg-surface))] p-3.5 rounded-xl text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] leading-relaxed space-y-1">
                  <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider text-[10px] block">Teacher Feedback:</strong>
                  <p>{submission.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
