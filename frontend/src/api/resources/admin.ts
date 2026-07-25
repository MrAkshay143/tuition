import { api } from '@/api/client'

// --- Backup & Restore ---
export const getAdminBackupData = () => {
  return api.get('/admin/backup').then((res) => res.data || res)
}

export const runAdminBackup = () => {
  return api.post('/admin/backup')
}

export const restoreAdminBackup = (id: number) => {
  return api.post(`/admin/backup/${id}/restore`)
}

export const deleteAdminBackup = (id: number) => {
  return api.delete(`/admin/backup/${id}`)
}

// --- Activity Logs ---
export const getAdminActivityLogs = (params?: any) => {
  return api.get('/admin/activity-logs', { params }).then((res) => res.data || res)
}

export const getAdminLogsStats = () => {
  return api.get('/admin/logs/stats').then((res) => res.data || res)
}

// --- Users ---
export const getAdminUsers = (params?: Record<string, any>) => {
  return api.get('/users', { params }).then((res) => res.data || res)
}

export const createAdminUser = (data: any) => {
  return api.post('/admin/users', data)
}

export const updateAdminUser = (id: number, data: any) => {
  return api.put(`/admin/users/${id}`, data)
}

export const deleteAdminUser = (id: number) => {
  return api.delete(`/admin/users/${id}`)
}

export const toggleAdminUserActive = (id: number, active: boolean) => {
  return api.put(`/admin/users/${id}/toggle-active`, { active })
}

// --- Security / Device Sessions ---
export const getAdminDeviceSessions = () => {
  return api.get('/admin/device-sessions').then((res) => res.data || res)
}

export const deleteAdminDeviceSession = (id: number) => {
  return api.delete(`/admin/device-sessions/${id}`)
}

export const deleteAllAdminDeviceSessions = () => {
  return api.delete('/admin/device-sessions/all')
}

export const clearRememberMe = () => {
  return api.post('/admin/security/clear-remember-me')
}

export const enforcePasswordReset = () => {
  return api.post('/admin/security/enforce-password-reset', {})
}

export const blockSuspiciousIps = () => {
  return api.post('/admin/security/block-suspicious-ips', {})
}

// --- Settings ---
export const getAdminSettings = () => {
  return api.get('/admin/settings').then((res) => res.data || res)
}

export const updateAdminSettings = (data: any) => {
  return api.put('/admin/settings', data)
}

export const testEmailSettings = (data: any) => {
  return api.post('/admin/settings/test-email', data)
}

// --- Roles ---
export const getAdminRoles = () => {
  return api.get('/admin/roles').then((res) => res.data || res)
}

export const updateAdminRolePermissions = (roleId: string | number, permissions: string[]) => {
  return api.put(`/admin/roles/${roleId}/permissions`, { permissions })
}

// --- Taxonomy (Programs, etc.) ---
export const getAdminPrograms = () => {
  return api.get('/admin/programs').then((res) => res.data || res)
}

export const createAdminProgram = (data: any) => {
  return api.post('/admin/programs', data)
}

export const updateAdminProgram = (id: number, data: any) => {
  return api.put(`/admin/programs/${id}`, data)
}

export const deleteAdminProgram = (id: number) => {
  return api.delete(`/admin/programs/${id}`)
}

export const getAdminEducationTypes = () => {
  return api.get('/admin/education-types').then((res) => res.data || res)
}
export const getAllCourses = () => {
  return api.get('/courses').then((res) => res.data || res)
}
