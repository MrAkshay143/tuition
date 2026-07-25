import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Generic wrapper for GET requests.
 */
export function useApiQuery<TData = any, TError = unknown>(
  queryKey: any[],
  url: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<TData, TError, TData, any[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError, TData, any[]>({
    queryKey,
    queryFn: async () => {
      const res = await api.get(url, params ? { params } : undefined) as any
      // Automatically unwrap standard Laravel/API Resource responses
      if (Array.isArray(res)) return res as any
      if (res?.data?.data !== undefined) return res.data.data as any
      if (res?.data !== undefined) return res.data as any
      return res as any
    },
    ...options,
  })
}

/**
 * Generic wrapper for POST requests.
 */
export function useApiMutation<TData = any, TVariables = any, TError = unknown>(
  urlOrFn: string | ((variables: TVariables) => string),
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> & { invalidateKeys?: any[][] }
) {
  const qc = useQueryClient()
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      let res: any;
      const url = typeof urlOrFn === 'function' ? urlOrFn(variables) : urlOrFn;
      if (method === 'post') res = await api.post(url, variables);
      else if (method === 'put') res = await api.put(url, variables);
      else if (method === 'patch') res = await api.patch(url, variables);
      else if (method === 'delete') res = await api.delete(url);
      
      if (res?.data?.data !== undefined) return res.data.data as any
      if (res?.data !== undefined) return res.data as any
      return res as any
    },
    ...options,
    onSuccess: (data: any, variables: any, context: any) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach(k => qc.invalidateQueries({ queryKey: k }))
      }
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context)
      }
    }
  })
}
