import React from 'react'
import { Modal } from '@/components/ui/overlays'
import { Input, Textarea, Select, Button } from '@/components/ui'
import { useCreateAssignment } from '@/api/resources/assignments'
import { useApiQuery } from '@/api/resources/hooks'
import { AssetPickerDrawer } from '@/features/media/AssetPickerDrawer'

export const CreateAssignmentModal = ({ open, isOpen, onClose }: { open?: boolean, isOpen?: boolean, onClose: () => void }) => {
  const isModalOpen = !!(open ?? isOpen)
  const createMutation = useCreateAssignment()
  const { data: batches } = useApiQuery(
    ['batches'],
    '/batches'
  )

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [dueAt, setDueAt] = React.useState('')
  const [maxMarks, setMaxMarks] = React.useState(100)
  const [selectedBatch, setSelectedBatch] = React.useState('')
  const [attachment, setAttachment] = React.useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  const handleClose = () => {
    setTitle(''); setDescription(''); setDueAt('')
    setMaxMarks(100); setSelectedBatch(''); setAttachment(null)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !dueAt || !maxMarks || !selectedBatch) return
    createMutation.mutate({
      title, description,
      due_at: new Date(dueAt).toISOString(),
      max_marks: Number(maxMarks),
      batch_ids: [Number(selectedBatch)],
      media_id: attachment || undefined
    }, { onSuccess: handleClose })
  }

  return (
    <Modal
      title="Create Assignment"
      open={isModalOpen}
      onClose={handleClose}
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="assignment-form" variant="primary" loading={createMutation.isPending}>
            Create Assignment
          </Button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="e.g. Midterm Essay"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the assignment..."
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="datetime-local"
            value={dueAt}
            onChange={e => setDueAt(e.target.value)}
            required
          />
          <Input
            label="Max Marks"
            type="number"
            value={maxMarks}
            onChange={e => setMaxMarks(Number(e.target.value))}
            required
            min={1}
          />
        </div>

        <Select
          label="Assign to Batch"
          value={selectedBatch}
          onChange={e => setSelectedBatch(e.target.value)}
          required
        >
          <option value="">Select a batch</option>
          {(batches || []).map((b: any) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>

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
        </div>

        <AssetPickerDrawer
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(media) => {
            setAttachment(media.id);
            setPickerOpen(false);
          }}
          typeFilter="document"
        />
      </form>
    </Modal>
  )
}



