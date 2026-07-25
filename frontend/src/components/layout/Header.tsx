import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sun, Moon, Monitor, Bell, Menu, X, BookOpen, Layers, Users, FileText, Award, ArrowRight } from 'lucide-react'
import { useAuthStore, useNotificationStore, useUIStore } from '@/store'
import { Avatar, Button } from '@/components/ui'
import NotificationCentre from '@/components/layout/NotificationCentre'
import { Dropdown } from '@/components/ui/overlays'
import { cn } from '@/lib/utils'
import { useLogout } from '@/api/resources/auth'
import { api } from '@/api/client'
import { useTheme } from '@/design-system/hooks/useTheme'

// Map route paths to readable page titles
const pageTitles: Record<string, string> = {
  '/teacher/dashboard': 'Dashboard',
  '/teacher/students': 'Students',
  '/teacher/batches': 'Batches',
  '/teacher/courses': 'Courses',
  '/teacher/videos': 'Video Library',
  '/teacher/notes': 'Notes Library',
  '/teacher/live-classes': 'Live Classes',
  '/teacher/assignments': 'Assignments',
  '/teacher/exams': 'Examinations',
  '/teacher/certificates': 'Certificates',
  '/teacher/chat': 'Messages',
  '/teacher/announcements': 'Announcements',
  '/teacher/calendar': 'Calendar',
  '/teacher/analytics': 'Analytics',
  '/teacher/settings': 'Settings',
  '/student/dashboard': 'Dashboard',
  '/student/courses': 'My Courses',
  '/student/live-classes': 'Live Classes',
  '/student/notes': 'Notes',
  '/student/assignments': 'Assignments',
  '/student/exams': 'Exams',
  '/student/progress': 'My Progress',
  '/student/chat': 'Messages',
  '/student/calendar': 'Calendar',
  '/student/certificates': 'Certificates',
  '/student/settings': 'Settings',
  '/admin/overview': 'Admin Overview',
  '/admin/users': 'User Management',
  '/admin/roles': 'Role & Permissions',
  '/admin/settings': 'Platform Settings',
  '/admin/logs': 'Activity Logs',
  '/admin/security': 'Security Centre',
  '/admin/announcements': 'Announcements',
  '/admin/backup': 'Backup & Export',
}

interface SearchResults {
  courses?: Array<{ id: number; title: string }>
  batches?: Array<{ id: number; name: string; code?: string }>
  students?: Array<{ id: number; name: string; email: string }>
  teachers?: Array<{ id: number; name: string; email: string }>
  assignments?: Array<{ id: number; title: string }>
  exams?: Array<{ id: number; title: string }>
}

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toggleTheme, isDark } = useTheme()
  const { unreadCount, setOpen: setNotifOpen } = useNotificationStore()
  const { toggleSidebar } = useUIStore()
  const { mutate: handleLogout, isPending: loggingOut } = useLogout()

  // Inline Navbar Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const pageTitle = pageTitles[pathname] ?? 'EduFlow'



  const settingsPath = user?.role === 'admin' ? '/admin/settings' : `/${user?.role}/settings`
  const profilePath = user?.role === 'student' ? '/student/profile' : user?.role === 'admin' ? '/admin/profile' : '/teacher/profile'
  const rolePrefix = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student'

  // Handle click outside search container to close inline dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced Search Query Execution
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null)
      setSearching(false)
      return
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<SearchResults>('/search', { q: searchQuery.trim() })
        setSearchResults(res)
      } catch {
        setSearchResults(null)
      } finally {
        setSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleResultClick = (url: string) => {
    setSearchQuery('')
    setSearchFocused(false)
    setSearchResults(null)
    navigate(url)
  }

  const hasResults =
    searchResults &&
    ((searchResults.courses && searchResults.courses.length > 0) ||
      (searchResults.batches && searchResults.batches.length > 0) ||
      (searchResults.students && searchResults.students.length > 0) ||
      (searchResults.teachers && searchResults.teachers.length > 0) ||
      (searchResults.assignments && searchResults.assignments.length > 0) ||
      (searchResults.exams && searchResults.exams.length > 0))

  return (
    <>
      <header className="page-header flex items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar Menu"
            title="Toggle Sidebar Menu"
            className="cursor-pointer text-[rgb(var(--text-primary))] touch-target"
          >
            <Menu size={18} />
          </Button>
          <motion.h1
            key={pageTitle}
            className="text-lg font-semibold text-[rgb(var(--text-primary))] font-[Outfit] hidden sm:block"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {pageTitle}
          </motion.h1>
        </div>

        <div className="flex items-center gap-2">
          <div ref={searchContainerRef} className="relative">
            <div
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl',
                'bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))]',
                'focus-within:border-[rgb(var(--primary))/0.5] focus-within:ring-2 focus-within:ring-[rgb(var(--primary))/0.2]',
                'transition-all duration-200 sm:w-56 lg:w-72 shadow-sm',
              )}
            >
              <Search size={15} className="text-[rgb(var(--text-secondary))] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSearchFocused(true)
                }}
                placeholder="Search anything..."
                className="w-full bg-transparent text-xs text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-secondary))] border-none outline-none font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults(null)
                  }}
                  className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] text-xs p-0.5 rounded-md hover:bg-[rgb(var(--bg-elevated))] transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Instant Floating Search Results Dropdown */}
            <AnimatePresence>
              {searchFocused && searchQuery.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-[var(--radius-lg)] shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto p-3"
                >
                  {searching && (
                    <div className="py-6 text-slate-500 dark:text-slate-400 text-center text-xs text-[rgb(var(--text-muted))] flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
                      Searching EduFlow...
                    </div>
                  )}

                  {!searching && !hasResults && (
                    <div className="py-6 text-slate-500 dark:text-slate-400 text-center text-xs text-[rgb(var(--text-muted))]">
                      No matching results for "{searchQuery}".
                    </div>
                  )}

                  {!searching && hasResults && (
                    <div className="space-y-3">
                      {searchResults?.courses && searchResults.courses.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <BookOpen size={12} /> Courses
                          </div>
                          {searchResults.courses.map((item) => (
                            <div
                              key={`c-${item.id}`}
                              onClick={() => handleResultClick(`${rolePrefix}/courses`)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors text-xs font-medium text-[rgb(var(--text-primary))]"
                            >
                              <span>{item.title}</span>
                              <ArrowRight size={12} className="text-[rgb(var(--text-muted))]" />
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults?.batches && searchResults.batches.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Layers size={12} /> Batches
                          </div>
                          {searchResults.batches.map((item) => (
                            <div
                              key={`b-${item.id}`}
                              onClick={() => handleResultClick(`${rolePrefix}/batches`)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors text-xs font-medium text-[rgb(var(--text-primary))]"
                            >
                              <span>{item.name} {item.code ? `(${item.code})` : ''}</span>
                              <ArrowRight size={12} className="text-[rgb(var(--text-muted))]" />
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults?.students && searchResults.students.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Users size={12} /> Students & Users
                          </div>
                          {searchResults.students.map((item) => (
                            <div
                              key={`u-${item.id}`}
                              onClick={() => handleResultClick('/admin/users')}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors text-xs font-medium text-[rgb(var(--text-primary))]"
                            >
                              <span>{item.name} ({item.email})</span>
                              <ArrowRight size={12} className="text-[rgb(var(--text-muted))]" />
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults?.assignments && searchResults.assignments.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText size={12} /> Assignments
                          </div>
                          {searchResults.assignments.map((item) => (
                            <div
                              key={`a-${item.id}`}
                              onClick={() => handleResultClick(`${rolePrefix}/assignments`)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors text-xs font-medium text-[rgb(var(--text-primary))]"
                            >
                              <span>{item.title}</span>
                              <ArrowRight size={12} className="text-[rgb(var(--text-muted))]" />
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults?.exams && searchResults.exams.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Award size={12} /> Exams
                          </div>
                          {searchResults.exams.map((item) => (
                            <div
                              key={`e-${item.id}`}
                              onClick={() => handleResultClick(`${rolePrefix}/exams`)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors text-xs font-medium text-[rgb(var(--text-primary))]"
                            >
                              <span>{item.title}</span>
                              <ArrowRight size={12} className="text-[rgb(var(--text-muted))]" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Direct Dark/Light Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={toggleTheme}
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-[var(--radius-md)] flex items-center justify-center hover:bg-[rgb(var(--bg-elevated))] transition-colors cursor-pointer"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
          </Button>

          {/* Notifications Bell Icon Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifOpen(true)}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              title="Notifications"
              className="w-11 h-11 sm:w-9 sm:h-9 rounded-[var(--radius-md)] flex items-center justify-center hover:bg-[rgb(var(--bg-elevated))] transition-colors cursor-pointer"
            >
              <Bell size={18} className="text-[rgb(var(--text-primary))]" />
            </Button>
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center pointer-events-none shadow-xs z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </div>

          {user && (
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1 rounded-[var(--radius-md)] hover:bg-[rgb(var(--border))] transition-colors">
                  <Avatar src={user.avatar} name={user.name} size="sm" online />
                  <span className="hidden md:block text-sm font-medium text-[rgb(var(--text-primary))] max-w-[120px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              }
              items={[
                { label: 'Profile', onClick: () => navigate(profilePath) },
                { label: 'Settings', onClick: () => navigate(settingsPath) },
                { divider: true },
                { label: loggingOut ? 'Signing Out...' : 'Sign Out', onClick: () => handleLogout(), danger: true, disabled: loggingOut },
              ]}
              align="right"
            />
          )}
        </div>
      </header>

      <NotificationCentre />
    </>
  )
}
