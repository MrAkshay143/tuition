import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiQuery } from '@/api/resources/hooks'
import { Link } from 'react-router-dom'
import { Search, ArrowUpDown, ChevronRight } from 'lucide-react'
import { api } from '@/api/client'
import { Button, Card, Spinner } from '@/components/ui'

export default function StudentCoursesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'progress' | 'completed' | 'bookmarks'>('all')
  const [sortBy, setSortBy] = useState<'alpha' | 'progress' | 'recent'>('recent')

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

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold font-[Outfit] tracking-tight text-[rgb(var(--text-primary))]">My Courses</h1>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 font-[Inter]">
            Filter and launch your enrolled courses. {courses.length} courses total.
          </p>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.3)] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs + Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[rgb(var(--border))] pb-3">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none whitespace-nowrap flex-nowrap w-full sm:w-auto">
          {(['all', 'progress', 'completed', 'bookmarks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none text-center px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize whitespace-nowrap flex-shrink-0 ${
                activeTab === tab
                  ? 'bg-[rgb(var(--primary))] text-white shadow-xs'
                  : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-elevated))]'
              }`}
            >
              {tab === 'progress' ? 'In Progress' : tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-secondary))]">
          <ArrowUpDown size={14} />
          <span>Sort:</span>
          <select
            className="border-none focus:ring-0 text-xs font-bold text-[rgb(var(--text-primary))] bg-transparent"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="recent">Recently Added</option>
            <option value="progress">Highest Progress</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-slate-500 dark:text-slate-400 text-center text-[rgb(var(--text-secondary))]">
          No courses found matching selected filters.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(course => (
            <Card key={course.id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div>
                {course.thumbnail ? (
                  <img src={course.thumbnail} className="w-full h-40 object-cover" alt={course.title} />
                ) : (
                  <div className="w-full h-40 bg-[rgb(var(--primary)/0.08)] flex items-center justify-center text-[rgb(var(--primary))] text-3xl font-extrabold font-[Outfit]">
                    {course.title.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-2">{course.description}</p>
                </div>
              </div>
              <div className="p-5 border-t border-[rgb(var(--border))] space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-[rgb(var(--text-secondary))]">
                    <span>Course Complete</span>
                    <span>{course.completed_percentage ?? 0}%</span>
                  </div>
                  <div className="w-full bg-[rgb(var(--border))] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[rgb(var(--primary))] h-1.5 rounded-full" style={{ width: `${course.completed_percentage ?? 0}%` }} />
                  </div>
                </div>
                <Button variant="primary" className="w-full justify-center flex items-center gap-1"
                  onClick={() => navigate(`/student/courses`)}>
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



