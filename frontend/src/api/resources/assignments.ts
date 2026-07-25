import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'

export const useAssignments = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => api.get('/assignments', { params }).then(res => res.data?.data || res.data)
  })
}

export const useAssignment = (id: string | number) => {
  return useQuery({
    queryKey: ['assignments', id],
    queryFn: () => api.get(`/assignments/${id}`).then(res => res.data?.data || res.data),
    enabled: !!id
  })
}

export const useCreateAssignment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => {
      return api.post('/assignments', data)
    },
    onSuccess: () => {
      toast.success('Assignment created successfully')
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create assignment')
    }
  })
}

export const useUpdateAssignment = (id: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.put(`/assignments/${id}`, data),
    onSuccess: () => {
      toast.success('Assignment updated successfully')
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['assignments', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update assignment')
    }
  })
}

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => api.delete(`/assignments/${id}`),
    onSuccess: () => {
      toast.success('Assignment deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete assignment')
    }
  })
}

export const useAssignmentSubmissions = (id: string | number) => {
  return useQuery({
    queryKey: ['assignments', id, 'submissions'],
    queryFn: () => api.get(`/assignments/${id}/submissions`).then(res => res.data?.data || res.data),
    enabled: !!id
  })
}

export const useGradeSubmission = (assignmentId: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: string | number, data: { grade: number, feedback: string } }) => 
      api.post(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, data),
    onSuccess: () => {
      toast.success('Submission graded successfully')
      queryClient.invalidateQueries({ queryKey: ['assignments', assignmentId, 'submissions'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to grade submission')
    }
  })
}

export const useStudentAssignments = () => {
  return useQuery({
    queryKey: ['student', 'assignments'],
    queryFn: () => api.get('/student/assignments').then(res => res.data?.data || res.data)
  })
}

export const useSubmitAssignment = (id: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { answer?: string, media_id?: number }) => {
      return api.post(`/student/assignments/${id}/submit`, data)
    },
    onSuccess: () => {
      toast.success('Assignment submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['student', 'assignments'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit assignment')
    }
  })
}
