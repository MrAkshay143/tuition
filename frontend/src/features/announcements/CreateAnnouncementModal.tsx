import React, { useState } from 'react'
import { useCreateAnnouncement } from '@/api/resources/announcements'
import { Modal } from '@/components/ui/overlays'
import { Button, Input, Select } from '@/components/ui'
import { useApiQuery } from '@/api/resources/hooks'
import { cn } from '@/lib/utils'

export const CreateAnnouncementModal = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('info')
  const [isAll, setIsAll] = useState(true)
  const [selectedBatches, setSelectedBatches] = useState<number[]>([])

  const createMutation = useCreateAnnouncement()

  const { data: batchesData } = useApiQuery(
    ['batches'],
    '/batches'
  )

  const batches = batchesData?.data || batchesData || []

  const handleClose = () => {
    setTitle(''); setBody(''); setType('info')
    setIsAll(true); setSelectedBatches([])
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title, body, type,
      is_all: isAll,
      batch_ids: isAll ? [] : selectedBatches,
      channels: ['platform']
    }, { onSuccess: handleClose })
  }

  const toggleBatch = (id: number) => {
    setSelectedBatches(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Announcement"
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="announcement-form" variant="primary" loading={createMutation.isPending}>
            Send Announcement
          </Button>
        </>
      }
    >
      <form id="announcement-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Tomorrow's class rescheduled"
        />

        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            required
            rows={4}
            className="input resize-none"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type your announcement here..."
          />
        </div>

        <Select label="Type" value={type} onChange={e => setType(e.target.value)}>
          <option value="info">Info (Blue)</option>
          <option value="warning">Warning (Yellow)</option>
          <option value="success">Success (Green)</option>
          <option value="urgent">Urgent (Red)</option>
          <option value="general">General</option>
        </Select>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="isAll"
              checked={isAll}
              onChange={e => setIsAll(e.target.checked)}
              className="w-4 h-4 rounded accent-[rgb(var(--primary))]"
            />
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Send to all my students</p>
              <p className="text-xs text-[rgb(var(--text-muted))]">All enrolled students will receive this announcement</p>
            </div>
          </label>

          {!isAll && (
            <div className="flex flex-col gap-2 bg-[rgb(var(--bg-elevated))] p-4 rounded-xl border border-[rgb(var(--border))]">
              <label className="text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider">Select Batches</label>
              {batches.map((b: any) => (
                <label key={b.id} className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all',
                  selectedBatches.includes(b.id)
                    ? 'border-[rgb(var(--primary)/0.4)] bg-[rgb(var(--primary)/0.06)]'
                    : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-surface))]'
                )}>
                  <input
                    type="checkbox"
                    checked={selectedBatches.includes(b.id)}
                    onChange={() => toggleBatch(b.id)}
                    className="w-4 h-4 rounded accent-[rgb(var(--primary))]"
                  />
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{b.name}</span>
                </label>
              ))}
              {batches.length === 0 && (
                <p className="text-sm text-[rgb(var(--text-muted))]">No batches available.</p>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
