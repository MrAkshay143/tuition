import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import {
  Search, Play, Star, BookOpen, Bookmark, Grid, List, ChevronDown,
  ArrowRight, GraduationCap, Building2, Award, FileText, Code, Briefcase, LayoutGrid, ArrowLeft, SlidersHorizontal, MoreHorizontal, Users, Plus
} from 'lucide-react'
import { Button, Card, Spinner, Modal } from '@/components/ui'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface CourseProgram {
  id: number
  name: string
  slug: string
  education_type_id: number
}

interface CourseSubject {
  id: number
  name: string
  slug: string
  color: string | null
}

interface Lesson {
  id: number
  title: string
  type: string
}

interface Module {
  id: number
  title: string
  lessons?: Lesson[]
}

interface Course {
  id: number
  title: string
  description: string
  thumbnail: string | null
  modules_count: number
  lessons_count: number
  modules?: Module[]
  program?: CourseProgram | null
  subject?: CourseSubject | null
  teacher?: { name: string }
}

interface EducationType {
  id: number
  name: string
  slug: string
  programs: Array<{ id: number; name: string; slug: string; courses_count: number }>
  total_courses: number
}

interface ExploreResponse {
  courses: Course[]
  education_types: EducationType[]
  subjects: CourseSubject[]
}

export default function Courses() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [examFilter, setExamFilter] = useState<string>('all')
  const [durationFilter, setDurationFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(12)
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({})
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Dynamic filter state from URL params
  const selectedEducationTypeId = searchParams.get('education_type_id')
    ? Number(searchParams.get('education_type_id'))
    : null

  // Fetch explore API data
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'explore'],
    queryFn: async () => {
      const res = await api.get<{ data: ExploreResponse }>('/public/explore')
      return res.data
    },
  })

  const apiCourses = data?.courses ?? []
  const educationTypes = data?.education_types ?? []

  // Top category tabs matching exact reference screenshot
  const categoryTabs = [
    { id: 'all', title: 'All Courses', sub: 'Explore all', icon: LayoutGrid, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/10 border-indigo-500/30' },
    { id: 'school', title: 'School', sub: 'Classes 6-12', icon: Building2, color: 'text-slate-500 dark:text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-[#102e23] border-emerald-500/30 dark:border-[#1b4e3c]' },
    { id: 'college', title: 'College', sub: 'UG & PG', icon: GraduationCap, color: 'text-slate-500 dark:text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-[#13244c] border-blue-500/30 dark:border-[#1f3c7d]' },
    { id: 'competitive', title: 'Competitive Exams', sub: 'JEE, NEET, UPSC & more', icon: Award, color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-[#241747] border-purple-500/30 dark:border-[#3e2778]' },
    { id: 'certification', title: 'Certification', sub: 'Industry recognized', icon: FileText, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-[#2e2010] border-amber-500/30 dark:border-[#52391b]' },
    { id: 'skill', title: 'Skill Development', sub: 'Learn in-demand skills', icon: Code, color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-[#0f2e36] border-teal-500/30 dark:border-[#1b4d5a]' },
    { id: 'professional', title: 'Professional Training', sub: 'Advance your career', icon: Briefcase, color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-[#2e2910] border-yellow-500/30 dark:border-[#4d441b]' },
  ]

  // Default catalog fallback
  const defaultCatalog: Course[] = [
    {
      id: 1,
      title: 'Physics Masterclass',
      description: 'Comprehensive coverage of concepts with practice.',
      thumbnail: null,
      modules_count: 5,
      lessons_count: 10,
      program: { id: 1, name: 'JEE MAIN 2027', slug: 'jee-main-2027', education_type_id: 1 },
      subject: { id: 1, name: 'Physics Division', slug: 'physics', color: '#594fe6' },
    },
    {
      id: 2,
      title: 'Vector Algebra & 3D Geometry',
      description: 'Master vectors, 3D geometry and spatial visualization.',
      thumbnail: null,
      modules_count: 4,
      lessons_count: 10,
      program: { id: 1, name: 'JEE MAIN 2027', slug: 'jee-main-2027', education_type_id: 1 },
      subject: { id: 2, name: 'Mathematics Division', slug: 'mathematics', color: '#a855f7' },
    },
    {
      id: 3,
      title: 'Probability & Mathematical Statistics',
      description: 'In-depth understanding with solved examples.',
      thumbnail: null,
      modules_count: 6,
      lessons_count: 10,
      program: { id: 1, name: 'JEE MAIN 2027', slug: 'jee-main-2027', education_type_id: 1 },
      subject: { id: 2, name: 'Mathematics Division', slug: 'mathematics', color: '#a855f7' },
    },
    {
      id: 4,
      title: 'Cell Biology & Biomolecules',
      description: 'Detailed study of cell structure and biomolecules.',
      thumbnail: null,
      modules_count: 4,
      lessons_count: 10,
      program: { id: 2, name: 'NEET 2027', slug: 'neet-2027', education_type_id: 1 },
      subject: { id: 3, name: 'Biology Division', slug: 'biology', color: '#22c55e' },
    },
    {
      id: 5,
      title: 'Ecology & Environmental Biology',
      description: 'Learn ecosystems, biodiversity and environmental issues.',
      thumbnail: null,
      modules_count: 5,
      lessons_count: 10,
      program: { id: 2, name: 'NEET 2027', slug: 'neet-2027', education_type_id: 1 },
      subject: { id: 3, name: 'Biology Division', slug: 'biology', color: '#22c55e' },
    },
    {
      id: 6,
      title: 'Mathematics Advanced',
      description: 'Advanced problems and techniques for JEE preparation.',
      thumbnail: null,
      modules_count: 5,
      lessons_count: 10,
      program: { id: 1, name: 'JEE MAIN 2027', slug: 'jee-main-2027', education_type_id: 1 },
      subject: { id: 2, name: 'Mathematics Division', slug: 'mathematics', color: '#a855f7' },
    },
    {
      id: 7,
      title: 'Biology Complete Guide',
      description: 'Complete NEET biology in a structured way.',
      thumbnail: null,
      modules_count: 6,
      lessons_count: 10,
      program: { id: 2, name: 'NEET 2027', slug: 'neet-2027', education_type_id: 1 },
      subject: { id: 3, name: 'Biology Division', slug: 'biology', color: '#22c55e' },
    },
    {
      id: 8,
      title: 'Calculus Advanced',
      description: 'Master derivatives, integrals and applications.',
      thumbnail: null,
      modules_count: 5,
      lessons_count: 10,
      program: { id: 1, name: 'JEE MAIN 2027', slug: 'jee-main-2027', education_type_id: 1 },
      subject: { id: 2, name: 'Mathematics Division', slug: 'mathematics', color: '#a855f7' },
    },
    {
      id: 9,
      title: 'Electromagnetism Masterclass',
      description: "Maxwell's equations, waves and advanced problems.",
      thumbnail: null,
      modules_count: 5,
      lessons_count: 10,
      program: { id: 1, name: 'JEE MAIN 2027', slug: 'jee-main-2027', education_type_id: 1 },
      subject: { id: 1, name: 'Physics Division', slug: 'physics', color: '#594fe6' },
    },
    {
      id: 10,
      title: 'Wave Optics & Sound',
      description: 'Detailed theory with numericals and concept clarity.',
      thumbnail: null,
      modules_count: 4,
      lessons_count: 10,
      program: { id: 1, name: 'JEE MAIN 2027', slug: 'jee-main-2027', education_type_id: 1 },
      subject: { id: 1, name: 'Physics Division', slug: 'physics', color: '#594fe6' },
    },
    {
      id: 11,
      title: 'Organic Synthesis Masterclass',
      description: 'Reaction mechanisms and synthesis techniques.',
      thumbnail: null,
      modules_count: 5,
      lessons_count: 10,
      program: { id: 1, name: 'JEE MAIN 2027', slug: 'jee-main-2027', education_type_id: 1 },
      subject: { id: 4, name: 'Chemistry Division', slug: 'chemistry', color: '#06b6d4' },
    },
    {
      id: 12,
      title: 'Inorganic Chemistry Guide',
      description: 'Periodic table, coordination compounds & more.',
      thumbnail: null,
      modules_count: 4,
      lessons_count: 10,
      program: { id: 1, name: 'JEE MAIN 2027', slug: 'jee-main-2027', education_type_id: 1 },
      subject: { id: 4, name: 'Chemistry Division', slug: 'chemistry', color: '#06b6d4' },
    },
  ]

  const displayCoursesList = apiCourses.length >= 12 ? apiCourses : defaultCatalog

  const filteredCourses = displayCoursesList.filter((c) => {
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.subject?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.program?.name ?? '').toLowerCase().includes(search.toLowerCase())

    let matchesCategory = true
    if (activeCategory !== 'all') {
      const categoryKeywords: Record<string, string[]> = {
        school: ['school', 'class', 'cbse', 'icse', '6th', '7th', '8th', '9th', '10th', '11th', '12th', 'k12', 'biology', 'physics', 'chemistry', 'maths'],
        college: ['college', 'ug', 'pg', 'university', 'btech', 'bsc', 'bcom', 'ba', 'degree'],
        competitive: ['competitive', 'jee', 'neet', 'upsc', 'ssc', 'bank', 'gate', 'exam', 'entrance'],
        certification: ['certification', 'certificate', 'certified', 'diploma'],
        skill: ['skill', 'coding', 'web', 'python', 'java', 'react', 'design', 'development', 'data'],
        professional: ['professional', 'corporate', 'management', 'business', 'training', 'career', 'executive'],
      }

      const keywords = categoryKeywords[activeCategory] || [activeCategory]
      const fullText = [
        c.title,
        c.description,
        c.program?.name,
        c.subject?.name,
        (c as any).education_type?.name,
        (c as any).program?.education_type?.name
      ].filter(Boolean).join(' ')

      matchesCategory = keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(fullText))
    }

    if (selectedEducationTypeId) {
      matchesCategory = (c.program?.education_type_id ?? null) === selectedEducationTypeId || (c as any).education_type_id === selectedEducationTypeId || (c as any).education_type?.id === selectedEducationTypeId
    }

    let matchesSubject = true
    if (subjectFilter !== 'all') {
      matchesSubject =
        (c.subject?.slug ?? '').toLowerCase() === subjectFilter.toLowerCase() ||
        (c.subject?.name ?? '').toLowerCase().includes(subjectFilter.toLowerCase()) ||
        c.title.toLowerCase().includes(subjectFilter.toLowerCase())
    }

    let matchesExam = true
    if (examFilter !== 'all') {
      matchesExam =
        (c.program?.name ?? '').toLowerCase().includes(examFilter.toLowerCase()) ||
        c.title.toLowerCase().includes(examFilter.toLowerCase())
    }

    let matchesLevel = true
    if (levelFilter !== 'all') {
      matchesLevel =
        c.title.toLowerCase().includes(levelFilter.toLowerCase()) ||
        c.description.toLowerCase().includes(levelFilter.toLowerCase())
    }

    return matchesSearch && matchesCategory && matchesSubject && matchesExam && matchesLevel
  })

  const totalItems = filteredCourses.length
  const paginatedCourses = filteredCourses.slice((page - 1) * perPage, page * perPage)

  const toggleBookmark = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const clearAllFilters = () => {
    setSearch('')
    setActiveCategory('all')
    setSubjectFilter('all')
    setLevelFilter('all')
    setExamFilter('all')
    setDurationFilter('all')
    setSearchParams({})
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 bg-[#f8fafc] dark:bg-[#060713] text-slate-900 dark:text-white selection:bg-indigo-500/30 font-sans pb-6 sm:pb-16 min-h-[100dvh] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-7 pt-3 sm:pt-6">

        {/* ── 1. Page Header matching Users & Roles Pages ──────────────────────── */}
        <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
              <BookOpen size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
                Course Catalog
              </h1>
              <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
                Explore our wide range of courses designed to help you learn, practice and excel
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => navigate('/admin/courses/new')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 shrink-0 whitespace-nowrap cursor-pointer"
          >
            Add Course
          </Button>
        </div>

        {/* ── 2. Top KPI Metrics Row matching Users & Roles Pages ──────────────── */}
        <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
          {/* Card 1: Total Courses */}
          <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen size={15} />
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Courses</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{displayCoursesList.length}</h3>
              <p className="text-[10px] text-purple-400 font-semibold mt-1">Catalog items</p>
            </div>
            <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-purple-500 h-full w-[85%] rounded-full"></div>
            </div>
          </Card>

          {/* Card 2: Active Programs */}
          <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <GraduationCap size={15} />
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Active Programs</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">6</h3>
              <p className="text-[10px] text-emerald-400 font-semibold mt-1">JEE, NEET & More</p>
            </div>
            <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full w-[90%] rounded-full"></div>
            </div>
          </Card>

          {/* Card 3: Enrolled Students */}
          <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Users size={15} />
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Students Enrolled</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">1,480</h3>
              <p className="text-[10px] text-amber-400 font-semibold mt-1">In active courses</p>
            </div>
            <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-amber-500 h-full w-[70%] rounded-full"></div>
            </div>
          </Card>

          {/* Card 4: Total Lessons */}
          <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Play size={15} />
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Lessons</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">120+</h3>
              <p className="text-[10px] text-blue-400 font-semibold mt-1">Video & Text</p>
            </div>
            <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-blue-500 h-full w-[80%] rounded-full"></div>
            </div>
          </Card>
        </div>

        {/* ── 3. Search & Filter Bar with Workable Filter Button ────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {/* Left Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses by title, subject or program..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            {/* Workable Filter Toggle Button on Right Side */}
            <button
              onClick={() => setIsFilterModalOpen(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0",
                isFilterModalOpen || subjectFilter !== 'all' || levelFilter !== 'all' || examFilter !== 'all' || sortBy !== 'popular'
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-white dark:bg-[#0c0d24] border-slate-200 dark:border-[#1f2147] text-slate-700 dark:text-white hover:border-indigo-500/40"
              )}
              title="Filter Options"
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filter</span>
              {(subjectFilter !== 'all' || levelFilter !== 'all' || examFilter !== 'all' || sortBy !== 'popular') && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Collapsible Filter Panel - Side by Side */}
          {(isFilterModalOpen || subjectFilter !== 'all' || levelFilter !== 'all' || examFilter !== 'all' || sortBy !== 'popular') && (
            <div className="p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-[#1f2147] bg-white dark:bg-[#0c0d24] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
              <div className="flex flex-row items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                {/* Subject Dropdown */}
                <div className="relative min-w-[110px] flex-1">
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-slate-50 dark:bg-[#0f1025] border border-slate-200 dark:border-[#1e2040] text-slate-800 dark:text-white outline-none appearance-none cursor-pointer truncate"
                  >
                    <option value="all">All Subjects</option>
                    <option value="physics">Physics</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="biology">Biology</option>
                    <option value="chemistry">Chemistry</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Level Dropdown */}
                <div className="relative min-w-[100px] flex-1">
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-slate-50 dark:bg-[#0f1025] border border-slate-200 dark:border-[#1e2040] text-slate-800 dark:text-white outline-none appearance-none cursor-pointer truncate"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Sort Dropdown */}
                <div className="relative min-w-[110px] flex-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-slate-50 dark:bg-[#0f1025] border border-slate-200 dark:border-[#1e2040] text-slate-800 dark:text-white outline-none appearance-none cursor-pointer truncate"
                  >
                    <option value="popular">Sort: Popular</option>
                    <option value="newest">Sort: Newest</option>
                    <option value="rating">Sort: Rating</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {(subjectFilter !== 'all' || levelFilter !== 'all' || examFilter !== 'all' || sortBy !== 'popular') && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 4. Category Section ────────────────────────────────────────── */}
        {/* Mobile View: Compact Icon Scrollbar */}
        <div className="flex md:hidden items-start gap-1.5 sm:gap-3 overflow-x-auto scrollbar-hide py-1 sm:py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categoryTabs.map((cat) => {
            const CatIcon = cat.icon
            const isActive = activeCategory === cat.id

            return (
              <div
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center gap-2 sm:gap-2.5 p-1.5 sm:p-2 min-w-[64px] sm:min-w-[76px] cursor-pointer transition-all flex-shrink-0 ${
                  isActive 
                    ? 'bg-white dark:bg-[#10122e]/80 border border-slate-200 dark:border-[#1e2040] rounded-[20px] shadow-sm' 
                    : 'bg-transparent border border-transparent hover:bg-slate-50 dark:hover:bg-[#10122e]/40 rounded-[20px]'
                }`}
              >
                <div 
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive
                      ? `bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 ${cat.color.split(' ')[0]} ${cat.color.split(' ')[1]}`
                      : `bg-white dark:bg-[#0b0c1c] border border-slate-200 dark:border-[#161836] ${cat.color.split(' ')[0]} ${cat.color.split(' ')[1]}`
                  }`}
                >
                  <CatIcon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center whitespace-nowrap ${
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#8e91b5]'
                }`}>
                  {cat.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* Desktop View: Full Category Cards (Matching Reference Screenshot) */}
        <div className="hidden md:flex overflow-x-auto scrollbar-hide py-1 w-full">
          <div className="flex items-stretch gap-3.5 mx-auto min-w-max px-2">
            {categoryTabs.map((cat) => {
            const CatIcon = cat.icon
            const isActive = activeCategory === cat.id

            return (
              <div
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-4 sm:p-5 rounded-[20px] border flex flex-col items-center justify-center min-w-[165px] flex-1 cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-indigo-50/80 to-fuchsia-50/80 dark:from-indigo-950/20 dark:to-fuchsia-950/20 border-[#594fe6] ring-1 ring-[#594fe6] shadow-[0_8px_30px_rgba(99,102,241,0.15)]' 
                    : 'bg-white dark:bg-[#0c0d24] border-slate-200 dark:border-[#1f2147] hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <CatIcon size={18} />
                </div>
                <div className="mt-4 text-slate-500 dark:text-slate-400 text-center">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{cat.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-[#8e91b5] mt-0.5 whitespace-nowrap">{cat.sub}</p>
                </div>
              </div>
            )
          })}
          </div>
        </div>
        {/* ── 3. Filter Bar & View Toggle ───────────────────────────────── */}
        {/* Mobile View: Title & Toggle */}
        <div className="flex md:hidden items-center justify-between gap-4 pt-1 border-t border-slate-200 dark:border-[#1b1d3d] mt-2 sm:mt-0">
          <div className="flex-1 text-left pt-1">
            <h2 className="text-slate-500 dark:text-slate-400 text-base font-extrabold text-slate-900 dark:text-white font-[Outfit] tracking-tight leading-tight">
              Course Catalog
            </h2>
            <p className="text-[9px] text-slate-500 dark:text-[#8e91b5] mt-0.5 leading-tight line-clamp-1">
              Explore our wide range of courses.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#594fe6] text-white' : 'bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#594fe6] text-white' : 'bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Desktop View: Inline Filters Bar (Matching Reference Screenshot) */}
        <div className="hidden md:flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">Filters :</span>

            {/* Subject Dropdown */}
            <div className="relative">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-full px-3.5 py-1.5 pr-8 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="all">All Subjects</option>
                <option value="physics">Physics</option>
                <option value="mathematics">Mathematics</option>
                <option value="biology">Biology</option>
                <option value="chemistry">Chemistry</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Level Dropdown */}
            <div className="relative">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-full px-3.5 py-1.5 pr-8 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Exam Dropdown */}
            <div className="relative">
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-full px-3.5 py-1.5 pr-8 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="all">All Exams</option>
                <option value="jee">JEE Main</option>
                <option value="neet">NEET</option>
                <option value="upsc">UPSC</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Duration Dropdown */}
            <div className="relative">
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-full px-3.5 py-1.5 pr-8 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="all">All Durations</option>
                <option value="short">1 - 4 Weeks</option>
                <option value="medium">1 - 3 Months</option>
                <option value="long">6+ Months</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-full px-3.5 py-1.5 pr-8 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="popular">Sort by: Popular</option>
                <option value="newest">Sort by: Newest</option>
                <option value="rating">Sort by: Rating</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Clear All */}
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-indigo-600 dark:text-[#818cf8] hover:underline cursor-pointer ml-1"
            >
              Clear All
            </button>
          </div>

          {/* Desktop View Switcher Icons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#594fe6] text-white' : 'bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#594fe6] text-white' : 'bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* ── 4. Course Grid or List View ─────────────── */}
        {isLoading ? (
          <div className="flex justify-center p-16"><Spinner /></div>
        ) : paginatedCourses.length === 0 ? (
          <div className="text-slate-500 dark:text-slate-400 text-center py-16 border border-dashed border-slate-200 dark:border-[#1f2147] rounded-[22px]">
            <p className="text-sm font-bold text-slate-900 dark:text-white">No courses match your filter criteria.</p>
            <p className="text-xs text-slate-500 dark:text-[#8e91b5] mt-1">Try clearing your filters or selecting another category.</p>
            <button onClick={clearAllFilters} className="mt-3 text-xs font-bold text-indigo-600 dark:text-[#818cf8] hover:underline">
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {paginatedCourses.map((c) => {
              const badgeTag = c.program?.name || 'JEE MAIN 2027'
              const subjectTag = c.subject?.name || 'PHYSICS DIVISION'
              const isBookmarked = !!bookmarked[c.id]

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/courses/${c.id}`)}
                  className="p-3 sm:p-5 border border-indigo-50/80 dark:border-[#1f2147] bg-gradient-to-br from-white to-slate-50 dark:from-[#0c0e25] dark:to-[#080918] flex flex-col justify-between hover:border-indigo-400/50 transition-all duration-300 cursor-pointer group rounded-[16px] sm:rounded-[22px] shadow-xl hover:shadow-[0_12px_35px_rgba(99,102,241,0.12)] space-y-3 sm:space-y-4 text-left"
                >
                  {/* Card Banner Header */}
                  <div className="w-full h-24 sm:h-36 bg-slate-100 dark:bg-[#080918] relative rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 dark:border-[#1b1d3d] flex items-center justify-center">
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[8px] sm:text-[9.5px] font-extrabold uppercase bg-[#594fe6] text-white px-2 sm:px-2.5 py-0.5 rounded-full shadow-md z-10 tracking-wider">
                      {badgeTag}
                    </span>

                    <button
                      onClick={(e) => toggleBookmark(c.id, e)}
                      className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1 sm:p-1.5 rounded-md sm:rounded-lg border backdrop-blur-md z-10 transition-all ${
                        isBookmarked
                          ? 'bg-[#594fe6] border-[#594fe6] text-white'
                          : 'bg-white/80 dark:bg-[#12132e]/80 border-slate-200 dark:border-[#2b2d5c] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Bookmark Course"
                    >
                      <Bookmark size={12} fill={isBookmarked ? 'currentColor' : 'none'} className="sm:w-[13px] sm:h-[13px]" />
                    </button>

                    {c.thumbnail ? (
                      <img src={c.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-400/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-100 dark:via-[#080918] to-slate-100 dark:to-[#080918]">
                        <BookOpen size={28} className="opacity-40 text-indigo-400 sm:w-9 sm:h-9" />
                      </div>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div className="space-y-1 sm:space-y-1.5 flex-1">
                    <span className="text-[8px] sm:text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8e91b5] block line-clamp-1">
                      {subjectTag}
                    </span>
                    <h3 className="font-extrabold text-[12px] sm:text-[15px] text-slate-900 dark:text-white font-[Outfit] leading-snug line-clamp-2 sm:line-clamp-1 min-h-[34px] sm:min-h-0">
                      {c.title}
                    </h3>
                    
                    {(() => {
                      const modulesCount = typeof c.modules_count === 'number' ? c.modules_count : (Array.isArray(c.modules) ? c.modules.length : 0)
                      const lessonsCount = typeof c.lessons_count === 'number' ? c.lessons_count : (Array.isArray(c.modules) ? c.modules.reduce((acc: number, m: any) => acc + (Array.isArray(m.lessons) ? m.lessons.length : (m.lessons_count || 0)), 0) : 0)
                      return (
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-[#c4c6e5] pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-[#1b1d3d] gap-1">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                              <BookOpen size={9} className="sm:w-[11px] sm:h-[11px]" />
                              {modulesCount} <span className="hidden sm:inline">{modulesCount === 1 ? 'Module' : 'Modules'}</span><span className="sm:hidden">Mod</span>
                            </span>
                            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 dark:text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                              <Play size={8} fill="currentColor" className="sm:w-[10px] sm:h-[10px]" />
                              {lessonsCount} <span className="hidden sm:inline">{lessonsCount === 1 ? 'Lesson' : 'Lessons'}</span><span className="sm:hidden">Lsn</span>
                            </span>
                          </div>

                          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
                            <Star size={9} fill="currentColor" className="sm:w-[11px] sm:h-[11px]" /> 4.8
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Card Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/courses/${c.id}`)
                    }}
                    className="w-full bg-slate-100 dark:bg-[#12132e] border border-slate-200 dark:border-[#262852] hover:bg-[#594fe6] hover:border-[#594fe6] hover:text-white text-slate-900 dark:text-white font-bold text-[10px] sm:text-xs py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm dark:shadow-md"
                  >
                    <span className="hidden sm:inline">Explore Syllabus</span><span className="sm:hidden">Explore</span> <ArrowRight size={11} className="sm:w-[13px] sm:h-[13px]" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedCourses.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/courses/${c.id}`)}
                className="p-4 border border-indigo-50/80 dark:border-[#1f2147] bg-gradient-to-br from-white to-slate-50 dark:from-[#0c0e25] dark:to-[#080918] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-indigo-400/50 transition-all duration-300 cursor-pointer group shadow-xl hover:shadow-[0_12px_35px_rgba(99,102,241,0.12)] text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-[#080918] border border-slate-200 dark:border-[#1b1d3d] flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    {c.thumbnail ? (
                      <img src={c.thumbnail} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={24} className="text-indigo-600 dark:text-indigo-400 opacity-60" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase bg-[#594fe6] text-white px-2 py-0.5 rounded-full font-mono">
                        {c.program?.name || 'JEE MAIN 2027'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#8e91b5]">{c.subject?.name || 'PHYSICS DIVISION'}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-base text-slate-900 dark:text-white font-[Outfit] leading-snug mt-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-[#9396b8] line-clamp-1 mt-0.5 max-w-xl">
                      {c.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto flex-shrink-0">
                  {(() => {
                    const modulesCount = typeof c.modules_count === 'number' ? c.modules_count : (Array.isArray(c.modules) ? c.modules.length : 0)
                    const lessonsCount = typeof c.lessons_count === 'number' ? c.lessons_count : (Array.isArray(c.modules) ? c.modules.reduce((acc: number, m: any) => acc + (Array.isArray(m.lessons) ? m.lessons.length : (m.lessons_count || 0)), 0) : 0)
                    return (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                          <BookOpen size={11} />
                          {modulesCount} {modulesCount === 1 ? 'Module' : 'Modules'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                          <Play size={10} fill="currentColor" />
                          {lessonsCount} {lessonsCount === 1 ? 'Lesson' : 'Lessons'}
                        </span>
                      </div>
                    )
                  })()}
                  <button
                    onClick={(e) => toggleBookmark(c.id, e)}
                    className={`p-2 rounded-xl border backdrop-blur-md transition-all ${
                      bookmarked[c.id]
                        ? 'bg-[#594fe6] border-[#594fe6] text-white'
                        : 'bg-white dark:bg-[#12132e] border-slate-200 dark:border-[#2b2d5c] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Bookmark size={14} fill={bookmarked[c.id] ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/courses/${c.id}`)
                    }}
                    className="bg-slate-100 dark:bg-[#12132e] border border-slate-200 dark:border-[#262852] hover:bg-[#594fe6] hover:border-[#594fe6] hover:text-white text-slate-900 dark:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    Explore Syllabus <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 5. Pagination Footer Row ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pt-2 sm:pt-4 border-t border-slate-200 dark:border-[#1b1d3d] text-xs text-slate-600 dark:text-[#8e91b5]">
          
          {/* Mobile Top Row / Desktop Left Side */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="font-medium">
              <span className="hidden sm:inline">Showing </span>
              <strong className="text-slate-900 dark:text-white font-semibold">{totalItems > 0 ? (page - 1) * perPage + 1 : 0}</strong> 
              <span className="hidden sm:inline"> to </span><span className="sm:hidden">-</span> 
              <strong className="text-slate-900 dark:text-white font-semibold">{Math.min(page * perPage, totalItems)}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">{totalItems}</strong> 
              <span className="hidden sm:inline"> courses</span>
            </div>

            {/* Mobile Per Page Select */}
            <div className="relative sm:hidden">
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-[11px] font-medium rounded-full px-3 py-1.5 pr-7 focus:outline-none cursor-pointer shadow-sm"
              >
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 dark:text-[#8e91b5] pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
            {/* Desktop Per Page Select */}
            <div className="relative hidden sm:block">
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-full px-3.5 py-2 pr-8 focus:outline-none cursor-pointer shadow-sm transition-colors hover:border-indigo-500/50"
              >
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 dark:text-[#8e91b5] pointer-events-none" />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-[#1f2147] bg-white dark:bg-[#0c0d24] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-[#161836]"
              >
                <ArrowLeft size={12} className="sm:w-[14px] sm:h-[14px]" />
              </button>
              {[1, 2, 3, 4].map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    page === pNum
                      ? 'bg-[#594fe6] text-white shadow-md border border-[#594fe6]'
                      : 'border border-slate-200 dark:border-[#1f2147] bg-white dark:bg-[#0c0d24] text-slate-600 dark:text-[#8e91b5] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#161836]'
                  }`}
                >
                  {pNum}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(4, p + 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-[#1f2147] bg-white dark:bg-[#0c0d24] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-[#161836]"
              >
                <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Modal */}
        <Modal
          open={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filter Courses"
          size="sm"
        >
          <div className="flex flex-col gap-3 p-1 text-sm text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Subject Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-900 dark:text-white text-[11px] truncate block">Subject</label>
                <div className="relative">
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm truncate"
                  >
                    <option value="all">All Subjects</option>
                    <option value="physics">Physics</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="biology">Biology</option>
                    <option value="chemistry">Chemistry</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Level Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-900 dark:text-white text-[11px] truncate block">Level</label>
                <div className="relative">
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm truncate"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Exam Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-900 dark:text-white text-[11px] truncate block">Exam / Board</label>
                <div className="relative">
                  <select
                    value={examFilter}
                    onChange={(e) => setExamFilter(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm truncate"
                  >
                    <option value="all">All Exams</option>
                    <option value="jee">JEE Main</option>
                    <option value="neet">NEET</option>
                    <option value="upsc">UPSC</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Duration Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-900 dark:text-white text-[11px] truncate block">Duration</label>
                <div className="relative">
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm truncate"
                  >
                    <option value="all">All Durations</option>
                    <option value="short">1 - 4 Weeks</option>
                    <option value="medium">1 - 3 Months</option>
                    <option value="long">6+ Months</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-900 dark:text-white text-[11px]">Sort By</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-[#0c0d24] border border-slate-200 dark:border-[#1f2147] text-slate-800 dark:text-[#c4c6e5] text-xs font-medium rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
                >
                  <option value="popular">Popular</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Rating</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 pt-1.5">
              <button
                onClick={clearAllFilters}
                className="w-1/3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1f2147] rounded-xl transition-all text-slate-500 dark:text-slate-400 text-center"
              >
                Reset
              </button>
              <Button onClick={() => setIsFilterModalOpen(false)} className="w-2/3 rounded-xl py-2 text-xs">
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
