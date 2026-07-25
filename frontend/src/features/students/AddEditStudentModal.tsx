import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/overlays'
import { Button, Input, Select } from '@/components/ui'
import { useCreateStudent, useUpdateStudent } from '@/api/resources/students'
import { useBatches } from '@/api/resources/batches'
import type { Student } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  student: Student | null
}

export default function AddEditStudentModal({ open, onClose, student }: Props) {
  const isEdit = !!student
  const { mutate: create, isPending: creating } = useCreateStudent()
  const { mutate: update, isPending: updating } = useUpdateStudent(student?.id ?? 0)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (student) reset({ name: student.name, email: student.email, phone: student.phone ?? '', password: '' })
    else reset({ name: '', email: '', phone: '', password: '' })
  }, [student, reset])

  const onSubmit = (data: FormData) => {
    const payload = { ...data, password: data.password || undefined }
    if (isEdit) {
      update(payload, { onSuccess: onClose })
    } else {
      create(payload as Required<typeof payload>, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Student' : 'Add New Student'}
      description={isEdit ? 'Update student information.' : 'Create a new student account.'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={creating || updating}>
            {isEdit ? 'Save Changes' : 'Create Student'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input {...register('name')} label="Full Name" placeholder="e.g., Arjun Sharma" error={errors.name?.message} />
        <Input {...register('email')} type="email" label="Email Address" placeholder="student@eduflow.ai" error={errors.email?.message} />
        <Input {...register('phone')} type="tel" label="Phone (optional)" placeholder="+91 98765 43210" error={errors.phone?.message} />
        <Input
          {...register('password')}
          type="password"
          label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
          placeholder="Minimum 8 characters"
          error={errors.password?.message}
        />
      </div>
    </Modal>
  )
}
