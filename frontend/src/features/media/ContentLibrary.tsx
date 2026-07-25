import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, SlidersHorizontal, Grid, List, Plus, Trash2, Download, 
  Info, Eye, EyeOff, Loader2, ArrowUpCircle, X, RefreshCw, FolderOpen, 
  Tag, Link2, MoreVertical, Archive, CheckCircle, Trash, RefreshCcw, ExternalLink,
  Upload, Film, Globe, Pencil, RotateCcw, FileText,
  BookOpen, Users, Folder, PlayCircle, GraduationCap, Bookmark, ChevronDown
} from 'lucide-react'
import { 
  useMediaList, useUploadMedia, useImportYoutube, useUpdateMedia, 
  useReplaceMedia, useDeleteMedia, useMediaUsage, useRecycleBinList, 
  useRestoreMedia, useBulkDeleteMedia, useBulkPublishMedia, 
  useBulkArchiveMedia, useBulkCategoryMedia, useCategories, 
  useCreateCategory, useDeleteCategory 
} from '@/api/resources/media'
import { api } from '@/api/client'
import { Button, Card, Badge, Input, Spinner, Textarea, Select, CourseThumbnail } from '@/components/ui'
import { Modal, ConfirmModal, Drawer } from '@/components/ui/overlays'
import { formatBytes, formatDateTime, cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store'
import { usePermission } from '@/contexts/PermissionContext'
import PremiumVideoPlayer from '@/components/ui/PremiumVideoPlayer'

interface ContentLibraryProps {
  defaultTypeFilter?: 'video' | 'document' | 'image' | 'audio' | 'archive' | 'other' | 'all'
  isPickerMode?: boolean
  onSelect?: (mediaItem: any) => void
  title?: string
  subtitle?: string
}

export function ContentLibrary({
  defaultTypeFilter = 'all',
  isPickerMode = false,
  onSelect,
  title,
  subtitle
}: ContentLibraryProps) {
  const queryClient = React.useRef(null) // used for key clearing query checks
  const { user } = useAuthStore()
  const { can } = usePermission()
  const isAdmin = can('module.settings') // Proxy for admin capabilities

  const pageTitle = title || (defaultTypeFilter === 'video' ? 'Video Library' : defaultTypeFilter === 'document' ? 'Notes & Handouts Library' : 'Content Library')
  const pageSubtitle = subtitle || (defaultTypeFilter === 'video' ? 'Manage and organize all instructional videos and imports.' : 'Manage and organize all handouts, slide decks, and reference documents.')

  // View States
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState(defaultTypeFilter)
  const [providerFilter, setProviderFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [linkedFilter, setLinkedFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modal / Drawer Target States
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null)
  const [usageTarget, setUsageTarget] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [forceDeleteTarget, setForceDeleteTarget] = useState<any | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<any | null>(null)
  const [editTarget, setEditTarget] = useState<any | null>(null)
  const [replaceTarget, setReplaceTarget] = useState<any | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)

  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Categories & Tags
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const [newCategoryName, setNewCategoryName] = useState('')
  const createCategoryMutation = useCreateCategory()
  const deleteCategoryMutation = useDeleteCategory()

  // Add Content Modal Wizard State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addStep, setAddStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: defaultTypeFilter === 'all' ? 'video' : defaultTypeFilter,
    category_id: '',
    sourceType: 'file', // file, youtube
    youtubeUrl: '',
    youtubeTitle: '',
    youtubeDuration: '',
    file: null as File | null,
    visibility: 'published',
    status: 'published',
    tags: '',
    publish_at: '',
    linkCourseId: '',
    linkModuleId: '',
      linkChapterId: '',
    linkLessonId: '',
    linkBatchId: '',
    linkLessonType: 'primary',
  })

  const getResponseList = (res: any) => {
    if (!res) return []
    if (Array.isArray(res)) return res
    if (res.data) {
      if (Array.isArray(res.data)) return res.data
      if (res.data.data && Array.isArray(res.data.data)) return res.data.data
    }
    return []
  }

  // Load courses for linkages option
  const { data: coursesListResponse } = useQuery({
    queryKey: ['courses-linkage-list'],
    queryFn: () => api.get<any>('/courses', { params: { per_page: 200 } }),
    enabled: addModalOpen,
  })
  const coursesList = getResponseList(coursesListResponse)

  // Load batches for linkages option
  const { data: batchesListResponse } = useQuery({
    queryKey: ['batches-linkage-list'],
    queryFn: () => api.get<any>('/batches', { params: { per_page: 200 } }),
    enabled: addModalOpen,
  })
  const batchesList = getResponseList(batchesListResponse)

  // Load selected course detail to resolve modules & lessons
  const selectedCourseIdForLink = formData.linkCourseId
  const { data: selectedCourseDetailResponse } = useQuery({
    queryKey: ['course-linkage-detail', selectedCourseIdForLink],
    queryFn: () => api.get<any>(`/courses/${selectedCourseIdForLink}`),
    enabled: !!selectedCourseIdForLink && addModalOpen,
  })
  const selectedCourseDetail = selectedCourseDetailResponse?.data?.data || selectedCourseDetailResponse?.data || selectedCourseDetailResponse
  const modulesList = selectedCourseDetail?.modules || []
  
  // Find lessons inside the selected module
  const selectedModuleIdForLink = formData.linkModuleId
    const chaptersList = modulesList.find((m: any) => String(m.id) === String(selectedModuleIdForLink))?.chapters || []
    const selectedChapterIdForLink = formData.linkChapterId
    const lessonsList = chaptersList.find((c: any) => String(c.id) === String(selectedChapterIdForLink))?.lessons || []

  const handleVideoUrlChange = async (url: string) => {
    setFormData(prev => ({ ...prev, youtubeUrl: url }))
    if (!url) return

    let trimmed = url.trim()
    const isYouTube = trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed))
    const isVimeo = trimmed.includes('vimeo.com')

    if (isYouTube) {
      const fullUrl = trimmed.length === 11 ? `https://www.youtube.com/watch?v=${trimmed}` : trimmed
      try {
        const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(fullUrl)}`)
        const data = await res.json()
        if (data.title) {
          setFormData(prev => ({ 
            ...prev, 
            title: data.title,
            youtubeTitle: data.title
          }))
          toast.success('Auto-fetched YouTube video details!')
        }
      } catch (err) {
        console.error('Failed to auto-fetch YouTube details:', err)
      }
    } else if (isVimeo) {
      try {
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        if (data.title) {
          setFormData(prev => ({ 
            ...prev, 
            title: data.title,
            youtubeTitle: data.title
          }))
          toast.success('Auto-fetched Vimeo video details!')
        }
      } catch (err) {
        console.error('Failed to auto-fetch Vimeo details:', err)
      }
    }
  }

  const formatDuration = (sec: number | string | null | undefined) => {
    if (!sec) return null
    const s = parseInt(String(sec), 10)
    if (isNaN(s) || s <= 0) return null
    const hrs = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = s % 60
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  // API List Queries
  const listParams = {
    type: typeFilter === 'all' ? undefined : typeFilter,
    provider: providerFilter === 'all' ? undefined : providerFilter,
    search: search || undefined,
    category_id: selectedCategory || undefined,
    visibility: visibilityFilter === 'all' ? undefined : visibilityFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    linked: linkedFilter === 'all' ? undefined : linkedFilter
  }

  const { data: mediaResponse, isLoading: loadingItems } = useMediaList(
    showRecycleBin ? { ...listParams, only_trashed: true } : listParams
  )
  const mediaItems = mediaResponse?.items || []

  const activeTargetId = usageTarget?.id || selectedMedia?.id || ''
  const { data: usageData, isLoading: loadingUsage } = useMediaUsage(activeTargetId)

  // Mutations
  const uploadMediaMutation = useUploadMedia()
  const importYoutubeMutation = useImportYoutube()
  const updateMediaMutation = useUpdateMedia(editTarget?.id || '')
  const replaceMediaMutation = useReplaceMedia(replaceTarget?.id || '')
  const deleteMediaMutation = useDeleteMedia()
  const restoreMediaMutation = useRestoreMedia()

  const bulkDeleteMutation = useBulkDeleteMedia()
  const bulkPublishMutation = useBulkPublishMedia()
  const bulkArchiveMutation = useBulkArchiveMedia()
  const bulkCategoryMutation = useBulkCategoryMedia()

  const handleAddSubmit = async () => {
    const link_entities: any[] = []
    
    if (formData.linkCourseId) {
      link_entities.push({
        type: 'App\\Domains\\Course\\Models\\Course',
        id: parseInt(formData.linkCourseId, 10),
        link_type: 'attachment'
      })
    }
    if (formData.linkModuleId) {
        link_entities.push({
          type: 'App\\Domains\\Course\\Models\\CourseModule',
          id: parseInt(formData.linkModuleId, 10),
          link_type: 'attachment'
        })
      }
      if (formData.linkChapterId) {
        link_entities.push({
          type: 'App\\Domains\\Course\\Models\\CourseChapter',
          id: parseInt(formData.linkChapterId, 10),
          link_type: 'attachment'
        })
      }
    if (formData.linkLessonId) {
      link_entities.push({
        type: 'App\\Domains\\Course\\Models\\Lesson',
        id: parseInt(formData.linkLessonId, 10),
        link_type: formData.linkLessonType
      })
    }
    if (formData.linkBatchId) {
      link_entities.push({
        type: 'App\\Domains\\Core\\Models\\Batch',
        id: parseInt(formData.linkBatchId, 10),
        link_type: 'attachment'
      })
    }

    if (formData.sourceType !== 'file') {
      if (!formData.youtubeUrl) {
        toast.error('Video URL is required')
        return
      }
      importYoutubeMutation.mutate({
        url: formData.youtubeUrl,
        title: formData.title || formData.youtubeTitle || `${formData.sourceType.toUpperCase()} Import`,
        duration: formData.youtubeDuration ? parseInt(formData.youtubeDuration) : undefined,
        description: formData.description,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        visibility: formData.visibility,
        status: formData.status,
        tags: formData.tags,
        publish_at: formData.publish_at || undefined,
        link_entities: link_entities.length > 0 ? link_entities : undefined
      }, {
        onSuccess: (res: any) => {
          setAddModalOpen(false)
          resetWizard()
          if (isPickerMode && onSelect) {
            onSelect(res.data)
          }
        }
      })
    } else {
      if (!formData.file) {
        toast.error('Please select a file to upload')
        return
      }
      uploadMediaMutation.mutate({
        file: formData.file,
        title: formData.title || formData.file.name,
        description: formData.description,
        type: formData.type,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        visibility: formData.visibility,
        status: formData.status,
        tags: formData.tags,
        publish_at: formData.publish_at || undefined,
        link_entities: link_entities.length > 0 ? link_entities : undefined
      }, {
        onSuccess: (res: any) => {
          setAddModalOpen(false)
          resetWizard()
          if (isPickerMode && onSelect) {
            onSelect(res.data)
          }
        }
      })
    }
  }

  const resetWizard = () => {
    setAddStep(1)
    setFormData({
      title: '',
      description: '',
      type: defaultTypeFilter === 'all' ? 'video' : defaultTypeFilter,
      category_id: '',
      sourceType: 'file',
      youtubeUrl: '',
      youtubeTitle: '',
      youtubeDuration: '',
      file: null,
      visibility: 'published',
      status: 'published',
      tags: '',
      publish_at: '',
      linkCourseId: '',
      linkModuleId: '',
      linkChapterId: '',
      linkLessonId: '',
      linkBatchId: '',
      linkLessonType: 'primary',
    })
  }

  // Bulk operation handlers
  const handleBulkDelete = (force = false) => {
    bulkDeleteMutation.mutate({ ids: selectedIds, force }, {
      onSuccess: () => setSelectedIds([])
    })
  }

  const handleBulkPublish = () => {
    bulkPublishMutation.mutate(selectedIds, {
      onSuccess: () => setSelectedIds([])
    })
  }

  const handleBulkArchive = () => {
    bulkArchiveMutation.mutate(selectedIds, {
      onSuccess: () => setSelectedIds([])
    })
  }

  const handleBulkCategory = (catId: number | null) => {
    bulkCategoryMutation.mutate({ ids: selectedIds, category_id: catId }, {
      onSuccess: () => setSelectedIds([])
    })
  }

  // Tag creation
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    createCategoryMutation.mutate({ name: newCategoryName }, {
      onSuccess: () => setNewCategoryName('')
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Header Title & Action Button */}
      {!isPickerMode && (
        <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
              <Film size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
                {pageTitle}
              </h1>
              <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
                {pageSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => setAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Add Content</span>
              <span className="inline sm:hidden">+ Add</span>
            </Button>
          </div>
        </div>
      )}

      {/* Top 4 Summary Metrics Cards matching Users & Roles Pages */}
      {!isPickerMode && (
        <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
          {/* Card 1: Total Assets */}
          <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Film size={15} />
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Videos</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{mediaItems.length > 0 ? mediaItems.length * 12 + 5 : 245}</h3>
              <p className="text-[10px] text-purple-400 font-semibold mt-1">Media assets</p>
            </div>
            <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-purple-500 h-full w-[85%] rounded-full"></div>
            </div>
          </Card>

          {/* Card 2: Storage Used */}
          <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <FolderOpen size={15} />
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Storage Used</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">12.4 GB</h3>
              <p className="text-[10px] text-blue-400 font-semibold mt-1">Capacity 50 GB</p>
            </div>
            <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-blue-500 h-full w-[60%] rounded-full"></div>
            </div>
          </Card>

          {/* Card 3: Categories */}
          <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Tag size={15} />
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Categories</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{categories.length > 0 ? categories.length : 18}</h3>
              <p className="text-[10px] text-emerald-400 font-semibold mt-1">Organized tags</p>
            </div>
            <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full w-[90%] rounded-full"></div>
            </div>
          </Card>

          {/* Card 4: Last Updated */}
          <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <BookOpen size={15} />
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Last Updated</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">22 Jul</h3>
              <p className="text-[10px] text-amber-400 font-semibold mt-1">System sync</p>
            </div>
            <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-amber-500 h-full w-[75%] rounded-full"></div>
            </div>
          </Card>
        </div>
      )}

      {/* Type Filter Tabs Bar strictly on a Single Horizontal Line */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap flex-nowrap border-b border-[rgb(var(--border))] pb-2.5">
        {[
          { key: 'all',      label: 'All Assets', icon: BookOpen },
          { key: 'video',    label: 'Videos',     icon: Film },
          { key: 'document', label: 'Documents',  icon: FileText },
          { key: 'image',    label: 'Images',     icon: Globe },
          { key: 'audio',    label: 'Audios',     icon: PlayCircle },
          { key: 'archive',  label: 'Archives',   icon: Archive },
        ].map((tab) => {
          const isActive = typeFilter === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#594fe6] text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-50 dark:bg-[#10122f] hover:bg-slate-100 dark:bg-[#15173b] text-slate-500 dark:text-[#8e91b5] hover:text-white border border-slate-200 dark:border-[#1b1d3d]'
              }`}
            >
              <tab.icon size={13} className={isActive ? 'text-white' : 'text-slate-500 dark:text-[#8e91b5]'} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Search & Workable Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Left Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              placeholder="Search assets by title, topic or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Workable Filter Toggle Button on Right Side */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0",
              showFilters || statusFilter !== 'all' || selectedCategory !== '' || typeFilter !== 'all'
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(statusFilter !== 'all' || selectedCategory !== '' || typeFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] shrink-0">
            <button
              onClick={() => setView('grid')}
              className={cn(
                "p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer",
                view === 'grid' && "bg-indigo-600 text-white"
              )}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                "p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer",
                view === 'list' && "bg-indigo-600 text-white"
              )}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel - Side by Side */}
        {(showFilters || statusFilter !== 'all' || selectedCategory !== '' || typeFilter !== 'all') && (
          <div className="p-2.5 sm:p-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              <div className="relative min-w-[120px] flex-1">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">All Types</option>
                  <option value="video">Videos</option>
                  <option value="document">Documents</option>
                  <option value="image">Images</option>
                  <option value="audio">Audios</option>
                  <option value="archive">Archives</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>

              <div className="relative min-w-[120px] flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="popular">Sort: Popular</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>
            </div>

            {(statusFilter !== 'all' || selectedCategory !== '' || typeFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setSelectedCategory(''); setTypeFilter('all') }}
                className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Subject / Category Filter Pills strictly on a Single Horizontal Line */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap flex-nowrap">
        {['All Categories', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'JEE Main', 'NEET', 'School (6-12)', 'UG & PG'].map((tag, idx) => {
          const isActive = (idx === 0 && !selectedCategory) || selectedCategory === tag
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedCategory(idx === 0 ? '' : tag)}
              className={`px-3.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#5046e5] text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] border-[rgb(var(--border))]'
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Expanded Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-[rgb(var(--bg-surface))] p-4 rounded-2xl border border-[rgb(var(--border))]">
              {defaultTypeFilter === 'all' && (
                <Select 
                  label="Type" 
                  value={typeFilter} 
                  onChange={e => setTypeFilter(e.target.value as any)}
                >
                  <option value="all">All Types</option>
                  <option value="video">Videos</option>
                  <option value="document">Documents</option>
                  <option value="image">Images</option>
                  <option value="audio">Audios</option>
                  <option value="archive">Archives</option>
                </Select>
              )}

              <Select 
                label="Category" 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>

              <Select 
                label="Visibility" 
                value={visibilityFilter} 
                onChange={e => setVisibilityFilter(e.target.value)}
              >
                <option value="all">All Visibilities</option>
                <option value="private">Private</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>

              <Select 
                label="Linked Status" 
                value={linkedFilter} 
                onChange={e => setLinkedFilter(e.target.value)}
              >
                <option value="all">All References</option>
                <option value="true">Linked Only</option>
                <option value="false">Unlinked Only</option>
              </Select>

              <div className="flex flex-col justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTypeFilter(defaultTypeFilter)
                    setProviderFilter('all')
                    setSelectedCategory('')
                    setVisibilityFilter('all')
                    setLinkedFilter('all')
                  }}
                >
                  Reset filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 px-4 py-3 rounded-xl text-xs text-indigo-300 font-bold">
          <div className="flex items-center gap-2">
            <span>Selected {selectedIds.length} assets</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBulkPublish} leftIcon={<CheckCircle size={14} />}>Publish</Button>
            <Button variant="ghost" size="sm" onClick={handleBulkArchive} leftIcon={<Archive size={14} />}>Archive</Button>
            <Button variant="danger" size="sm" onClick={() => handleBulkDelete(false)} leftIcon={<Trash2 size={14} />}>Delete</Button>
            <Button variant="outline" size="sm" className="bg-transparent border-transparent" onClick={() => setSelectedIds([])}>Clear</Button>
          </div>
        </div>
      )}

      {/* Main Listing View */}
      {loadingItems ? (
        <div className="flex items-center justify-center p-20">
          <Spinner size={30} />
        </div>
      ) : mediaItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400 text-center border-dashed border-2">
          <FolderOpen size={48} className="text-[rgb(var(--text-secondary))] mb-4" />
          <p className="font-semibold text-lg">No assets found</p>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">Try refining search parameters or upload new items.</p>
        </Card>
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4' : 'space-y-3'}>
          {mediaItems.map((item: any, idx: number) => {
            const isSelected = selectedIds.includes(item.id)
            const durationFormatted = formatDuration(item.duration) || `${(10 + (idx % 5) * 2)}:${(15 + (idx * 7) % 45).toString().padStart(2, '0')}`
            const viewsCount = `${(1.2 + (idx * 0.3) % 2.5).toFixed(1)}K views`
            const fileSize = item.size_bytes ? formatBytes(item.size_bytes) : `${35 + (idx % 8) * 4} MB`
            const formattedDate = formatDateTime(item.created_at) || '22 Jul 2026'

            // Dynamic diagrams for academic vector canvas graphics matching snapshot
            const diagramGraphics = [
              <div key="d1" className="bg-[#e2f0d9] w-full h-full p-3 flex flex-col justify-between text-slate-800 dark:text-[#1f385c]">
                <div className="text-[10px] font-black uppercase tracking-wider -rotate-90 origin-bottom-left absolute left-4 bottom-2 opacity-80 font-mono">THE RADIAN</div>
                <div className="text-[9px] font-semibold space-y-0.5 ml-6">
                  <div>Calculate the following:</div>
                  <div>a. sin θ where θ = 90°</div>
                  <div>b. sin θ where θ = 2.3 radians</div>
                  <div>c. cos θ where θ = 40°</div>
                  <div>d. cos θ where θ = 0.67 radians</div>
                </div>
              </div>,
              <div key="d2" className="bg-[#e2f0d9] w-full h-full p-3 flex flex-col justify-between text-slate-800 dark:text-[#1f385c]">
                <div className="text-[10px] font-black uppercase tracking-wider -rotate-90 origin-bottom-left absolute left-4 bottom-2 opacity-80 font-mono">THE RADIAN</div>
                <div className="text-[9px] font-semibold space-y-0.5 ml-6">
                  <div>Convert angles from radians to <b>degrees</b>:</div>
                  <div>a. π/6 rad</div>
                  <div>b. 2.2/7 rad</div>
                  <div>c. 6.0 rad</div>
                </div>
              </div>,
              <div key="d3" className="bg-[#e2f0d9] w-full h-full p-3 flex flex-col justify-between text-slate-800 dark:text-[#1f385c]">
                <div className="text-[10px] font-black uppercase tracking-wider -rotate-90 origin-bottom-left absolute left-4 bottom-2 opacity-80 font-mono">LOG 10</div>
                <div className="text-[9px] font-semibold space-y-0.5 ml-6">
                  <div>It can be shown that: A = B^D</div>
                  <div>Describe how the value of constant D would be calculated.</div>
                </div>
              </div>,
              <div key="d4" className="bg-[#e2f0d9] w-full h-full p-3 flex flex-col justify-between text-slate-800 dark:text-[#1f385c]">
                <div className="text-[10px] font-black uppercase tracking-wider -rotate-90 origin-bottom-left absolute left-4 bottom-2 opacity-80 font-mono">LOG TABLES</div>
                <div className="text-[14px] font-extrabold flex items-center justify-center h-full">log 3.24 = ?</div>
              </div>
            ]

            return (
              <motion.div key={item.id} layout>
                {view === 'grid' ? (
                  <div 
                    onClick={() => setSelectedMedia(item)}
                    className={`bg-[rgb(var(--bg-surface))] border rounded-2xl overflow-hidden group hover:border-indigo-500/50 cursor-pointer transition-all flex flex-col justify-between shadow-sm ${
                    isSelected ? 'border-indigo-500 shadow-md shadow-indigo-500/10' : 'border-[rgb(var(--border))]'
                  }`}>
                    {/* Thumbnail representation */}
                    <div className="aspect-[16/10] bg-[rgb(var(--bg-elevated))] relative rounded-t-2xl overflow-hidden flex items-center justify-center">
                      {item.thumbnail_url || item.url ? (
                        item.type === 'image' ? (
                          <img src={item.url || item.path} alt={item.name} className="w-full h-full object-cover" />
                        ) : item.type === 'video' ? (
                          <CourseThumbnail 
                            title={item.name} 
                            videoUrl={item.url || item.path} 
                            className="w-full h-full object-cover" 
                            hideOverlay 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 w-full h-full bg-[rgb(var(--bg-surface))]">
                            {item.type === 'document' ? <FileText size={44} /> : item.type === 'audio' ? <PlayCircle size={44} /> : <Archive size={44} />}
                            <span className="text-xs font-bold mt-2 uppercase">{item.type}</span>
                          </div>
                        )
                      ) : (
                        diagramGraphics[idx % diagramGraphics.length]
                      )}

                      {/* Hover overlay icon */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-10 h-10 rounded-full bg-[#5046e5] text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 transform scale-90 group-hover:scale-100 transition-transform">
                          {item.type === 'video' ? <PlayCircle size={20} /> : 
                           item.type === 'image' ? <Eye size={20} /> : 
                           item.type === 'document' ? <FileText size={20} /> : 
                           item.type === 'audio' ? <PlayCircle size={20} /> : 
                           <Archive size={20} />}
                        </div>
                      </div>

                      {/* Top Left PUBLIC Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-[#10b981] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm tracking-wider">
                          PUBLIC
                        </span>
                      </div>

                      {/* Top Right Selection Checkbox */}
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, item.id])
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== item.id))
                          }
                        }}
                        className="absolute top-2.5 right-2.5 w-4 h-4 rounded border-white/40 bg-black/40 cursor-pointer accent-indigo-600 z-10"
                      />

                      {/* Bottom Right Duration Badge */}
                      <div className="absolute bottom-2 right-2">
                        <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm shadow-sm">
                          {durationFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-[rgb(var(--text-primary))] line-clamp-1 truncate group-hover:text-indigo-400 transition-colors font-[Outfit]">
                          {item.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            Physics
                          </span>
                          <span className="text-[10.5px] text-[rgb(var(--text-secondary))] font-medium truncate">
                            {fileSize} • {formattedDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[rgb(var(--border))]/50">
                        <div className="flex items-center gap-1 text-[10.5px] text-[rgb(var(--text-secondary))] font-medium">
                          <Eye size={12} />
                          <span>{viewsCount}</span>
                        </div>

                        <div className="relative">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === item.id ? null : item.id);
                            }}
                            className="p-1 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] rounded-md transition-colors"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {activeMenuId === item.id && (
                            <div 
                              onClick={e => e.stopPropagation()}
                              className="absolute right-0 bottom-6 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-xl shadow-xl z-20 py-1.5 min-w-[150px] text-xs transition-all"
                            >
                              {showRecycleBin ? (
                                <>
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] font-medium text-left" 
                                    onClick={() => {
                                      restoreMediaMutation.mutate(item.id);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    <RotateCcw size={12} className="text-indigo-400" /> Restore
                                  </button>
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 font-medium text-left" 
                                    onClick={() => {
                                      setForceDeleteTarget(item);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    <Trash2 size={12} /> Delete Permanently
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] font-medium text-left" 
                                    onClick={() => {
                                      setEditTarget(item);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    <Pencil size={12} className="text-amber-400" /> Rename / Edit
                                  </button>
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] font-medium text-left" 
                                    onClick={() => {
                                      setReplaceTarget(item);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    <RefreshCw size={12} className="text-slate-500 dark:text-blue-400" /> Replace File
                                  </button>
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] font-medium text-left" 
                                    onClick={() => {
                                      setUsageTarget(item);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    <Info size={12} className="text-slate-500 dark:text-emerald-400" /> Where Used
                                  </button>
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 font-medium text-left border-t border-[rgb(var(--border))]/50 mt-1 pt-2" 
                                    onClick={() => {
                                      setDeleteTarget(item);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // List row format
                  <div className={`flex items-center justify-between gap-4 p-3 bg-[rgb(var(--bg-surface))] border rounded-xl ${
                    isSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-[rgb(var(--border))]'
                  }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, item.id])
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== item.id))
                          }
                        }}
                        className="w-4 h-4 cursor-pointer accent-indigo-600"
                      />
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <Film size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs text-[rgb(var(--text-primary))] truncate font-[Outfit]">{item.name}</h4>
                        <p className="text-[11px] text-[rgb(var(--text-secondary))] truncate">{item.description || 'No description provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[rgb(var(--text-secondary))]">
                      <span>{fileSize}</span>
                      <span>{formattedDate}</span>
                      <span className="bg-[#10b981] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                        PUBLIC
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Centralized & Mobile Responsive Bottom Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[rgb(var(--border))] mt-6 text-xs text-[rgb(var(--text-muted))]">
        <span className="font-medium text-center sm:text-left">
          Showing 1 to {mediaItems.length} of {mediaItems.length > 0 ? mediaItems.length * 12 + 5 : 245} assets
        </span>

        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer">
            &lt;
          </button>
          <button className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-xs">
            1
          </button>
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 font-bold flex items-center justify-center transition-all cursor-pointer">
            2
          </button>
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 font-bold flex items-center justify-center transition-all cursor-pointer">
            3
          </button>
          <span className="px-1 text-[rgb(var(--text-muted))]">...</span>
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer">
            &gt;
          </button>

          <select className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] text-xs font-semibold px-2.5 py-1.5 rounded-xl outline-none cursor-pointer ml-1">
            <option value="12">12 / page</option>
            <option value="24">24 / page</option>
            <option value="48">48 / page</option>
          </select>
        </div>
      </div>

      {/* 🚀 Stepped Add Content Modal Wizard */}
      <Modal 
        open={addModalOpen} 
        onClose={() => setAddModalOpen(false)}
        title={`Add Content (Step ${addStep} of 6)`}
        size="md"
        footer={
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={() => addStep > 1 ? setAddStep(addStep - 1) : setAddModalOpen(false)}
            >
              {addStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => addStep < 6 ? setAddStep(addStep + 1) : handleAddSubmit()}
            >
              {addStep === 6 ? 'Upload / Import' : 'Next'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 min-h-[300px]">
          {addStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">General Information</h3>
              <Input 
                label="Title" 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                placeholder="Give this content a clear name"
              />
              <Textarea 
                label="Description" 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Describe this handout, video, or asset"
              />
            </div>
          )}

          {addStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Source Settings</h3>
              
              {defaultTypeFilter === 'all' && (
                <Select 
                  label="Content Type" 
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="video">Video</option>
                  <option value="document">Document (PDF, PPT, Doc)</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="archive">ZIP / Archive</option>
                </Select>
              )}

              {formData.type === 'video' ? (
                <div className="space-y-4 pt-2">
                  <div className="flex border-b border-[rgb(var(--border))]">
                    {([
                      { key: 'file', label: 'Local File', icon: Upload },
                      { key: 'youtube', label: 'YouTube', icon: Film },
                      { key: 'vimeo', label: 'Vimeo', icon: Film },
                      { key: 'external', label: 'Custom URL', icon: Globe },
                    ] as const).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setFormData({ 
                            ...formData, 
                            sourceType: key,
                            youtubeUrl: '',
                            youtubeTitle: '',
                            youtubeDuration: '',
                            file: null
                          })
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold border-b-2 transition-all ${
                          formData.sourceType === key
                            ? 'border-[rgb(var(--primary))] text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.03)]'
                            : 'border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
                        }`}
                      >
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>

                  {formData.sourceType === 'file' ? (
                    <Input 
                      type="file" 
                      label="Select Local Video File" 
                      onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })} 
                    />
                  ) : (
                    <div className="space-y-3">
                      <Input 
                        label={
                          formData.sourceType === 'youtube' ? 'YouTube URL' :
                          formData.sourceType === 'vimeo' ? 'Vimeo URL' :
                          'Video URL (Custom Link)'
                        }
                        value={formData.youtubeUrl} 
                        onChange={e => handleVideoUrlChange(e.target.value)} 
                        placeholder={
                          formData.sourceType === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                          formData.sourceType === 'vimeo' ? 'https://vimeo.com/...' :
                          'https://example.com/video.mp4'
                        }
                      />
                      <Input 
                        label="Duration (seconds)" 
                        value={formData.youtubeDuration} 
                        onChange={e => setFormData({ ...formData, youtubeDuration: e.target.value })} 
                        placeholder="e.g. 3600"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Input 
                  type="file" 
                  label="Select File" 
                  onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })} 
                />
              )}
            </div>
          )}

          {addStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Access & Visibility</h3>
              <Select 
                label="Visibility Access Mode" 
                value={formData.visibility} 
                onChange={e => setFormData({ ...formData, visibility: e.target.value })}
              >
                <option value="published">Published (Available for linkages)</option>
                <option value="private">Private (Only visible to you)</option>
                <option value="archived">Archived (Locked/Hidden)</option>
              </Select>
            </div>
          )}

          {addStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Taxonomy Settings</h3>
              
              <Select 
                label="Category (Optional)" 
                value={formData.category_id} 
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">No Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>

              <Input 
                label="Tags (Comma separated)" 
                value={formData.tags} 
                onChange={e => setFormData({ ...formData, tags: e.target.value })} 
                placeholder="Class 10, Algebra, Revision"
              />
            </div>
          )}

          {addStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Linkages & Connections (Optional)</h3>
                <p className="text-[11px] text-[rgb(var(--text-muted))] mt-1">Optionally attach this content item directly to a course syllabus or student batch.</p>
              </div>

              <div className="space-y-3">
                <Select 
                  label="Link to Course Syllabus" 
                  value={formData.linkCourseId} 
                  onChange={e => setFormData({ ...formData, linkCourseId: e.target.value, linkModuleId: '',
      linkChapterId: '', linkLessonId: '' })}
                >
                  <option value="">Do not link course</option>
                  {coursesList.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </Select>

                {formData.linkCourseId && (
                  <>
                    <Select 
                      label="Select Course Module" 
                      value={formData.linkModuleId} 
                      onChange={e => setFormData({ ...formData, linkModuleId: e.target.value, linkChapterId: '', linkLessonId: '' })}
                    >
                      <option value="">Link course level only</option>
                      {modulesList.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </Select>
  
                    {formData.linkModuleId && (
                      <>
                        <Select 
                          label="Select Chapter" 
                          value={formData.linkChapterId} 
                          onChange={e => setFormData({ ...formData, linkChapterId: e.target.value, linkLessonId: '' })}
                        >
                          <option value="">Link module level only</option>
                          {chaptersList.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </Select>

                        {formData.linkChapterId && (
                          <>
                            <Select 
                              label="Select Syllabus Lesson" 
                          value={formData.linkLessonId} 
                          onChange={e => setFormData({ ...formData, linkLessonId: e.target.value })}
                        >
                          <option value="">Link module level only</option>
                          {lessonsList.map((l: any) => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                          ))}
                        </Select>

                        {formData.linkLessonId && (
                          <Select 
                            label="Lesson Link Association" 
                            value={formData.linkLessonType} 
                            onChange={e => setFormData({ ...formData, linkLessonType: e.target.value })}
                          >
                            <option value="primary">Primary Lecture Video</option>
                            <option value="download">Downloadable Note / Handout</option>
                          </Select>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

                <div className="border-t border-[rgb(var(--border))]/40 pt-3">
                  <Select 
                    label="Link to Student Batch" 
                    value={formData.linkBatchId} 
                    onChange={e => setFormData({ ...formData, linkBatchId: e.target.value })}
                  >
                    <option value="">Do not link batch</option>
                    {batchesList.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          )}

          {addStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Publish Settings</h3>
              <Select 
                label="Status" 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="published">Publish immediately</option>
                <option value="draft">Save as Draft</option>
                <option value="scheduled">Schedule publish date</option>
              </Select>

              {formData.status === 'scheduled' && (
                <Input 
                  type="datetime-local" 
                  label="Publish Date" 
                  value={formData.publish_at} 
                  onChange={e => setFormData({ ...formData, publish_at: e.target.value })} 
                />
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* 🎬 Media Preview Modal Popup */}
      <Modal 
        open={!!selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
        title={selectedMedia?.name || 'Media Preview'}
        size="lg"
      >
        {selectedMedia && (
          <div className="space-y-5 py-1">
            {/* Dynamic Media Viewer */}
            <div className="aspect-[16/9] bg-[rgb(var(--bg-elevated))] rounded-2xl overflow-hidden shadow-2xl border border-[rgb(var(--border))] flex items-center justify-center relative">
              {selectedMedia.type === 'video' ? (
                <PremiumVideoPlayer 
                  videoUrl={selectedMedia.url || selectedMedia.original_name || selectedMedia.path}
                  title={selectedMedia.name}
                />
              ) : selectedMedia.type === 'image' ? (
                <img 
                  src={selectedMedia.url || selectedMedia.original_name || selectedMedia.path} 
                  alt={selectedMedia.name} 
                  className="max-w-full max-h-full object-contain"
                />
              ) : selectedMedia.type === 'document' ? (
                <iframe 
                  src={selectedMedia.url || selectedMedia.original_name || selectedMedia.path} 
                  title={selectedMedia.name}
                  className="w-full h-full bg-white"
                />
              ) : (
                <div className="text-[rgb(var(--text-secondary))] flex flex-col items-center">
                   <FileText size={48} className="mb-4 opacity-50" />
                   <p className="font-semibold">No direct preview available for this file type.</p>
                   <a 
                     href={selectedMedia.url || selectedMedia.original_name || selectedMedia.path} 
                     target="_blank" 
                     rel="noreferrer" 
                     className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"
                   >
                     Download / Open File
                   </a>
                </div>
              )}
            </div>

            {/* Video Details & Meta Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[rgb(var(--bg-base))] p-4 rounded-2xl border border-[rgb(var(--border))] text-xs">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-[rgb(var(--text-secondary))] block">Title</span>
                <span className="font-extrabold text-[rgb(var(--text-primary))] text-sm mt-0.5 block line-clamp-1 font-[Outfit]">
                  {selectedMedia.name}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-[rgb(var(--text-secondary))] block">Subject & Type</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                    Physics
                  </span>
                  <span className="bg-[#10b981] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                    {selectedMedia.visibility?.toUpperCase() || 'PUBLIC'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-[rgb(var(--text-secondary))] block">Duration & Size</span>
                <span className="font-bold text-[rgb(var(--text-primary))] mt-0.5 block">
                  {formatDuration(selectedMedia.duration) || '12m 45s'} • {selectedMedia.size_bytes ? formatBytes(selectedMedia.size_bytes) : '45 MB'}
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-[rgb(var(--text-secondary))] block">Direct Video Link</span>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    readOnly 
                    value={selectedMedia.url || selectedMedia.original_name || selectedMedia.path}
                    className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] text-[11px] font-mono rounded-lg px-3 py-1.5 flex-1 focus:outline-none truncate"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMedia.url || selectedMedia.original_name || selectedMedia.path)
                      toast.success('Video link copied to clipboard!')
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-[rgb(var(--text-secondary))] block">Provider & Status</span>
                <span className="font-bold text-indigo-400 mt-0.5 block capitalize">
                  {selectedMedia.provider || 'youtube'} (Ready)
                </span>
              </div>
            </div>

            {/* Assigned Details Section */}
            <div className="bg-[rgb(var(--bg-base))] p-4 rounded-2xl border border-[rgb(var(--border))] text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[rgb(var(--border))]/50 pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 font-[Outfit] flex items-center gap-1.5">
                  <Link2 size={13} /> Assigned Syllabus & Batch Details
                </span>
                <span className="bg-emerald-500/10 text-slate-500 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  LINKED & ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <BookOpen size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[rgb(var(--text-secondary))] font-medium block">Assigned Course</span>
                      <span className="font-bold text-[rgb(var(--text-primary))] text-xs">
                        {usageData?.used_by?.[0]?.details?.course_name || 'Physics Masterclass'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Folder size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[rgb(var(--text-secondary))] font-medium block">Assigned Module & Lesson</span>
                      <span className="font-semibold text-[rgb(var(--text-primary))] text-xs">
                        {usageData?.used_by?.[0]?.details?.module_name || 'Foundations of Physics'} — {usageData?.used_by?.[0]?.details?.name || selectedMedia.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Users size={14} className="text-slate-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[rgb(var(--text-secondary))] font-medium block">Assigned Student Batches</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className="bg-emerald-500/10 text-slate-500 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded">
                          JEE Advanced 2026
                        </span>
                        <span className="bg-blue-500/10 text-slate-500 dark:text-blue-400 text-[10px] font-extrabold px-2 py-0.5 rounded">
                          NEET 2026
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <GraduationCap size={14} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[rgb(var(--text-secondary))] font-medium block">Uploaded By / Author</span>
                      <span className="font-semibold text-[rgb(var(--text-primary))] text-xs">
                        Platform Admin ({user?.email || 'admin@eduflow.test'})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))]">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setUsageTarget(selectedMedia)
                    setSelectedMedia(null)
                  }}
                  leftIcon={<Info size={13} />}
                >
                  Where Used
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditTarget(selectedMedia)
                    setSelectedMedia(null)
                  }}
                  leftIcon={<Pencil size={13} />}
                >
                  Edit Details
                </Button>
              </div>

              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setSelectedMedia(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Usage Popup Modal ("Where Used") */}
      <Modal open={!!usageTarget} onClose={() => setUsageTarget(null)} title="Asset Details & Linkages" size="lg">
        {loadingUsage ? (
          <div className="flex items-center justify-center p-12"><Spinner /></div>
        ) : usageData ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-sm">
            {/* Left Column: Asset Info, Live Player, Stats */}
            <div className="md:col-span-2 space-y-4">
              {/* Visual Player */}
              <div className="aspect-video border border-[rgb(var(--border))] rounded-xl overflow-hidden shadow-sm bg-black relative">
                {usageTarget?.type === 'video' ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-[rgb(var(--border))]">
                    <PremiumVideoPlayer 
                      videoUrl={usageTarget.url || usageTarget.original_name || usageTarget.path}
                      title={usageTarget.name}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[rgb(var(--text-muted))] p-4 text-slate-500 dark:text-slate-400 text-center bg-[rgb(var(--bg-elevated))]">
                    <FileText size={32} className="text-[rgb(var(--primary))]" />
                    <span className="text-xs uppercase font-extrabold mt-2 text-[rgb(var(--text-secondary))]">{usageTarget?.extension || usageTarget?.mime || 'file'} file</span>
                  </div>
                )}
              </div>

              {/* Metadata details */}
              <Card className="p-4 space-y-3 bg-[rgb(var(--bg-surface))]">
                <h4 className="font-extrabold text-xs text-[rgb(var(--text-secondary))] uppercase tracking-wider">Asset Info</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs gap-2">
                    <span className="text-[rgb(var(--text-muted))] font-medium">Name:</span>
                    <span className="font-bold text-[rgb(var(--text-primary))] whitespace-normal break-all max-w-[170px]" title={usageTarget?.name}>{usageTarget?.name}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-[rgb(var(--text-muted))] font-medium">Type:</span>
                    <span className="font-semibold text-[rgb(var(--text-primary))] uppercase">{usageTarget?.type}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[rgb(var(--text-muted))] font-medium">Provider:</span>
                    <span className="font-semibold text-[rgb(var(--text-primary))] uppercase">
                      {usageTarget?.provider === 'youtube' ? 'YouTube' : usageTarget?.provider === 'vimeo' ? 'Vimeo' : usageTarget?.provider === 'external' ? 'External Link' : 'Local File'}
                    </span>
                  </div>

                  {(usageTarget?.provider === 'local' || !usageTarget?.provider) && (usageTarget?.size_bytes || usageTarget?.size) ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-[rgb(var(--text-muted))] font-medium">Size:</span>
                      <span className="font-semibold text-[rgb(var(--text-primary))]">
                        {formatBytes(usageTarget?.size_bytes || usageTarget?.size)}
                      </span>
                    </div>
                  ) : null}

                  {usageTarget?.duration ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-[rgb(var(--text-muted))] font-medium">Duration:</span>
                      <span className="font-semibold text-[rgb(var(--text-primary))]">
                        {formatDuration(usageTarget?.duration)}
                      </span>
                    </div>
                  ) : null}

                  {usageTarget?.url && (
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-[rgb(var(--border))]/40">
                      <span className="text-[rgb(var(--text-muted))] text-[10px] font-medium uppercase tracking-wider">Direct URL / Path:</span>
                      <a 
                        href={usageTarget.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] font-semibold text-[rgb(var(--primary))] hover:underline break-all"
                      >
                        {usageTarget.url}
                      </a>
                    </div>
                  )}
                </div>
              </Card>

              {/* Statistics cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="p-3 text-slate-500 dark:text-slate-400 text-center bg-[rgb(var(--bg-surface))] flex flex-col items-center justify-center">
                  <span className="block text-2xl font-black font-[Outfit] text-[rgb(var(--primary))]">{usageTarget?.statistics?.views || 0}</span>
                  <span className="text-[9px] text-[rgb(var(--text-muted))] font-extrabold uppercase mt-0.5">VIEWS</span>
                </Card>
                <Card className="p-3 text-slate-500 dark:text-slate-400 text-center bg-[rgb(var(--bg-surface))] flex flex-col items-center justify-center">
                  <span className="block text-2xl font-black font-[Outfit] text-[rgb(var(--primary))]">{usageTarget?.statistics?.downloads || 0}</span>
                  <span className="text-[9px] text-[rgb(var(--text-muted))] font-extrabold uppercase mt-0.5">DOWNLOADS</span>
                </Card>
              </div>
            </div>

            {/* Right Column: Linked References */}
            <div className="md:col-span-3 space-y-4 border-t md:border-t-0 md:border-l border-[rgb(var(--border))] pt-4 md:pt-0 md:pl-6">
              <h4 className="font-extrabold text-xs text-[rgb(var(--text-muted))] uppercase tracking-wider mb-2">Where Used & Linkages</h4>
              
              <div className="space-y-5">
                {usageData.count === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400 text-center border border-dashed border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--bg-elevated))] p-6 text-[rgb(var(--text-muted))]">
                    <SlidersHorizontal size={24} className="mb-2 opacity-50 text-[rgb(var(--primary))]" />
                    <p className="text-xs font-semibold">Unlinked Asset</p>
                    <p className="text-[10px] mt-1 max-w-[200px]">This asset is not attached to any syllabus courses, modules, or lessons.</p>
                  </div>
                ) : (
                  Object.entries(
                    usageData.used_by.reduce((acc: any, use: any) => {
                      const type = use.details?.type || 'Other';
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(use);
                      return acc;
                    }, {} as Record<string, any[]>)
                  ).map(([type, items]: [string, any[]]) => {
                    let sectionTitle = `${type} Linkages`;
                    if (type === 'Lesson') sectionTitle = 'Linked Course Syllabus & Lessons';
                    if (type === 'Course') sectionTitle = 'Linked General Courses';
                    if (type === 'Batch') sectionTitle = 'Linked Student Batches';
                    if (type === 'Subject') sectionTitle = 'Linked Subjects';

                    return (
                      <div key={type} className="space-y-2">
                        <h5 className="text-[10px] font-black text-[rgb(var(--text-muted))] uppercase tracking-wider pl-1 flex items-center gap-1.5 border-b border-[rgb(var(--border))]/30 pb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))]" />
                          {sectionTitle} ({items.length})
                        </h5>
                        <div className="space-y-1.5">
                          {items.map((use: any) => {
                            const isLesson = use.details?.type === 'Lesson';
                            const isCourse = use.details?.type === 'Course';
                            const isBatch = use.details?.type === 'Batch';
                            const isSubject = use.details?.type === 'Subject';

                            return (
                              <a 
                                key={use.id} 
                                href={use.details?.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 border border-[rgb(var(--border))]/50 flex flex-col gap-2 transition-all group/item hover:bg-[rgb(var(--bg-elevated))] hover:border-[rgb(var(--primary)/0.3)] rounded-xl"
                              >
                                <div className="flex items-start justify-between gap-3 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isLesson || isCourse ? (
                                      <BookOpen size={13} className="text-[rgb(var(--primary))] shrink-0" />
                                    ) : isBatch ? (
                                      <Users size={13} className="text-slate-500 dark:text-emerald-500 shrink-0" />
                                    ) : isSubject ? (
                                      <GraduationCap size={13} className="text-amber-500 shrink-0" />
                                    ) : (
                                      <Bookmark size={13} className="text-slate-500 dark:text-blue-500 shrink-0" />
                                    )}
                                    <span className="font-bold text-xs text-[rgb(var(--text-primary))] group-hover/item:text-[rgb(var(--primary))] transition-colors whitespace-normal break-words">
                                      {isLesson ? (use.details?.course_name || 'Untitled Course') : (use.details?.name || 'Attachment')}
                                    </span>
                                  </div>
                                  <ExternalLink size={11} className="text-[rgb(var(--text-muted))] group-hover/item:text-[rgb(var(--primary))] transition-colors shrink-0" />
                                </div>

                                {isLesson && (
                                  <div className="pl-[21px] space-y-1 text-[10px] text-[rgb(var(--text-muted))] border-l border-[rgb(var(--border))]/60 ml-[6px] whitespace-normal break-words">
                                    <div className="flex items-start gap-1.5">
                                      <Folder size={11} className="opacity-70 text-[rgb(var(--text-muted))] mt-0.5 shrink-0" />
                                      <span>
                                        Module: <strong className="text-[rgb(var(--text-secondary))] font-semibold">{use.details?.module_name || 'N/A'}</strong>
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-1.5">
                                      <PlayCircle size={11} className="opacity-70 text-[rgb(var(--primary))] mt-0.5 shrink-0" />
                                      <span>
                                        Lesson: <strong className="text-[rgb(var(--text-secondary))] font-semibold">{use.details?.name}</strong>
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {!isLesson && (
                                  <div className="pl-[21px] text-[10px] text-[rgb(var(--text-muted))] border-l border-[rgb(var(--border))]/60 ml-[6px]">
                                    Attached resource linkage
                                  </div>
                                )}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Edit Metadata Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Content Metadata">
        {editTarget && (
          <form onSubmit={e => {
            e.preventDefault()
            const name = (e.target as any).name.value
            const description = (e.target as any).description.value
            const visibility = (e.target as any).visibility.value
            const category_id = (e.target as any).category_id.value
            const tags = (e.target as any).tags.value

            updateMediaMutation.mutate({
              id: editTarget.id,
              name,
              description,
              visibility,
              category_id: category_id ? parseInt(category_id) : null,
              tags
            }, {
              onSuccess: () => setEditTarget(null)
            })
          }} className="space-y-4">
            <Input label="Name" name="name" defaultValue={editTarget.name} />
            <Textarea label="Description" name="description" defaultValue={editTarget.description} />
            <Select label="Visibility" name="visibility" defaultValue={editTarget.visibility}>
              <option value="private">Private</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
            <Select label="Category" name="category_id" defaultValue={editTarget.category?.id || ''}>
              <option value="">No Category</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
            <Input label="Tags (comma separated)" name="tags" defaultValue={editTarget.tags?.join(', ') || ''} />
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={updateMediaMutation.isPending}>Save changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* File Replacement Modal */}
      <Modal open={!!replaceTarget} onClose={() => setReplaceTarget(null)} title="Replace Asset File">
        {replaceTarget && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-[rgb(var(--text-muted))]">Replacing this file will update the physical handout or stream for all referenced lessons. The original Media ID will be preserved.</p>
            <Input 
              type="file" 
              label="Select replacement file"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (file) {
                  replaceMediaMutation.mutate({ id: replaceTarget.id, file }, {
                    onSuccess: () => setReplaceTarget(null)
                  })
                }
              }}
            />
            {replaceMediaMutation.isPending && (
              <div className="flex items-center gap-2 text-xs text-[rgb(var(--primary))]"><Spinner size={14} /> Uploading replacement...</div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete / Recycle Bin confirmation */}
      <ConfirmModal 
        open={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)}
        title="Move to Recycle Bin?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? You can restore it from the Recycle Bin later.`}
        confirmText="Move to Recycle Bin"
        onConfirm={() => {
          deleteMediaMutation.mutate({ id: deleteTarget.id, force: false }, {
            onSuccess: () => setDeleteTarget(null)
          })
        }}
        loading={deleteMediaMutation.isPending}
      />

      <ConfirmModal 
        open={!!forceDeleteTarget} 
        onClose={() => setForceDeleteTarget(null)}
        title="Permanently Delete Asset?"
        message={`Are you sure you want to permanently delete "${forceDeleteTarget?.name}"? This action cannot be undone and will break all lesson linkages.`}
        confirmText="Permanently Delete"
        variant="danger"
        onConfirm={() => {
          deleteMediaMutation.mutate({ id: forceDeleteTarget.id, force: true }, {
            onSuccess: () => setForceDeleteTarget(null)
          })
        }}
        loading={deleteMediaMutation.isPending}
      />
    </div>
  )
}
