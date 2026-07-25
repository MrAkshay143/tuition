import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Notification } from '@/types'
import { removeToken, setToken } from '@/api/client'

// ── Auth Store ────────────────────────────────────────────────
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        setToken(token)
        set({ user, token, isAuthenticated: true })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        removeToken()
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'eduflow-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
)

// ── Theme Store ───────────────────────────────────────────────
interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme
        document.documentElement.classList.toggle('dark', resolved === 'dark')
        set({ theme, resolvedTheme: resolved })
      },
    }),
    {
      name: 'eduflow-theme',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state.theme === 'system' ? getSystemTheme() : state.theme
          document.documentElement.classList.toggle('dark', resolved === 'dark')
          state.resolvedTheme = resolved
        }
      },
    },
  ),
)

// ── Notification Store ────────────────────────────────────────
interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  activeFilter: string
  setNotifications: (notifs: Notification[]) => void
  addNotification: (notif: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  setUnreadCount: (count: number) => void
  setOpen: (open: boolean) => void
  setFilter: (filter: string) => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  activeFilter: 'all',

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notif) =>
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read_at: n.read_at ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setOpen: (isOpen) => set({ isOpen }),
  setFilter: (activeFilter) => set({ activeFilter }),
}))

// ── UI Store ──────────────────────────────────────────────────
interface UIState {
  sidebarCollapsed: boolean
  searchOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setSearchOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: typeof window !== 'undefined' && window.innerWidth < 1024,
      searchOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
    }),
    {
      name: 'eduflow-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
)
