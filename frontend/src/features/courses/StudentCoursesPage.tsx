import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiQuery } from '@/api/resources/hooks'
import { Link } from 'react-router-dom'
import { Search, ArrowUpDown, ChevronRight, BookOpen, Clock, CheckCircle, Filter, ChevronDown } from 'lucide-react'
import { api } from '@/api/client'
import { Button, Card, Spinner } from '@/components/ui'

export default function StudentCoursesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'progress' | 'completed' | 'bookmarks'>('all')
  const [sortBy, setSortBy] = useState<'alpha' | 'progress' | 'recent'>('recent')
  const [showFilters, setShowFilters] = useState(false)

  const { data: dashboard, isLoading: loadingDash } = useApiQuery(
    ['student', 'dashboard'],
    '/student/dashboard'
  )

  const { data: bookmarksData } = useApiQuery(
    ['student', 'bookmarks'],
    '/student/bookmarks'
  )

  if (loadingDash) return <div className="flex justify-center py-12"><Spinner /></div>

  const courses = dashboard?.enrolled_courses || []
  const bookmarks = bookmarksData?.data || []

  let filtered = [...courses]
  if (activeTab === 'progress') {
    filtered = filtered.filter(c => c.completed_percentage > 0 && c.completed_percentage < 100)
  } else if (activeTab === 'completed') {
    filtered = filtered.filter(c => c.completed_percentage === 100)
  } else if (activeTab === 'bookmarks') {
    const bookmarkedCourseIds = bookmarks.map((b: any) => b.lesson?.module?.course_id)
    filtered = filtered.filter(c => bookmarkedCourseIds.includes(c.id))
  }

  if (search.trim()) {
    filtered = filtered.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
  }

  filtered.sort((a, b) => {
    if (sortBy === 'alpha') return a.title.localeCompare(b.title)
    if (sortBy === 'progress') return b.completed_percentage - a.completed_percentage
    return b.id - a.id
  })

  const inProgressCount = courses.filter((c: any) => c.completed_percentage > 0 && c.completed_percentage < 100).length
  const completedCount = courses.filter((c: any) => c.completed_percentage === 100).length

  return (
    <div className="space-y-5 pb-12 font-[Outfit]">
      {/* 1. Minimalist Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">My Courses</span>
          </div>
        </div>
      </div>

      {/* 2. Compact One-Line Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <BookOpen size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Enrolled</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{courses.length}</h3>
            <p className="text-[10px] text-indigo-500 font-semibold mt-1">Enrolled classrooms</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">In Progress</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{inProgressCount}</h3>
            <p className="text-[10px] text-amber-500 font-semibold mt-1">Ongoing lessons</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[65%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Completed</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{completedCount}</h3>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">Finished courses</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[90%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 3. Search Bar & Filter Action Row */}
      <div className="bg-[rgb(var(--bg-surface))] p-3 rounded-2xl border border-[rgb(var(--border))] shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              className="w-full pl-9 pr-4 py-2 text-xs border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))] transition-all"
              placeholder="Search courses by title or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer shrink-0 ${
              showFilters || activeTab !== 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] border-[rgb(var(--border))] hover:bg-[rgb(var(--border))]'
            }`}
          >
            <Filter size={14} />
            <span>Filter</span>
            {activeTab !== 'all' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
            <ChevronDown size={14} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded Filter Options (Tabs + Sort) */}
        {showFilters && (
          <div className="pt-3 border-t border-[rgb(var(--border))] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none whitespace-nowrap p-1 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
              {(['all', 'progress', 'completed', 'bookmarks'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                  }`}
                >
                  {tab === 'progress' ? 'In Progress' : tab}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] text-xs font-medium text-[rgb(var(--text-secondary))] shrink-0">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={13} className="text-indigo-500" />
                <span>Sort:</span>
              </div>
              <select
                className="border-none focus:ring-0 text-xs font-bold text-[rgb(var(--text-primary))] bg-transparent cursor-pointer py-0 pr-6 pl-1"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
              >
                <option value="recent">Recently Added</option>
                <option value="progress">Highest Progress</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-[rgb(var(--text-secondary))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl">
          No courses found matching selected filters.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map(course => (
            <Card key={course.id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 border border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--bg-surface))]">
              <div>
                {course.thumbnail ? (
                  <img src={course.thumbnail} className="w-full h-36 object-cover" alt={course.title} />
                ) : (
                  <div className="w-full h-36 bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-extrabold font-[Outfit]">
                    {course.title.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="p-4 space-y-1.5">
                  <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-2 leading-relaxed">{course.description}</p>
                </div>
              </div>
              <div className="p-4 border-t border-[rgb(var(--border))] space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-[rgb(var(--text-secondary))]">
                    <span>Progress</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{course.completed_percentage ?? 0}%</span>
                  </div>
                  <div className="w-full bg-[rgb(var(--bg-elevated))] h-1.5 rounded-full overflow-hidden border border-[rgb(var(--border))]">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${course.completed_percentage ?? 0}%` }} />
                  </div>
                </div>
                <Button variant="primary" className="w-full justify-center flex items-center gap-1 font-extrabold text-xs py-2 rounded-xl cursor-pointer"
                  onClick={() => navigate(`/student/courses/${course.id}`)}>
                  Go to Classroom <ChevronRight size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}



