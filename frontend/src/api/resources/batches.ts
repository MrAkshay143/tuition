import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/lib/queryKeys'
import type { Batch, BatchForm, Student, ApiResponse, PaginatedResponse } from '@/types'
import { toast } from 'react-hot-toast'

export function useBatches(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.batches(params),
    queryFn: () => api.get<PaginatedResponse<Batch>>('/batches', params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useBatch(id: number) {
  return useQuery({
    queryKey: queryKeys.batch(id),
    queryFn: () => api.get<ApiResponse<Batch>>(`/batches/${id}`, { include: 'students,courses' }).then((r) => r.data),
    enabled: id > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useBatchStudents(id: number) {
  return useQuery({
    queryKey: queryKeys.batchStudents(id),
    queryFn: () => api.get<PaginatedResponse<Student>>(`/batches/${id}/students`),
    enabled: id > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BatchForm) => api.post<ApiResponse<Batch>>('/batches', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['batches'] })
      toast.success(`Batch "${res.data.name}" created!`)
    },
    onError: () => toast.error('Failed to create batch.'),
  })
}

export function useUpdateBatch(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BatchForm>) => api.put<ApiResponse<Batch>>(`/batches/${id}`, data),
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.batch(id), res.data)
      qc.invalidateQueries({ queryKey: ['batches'] })
      toast.success('Batch updated.')
    },
  })
}

export function useDeleteBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/batches/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches'] })
      toast.success('Batch deleted.')
    },
    onError: () => toast.error('Cannot delete batch with active students.'),
  })
}
