import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/overlays'
import { Button, Input, Textarea, Toggle } from '@/components/ui'
import { useCreateBatch, useUpdateBatch } from '@/api/resources/batches'
import type { Batch } from '@/types'
import { useAuthStore } from '@/store'
import { usePermission } from '@/contexts/PermissionContext'
import { useApiQuery } from '@/api/resources/hooks'

const schema = z.object({
  name: z.string().min(2, 'Batch name is required'),
  description: z.string().optional(),
  color: z.string().min(4, 'Pick a color'),
  is_active: z.boolean(),
  teacher_id: z.number().optional().nullable(),
  program_id: z.number().optional().nullable(),
  session_id: z.number().optional().nullable(),
})

const PRESET_COLORS = [
  '#6C63FF', '#00D4AA', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899',
]

interface Props { open: boolean; onClose: () => void; batch: Batch | null }

export default function AddEditBatchModal({ open, onClose, batch }: Props) {
  const isEdit = !!batch
  const { user } = useAuthStore()
  const { can } = usePermission()
  const isAdmin = can('module.settings') // Proxy for admin capabilities
  const { mutate: create, isPending: creating } = useCreateBatch()
  const { mutate: update, isPending: updating } = useUpdateBatch(batch?.id ?? 0)

  const { data: programs } = useApiQuery(
    ['programs'],
    '/programs'
  )

  const { data: sessions } = useApiQuery(
    ['academic-sessions'],
    '/academic-sessions'
  )

  const { data: teachers } = useApiQuery(
    ['admin', 'teachers'],
    '/users?role=teacher',
    undefined,
    { enabled: isAdmin && open }
  )


  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', color: '#6C63FF', is_active: true, teacher_id: null as any, program_id: null as any, session_id: null as any },
  })

  const selectedColor = watch('color')
  const isActive = watch('is_active')

  useEffect(() => {
    if (batch) reset({ name: batch.name, description: batch.description ?? '', color: batch.color, is_active: batch.is_active, teacher_id: (batch as any).teacher_id ?? null, program_id: (batch as any).program_id ?? null, session_id: (batch as any).session_id ?? null })
    else reset({ name: '', description: '', color: '#6C63FF', is_active: true, teacher_id: null as any, program_id: null as any, session_id: null as any })
  }, [batch, reset])

  useEffect(() => {
    if (!batch && teachers && teachers.length === 1) {
      setValue('teacher_id', teachers[0].id)
    }
  }, [teachers, batch, setValue])

  const onSubmit = (data: z.infer<typeof schema>) => {
    const payload = { ...data }
    if (!payload.teacher_id) {
      delete payload.teacher_id
    }
    if (isEdit) update(payload, { onSuccess: onClose })
    else create(payload, { onSuccess: onClose })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Batch' : 'Create Batch'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={creating || updating}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input {...register('name')} label="Batch Name" placeholder="e.g., Class 10, NEET, JEE Advanced" error={errors.name?.message} />
        <Textarea {...register('description')} label="Description (optional)" placeholder="Brief description of this batch" />

        {isAdmin && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[rgb(var(--text-secondary))]">Assigned Teacher</label>
            {teachers && teachers.length === 1 ? (
              <div className="p-2.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-sm font-semibold text-[rgb(var(--text-primary))] flex items-center justify-between">
                <span>{teachers[0].name}</span>
                <span className="text-xs text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.1)] px-2 py-0.5 rounded">Auto-Assigned</span>
              </div>
            ) : (
              <select
                {...register('teacher_id', { valueAsNumber: true })}
                className="w-full p-2.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-sm text-[rgb(var(--text-primary))] font-semibold focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.3)]"
              >
                <option value="">Select Teacher</option>
                {(teachers || []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            {errors.teacher_id && <span className="text-xs text-[rgb(var(--error))]">{errors.teacher_id.message}</span>}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Color</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                style={{
                  background: c,
                  border: selectedColor === c ? '3px solid rgb(var(--text-primary))' : '2px solid transparent',
                  outline: selectedColor === c ? '2px solid white' : 'none',
                }}
                onClick={() => setValue('color', c)}
              />
            ))}
          </div>
        </div>

        <Toggle
          checked={isActive}
          onChange={(v) => setValue('is_active', v)}
          label="Batch is active"
        />
      </div>
    </Modal>
  )
}
