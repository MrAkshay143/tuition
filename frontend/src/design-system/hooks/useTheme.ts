import { useThemeStore, Theme } from '../stores/theme.store'
import { useThemeStore as useAppThemeStore } from '@/store'
import { useAuthStore } from '@/store'
import { api } from '@/api/client'

export function useTheme() {
  const { theme, resolvedTheme, setTheme, setResolvedTheme } = useThemeStore()
  const appThemeSet = useAppThemeStore((state) => state.setTheme)
  const { isAuthenticated, user, setUser } = useAuthStore()

  const changeTheme = async (newTheme: Theme) => {
    const systemIsDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDarkTarget = newTheme === 'dark' || (newTheme === 'system' && systemIsDark)

    if (typeof document !== 'undefined') {
      if (isDarkTarget) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    setTheme(newTheme)
    setResolvedTheme(isDarkTarget ? 'dark' : 'light')
    appThemeSet(newTheme)

    if (isAuthenticated && user) {
      try {
        await api.put('/auth/theme', { theme: newTheme })
        setUser({ ...user, theme: newTheme })
      } catch (error) {
        console.error('Failed to sync theme preference to database:', error)
      }
    }
  }

  const toggleTheme = () => {
    const isCurrentlyDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : resolvedTheme === 'dark'
    changeTheme(isCurrentlyDark ? 'light' : 'dark')
  }

  const isDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : resolvedTheme === 'dark'

  return {
    theme,
    resolvedTheme,
    setTheme: changeTheme,
    toggleTheme,
    isDark,
  }
}
