import React, { useEffect } from 'react'
import { Modal } from '@/components/ui/overlays'
import { Input, Select, Button, Textarea } from '@/components/ui'
import { useCreateLiveClass, useUpdateLiveClass } from '@/api/resources/liveClasses'
import { useBatches } from '@/api/resources/batches'
import toast from 'react-hot-toast'

export const CreateLiveClassModal = ({ open, isOpen, onClose, initialData }: { open?: boolean, isOpen?: boolean, onClose: () => void, initialData?: any }) => {
  const isModalOpen = !!(open ?? isOpen)
  const isEditMode = !!initialData
  
  const createMutation = useCreateLiveClass()
  const updateMutation = useUpdateLiveClass(initialData?.id || '')
  
  const { data: batchesData } = useBatches({ per_page: 100 })
  const batches = batchesData?.data || []

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [provider, setProvider] = React.useState('zoom')
  const [meetingUrl, setMeetingUrl] = React.useState('')
  const [meetingId, setMeetingId] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [scheduledAt, setScheduledAt] = React.useState('')
  const [duration, setDuration] = React.useState(60)
  const [selectedBatch, setSelectedBatch] = React.useState('')

  useEffect(() => {
    if (isModalOpen) {
      if (initialData) {
        setTitle(initialData.title || '')
        setDescription(initialData.description || '')
        setProvider(initialData.provider || 'zoom')
        setMeetingUrl(initialData.meeting_url || '')
        setMeetingId(initialData.meeting_id || '')
        setPassword(initialData.password || '')
        
        // Format scheduled_at for datetime-local input
        let formattedDate = ''
        if (initialData.scheduled_at) {
          try {
            const dateObj = new Date(initialData.scheduled_at)
            // Adjust for local timezone to display correctly in input type="datetime-local"
            const tzOffset = dateObj.getTimezoneOffset() * 60000;
            formattedDate = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
          } catch (e) {
            formattedDate = ''
          }
        }
        setScheduledAt(formattedDate)
        
        setDuration(initialData.duration_minutes || 60)
        
        // For batch, extract first batch id if array, or map from objects
        let batchId = ''
        if (initialData.batches && initialData.batches.length > 0) {
          batchId = String(initialData.batches[0].id)
        }
        setSelectedBatch(batchId)
      } else {
        // Reset form for create
        setTitle(''); setDescription(''); setProvider('zoom')
        setMeetingUrl(''); setMeetingId(''); setPassword('')
        setScheduledAt(''); setDuration(60); setSelectedBatch('')
      }
    }
  }, [isModalOpen, initialData])

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !scheduledAt || !duration || !selectedBatch) {
      toast.error('Please fill in all required fields')
      return
    }
    
    const payload = {
      title, description, provider,
      meeting_url: meetingUrl,
      meeting_id: meetingId,
      password,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: Number(duration),
      batch_ids: [Number(selectedBatch)]
    }
    
    if (isEditMode) {
      updateMutation.mutate(payload, { onSuccess: handleClose })
    } else {
      createMutation.mutate(payload, { onSuccess: handleClose })
    }
  }

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending

  return (
    <Modal
      title={isEditMode ? "Edit Live Class" : "Schedule Live Class"}
      open={isModalOpen}
      onClose={handleClose}
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="live-class-form" variant="primary" loading={isPending}>
            {isEditMode ? "Update Class" : "Schedule Class"}
          </Button>
        </>
      }
    >
      <form id="live-class-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Topic / Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="e.g. Thermodynamics Part 1"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What will you cover?"
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Provider" value={provider} onChange={e => setProvider(e.target.value)} required>
            <option value="zoom">Zoom</option>
            <option value="meet">Google Meet</option>
            <option value="jitsi">Jitsi</option>
            <option value="livekit">LiveKit (In-App)</option>
          </Select>
          <Select label="Assign to Batch" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required>
            <option value="">Select a batch</option>
            {(batches || []).map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            required
          />
          <Input
            label="Duration (mins)"
            type="number"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            required
            min={1}
          />
        </div>

        {provider !== 'livekit' && (
          <div className="flex flex-col gap-3 bg-[rgb(var(--bg-elevated))] p-4 rounded-xl border border-[rgb(var(--border))]">
            <h4 className="font-bold text-sm text-[rgb(var(--text-primary))]">Meeting Details</h4>
            <Input
              label="Meeting URL / Join Link"
              value={meetingUrl}
              onChange={e => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/123..."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Meeting ID (Optional)" value={meetingId} onChange={e => setMeetingId(e.target.value)} />
              <Input label="Passcode (Optional)" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
        )}

        {provider === 'livekit' && (
          <div className="bg-[rgb(var(--primary)/0.06)] border border-[rgb(var(--primary)/0.25)] text-[rgb(var(--primary))] p-4 rounded-xl text-sm">
            <strong>LiveKit Integration:</strong> A secure, in-app classroom environment will be automatically provisioned when you start this class. No external links required!
          </div>
        )}
      </form>
    </Modal>
  )
}
