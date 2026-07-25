import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  setResolvedTheme: (resolvedTheme: 'light' | 'dark') => void
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', resolved === 'dark')
        }
        set({ theme, resolvedTheme: resolved })
      },

      setResolvedTheme: (resolvedTheme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
        }
        set({ resolvedTheme })
      }
    }),
    {
      name: 'eduflow-theme-ds',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
