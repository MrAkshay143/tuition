import React from 'react'
import { Modal } from '@/components/ui/overlays'
import { Input, Textarea, Select, Button } from '@/components/ui'
import { useCreateAssignment } from '@/api/resources/assignments'
import { useApiQuery } from '@/api/resources/hooks'
import { AssetPickerDrawer } from '@/features/media/AssetPickerDrawer'
import { api } from '@/api/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

export const CreateAssignmentModal = ({ 
  open, 
  isOpen, 
  onClose,
  initialData
}: { 
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  initialData?: any
}) => {
  const isModalOpen = !!(open ?? isOpen)
  const createMutation = useCreateAssignment()
  const queryClient = useQueryClient()
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
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (initialData && isModalOpen) {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      if (initialData.due_at) {
        try {
          const d = new Date(initialData.due_at)
          setDueAt(d.toISOString().slice(0, 16))
        } catch {
          setDueAt('')
        }
      } else {
        setDueAt('')
      }
      setMaxMarks(initialData.max_marks || 100)
      setSelectedBatch(initialData.batches?.[0]?.id ? String(initialData.batches[0].id) : '')
      setAttachment(initialData.media_id || null)
    } else if (!initialData && isModalOpen) {
      setTitle(''); setDescription(''); setDueAt('')
      setMaxMarks(100); setSelectedBatch(''); setAttachment(null)
    }
  }, [initialData, isModalOpen])

  const handleClose = () => {
    setTitle(''); setDescription(''); setDueAt('')
    setMaxMarks(100); setSelectedBatch(''); setAttachment(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !dueAt || !maxMarks || !selectedBatch) return

    const payload = {
      title, 
      description,
      due_at: new Date(dueAt).toISOString(),
      max_marks: Number(maxMarks),
      batch_ids: [Number(selectedBatch)],
      media_id: attachment || undefined
    }

    setIsSubmitting(true)
    try {
      if (initialData?.id) {
        await api.put(`/assignments/${initialData.id}`, payload)
        toast.success('Assignment updated successfully!')
        queryClient.invalidateQueries({ queryKey: ['assignments'] })
      } else {
        await createMutation.mutateAsync(payload)
      }
      handleClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      title={initialData ? "Edit Assignment" : "Create Assignment"}
      open={isModalOpen}
      onClose={handleClose}
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="assignment-form" variant="primary" loading={isSubmitting || createMutation.isPending}>
            {initialData ? "Update Assignment" : "Create Assignment"}
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



