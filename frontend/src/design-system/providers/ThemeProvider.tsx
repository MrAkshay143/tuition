import React, { useEffect } from 'react'
import { useThemeStore, getSystemTheme } from '../stores/theme.store'
import { useAuthStore } from '@/store'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme, resolvedTheme, setResolvedTheme } = useThemeStore()
  const { isAuthenticated, user } = useAuthStore()

  // 1. Initial mounting theme resolution
  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    setResolvedTheme(resolved)
  }, [theme])

  // 2. Synchronize theme preference from logged-in user database profile
  useEffect(() => {
    if (isAuthenticated && user?.theme && user.theme !== theme) {
      setTheme(user.theme)
    }
  }, [isAuthenticated, user?.theme])

  // 3. Listen to system preference changes in background
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const resolved = getSystemTheme()
      document.documentElement.classList.toggle('dark', resolved === 'dark')
      setResolvedTheme(resolved)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return <>{children}</>
}
