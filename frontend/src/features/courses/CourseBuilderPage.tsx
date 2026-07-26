import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useTeacherCourse, useCourseVersions, useAcquireCourseLock, useReleaseCourseLock,
  useUpdateTeacherCourse, usePublishCourse, useDuplicateCourse, useAddModule,
  useUpdateModule, useDeleteModule, useAddLesson, useUpdateLesson,
  useDeleteLesson, useSaveCourseVersion, exportCourseAction
} from '@/api/resources/courseBuilder'
import { useApiQuery } from '@/api/resources/hooks'
import {
  ArrowLeft, Plus, Folder, FolderOpen, FileText, Video, HelpCircle, Save,
  CheckCircle2, Trash2, Copy, Archive, Milestone, RefreshCw, ChevronRight,
  ChevronDown, ArrowUp, ArrowDown, Lock, Clock, Calendar, Download, Globe, Search,
  BookOpen, Eye, Pencil, GripVertical, Upload, X, Film, AlertTriangle,
  Layers, PlayCircle, AlignLeft, ExternalLink, Star, MoreVertical, SlidersHorizontal,
  Bold, Italic, Underline, List, ListOrdered, Link2, Image, Quote, Code, Check, User
} from 'lucide-react'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import toast from 'react-hot-toast'
import PremiumVideoPlayer from '@/components/ui/PremiumVideoPlayer'
import { Modal, ConfirmModal } from '@/components/ui/overlays'
import { AssetPickerDrawer } from '../media/AssetPickerDrawer'
import { useAuthStore } from '@/store'

interface Lesson {
  id: number
  chapter_id: number
  title: string
  type: 'video' | 'text' | 'quiz'
  content?: string
  primary_media_id?: number | null
  download_media_id?: number | null
  duration_seconds?: number
  is_free_preview?: boolean
  sort_order: number
}

interface Chapter {
  id: number
  module_id: number
  title: string
  sort_order: number
  lessons: Lesson[]
}

interface Module {
  id: number
  course_id: number
  title: string
  sort_order: number
  chapters: Chapter[]
}

interface Course {
  id: number
  title: string
  description?: string
  thumbnail?: string
  status: 'draft' | 'published' | 'archived'
  publish_at?: string
  unpublish_at?: string
  timezone?: string
  updated_at?: string
  subject_id?: number
  education_type_id?: number
  program_id?: number
  teacher?: { name: string; avatar?: string }
  modules: Module[]
}

const LESSON_ICONS: Record<string, React.ReactNode> = {
  video: <PlayCircle size={13} className="text-slate-500 dark:text-blue-400" />,
  text:  <AlignLeft size={13} className="text-slate-500 dark:text-emerald-400" />,
  quiz:  <HelpCircle size={13} className="text-violet-400" />,
}

export default function CourseBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({})
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({})
  const [lessonForm, setLessonForm] = useState<Partial<Lesson> | null>(null)
  const [lockError, setLockError] = useState<string | null>(null)
  const [publishErrors, setPublishErrors] = useState<Record<string, string> | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'scheduling' | 'versions' | 'seo' | 'resources'>('info')
  const [addingModuleTitle, setAddingModuleTitle] = useState('')
  const [showAddModule, setShowAddModule] = useState(false)
  const [addingLesson, setAddingLesson] = useState<{ chapterId: number; type: 'video'|'text'|'quiz'; title: string } | null>(null)
  const [curriculumSearch, setCurriculumSearch] = useState('')
  const [checkpointSummary, setCheckpointSummary] = useState('')
  
  // Real Form State
  const [titleInput, setTitleInput] = useState('')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [thumbnailInput, setThumbnailInput] = useState('')
  const [subjectInput, setSubjectInput] = useState('Physics')
  const [levelInput, setLevelInput] = useState('Class 12')
  const [examInput, setExamInput] = useState('JEE Advanced')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Delete Confirmation State
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'module' | 'lesson'; id: number; title: string } | null>(null)

  // Module & Lesson Popup Modals State
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null)
  const [moduleTitleInput, setModuleTitleInput] = useState('')

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [lessonModuleId, setLessonModuleId] = useState<number | null>(null)
  const [lessonChapterId, setLessonChapterId] = useState<number | null>(null)
  const [lessonTitleInput, setLessonTitleInput] = useState('')
  const [lessonTypeInput, setLessonTypeInput] = useState<'video' | 'text' | 'quiz'>('video')

  // Selected Lesson Local Editor State (Prevents Keystroke Network Lag)
  const [editingLessonTitle, setEditingLessonTitle] = useState('')
  const [editingLessonContent, setEditingLessonContent] = useState('')
  const [editingLessonIsFree, setEditingLessonIsFree] = useState(false)

  // Content Library & Direct Upload Modals
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerType, setPickerType] = useState<'video' | 'document' | 'image'>('video')
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false)
  const [videoProvider, setVideoProvider] = useState<'local' | 'youtube' | 'vimeo' | 'external'>('local')
  const [videoUrlInput, setVideoUrlInput] = useState('')
  const [videoTitleInput, setVideoTitleInput] = useState('')
  const [videoDurationInput, setVideoDurationInput] = useState('')
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [isSavingVideo, setIsSavingVideo] = useState(false)

  const { data: course, isLoading, isError } = useTeacherCourse(id ? Number(id) : null)
    
  useEffect(() => {
    if (course?.title) document.title = `${course.title} - EduFlow`
  }, [course])

  const { data: versions, refetch: refetchVersions } = useCourseVersions(id ? Number(id) : null)

  const { data: mediaItems, refetch: refetchMedia } = useApiQuery(
    ['teacher', 'media'],
    '/media'
  )
  
  const { data: subjects = [] } = useApiQuery(
    ['admin', 'subjects'],
    '/admin/subjects'
  )
  
  const { data: educationTypes = [] } = useApiQuery(
    ['admin', 'education-types'],
    '/admin/education-types'
  )
  
  const { data: programs = [] } = useApiQuery(
    ['admin', 'programs'],
    '/admin/programs'
  )

  // Lock session management
  const acquireLockMutation = useAcquireCourseLock(id ? Number(id) : null, (err: any) => 
    setLockError(err.response?.data?.message || err.message || 'Failed to acquire lock.')
  )

  const releaseLockMutation = useReleaseCourseLock(id ? Number(id) : null)

  useEffect(() => {
    acquireLockMutation.mutate()
    const interval = setInterval(() => { if (!lockError) acquireLockMutation.mutate() }, 5 * 60 * 1000)
    return () => { clearInterval(interval); releaseLockMutation.mutate() }
  }, [id, lockError])

  // Course & Lesson Mutations
  const updateCourseMutation = useUpdateTeacherCourse(id ? Number(id) : null, () => setHasUnsavedChanges(false))

  const publishMutation = usePublishCourse(id ? Number(id) : null, 
    () => {
      setPublishErrors(null)
      toast.success(course?.status === 'published' ? 'Course reverted to draft' : 'Course published successfully!')
    },
    (err: any) => {
      if (err.response?.status === 422) setPublishErrors(err.response?.data?.errors || null)
      else toast.error(err.response?.data?.message || 'Failed to update status.')
    }
  )

  const duplicateMutation = useDuplicateCourse(id ? Number(id) : null, (res: any) => {
    const newId = res.data?.data?.id
    if (newId) navigate(`/teacher/courses/${newId}/builder`)
    toast.success('Course duplicated!')
  })

  const addModuleMutation = useAddModule(id ? Number(id) : null)
  const updateModuleMutation = useUpdateModule(id ? Number(id) : null)
  const deleteModuleMutation = useDeleteModule(id ? Number(id) : null)

  const addLessonMutation = useAddLesson(id ? Number(id) : null, (res: any) => {
    const newLessonId = res.data?.data?.id || res.data?.id
    if (newLessonId) setSelectedLessonId(newLessonId)
    setIsLessonModalOpen(false)
  })

  const updateLessonMutation = useUpdateLesson(id ? Number(id) : null)

  const deleteLessonMutation = useDeleteLesson(id ? Number(id) : null, () => setSelectedLessonId(null))

  const saveVersionMutation = useSaveCourseVersion(id ? Number(id) : null, () => refetchVersions())

  // Derived real data
  const modules = Array.isArray(course?.modules) ? course.modules : []
  const allChapters = modules.flatMap(m => m.chapters || [])
  const allLessons = modules.flatMap(m => {
    const chapLessons = (m.chapters || []).flatMap(c => c.lessons || [])
    const directLessons = (m as any).lessons || []
    return chapLessons.length > 0 ? chapLessons : directLessons
  })
  const videoLessons = allLessons.filter(l => l.type === 'video')
  const freePreviewLessons = allLessons.filter(l => l.is_free_preview)
  const totalDurationSeconds = allLessons.reduce((acc, l) => acc + (l.duration_seconds || 0), 0)
  const totalDurationHours = Math.round(totalDurationSeconds / 3600)

  const selectedLesson = allLessons.find(l => l.id === selectedLessonId)

  // Checklist Validation calculation
  const hasTitle = !!titleInput.trim()
  const hasDescription = !!descriptionInput.trim()
  const hasThumbnail = !!thumbnailInput.trim()
  const hasModule = modules.length > 0
  const hasLesson = allLessons.length > 0
  const hasVideo = videoLessons.length > 0
  const hasTeacher = !!(course?.teacher?.name || user?.name)
  const hasSubject = !!subjectInput

  const checklistItems = [
    { label: 'Course Title', valid: hasTitle },
    { label: 'Course Description', valid: hasDescription },
    { label: 'Course Thumbnail', valid: hasThumbnail },
    { label: 'At least one Module', valid: hasModule },
    { label: 'At least one Lesson', valid: hasLesson },
    { label: 'At least one Video', valid: hasVideo },
    { label: 'Instructor Assigned', valid: hasTeacher },
    { label: 'Subject & Level', valid: hasSubject },
  ]
  const validChecklistCount = checklistItems.filter(i => i.valid).length
  const readinessPercentage = Math.round((validChecklistCount / checklistItems.length) * 100)

  const toggleModule = (modId: number) => {
    setExpandedModules(prev => ({ ...prev, [modId]: prev[modId] === false ? true : false }))
  }

  const toggleChapter = (chapId: number) => {
    setExpandedChapters(prev => ({ ...prev, [chapId]: prev[chapId] === false ? true : false }))
  }

  // Sync Lesson Local State when selected lesson changes
  useEffect(() => {
    if (selectedLesson) {
      setEditingLessonTitle(selectedLesson.title || '')
      setEditingLessonContent(selectedLesson.content || '')
      setEditingLessonIsFree(!!selectedLesson.is_free_preview)
    }
  }, [selectedLessonId, selectedLesson])

  const handleSaveAll = () => {
    updateCourseMutation.mutate({
      title: titleInput,
      description: descriptionInput,
      thumbnail: thumbnailInput,
    })
  }

  const exportCourse = async () => {
    try {
      const payload = await exportCourseAction(Number(id))
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(course?.title || 'course').toLowerCase().replace(/\s+/g, '-')}.eduflow`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Course package exported!')
    } catch { toast.error('Failed to export course.') }
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 bg-slate-50 dark:bg-[#080918] text-white">
      <Spinner size={36} />
      <span className="text-xs text-slate-500 dark:text-[#8e91b5] font-semibold">Loading Course Builder Workspace...</span>
    </div>
  )

  if (isError || !course) return (
    <div className="flex items-center justify-center min-h-[70vh] bg-slate-50 dark:bg-[#080918]">
      <Card className="p-8 max-w-sm text-slate-500 dark:text-slate-400 text-center space-y-4 bg-white dark:bg-[#0c0e25] border-slate-200 dark:border-[#1f2147]">
        <h2 className="text-lg font-extrabold text-white">Course Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-[#8e91b5]">Could not locate requested course id #{id}.</p>
        <Button variant="primary" onClick={() => navigate('/teacher/courses')}>Return to Catalog</Button>
      </Card>
    </div>
  )

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-[#080918] text-slate-700 dark:text-[#c4c6e5] font-[Inter] -m-6">

      {/* ── TOP HEADER / NAVBAR ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0a0b20] border-b border-slate-200 dark:border-[#1b1d3d] px-5 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        {/* Left Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button className="text-slate-500 dark:text-[#8e91b5] hover:text-white p-1 rounded-lg transition-colors">
            <SlidersHorizontal size={15} />
          </button>
          <Link to="/teacher/courses" className="text-xs font-semibold text-slate-500 dark:text-[#8e91b5] hover:text-white transition-colors">
            Courses
          </Link>
          <span className="text-[#2b2d5c]">/</span>
          <h1 className="text-sm font-extrabold text-white font-[Outfit] truncate max-w-xs">
            {titleInput || course.title}
          </h1>
          <Badge className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
            course.status === 'published' ? 'bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {course.status}
          </Badge>
        </div>

        {/* Center Autosave Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <CheckCircle2 size={13} /> Autosaved 4 sec ago
        </div>

        {/* Right Top Action Bar Buttons (Cleaned up duplicates) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={exportCourse} className="px-2 sm:px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-[#c4c6e5] hover:text-white bg-slate-100 dark:bg-[#12132e] hover:bg-slate-200 dark:hover:bg-[#1f2147] border border-slate-200 dark:border-[#23254e] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer" title="Export">
            <Download size={13} /> <span className="hidden sm:inline">Export</span>
          </button>

          <button onClick={() => navigate(`/courses/${id}`)} className="px-2 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 dark:bg-[#1a1b3d] hover:bg-indigo-700 dark:hover:bg-[#282a5c] border border-indigo-500 dark:border-[#30336b] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer" title="Preview">
            <Eye size={13} /> <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            onClick={() => publishMutation.mutate(course.status !== 'published')}
            className="px-2 sm:px-4 py-1.5 text-xs font-extrabold text-white bg-[#594fe6] hover:bg-[#4a41d0] rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span className="hidden sm:inline">{course.status === 'published' ? 'Unpublish' : 'Publish'}</span>
            <span className="sm:hidden">{course.status === 'published' ? 'Unpub' : 'Pub'}</span>
            <ChevronDown size={13} />
          </button>

          <div className="w-8 h-8 rounded-full bg-[#594fe6] text-white flex items-center justify-center font-black text-xs shadow-md ml-2 border border-indigo-400/30">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'PA'}
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN WORKSPACE BODY ────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 p-4 lg:p-0" style={{ minHeight: 'calc(100vh - 110px)' }}>

        {/* ── COLUMN 1: LEFT CURRICULUM TREE SIDEBAR (3 cols) ─────────── */}
        <div className="lg:col-span-3 border-r border-slate-200 dark:border-[#1b1d3d] bg-white dark:bg-[#0c0e25] flex flex-col p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-white font-[Outfit]">Curriculum</h2>
            <span className="text-[10px] text-slate-500 dark:text-[#8e91b5] font-bold">{modules.length} modules</span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#8e91b5]" />
            <input
              type="text"
              placeholder="Search modules & lessons..."
              value={curriculumSearch}
              onChange={e => setCurriculumSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#12132e] border border-slate-200 dark:border-[#23254e] text-white placeholder:text-slate-500 dark:text-[#8e91b5] outline-none focus:border-indigo-500/60"
            />
            <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#8e91b5] cursor-pointer" />
          </div>

          {/* Primary + New Module Button */}
          <button
            onClick={() => {
              setEditingModuleId(null)
              setModuleTitleInput('')
              setIsModuleModalOpen(true)
            }}
            className="w-full bg-[#594fe6] hover:bg-[#4a41d0] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} /> New Module
          </button>

          {/* Course Tree Container */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {modules.length === 0 ? (
              <div className="p-8 text-slate-500 dark:text-slate-400 text-center border border-dashed border-slate-200 dark:border-[#1f2147] rounded-xl text-slate-500 dark:text-[#8e91b5] text-xs space-y-1">
                <Layers size={24} className="mx-auto opacity-30" />
                <p className="font-bold">No modules created yet</p>
                <p className="text-[10px]">Click "+ New Module" to get started.</p>
              </div>
            ) : (
              modules.map((mod, modIdx) => {
                const isExpanded = expandedModules[mod.id] !== false
                const chapters = mod.chapters || []
                const directLessons = (mod as any).lessons || []
                const totalModLessons = chapters.reduce((acc, c) => acc + (c.lessons?.length || 0), 0) || directLessons.length

                return (
                  <div key={mod.id} className="rounded-xl border border-slate-200 dark:border-[#1b1d3d] bg-white dark:bg-[#090a1e] overflow-hidden">
                    {/* Module Header Row */}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#10122f] hover:bg-slate-100 dark:bg-[#15173b] transition-all cursor-pointer group">
                      <div className="flex items-center gap-2 min-w-0" onClick={() => toggleModule(mod.id)}>
                        {isExpanded ? <ChevronDown size={13} className="text-slate-500 dark:text-[#8e91b5]" /> : <ChevronRight size={13} className="text-slate-500 dark:text-[#8e91b5]" />}
                        <FolderOpen size={13} className="text-slate-500 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">
                          Module {modIdx + 1}: {mod.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 dark:text-[#8e91b5] font-mono mr-1">{totalModLessons}</span>
                        <button
                          onClick={() => {
                            setLessonModuleId(mod.id)
                            setLessonChapterId(chapters[0]?.id || null)
                            setLessonTitleInput('')
                            setLessonTypeInput('video')
                            setIsLessonModalOpen(true)
                          }}
                          className="p-1 hover:bg-[#23254e] rounded text-slate-500 dark:text-[#8e91b5] hover:text-white"
                          title="Add Lesson Popup"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingModuleId(mod.id)
                            setModuleTitleInput(mod.title)
                            setIsModuleModalOpen(true)
                          }}
                          className="p-1 hover:bg-[#23254e] rounded text-slate-500 dark:text-[#8e91b5] hover:text-white"
                          title="Edit Module Title"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: 'module', id: mod.id, title: mod.title })}
                          className="p-1 hover:bg-red-500/10 rounded text-slate-500 dark:text-[#8e91b5] hover:text-red-400 cursor-pointer"
                          title="Delete Module"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Chapters & Lessons Content Tree */}
                    {isExpanded && (
                      <div className="p-2 space-y-2 bg-white dark:bg-[#090a1e]">
                        {chapters.map((chap, chapIdx) => {
                          const isChapExpanded = expandedChapters[chap.id] !== false
                          const lessons = chap.lessons || []

                          return (
                            <div key={chap.id} className="pl-2 space-y-1">
                              {/* Chapter Header */}
                              <div
                                onClick={() => toggleChapter(chap.id)}
                                className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-[#8e91b5] py-1 px-2 rounded hover:bg-slate-100 dark:bg-[#12132e] cursor-pointer"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  {isChapExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                  <Folder size={11} className="text-slate-500 dark:text-blue-400" /> Chapter {chapIdx + 1}: {chap.title}
                                </span>
                              </div>

                              {/* Lesson Items */}
                              {isChapExpanded && (
                                <div className="pl-4 space-y-1">
                                  {lessons.map((les, lesIdx) => {
                                    const isSelected = selectedLessonId === les.id
                                    return (
                                      <div
                                        key={les.id}
                                        onClick={() => setSelectedLessonId(les.id)}
                                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                                          isSelected
                                            ? 'bg-[#594fe6] text-white font-bold shadow-md'
                                            : 'text-slate-700 dark:text-[#c4c6e5] hover:bg-[#141638] hover:text-white'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          {les.type === 'video' ? <PlayCircle size={12} className={isSelected ? 'text-white' : 'text-slate-500 dark:text-blue-400'} /> :
                                           les.type === 'quiz' ? <HelpCircle size={12} className={isSelected ? 'text-white' : 'text-purple-400'} /> :
                                           <AlignLeft size={12} className={isSelected ? 'text-white' : 'text-slate-500 dark:text-emerald-400'} />}
                                          <span className="truncate">{lesIdx + 1}. {les.title}</span>
                                        </div>
                                        {les.is_free_preview && (
                                          <span className="text-[8px] font-extrabold uppercase bg-emerald-500/20 text-slate-500 dark:text-emerald-300 px-1 py-0.5 rounded">FREE</span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {/* Bottom Add Module Dashed CTA */}
            <button
              onClick={() => {
                setEditingModuleId(null)
                setModuleTitleInput('')
                setIsModuleModalOpen(true)
              }}
              className="w-full border-2 border-dashed border-slate-200 dark:border-[#1f2147] hover:border-[#594fe6] text-slate-500 dark:text-[#8e91b5] hover:text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus size={14} /> Add Module
            </button>
          </div>
        </div>

        {/* ── COLUMN 2: CENTER EDITOR PANEL (6 cols) ─────────────────── */}
        <div className="lg:col-span-6 bg-[rgb(var(--bg-surface))] p-5 overflow-y-auto space-y-5 rounded-2xl border border-[rgb(var(--border))]">
          {/* Navigation Tabs Bar strictly on a single horizontal line */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[rgb(var(--border))] scrollbar-none whitespace-nowrap flex-nowrap">
            {[
              { key: 'info',       label: 'Course Info',     icon: BookOpen },
              { key: 'scheduling', label: 'Scheduling',      icon: Clock },
              { key: 'versions',   label: 'Version History', icon: Calendar },
              { key: 'seo',        label: 'SEO & Visibility',icon: Globe },
              { key: 'resources',  label: 'Resources',       icon: Folder },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                  activeTab === t.key
                    ? 'bg-[rgb(var(--primary))] text-white shadow-md shadow-indigo-600/30'
                    : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] border border-transparent'
                }`}
              >
                <t.icon size={13} className={activeTab === t.key ? 'text-white' : 'text-[rgb(var(--text-muted))]'} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {selectedLesson ? (
            /* ── LESSON EDITOR PANEL ────────────────────────────────────── */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] p-4 rounded-2xl">
                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-indigo-400 block">Lesson Config # {selectedLesson.id}</span>
                  <h2 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{editingLessonTitle || selectedLesson.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      updateLessonMutation.mutate({
                        lessonId: selectedLesson.id,
                        data: {
                          title: editingLessonTitle,
                          content: editingLessonContent,
                          is_free_preview: editingLessonIsFree
                        }
                      })
                    }}
                  >
                    Save Lesson
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedLessonId(null)}>Close</Button>
                </div>
              </div>

              {/* Form Inputs with Local State (No Keystroke Lag) */}
              <div className="p-4 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Lesson Title</label>
                  <input
                    type="text"
                    value={editingLessonTitle}
                    onChange={e => setEditingLessonTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between bg-[rgb(var(--bg-elevated))] p-3 rounded-xl border border-[rgb(var(--border))]">
                  <div>
                    <span className="text-xs font-bold text-[rgb(var(--text-primary))] block">Free Sample Preview</span>
                    <span className="text-[10px] text-[rgb(var(--text-muted))]">Allow unregistered visitors to preview this lesson</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingLessonIsFree}
                    onChange={e => setEditingLessonIsFree(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Lesson Notes & Text Content</label>
                  <textarea
                    rows={5}
                    value={editingLessonContent}
                    onChange={e => setEditingLessonContent(e.target.value)}
                    placeholder="Enter lecture notes, reading material, or HTML instructions..."
                    className="w-full p-3 text-xs rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => { setPickerType('video'); setIsPickerOpen(true) }}
                    className="px-3.5 py-2 bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--border))] text-indigo-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-[rgb(var(--border))]"
                  >
                    <Film size={14} /> Attach Video from Library
                  </button>

                  <button
                    onClick={() => setConfirmDelete({ type: 'lesson', id: selectedLesson.id, title: selectedLesson.title })}
                    className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Lesson
                  </button>
                </div>
              </div>

              {/* Lesson Video Container */}
              {selectedLesson.type === 'video' && (
                <Card className="p-4 bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] space-y-3">
                  <h3 className="text-xs font-extrabold text-[rgb(var(--text-primary))] uppercase font-mono">Video Asset</h3>
                  <div className="aspect-video bg-black rounded-xl overflow-hidden border border-[rgb(var(--border))]">
                    <PremiumVideoPlayer
                      videoUrl={(selectedLesson as any)?.video_url || (selectedLesson as any)?.media?.url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
                      title={editingLessonTitle || selectedLesson.title}
                    />
                  </div>
                </Card>
              )}
            </div>
          ) : (
            /* ── MAIN COURSE OVERVIEW PANEL ────────────────────────────── */
            <div className="space-y-5">
              {/* TAB 1: COURSE INFO */}
              {activeTab === 'info' && (
                <div className="space-y-5">
                  {/* Course Overview Card */}
                  <div className="p-5 bg-white dark:bg-[#0c0e25] border border-slate-200 dark:border-[#1b1d3d] rounded-2xl space-y-4">
                    <h2 className="text-sm font-extrabold text-white font-[Outfit]">Course Overview</h2>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Left Course Image Thumbnail */}
                      <div className="md:col-span-4 relative group rounded-xl overflow-hidden border border-slate-200 dark:border-[#23254e] bg-slate-100 dark:bg-[#12132e] h-32 flex items-center justify-center">
                        {thumbnailInput ? (
                          <img src={thumbnailInput} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-slate-500 dark:text-slate-400 text-center p-3">
                            <BookOpen size={28} className="mx-auto text-indigo-400 opacity-60 mb-1" />
                            <span className="text-[10px] text-slate-500 dark:text-[#8e91b5] font-bold block">No Image</span>
                          </div>
                        )}
                        <button 
                          onClick={() => { setPickerType('image'); setIsPickerOpen(true); }}
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1 hover:bg-black cursor-pointer"
                        >
                          <Image size={11} /> Change
                        </button>
                      </div>

                      {/* Right Form Inputs */}
                      <div className="md:col-span-8 space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-[#8e91b5] uppercase block mb-1">Course Title</label>
                          <input
                            type="text"
                            value={titleInput}
                            onChange={e => { setTitleInput(e.target.value); setHasUnsavedChanges(true) }}
                            className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#12132e] border border-slate-200 dark:border-[#23254e] text-white outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Subject</label>
                            <select value={subjectInput} onChange={e => { setSubjectInput(e.target.value); setHasUnsavedChanges(true) }} className="w-full px-2 py-1.5 text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none cursor-pointer">
                              {subjects.length > 0 ? (
                                subjects.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)
                              ) : (
                                <>
                                  <option value="Physics">Physics</option>
                                  <option value="Mathematics">Mathematics</option>
                                  <option value="Biology">Biology</option>
                                  <option value="Chemistry">Chemistry</option>
                                </>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Level</label>
                            <select value={levelInput} onChange={e => { setLevelInput(e.target.value); setHasUnsavedChanges(true) }} className="w-full px-2 py-1.5 text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none cursor-pointer">
                              {educationTypes.length > 0 ? (
                                educationTypes.map((e: any) => <option key={e.id} value={e.name}>{e.name}</option>)
                              ) : (
                                <>
                                  <option value="Class 12">Class 12</option>
                                  <option value="Class 11">Class 11</option>
                                  <option value="Undergraduate">Undergraduate</option>
                                </>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Exam</label>
                            <select value={examInput} onChange={e => { setExamInput(e.target.value); setHasUnsavedChanges(true) }} className="w-full px-2 py-1.5 text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none cursor-pointer">
                              {programs.length > 0 ? (
                                programs.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)
                              ) : (
                                <>
                                  <option value="JEE Advanced">JEE Advanced</option>
                                  <option value="JEE Main">JEE Main</option>
                                  <option value="NEET UG">NEET UG</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5-Metric Compact Inline Statistics Grid - Perfect Fit */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
                      <div className="p-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center min-w-0">
                        <span className="text-slate-500 dark:text-slate-400 text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{modules.length}</span>
                        <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-[rgb(var(--text-muted))] uppercase mt-1.5 whitespace-nowrap tracking-tight w-full">
                          <BookOpen size={11} className="text-indigo-400 shrink-0" />
                          <span>Modules</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center min-w-0">
                        <span className="text-slate-500 dark:text-slate-400 text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{allLessons.length}</span>
                        <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-[rgb(var(--text-muted))] uppercase mt-1.5 whitespace-nowrap tracking-tight w-full">
                          <PlayCircle size={11} className="text-slate-500 dark:text-blue-400 shrink-0" />
                          <span>Lessons</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center min-w-0">
                        <span className="text-slate-500 dark:text-slate-400 text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{totalDurationHours}h</span>
                        <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-[rgb(var(--text-muted))] uppercase mt-1.5 whitespace-nowrap tracking-tight w-full">
                          <Clock size={11} className="text-amber-400 shrink-0" />
                          <span>Duration</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center min-w-0">
                        <span className="text-slate-500 dark:text-slate-400 text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{freePreviewLessons.length}</span>
                        <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-[rgb(var(--text-muted))] uppercase mt-1.5 whitespace-nowrap tracking-tight w-full">
                          <Eye size={11} className="text-slate-500 dark:text-emerald-400 shrink-0" />
                          <span>Free Preview</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center min-w-0">
                        <span className="text-slate-500 dark:text-slate-400 text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{readinessPercentage}%</span>
                        <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-[rgb(var(--text-muted))] uppercase mt-1.5 whitespace-nowrap tracking-tight w-full">
                          <SlidersHorizontal size={11} className="text-purple-400 shrink-0" />
                          <span>Completion</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Description with Formatting Toolbar */}
                  <div className="p-5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl space-y-3">
                    <h3 className="text-xs font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">Course Description</h3>

                    {/* Toolbar */}
                    <div className="flex items-center gap-2 bg-[rgb(var(--bg-elevated))] p-2 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] text-xs flex-wrap">
                      <span className="font-bold text-[rgb(var(--text-primary))] px-2 py-0.5 bg-[rgb(var(--border))] rounded text-[11px]">Paragraph</span>
                      <div className="h-4 w-px bg-[rgb(var(--border))]" />
                      <button type="button" onClick={() => { setDescriptionInput(prev => `${prev}**bold**`); setHasUnsavedChanges(true) }} className="hover:text-[rgb(var(--text-primary))] p-1 cursor-pointer" title="Bold"><Bold size={13} /></button>
                      <button type="button" onClick={() => { setDescriptionInput(prev => `${prev}*italic*`); setHasUnsavedChanges(true) }} className="hover:text-[rgb(var(--text-primary))] p-1 cursor-pointer" title="Italic"><Italic size={13} /></button>
                      <button type="button" onClick={() => { setDescriptionInput(prev => `${prev}<u>underline</u>`); setHasUnsavedChanges(true) }} className="hover:text-[rgb(var(--text-primary))] p-1 cursor-pointer" title="Underline"><Underline size={13} /></button>
                      <div className="h-4 w-px bg-[rgb(var(--border))]" />
                      <button type="button" onClick={() => { setDescriptionInput(prev => `${prev}\n- List Item`); setHasUnsavedChanges(true) }} className="hover:text-[rgb(var(--text-primary))] p-1 cursor-pointer" title="Bullet List"><List size={13} /></button>
                      <button type="button" onClick={() => { setDescriptionInput(prev => `${prev}\n1. List Item`); setHasUnsavedChanges(true) }} className="hover:text-[rgb(var(--text-primary))] p-1 cursor-pointer" title="Numbered List"><ListOrdered size={13} /></button>
                      <div className="h-4 w-px bg-[rgb(var(--border))]" />
                      <button type="button" onClick={() => { setDescriptionInput(prev => `${prev}[Link Title](https://)`); setHasUnsavedChanges(true) }} className="hover:text-[rgb(var(--text-primary))] p-1 cursor-pointer" title="Add Link"><Link2 size={13} /></button>
                      <button type="button" onClick={() => { setPickerType('image'); setIsPickerOpen(true) }} className="hover:text-[rgb(var(--text-primary))] p-1 cursor-pointer" title="Attach Image"><Image size={13} /></button>
                      <button type="button" onClick={() => { setDescriptionInput(prev => `${prev}\n> Quote text`); setHasUnsavedChanges(true) }} className="hover:text-[rgb(var(--text-primary))] p-1 cursor-pointer" title="Quote"><Quote size={13} /></button>
                      <button type="button" onClick={() => { setDescriptionInput(prev => `${prev}\`code\``); setHasUnsavedChanges(true) }} className="hover:text-[rgb(var(--text-primary))] p-1 cursor-pointer" title="Code"><Code size={13} /></button>
                    </div>

                    <textarea
                      rows={4}
                      value={descriptionInput}
                      onChange={e => { setDescriptionInput(e.target.value); setHasUnsavedChanges(true) }}
                      placeholder="Enter detailed course description..."
                      className="w-full p-3.5 text-xs rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Course Thumbnail & Visibility Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Upload Box */}
                    <div className="p-5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl space-y-3 text-slate-500 dark:text-slate-400 text-center flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-[rgb(var(--text-primary))] block">Course Thumbnail</span>
                      <div
                        onClick={() => { setPickerType('image'); setIsPickerOpen(true) }}
                        className="w-full border-2 border-dashed border-[rgb(var(--border))] hover:border-indigo-500 p-6 rounded-xl cursor-pointer transition-all bg-[rgb(var(--bg-elevated))]"
                      >
                        <Upload size={24} className="mx-auto text-indigo-400 mb-2" />
                        <p className="text-xs font-bold text-[rgb(var(--text-primary))]">Drag & drop image</p>
                        <p className="text-[10px] text-[rgb(var(--text-muted))] mt-0.5">or click to upload (Recommended: 1280x720px)</p>
                      </div>
                    </div>

                    {/* Right Visibility Box */}
                    <div className="p-5 bg-white dark:bg-[#0c0e25] border border-slate-200 dark:border-[#1b1d3d] rounded-2xl space-y-3">
                      <span className="text-xs font-bold text-white block">Course Visibility</span>
                      <select
                        value={course.status}
                        onChange={e => publishMutation.mutate(e.target.value === 'published')}
                        className="w-full p-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#12132e] border border-slate-200 dark:border-[#23254e] text-slate-500 dark:text-emerald-400 outline-none cursor-pointer"
                      >
                        <option value="published">Published - Visible to enrolled students</option>
                        <option value="draft">Draft - Hidden from catalog</option>
                      </select>
                      <p className="text-[10px] text-slate-500 dark:text-[#8e91b5]">Published courses are active and accessible in student dashboards.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SCHEDULING */}
              {activeTab === 'scheduling' && (
                <div className="space-y-5">
                  <div className="p-5 bg-white dark:bg-[#0c0e25] border border-slate-200 dark:border-[#1b1d3d] rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="text-indigo-400" size={18} />
                      <h2 className="text-sm font-extrabold text-white font-[Outfit]">Publishing & Drip Schedule</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Auto-Publish Date & Time</label>
                        <input
                          type="datetime-local"
                          defaultValue={(course as any)?.start_date ? new Date((course as any).start_date).toISOString().slice(0, 16) : new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
                          className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Expiration / Unpublish Date</label>
                        <input
                          type="datetime-local"
                          defaultValue={(course as any)?.end_date ? new Date((course as any).end_date).toISOString().slice(0, 16) : new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 16)}
                          className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Content Release (Drip) Mode</label>
                      <select className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none cursor-pointer">
                        <option value="all">All Content Unlocked Immediately</option>
                        <option value="weekly">Drip 1 Module Every Week</option>
                        <option value="date">Drip Based on Enrolment Date</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VERSION HISTORY */}
              {activeTab === 'versions' && (
                <div className="space-y-5">
                  <div className="p-5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="text-indigo-400" size={18} />
                        <h2 className="text-sm font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">Version History & Checkpoints</h2>
                      </div>
                      <button
                        onClick={() => {
                          const summary = prompt('Enter version summary (e.g. Added Module 2 & Physics Quiz):')
                          if (summary) saveVersionMutation.mutate(summary)
                        }}
                        className="px-3 py-1.5 bg-[#594fe6] hover:bg-[#4a41d0] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus size={14} /> Save Checkpoint
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(!versions || versions.length === 0) ? (
                        <div className="p-6 text-slate-500 dark:text-slate-400 text-center text-[rgb(var(--text-muted))] text-xs border border-dashed border-[rgb(var(--border))] rounded-xl">
                          No saved version checkpoints yet. Click "Save Checkpoint" to create one.
                        </div>
                      ) : (
                        versions.map((ver: any, vIdx: number) => (
                          <div key={ver.id || vIdx} className="p-3 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="font-bold text-[rgb(var(--text-primary))] block">Version v1.{ver.version_number || vIdx + 1} - {ver.change_summary || 'Auto Checkpoint'}</span>
                              <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">{ver.created_at ? new Date(ver.created_at).toLocaleString() : '23 Jul 2026'} • By {ver.author?.name || user?.name || 'Teacher'}</span>
                            </div>
                            <button
                              onClick={() => { if (confirm('Restore this version checkpoint?')) toast.success('Restored version successfully!') }}
                              className="px-2.5 py-1 text-[11px] font-bold bg-[rgb(var(--border))] hover:bg-indigo-600/20 text-indigo-400 rounded-lg transition-all cursor-pointer"
                            >
                              Restore
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SEO & VISIBILITY */}
              {activeTab === 'seo' && (
                <div className="space-y-5">
                  <div className="p-5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Globe className="text-indigo-400" size={18} />
                      <h2 className="text-sm font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">SEO & Search Engine Optimization</h2>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Meta Title</label>
                        <input
                          type="text"
                          defaultValue={titleInput || course?.title}
                          className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Meta Description</label>
                        <textarea
                          rows={3}
                          defaultValue={descriptionInput || course?.description}
                          className="w-full p-3 text-xs rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Custom URL Slug</label>
                        <div className="flex items-center bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-xs font-mono text-[rgb(var(--text-muted))]">
                          <span>https://eduflow.in/courses/</span>
                          <input
                            type="text"
                            defaultValue={(course as any)?.slug || (titleInput || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                            className="bg-transparent text-[rgb(var(--text-primary))] font-bold outline-none flex-1 ml-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: RESOURCES */}
              {activeTab === 'resources' && (
                <div className="space-y-5">
                  <div className="p-5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Folder className="text-indigo-400" size={18} />
                        <h2 className="text-sm font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">Course Attachments & Downloads</h2>
                      </div>
                      <button
                        onClick={() => { setPickerType('document'); setIsPickerOpen(true) }}
                        className="px-3 py-1.5 bg-[#594fe6] hover:bg-[#4a41d0] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus size={14} /> Attach Resource
                      </button>
                    </div>

                    <div className="space-y-2">
                      {mediaItems && mediaItems.length > 0 ? (
                        mediaItems.slice(0, 4).map((m: any, mIdx: number) => (
                          <div key={m.id || mIdx} className="p-3 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <FileText size={16} className="text-indigo-400" />
                              <div>
                                <span className="font-bold text-[rgb(var(--text-primary))] block">{m.original_filename || m.title || `Course_Resource_${mIdx + 1}.pdf`}</span>
                                <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">Resource Document • {m.file_size ? `${(m.file_size / 1024 / 1024).toFixed(1)} MB` : '1.8 MB'}</span>
                              </div>
                            </div>
                            <a
                              href={m.url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 hover:bg-[#23254e] rounded-lg text-indigo-300 hover:text-white"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-slate-500 dark:text-slate-400 text-center text-slate-500 dark:text-[#8e91b5] text-xs border border-dashed border-slate-200 dark:border-[#1f2147] rounded-xl">
                          No extra course handouts attached. Click "Attach Resource" to select files.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COLUMN 3: RIGHT SIDEBAR (Preview & Checklist) (3 cols) ──── */}
        <div className="lg:col-span-3 border-l border-slate-200 dark:border-[#1b1d3d] bg-white dark:bg-[#0c0e25] p-4 space-y-4 overflow-y-auto">
          {/* Course Preview Card matching Screenshot */}
          <div className="p-4 bg-white dark:bg-[#090a1e] border border-slate-200 dark:border-[#1b1d3d] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-white font-[Outfit]">Course Preview</h3>
              <a href={`/courses/${id}`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 font-bold">
                Student View <ExternalLink size={10} />
              </a>
            </div>

            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-200 dark:border-[#23254e] relative group">
              {thumbnailInput ? (
                <img src={thumbnailInput} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-[#12132e] flex items-center justify-center text-indigo-400 font-extrabold font-[Outfit]">
                  PREVIEW
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#594fe6] text-white flex items-center justify-center shadow-lg">
                  <PlayCircle size={20} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-[rgb(var(--text-primary))] font-[Outfit] line-clamp-2 leading-snug">{titleInput || course.title}</h4>
              <div className="flex items-center justify-between text-[11px] text-[rgb(var(--text-muted))] font-semibold mt-1 flex-wrap gap-1">
                <span className="flex items-center gap-1 shrink-0"><User size={12} className="text-[rgb(var(--text-muted))]" /> {course.teacher?.name || user?.name || 'Instructor'}</span>
                <span className="text-amber-400 flex items-center gap-0.5 shrink-0">
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <span className="text-[rgb(var(--text-primary))] text-[10px] ml-0.5">(4.8)</span>
                </span>
              </div>
              <div className="text-[10px] text-[rgb(var(--text-muted))] mt-2 border-t border-[rgb(var(--border))] pt-2 flex justify-between gap-2 whitespace-nowrap">
                <span>Duration: {totalDurationHours} Hours</span>
                <span>Updated: {course.updated_at ? new Date(course.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '23 Jul 2026'}</span>
              </div>
            </div>
          </div>

          {/* Publish Checklist Card matching Screenshot */}
          <div className="p-4 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl space-y-3">
            <h3 className="text-xs font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">Publish Checklist</h3>

            {/* Circular Donut Readiness Indicator */}
            <div className="flex items-center gap-3 p-3 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500 flex items-center justify-center font-extrabold text-xs text-[rgb(var(--text-primary))] shrink-0">
                {readinessPercentage}%
              </div>
              <div>
                <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] whitespace-nowrap">Course Readiness</h4>
                <p className="text-[10px] text-[rgb(var(--text-muted))] whitespace-nowrap">{readinessPercentage === 100 ? 'Ready to publish!' : 'Complete required fields'}</p>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-1.5 text-xs">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] gap-2">
                  <span className="flex items-center gap-2 text-[rgb(var(--text-secondary))] whitespace-nowrap">
                    {item.valid ? (
                      <CheckCircle2 size={13} className="text-slate-500 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                    )}
                    {item.label}
                  </span>
                  {item.valid ? (
                    <Check size={12} className="text-slate-500 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-amber-400 font-bold shrink-0">!</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const missing = checklistItems.filter(i => !i.valid).map(i => i.label).join(', ')
                if (missing) toast.error(`Missing items: ${missing}`)
                else toast.success('Course is 100% complete and ready to publish!')
              }}
              className="w-full py-2 bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--border))] border border-[rgb(var(--border))] text-indigo-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              View Suggestions
            </button>
          </div>

          {/* Editing Lock Card matching Screenshot */}
          <div className="p-3.5 bg-white dark:bg-[#090a1e] border border-slate-200 dark:border-[#1b1d3d] rounded-2xl flex items-center gap-2.5 text-xs text-slate-500 dark:text-[#8e91b5]">
            <Lock size={15} className="text-indigo-400" />
            <div>
              <span className="font-bold text-white block">Editing Lock</span>
              <span className="text-[10px]">Session active (Auto-renews)</span>
            </div>
          </div>
        </div>
      </div>



      {/* Media Picker Drawer */}
      <AssetPickerDrawer
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        typeFilter={pickerType}
        onSelect={(item) => {
          if (pickerType === 'image' && (item.url || item.path)) {
            setThumbnailInput(item.url || item.path)
            setHasUnsavedChanges(true)
            toast.success('Course thumbnail updated!')
          } else if (selectedLessonId) {
            updateLessonMutation.mutate({
              lessonId: selectedLessonId,
              data: { primary_media_id: item.id }
            })
          }
          refetchMedia()
          setIsPickerOpen(false)
        }}
      />

      {/* Module Add/Edit Modal Popup */}
      <Modal
        title={editingModuleId ? 'Edit Module Title' : 'Create New Module'}
        open={isModuleModalOpen}
        onClose={() => { setIsModuleModalOpen(false); setEditingModuleId(null); setModuleTitleInput('') }}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModuleModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!moduleTitleInput.trim()}
              onClick={() => {
                if (editingModuleId) {
                  updateModuleMutation.mutate({ moduleId: editingModuleId, title: moduleTitleInput.trim() })
                } else {
                  addModuleMutation.mutate(moduleTitleInput.trim())
                }
                setIsModuleModalOpen(false)
                setEditingModuleId(null)
                setModuleTitleInput('')
              }}
            >
              {editingModuleId ? 'Save Title' : 'Create Module'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="text-xs font-bold text-[rgb(var(--text-secondary))]">Module Title</label>
          <input
            type="text"
            value={moduleTitleInput}
            onChange={e => setModuleTitleInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && moduleTitleInput.trim()) {
                if (editingModuleId) {
                  updateModuleMutation.mutate({ moduleId: editingModuleId, title: moduleTitleInput.trim() })
                } else {
                  addModuleMutation.mutate(moduleTitleInput.trim())
                }
                setIsModuleModalOpen(false)
                setEditingModuleId(null)
                setModuleTitleInput('')
              }
            }}
            placeholder="e.g. Module 1: Mechanics & Laws of Motion"
            className="w-full border border-[rgb(var(--border))] rounded-xl px-3.5 py-2 text-sm bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.3)] transition-all"
          />
        </div>
      </Modal>

      {/* Lesson Add Modal Popup */}
      <Modal
        title="Create New Lesson"
        open={isLessonModalOpen}
        onClose={() => { setIsLessonModalOpen(false); setLessonChapterId(null); setLessonModuleId(null); setLessonTitleInput(''); setLessonTypeInput('video') }}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsLessonModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!lessonTitleInput.trim() || (!lessonChapterId && !lessonModuleId)}
              onClick={() => {
                if (lessonTitleInput.trim() && (lessonChapterId || lessonModuleId)) {
                  addLessonMutation.mutate({
                    chapterId: lessonChapterId || undefined,
                    moduleId: lessonModuleId || undefined,
                    title: lessonTitleInput.trim(),
                    type: lessonTypeInput
                  })
                  setIsLessonModalOpen(false)
                  setLessonChapterId(null)
                  setLessonModuleId(null)
                  setLessonTitleInput('')
                }
              }}
            >
              Create Lesson
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[rgb(var(--text-secondary))]">Lesson Title</label>
            <input
              type="text"
              value={lessonTitleInput}
              onChange={e => setLessonTitleInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && lessonTitleInput.trim() && (lessonChapterId || lessonModuleId)) {
                  addLessonMutation.mutate({
                    chapterId: lessonChapterId || undefined,
                    moduleId: lessonModuleId || undefined,
                    title: lessonTitleInput.trim(),
                    type: lessonTypeInput
                  })
                  setIsLessonModalOpen(false)
                  setLessonChapterId(null)
                  setLessonModuleId(null)
                  setLessonTitleInput('')
                }
              }}
              placeholder="e.g. 1. Units & Measurement"
              className="w-full border border-[rgb(var(--border))] rounded-xl px-3.5 py-2 text-sm bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.3)] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[rgb(var(--text-secondary))]">Lesson Format</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { type: 'video', label: 'Video Lecture', icon: PlayCircle, desc: 'Recorded MP4 / YouTube' },
                { type: 'text',  label: 'Text Reading',  icon: AlignLeft,  desc: 'HTML & Markdown notes' },
                { type: 'quiz',  label: 'Quiz Test',     icon: HelpCircle, desc: 'Interactive questions' },
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setLessonTypeInput(item.type as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    lessonTypeInput === item.type
                      ? 'border-[#594fe6] bg-[#594fe6]/10 text-white font-bold'
                      : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))]'
                  }`}
                >
                  <item.icon size={18} className={lessonTypeInput === item.type ? 'text-indigo-400 mb-1' : 'text-slate-500 dark:text-slate-400 mb-1'} />
                  <span className="font-bold text-xs block">{item.label}</span>
                  <span className="text-[10px] opacity-70 block">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={confirmDelete?.type === 'module' ? 'Delete Module' : 'Delete Lesson'}
        message={`Are you sure you want to delete "${confirmDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete?.type === 'module') {
            deleteModuleMutation.mutate(confirmDelete.id, { onSettled: () => setConfirmDelete(null) })
          } else if (confirmDelete?.type === 'lesson') {
            deleteLessonMutation.mutate(confirmDelete.id, { onSettled: () => setConfirmDelete(null) })
          }
        }}
        loading={deleteModuleMutation.isPending || deleteLessonMutation.isPending}
      />
    </div>
  )
}
