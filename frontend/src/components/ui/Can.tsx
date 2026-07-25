import React from 'react'
import { usePermission } from '@/contexts/PermissionContext'

interface CanProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const { can } = usePermission()
  return can(permission) ? <>{children}</> : <>{fallback}</>
}

interface CanAnyProps {
  permissions: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const CanAny: React.FC<CanAnyProps> = ({ permissions, children, fallback = null }) => {
  const { canAny } = usePermission()
  return canAny(permissions) ? <>{children}</> : <>{fallback}</>
}

interface CanAllProps {
  permissions: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const CanAll: React.FC<CanAllProps> = ({ permissions, children, fallback = null }) => {
  const { canAll } = usePermission()
  return canAll(permissions) ? <>{children}</> : <>{fallback}</>
}
