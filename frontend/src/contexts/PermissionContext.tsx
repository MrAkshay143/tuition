import React, { createContext, useContext, useMemo } from 'react'
import { useAuthStore } from '@/store'

interface PermissionContextType {
  permissions: string[]
  can: (permission: string) => boolean
  canAny: (permissions: string[]) => boolean
  canAll: (permissions: string[]) => boolean
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  can: () => false,
  canAny: () => false,
  canAll: () => false,
})

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore()

  const permissions = useMemo(() => user?.permissions || [], [user?.permissions])

  const can = (permission: string) => permissions.includes(permission)
  
  const canAny = (perms: string[]) => perms.some((p) => permissions.includes(p))
  
  const canAll = (perms: string[]) => perms.every((p) => permissions.includes(p))

  return (
    <PermissionContext.Provider value={{ permissions, can, canAny, canAll }}>
      {children}
    </PermissionContext.Provider>
  )
}

export const usePermission = () => useContext(PermissionContext)
