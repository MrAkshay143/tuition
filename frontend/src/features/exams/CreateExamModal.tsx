import React, { useEffect } from 'react'
import { Modal } from '@/components/ui/overlays'
import { Input, Textarea, Select, Button } from '@/components/ui'
import { useCreateExam, useUpdateExam } from '@/api/resources/exams'
import { useApiQuery } from '@/api/resources/hooks'
import toast from 'react-hot-toast'

export const CreateExamModal = ({ open, isOpen, onClose, initial }: { open?: boolean, isOpen?: boolean, onClose: () => void, initial?: any }) => {
  const isModalOpen = !!(open ?? isOpen)
  const createMutation = useCreateExam()
  const updateMutation = useUpdateExam(initial?.id || 0)
  const { data: batches } = useApiQuery(
    ['batches'],
    '/batches'
  )

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [type, setType] = React.useState('mcq')
  const [duration, setDuration] = React.useState(60)
  const [totalMarks, setTotalMarks] = React.useState(100)
  const [passMarks, setPassMarks] = React.useState(50)
  const [startsAt, setStartsAt] = React.useState('')
  const [endsAt, setEndsAt] = React.useState('')
  const [selectedBatch, setSelectedBatch] = React.useState('')
  const [shuffleQuestions, setShuffleQuestions] = React.useState(false)
  const [showResultImmediately, setShowResultImmediately] = React.useState(true)

  useEffect(() => {
    if (isModalOpen) {
      if (initial) {
        setTitle(initial.title || '')
        setDescription(initial.description || '')
        setType(initial.type || 'mcq')
        setDuration(initial.duration_minutes || 60)
        setTotalMarks(initial.total_marks || 100)
        setPassMarks(initial.pass_marks || 50)
        setStartsAt(initial.starts_at ? new Date(initial.starts_at).toISOString().slice(0, 16) : '')
        setEndsAt(initial.ends_at ? new Date(initial.ends_at).toISOString().slice(0, 16) : '')
        setSelectedBatch(initial.batches?.[0]?.id?.toString() || initial.batch_ids?.[0]?.toString() || '')
        setShuffleQuestions(initial.shuffle_questions ?? false)
        setShowResultImmediately(initial.show_result_immediately ?? true)
      } else {
        setTitle(''); setDescription(''); setType('mcq')
        setDuration(60); setTotalMarks(100); setPassMarks(50)
        setStartsAt(''); setEndsAt(''); setSelectedBatch('')
        setShuffleQuestions(false); setShowResultImmediately(true)
      }
    }
  }, [isModalOpen, initial])

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !type || !duration || !totalMarks || !passMarks || !selectedBatch) {
      toast.error('Please fill in all required fields')
      return
    }
    if (passMarks > totalMarks) {
      toast.error('Pass marks cannot be greater than total marks')
      return
    }
    
    const payload = {
      title, description, type,
      duration_minutes: Number(duration),
      total_marks: Number(totalMarks),
      pass_marks: Number(passMarks),
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      batch_ids: [Number(selectedBatch)],
      shuffle_questions: shuffleQuestions,
      show_result_immediately: showResultImmediately
    }

    if (initial?.id) {
      updateMutation.mutate(payload, { onSuccess: handleClose })
    } else {
      createMutation.mutate(payload, { onSuccess: handleClose })
    }
  }

  return (
    <Modal
      title="Create Exam"
      open={isModalOpen}
      onClose={handleClose}
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="exam-form" variant="primary" loading={createMutation.isPending}>
            Create Exam
          </Button>
        </>
      }
    >
      <form id="exam-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="e.g. Final Semester Exam"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Exam instructions..."
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Exam Type" value={type} onChange={e => setType(e.target.value)} required>
            <option value="mcq">MCQ Only</option>
            <option value="subjective">Subjective Only</option>
            <option value="mixed">Mixed</option>
          </Select>
          <Select label="Assign to Batch" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required>
            <option value="">Select a batch</option>
            {(batches || []).map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Duration (mins)" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} required min={1} />
          <Input label="Total Marks" type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} required min={1} />
          <Input label="Pass Marks" type="number" value={passMarks} onChange={e => setPassMarks(Number(e.target.value))} required min={1} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Starts At (Optional)" type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
          <Input label="Ends At (Optional)" type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
        </div>

        <div className="flex flex-col gap-3 bg-[rgb(var(--bg-elevated))] p-4 rounded-xl border border-[rgb(var(--border))]">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={e => setShuffleQuestions(e.target.checked)}
              className="w-4 h-4 rounded accent-[rgb(var(--primary))]"
            />
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Shuffle Questions</p>
              <p className="text-xs text-[rgb(var(--text-muted))]">Randomise question order for each student</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showResultImmediately}
              onChange={e => setShowResultImmediately(e.target.checked)}
              className="w-4 h-4 rounded accent-[rgb(var(--primary))]"
            />
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Show Result Immediately</p>
              <p className="text-xs text-[rgb(var(--text-muted))]">Students see score right after submission</p>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  )
}
