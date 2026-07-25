import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/overlays'
import { Button, Badge, Skeleton } from '@/components/ui'
import { useBatches } from '@/api/resources/batches'
import { useAssignBatch } from '@/api/resources/students'
import { cn } from '@/lib/utils'
import type { Student } from '@/types'

interface Props { open: boolean; onClose: () => void; student: Student | null }

export default function AssignBatchModal({ open, onClose, student }: Props) {
  const { data, isLoading } = useBatches({ per_page: 50 })
  const { mutate: assign, isPending } = useAssignBatch()
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    if (student?.batches) setSelected(student.batches.map((b) => b.id))
  }, [student])

  const toggle = (id: number) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleSave = () => {
    if (!student) return
    assign({ studentId: student.id, batchIds: selected }, { onSuccess: onClose })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Batches"
      description={`Assign ${student?.name ?? 'student'} to one or more batches.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={isPending}>Save Assignment</Button>
        </>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(data?.data ?? []).map((batch) => (
            <div
              key={batch.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all',
                selected.includes(batch.id)
                  ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.06)]'
                  : 'border-[rgb(var(--border))] hover:border-[rgb(var(--border-strong))]',
              )}
              onClick={() => toggle(batch.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: batch.color }}>
                  {batch.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{batch.name}</p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">{batch.students_count} students</p>
                </div>
              </div>
              {selected.includes(batch.id) && (
                <div className="w-5 h-5 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center">
                  <span className="text-white text-[10px]">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
