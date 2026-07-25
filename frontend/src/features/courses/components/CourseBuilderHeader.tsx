import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Globe, Eye, Lock } from 'lucide-react'
import { Button, Badge } from '@/components/ui'

interface CourseBuilderHeaderProps {
  courseTitle: string
  status: 'draft' | 'published' | 'archived'
  isSaving: boolean
  onSave: () => void
  onTogglePublish: () => void
  onPreview: () => void
}

export const CourseBuilderHeader: React.FC<CourseBuilderHeaderProps> = ({
  courseTitle,
  status,
  isSaving,
  onSave,
  onTogglePublish,
  onPreview,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-[rgb(var(--surface))] p-4 rounded-xl border border-[rgb(var(--border))]">
      <div className="flex items-center gap-3">
        <Link
          to="/teacher/courses"
          className="p-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-hover))] transition-colors text-[rgb(var(--text-muted))]"
          title="Back to Courses"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[rgb(var(--text-primary))]">{courseTitle || 'Untitled Course'}</h1>
            <Badge variant={status === 'published' ? 'success' : status === 'archived' ? 'warning' : 'neutral'}>
              {status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-[rgb(var(--text-muted))]">Course Curriculum & Lesson Builder</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="w-4 h-4 mr-1.5" />
          Preview
        </Button>
        <Button
          variant={status === 'published' ? 'secondary' : 'primary'}
          size="sm"
          onClick={onTogglePublish}
        >
          {status === 'published' ? (
            <>
              <Lock className="w-4 h-4 mr-1.5" />
              Unpublish
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 mr-1.5" />
              Publish Course
            </>
          )}
        </Button>
        <Button variant="primary" size="sm" onClick={onSave} loading={isSaving}>
          <Save className="w-4 h-4 mr-1.5" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
