import React, { useState } from 'react'
import { useAnnouncements, useDeleteAnnouncement } from '@/api/resources/announcements'
import { Card, Badge, Spinner, Button } from '@/components/ui'
import { Megaphone, Plus, Trash2, Users, Calendar, Sparkles, RefreshCw } from 'lucide-react'
import { CreateAnnouncementModal } from './CreateAnnouncementModal'
import { ConfirmModal } from '@/components/ui/overlays'

const TYPE_MAP: Record<string, { variant: string; label: string }> = {
  urgent:  { variant: 'error',   label: 'Urgent' },
  warning: { variant: 'warning', label: 'Warning' },
  success: { variant: 'success', label: 'Success' },
  info:    { variant: 'primary', label: 'Info' },
  general: { variant: 'muted',   label: 'General' },
}

const BORDER_ACCENT: Record<string, string> = {
  urgent:  'border-l-[rgb(var(--error))]',
  warning: 'border-l-[rgb(var(--warning))]',
  success: 'border-l-[rgb(var(--success))]',
  info:    'border-l-[rgb(var(--primary))]',
  general: 'border-l-[rgb(var(--border-strong))]',
}

export const TeacherAnnouncementsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const { data: announcementsData, isLoading } = useAnnouncements()
  const deleteMutation = useDeleteAnnouncement()

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  const announcements = announcementsData || []

  const totalCount = announcements.length
  const broadcastAllCount = announcements.filter((a: any) => a.is_all).length
  const batchCount = announcements.filter((a: any) => !a.is_all).length

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-[1400px] mx-auto pb-12 text-left">
      {/* Page Banner */}
      <div className="flex flex-row items-center justify-between gap-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-3 sm:p-3.5 shadow-xs">
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h1 className="text-sm sm:text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] shrink-0">
              Announcements
            </h1>
            <span className="hidden sm:inline text-[rgb(var(--text-muted))] text-xs">•</span>
            <p className="hidden sm:block text-xs text-[rgb(var(--text-muted))] truncate">
              Create and publish instant alerts and reminders to students.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 sm:p-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-all cursor-pointer flex items-center justify-center"
              title="Refresh Announcements"
            >
              <RefreshCw size={14} />
            </button>
            <Button 
              variant="primary" 
              leftIcon={<Plus size={14} />} 
              onClick={() => setShowCreateModal(true)} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span className="hidden sm:inline">New</span> Announcement
            </Button>
          </div>
        </div>

      {/* KPI Stats Row */}
      <div className="admin-stats-row">
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Megaphone size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Total Broadcasts</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{totalCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">All Students</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{broadcastAllCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Batch Targeted</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{batchCount}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {announcements.map((a: any) => {
          const typeKey = a.type || 'general'
          const typeInfo = TYPE_MAP[typeKey] || TYPE_MAP.general
          const accentClass = BORDER_ACCENT[typeKey] || BORDER_ACCENT.general

          return (
            <Card key={a.id} className={`p-4 sm:p-5 relative border-l-4 ${accentClass} hover:shadow-sm transition-all duration-150`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant={typeInfo.variant as any}>{typeInfo.label}</Badge>
                      <h3 className="font-bold text-sm sm:text-base text-[rgb(var(--text-primary))]">{a.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] whitespace-pre-wrap leading-relaxed">{a.body}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[rgb(var(--text-muted))] hover:text-red-600 hover:bg-red-500/10 shrink-0"
                  onClick={() => setDeleteTargetId(a.id)}
                  title="Delete announcement"
                >
                  <Trash2 size={15} />
                </Button>
              </div>

              <div className="flex justify-between items-center text-xs text-[rgb(var(--text-muted))] border-t border-[rgb(var(--border))] pt-3 mt-4">
                <div className="flex items-center gap-1.5">
                  <Users size={12} />
                  <span>{a.is_all ? 'All Students' : `${a.batch_ids?.length || 0} Batches`}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>{new Date(a.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            </Card>
          )
        })}

        {announcements.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 border-2 border-dashed border-[rgb(var(--border))] rounded-2xl text-[rgb(var(--text-muted))] text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--bg-elevated))] flex items-center justify-center">
              <Megaphone size={26} className="opacity-40" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[rgb(var(--text-primary))]">No Announcements</p>
              <p className="text-xs mt-1 text-[rgb(var(--text-muted))] max-w-sm">You haven't sent any announcements yet. Click the button above to broadcast your first message.</p>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white font-bold mt-2">
              New Announcement
            </Button>
          </div>
        )}
      </div>

      <CreateAnnouncementModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />

      <ConfirmModal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Announcement"
        message="Delete this announcement?"
        confirmText="Delete"
        confirmVariant="error"
        onConfirm={() => {
          if (deleteTargetId) { deleteMutation.mutate(deleteTargetId); setDeleteTargetId(null) }
        }}
      />
    </div>
  )
}
