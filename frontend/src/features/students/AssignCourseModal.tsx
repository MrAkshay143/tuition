import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAdminCourses } from '@/api/resources/courses'
import { Modal } from '@/components/ui/overlays'
import { Button, Badge, Skeleton } from '@/components/ui'
import { useAssignCourse } from '@/api/resources/students'
import { cn } from '@/lib/utils'
import type { Student, Course, PaginatedResponse } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  student: Student | null
}

export default function AssignCourseModal({ open, onClose, student }: Props) {
  const { data: coursesData, isLoading } = useAdminCourses({ per_page: 50 })
  const { mutate: assign, isPending } = useAssignCourse()
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    if (student?.courses) setSelected(student.courses.map((c) => c.id))
  }, [student])

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleSave = () => {
    if (!student) return
    assign({ studentId: student.id, courseIds: selected }, { onSuccess: onClose })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Courses"
      description={`Assign ${student?.name ?? 'student'} to one or more courses.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={isPending}>
            Save Assignment
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(coursesData ?? []).map((course) => (
            <div
              key={course.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all',
                selected.includes(course.id)
                  ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.06)]'
                  : 'border-[rgb(var(--border))] hover:border-[rgb(var(--border-strong))]',
              )}
              onClick={() => toggle(course.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgb(var(--primary))] text-white text-xs font-bold">
                  {course.title[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{course.title}</p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">{course.status}</p>
                </div>
              </div>
              {selected.includes(course.id) && (
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
