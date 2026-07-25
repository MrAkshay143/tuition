import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, BookOpen, Users, User, FileText, Award, Calendar, Layers, ArrowRight } from 'lucide-react'
import { useUIStore, useAuthStore } from '@/store'
import { api } from '@/api/client'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui'

interface SearchResults {
  courses?: Array<{ id: number; title: string; status?: string }>
  batches?: Array<{ id: number; name: string; code?: string }>
  students?: Array<{ id: number; name: string; email: string }>
  teachers?: Array<{ id: number; name: string; email: string }>
  assignments?: Array<{ id: number; title: string }>
  exams?: Array<{ id: number; title: string }>
}

export default function GlobalSearchModal() {
  const { searchOpen, setSearchOpen } = useUIStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen to Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, setSearchOpen])

  // Focus input on mount
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults(null)
    }
  }, [searchOpen])

  // Debounced API search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<SearchResults>('/search', { q: query.trim() })
        setResults(res)
      } catch {
        setResults(null)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  if (!searchOpen) return null

  const handleSelect = (url: string) => {
    setSearchOpen(false)
    navigate(url)
  }

  const rolePrefix = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student'

  const hasResults =
    results &&
    ((results.courses && results.courses.length > 0) ||
      (results.batches && results.batches.length > 0) ||
      (results.students && results.students.length > 0) ||
      (results.teachers && results.teachers.length > 0) ||
      (results.assignments && results.assignments.length > 0) ||
      (results.exams && results.exams.length > 0))

  return (
    <Modal 
      open={searchOpen} 
      onClose={() => setSearchOpen(false)} 
      size="xl"
    >
      <div className="-m-6">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))]">
            <Search size={18} className="text-[rgb(var(--text-muted))] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, batches, students, assignments, exams..."
              className="flex-1 bg-transparent text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] border-none outline-none font-medium"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            <button
              onClick={() => setSearchOpen(false)}
              className="p-1 rounded-[var(--radius-sm)] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {query.trim().length < 2 && (
              <div className="py-8 text-slate-500 dark:text-slate-400 text-center text-sm text-[rgb(var(--text-muted))]">
                Type at least 2 characters to search.
              </div>
            )}

            {!loading && query.trim().length >= 2 && !hasResults && (
              <div className="py-8 text-slate-500 dark:text-slate-400 text-center text-sm text-[rgb(var(--text-muted))]">
                No matching results found for "{query}".
              </div>
            )}

            {hasResults && (
              <div className="space-y-4">
                {results?.courses && results.courses.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen size={13} /> Courses
                    </div>
                    <div className="space-y-1">
                      {results.courses.map((item) => (
                        <div
                          key={`course-${item.id}`}
                          onClick={() => handleSelect(`${rolePrefix}/courses`)}
                          className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors group"
                        >
                          <span className="text-sm font-medium text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--primary))]">
                            {item.title}
                          </span>
                          <ArrowRight size={14} className="text-[rgb(var(--text-muted))] group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results?.batches && results.batches.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers size={13} /> Batches
                    </div>
                    <div className="space-y-1">
                      {results.batches.map((item) => (
                        <div
                          key={`batch-${item.id}`}
                          onClick={() => handleSelect(`${rolePrefix}/batches`)}
                          className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors group"
                        >
                          <div>
                            <span className="text-sm font-medium text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--primary))]">
                              {item.name}
                            </span>
                            {item.code && (
                              <span className="ml-2 text-xs text-[rgb(var(--text-muted))] font-mono">
                                ({item.code})
                              </span>
                            )}
                          </div>
                          <ArrowRight size={14} className="text-[rgb(var(--text-muted))] group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results?.students && results.students.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users size={13} /> Students
                    </div>
                    <div className="space-y-1">
                      {results.students.map((item) => (
                        <div
                          key={`student-${item.id}`}
                          onClick={() => handleSelect('/admin/users')}
                          className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors group"
                        >
                          <div>
                            <span className="text-sm font-medium text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--primary))]">
                              {item.name}
                            </span>
                            <span className="ml-2 text-xs text-[rgb(var(--text-muted))]">
                              {item.email}
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-[rgb(var(--text-muted))] group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results?.assignments && results.assignments.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText size={13} /> Assignments
                    </div>
                    <div className="space-y-1">
                      {results.assignments.map((item) => (
                        <div
                          key={`assignment-${item.id}`}
                          onClick={() => handleSelect(`${rolePrefix}/assignments`)}
                          className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors group"
                        >
                          <span className="text-sm font-medium text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--primary))]">
                            {item.title}
                          </span>
                          <ArrowRight size={14} className="text-[rgb(var(--text-muted))] group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results?.exams && results.exams.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Award size={13} /> Exams
                    </div>
                    <div className="space-y-1">
                      {results.exams.map((item) => (
                        <div
                          key={`exam-${item.id}`}
                          onClick={() => handleSelect(`${rolePrefix}/exams`)}
                          className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] hover:bg-[rgb(var(--bg-elevated))] cursor-pointer transition-colors group"
                        >
                          <span className="text-sm font-medium text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--primary))]">
                            {item.title}
                          </span>
                          <ArrowRight size={14} className="text-[rgb(var(--text-muted))] group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-2 bg-[rgb(var(--bg-elevated))] border-t border-[rgb(var(--border))] flex items-center justify-between text-[11px] text-[rgb(var(--text-muted))]">
            <span>Press <kbd className="px-1 py-0.5 bg-[rgb(var(--border))] rounded font-mono">ESC</kbd> to close</span>
            <span>EduFlow Command Palette</span>
          </div>
          </div>
    </Modal>
  )
}
