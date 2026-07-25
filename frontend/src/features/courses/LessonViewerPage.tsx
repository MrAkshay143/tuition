import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui'

/**
 * LessonViewerPage - route: /student/courses/:courseId/lessons/:lessonId
 *
 * The full lesson viewing experience lives inside CourseDetails (public page
 * at /courses/:id), which already handles:
 *  - Module/lesson tree navigation
 *  - HLS + YouTube video player with resume
 *  - Progress tracking / heartbeat
 *  - Bookmark management
 *  - Downloadable material
 *  - Free preview / lock gates
 *
 * This page simply redirects to that route with the lessonId as a query param
 * so CourseDetails auto-opens the correct lesson.
 */
export function LessonViewerPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (courseId) {
      const target = lessonId
        ? `/courses/${courseId}?lesson_id=${lessonId}`
        : `/courses/${courseId}`
      navigate(target, { replace: true })
    }
  }, [courseId, lessonId, navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Spinner size={32} />
      <span className="text-sm text-[rgb(var(--text-muted))]">Loading lesson…</span>
    </div>
  )
}
