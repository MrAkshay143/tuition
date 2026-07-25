import React, { useState } from 'react'
import { Modal } from '@/components/ui/overlays'
import { Button, Input } from '@/components/ui'
import { useAuthStore } from '@/store'
import { usePermission } from '@/contexts/PermissionContext'
import { useQuery } from '@tanstack/react-query'
import { getAdminUsers } from '@/api/resources/admin'
import { BookOpen, User } from 'lucide-react'

interface CreateCourseModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (title: string, description: string, teacherId: number | null) => void
  isPending: boolean
  initial?: { title: string; description: string; teacher_id?: number | null } | null
}

export const CreateCourseModal = ({ open, onClose, onSubmit, isPending, initial }: CreateCourseModalProps) => {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [teacherId, setTeacherId] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (open) {
      if (initial) {
        setTitle(initial.title)
        setDescription(initial.description || '')
        setTeacherId(initial.teacher_id || null)
      } else {
        setTitle('')
        setDescription('')
        setTeacherId(null)
      }
    }
  }, [open, initial])

  const { user } = useAuthStore()
  const { can } = usePermission()
  const isAdmin = can('module.settings') // Proxy for admin capabilities

  const { data: teachers } = useQuery({
    queryKey: ['admin', 'teachers'],
    queryFn: async () => {
      const res = await getAdminUsers({ role: 'teacher' })
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
    enabled: isAdmin && open
  })

  const handleClose = () => {
    setTitle(''); setDescription(''); setTeacherId(null)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.length < 2) return
    onSubmit(title, description, teacherId)
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={initial ? "Edit Course" : "Create New Course"}
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            form="create-course-form"
            variant="primary"
            loading={isPending}
            disabled={title.length < 2}
          >
            Create Course
          </Button>
        </>
      }
    >
      <form id="create-course-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Icon + title preview */}
        <div className="flex items-center gap-4 p-4 bg-[rgb(var(--primary)/0.05)] rounded-xl border border-[rgb(var(--primary)/0.15)]">
          <div className="w-12 h-12 rounded-xl bg-[rgb(var(--primary)/0.12)] flex items-center justify-center flex-shrink-0">
            <BookOpen size={22} className="text-[rgb(var(--primary))]" />
          </div>
          <div>
            <p className="font-bold text-[rgb(var(--text-primary))] text-sm line-clamp-1">
              {title || 'Course Title Preview'}
            </p>
            <p className="text-xs text-[rgb(var(--text-muted))]">New course · Draft by default</p>
          </div>
        </div>

        <Input
          label="Course Title"
          required
          minLength={2}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Advanced Calculus 101"
        />

        <div className="form-group">
          <label className="form-label">Description <span className="text-[rgb(var(--text-muted))] font-normal">(Optional)</span></label>
          <textarea
            rows={3}
            className="input resize-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Briefly describe what students will learn..."
          />
        </div>

        {isAdmin && (
          <div className="form-group">
            <label className="form-label flex items-center gap-1.5">
              <User size={13} className="text-[rgb(var(--text-muted))]" />
              Assign Teacher
            </label>
            <select
              className="input"
              value={teacherId || ''}
              onChange={e => setTeacherId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Assign to myself (Admin)</option>
              {(teachers || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </form>
    </Modal>
  )
}
