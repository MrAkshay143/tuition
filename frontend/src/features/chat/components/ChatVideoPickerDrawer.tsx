import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Film, Library, BookOpen, Play, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { ContentLibrary } from '@/features/media/ContentLibrary'

interface VideoPickerItem {
  id: number
  title: string
  url: string
  mime_type?: string
  thumbnail_url?: string
  course_name?: string
  chapter_name?: string
  duration_seconds?: number
}

interface ChatVideoPickerDrawerProps {
  open: boolean
  onClose: () => void
  partnerId: number
  onSelect: (item: VideoPickerItem) => void
}

// Hook: fetch partner's enrolled course videos
function usePartnerCourseVideos(partnerId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['chat', 'partner-course-videos', partnerId],
    queryFn: () => api.get(`/chat/partner-course-videos/${partnerId}`).then(r => r.data?.data || r.data || []),
    enabled: enabled && !!partnerId,
    staleTime: 1000 * 60 * 5,
  })
}

function fmtDuration(s?: number) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function ChatVideoPickerDrawer({ open, onClose, partnerId, onSelect }: ChatVideoPickerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'course' | 'all'>('course')
  const [courseSearch, setCourseSearch] = useState('')

  const { data: courseVideos = [], isLoading: isLoadingCourse } = usePartnerCourseVideos(partnerId, open)

  const filteredCourseVideos = (courseVideos as VideoPickerItem[]).filter(v =>
    v.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    v.course_name?.toLowerCase().includes(courseSearch.toLowerCase())
  )

  const handleLibrarySelect = (item: any) => {
    onSelect({
      id: item.id,
      title: item.title || item.name || 'Video',
      url: item.url,
      mime_type: item.mime_type || item.type,
      thumbnail_url: item.thumbnail_url,
    })
  }

  const handleCourseVideoSelect = (v: VideoPickerItem) => {
    onSelect(v)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel — slides in from right */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-[91] w-full max-w-2xl bg-[rgb(var(--bg-surface))] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-[rgb(var(--border))] flex items-center justify-between bg-gradient-to-r from-indigo-600/10 to-violet-600/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
                  <Film size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-[rgb(var(--text-primary))]">Select Video</h2>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Pick a video to watch together</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-3 gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]">
              <button
                onClick={() => setActiveTab('course')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'course'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] border border-[rgb(var(--border))]'
                }`}
              >
                <BookOpen size={16} />
                Student's Course Videos
                {courseVideos.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'course' ? 'bg-white/20' : 'bg-indigo-500/20 text-indigo-500'}`}>
                    {courseVideos.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] border border-[rgb(var(--border))]'
                }`}
              >
                <Library size={16} />
                All Media Library
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'course' ? (
                <div className="flex flex-col h-full">
                  {/* Course search */}
                  <div className="p-3 border-b border-[rgb(var(--border))]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
                      <input
                        type="text"
                        value={courseSearch}
                        onChange={e => setCourseSearch(e.target.value)}
                        placeholder="Search videos..."
                        className="w-full pl-9 pr-4 py-2 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {isLoadingCourse ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 text-[rgb(var(--text-muted))]">
                        <Loader2 size={28} className="animate-spin text-indigo-500" />
                        <span className="text-sm font-medium">Loading course videos...</span>
                      </div>
                    ) : filteredCourseVideos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <BookOpen size={28} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[rgb(var(--text-primary))]">No course videos found</p>
                          <p className="text-xs text-[rgb(var(--text-muted))] mt-1">
                            {courseSearch ? 'Try a different search.' : 'This student has no enrolled course videos.'}
                          </p>
                          <button
                            onClick={() => setActiveTab('all')}
                            className="mt-2 text-xs text-indigo-500 hover:text-indigo-400 font-semibold underline"
                          >
                            Browse All Media instead →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Group by course */}
                        {Object.entries(
                          filteredCourseVideos.reduce((acc: any, v) => {
                            const key = v.course_name || 'Uncategorised'
                            if (!acc[key]) acc[key] = []
                            acc[key].push(v)
                            return acc
                          }, {})
                        ).map(([courseName, videos]: any) => (
                          <div key={courseName}>
                            <div className="flex items-center gap-2 px-1 mb-1.5 mt-3 first:mt-0">
                              <BookOpen size={12} className="text-indigo-400 shrink-0" />
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400">{courseName}</span>
                              <div className="flex-1 h-px bg-indigo-500/15" />
                            </div>
                            {videos.map((v: VideoPickerItem) => (
                              <motion.button
                                key={v.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleCourseVideoSelect(v)}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[rgb(var(--border))] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-left group mb-1.5 bg-[rgb(var(--bg-elevated))]"
                              >
                                {/* Thumbnail */}
                                <div className="w-16 h-12 rounded-xl bg-black overflow-hidden shrink-0 border border-white/10 relative">
                                  {v.thumbnail_url ? (
                                    <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                      <Film size={18} className="text-slate-500" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <Play size={14} className="text-white fill-white" />
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-[rgb(var(--text-primary))] truncate group-hover:text-indigo-400 transition-colors">
                                    {v.title}
                                  </p>
                                  <p className="text-xs text-[rgb(var(--text-muted))] truncate mt-0.5">{v.chapter_name}</p>
                                </div>

                                {v.duration_seconds && (
                                  <span className="text-[10px] font-mono font-bold text-[rgb(var(--text-muted))] shrink-0 bg-[rgb(var(--bg-surface))] px-1.5 py-0.5 rounded-lg border border-[rgb(var(--border))]">
                                    {fmtDuration(v.duration_seconds)}
                                  </span>
                                )}
                              </motion.button>
                            ))}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* All Media tab — use existing ContentLibrary in picker mode */
                <div className="h-full p-3 overflow-auto">
                  <ContentLibrary
                    defaultTypeFilter="video"
                    isPickerMode={true}
                    onSelect={handleLibrarySelect}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ChatVideoPickerDrawer
