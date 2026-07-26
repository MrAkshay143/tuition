import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'

// ── QUERIES ─────────────────────────────────────────────────────────────

export const useExams = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => api.get('/exams', { params }).then(res => res.data?.data || res.data)
  })
}

export const useExam = (id: string | number) => {
  return useQuery({
    queryKey: ['exams', id],
    queryFn: () => api.get(`/exams/${id}`).then(res => res.data?.data || res.data),
    enabled: !!id
  })
}

export const useExamQuestions = (id: string | number) => {
  return useQuery({
    queryKey: ['exams', id, 'questions'],
    queryFn: () => api.get(`/exams/${id}/questions`).then(res => res.data?.data || res.data),
    enabled: !!id
  })
}

export const useExamAttempts = (id: string | number) => {
  return useQuery({
    queryKey: ['exams', id, 'attempts'],
    queryFn: () => api.get(`/exams/${id}/attempts`).then(res => res.data?.data || res.data),
    enabled: !!id
  })
}

export const useStudentExams = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['student', 'exams', params],
    queryFn: () => api.get('/student/exams', { params }).then(res => res.data?.data || res.data)
  })
}

export const useExamResult = (id: string | number) => {
  return useQuery({
    queryKey: ['student', 'exams', id, 'result'],
    queryFn: () => api.get(`/student/exams/${id}/result`).then(res => res.data?.data || res.data),
    enabled: !!id
  })
}

// ── MUTATIONS ───────────────────────────────────────────────────────────

export const useCreateExam = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/exams', data),
    onSuccess: () => {
      toast.success('Exam created successfully')
      queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create exam')
    }
  })
}

export const useUpdateExam = (id: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.put(`/exams/${id}`, data),
    onSuccess: () => {
      toast.success('Exam updated successfully')
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      queryClient.invalidateQueries({ queryKey: ['exams', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update exam')
    }
  })
}

export const useDeleteExam = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => api.delete(`/exams/${id}`),
    onSuccess: () => {
      toast.success('Exam deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete exam')
    }
  })
}

export const useAddQuestion = (examId: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post(`/exams/${examId}/questions`, data),
    onSuccess: () => {
      toast.success('Question added successfully')
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'questions'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add question')
    }
  })
}

export const useAttachQuestion = (examId: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { question_id: number, marks: number, sort_order?: number }) => api.post(`/exams/${examId}/questions/attach`, data),
    onSuccess: () => {
      toast.success('Question added from bank successfully')
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'questions'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add question from bank')
    }
  })
}

export const useUpdateQuestion = (examId: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ qId, data }: { qId: string | number, data: any }) => api.put(`/exams/${examId}/questions/${qId}`, data),
    onSuccess: () => {
      toast.success('Question updated successfully')
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'questions'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update question')
    }
  })
}

export const useRemoveQuestion = (examId: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (qId: string | number) => api.delete(`/exams/${examId}/questions/${qId}`),
    onSuccess: () => {
      toast.success('Question removed successfully')
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'questions'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove question')
    }
  })
}

export const useStartExam = (id: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/student/exams/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'exams'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start exam')
    }
  })
}

export const useSubmitExam = (id: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { answers: Record<number, any> }) => api.post(`/student/exams/${id}/submit`, data),
    onSuccess: () => {
      toast.success('Exam submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['student', 'exams'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'exams', id, 'result'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit exam')
    }
  })
}
