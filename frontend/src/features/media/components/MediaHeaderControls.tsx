import React from 'react'
import { Search, Grid, List, RefreshCw, Trash2, Plus } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'

interface MediaHeaderControlsProps {
  search: string
  onSearchChange: (val: string) => void
  view: 'grid' | 'list'
  onViewChange: (v: 'grid' | 'list') => void
  typeFilter: string
  onTypeFilterChange: (t: string) => void
  onRefresh: () => void
  onOpenUpload: () => void
  onOpenRecycleBin: () => void
  showRecycleBin: boolean
}

export const MediaHeaderControls: React.FC<MediaHeaderControlsProps> = ({
  search,
  onSearchChange,
  view,
  onViewChange,
  typeFilter,
  onTypeFilterChange,
  onRefresh,
  onOpenUpload,
  onOpenRecycleBin,
  showRecycleBin,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search assets by title, tag, or description..."
            className="pl-9 w-full"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="w-36"
        >
          <option value="all">All Types</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
          <option value="image">Images</option>
          <option value="audio">Audio</option>
          <option value="archive">Archives</option>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} title="Refresh media library">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <div className="flex items-center border border-[rgb(var(--border))] rounded-lg p-0.5 bg-[rgb(var(--surface))]">
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            className={`p-1.5 rounded ${view === 'grid' ? 'bg-[rgb(var(--primary))] text-white' : 'text-[rgb(var(--text-muted))]'}`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={`p-1.5 rounded ${view === 'list' ? 'bg-[rgb(var(--primary))] text-white' : 'text-[rgb(var(--text-muted))]'}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenRecycleBin} className="text-amber-500 border-amber-500/20">
          <Trash2 className="w-4 h-4 mr-1.5" />
          {showRecycleBin ? 'Back to Library' : 'Recycle Bin'}
        </Button>
        <Button variant="primary" size="sm" onClick={onOpenUpload}>
          <Plus className="w-4 h-4 mr-1.5" />
          Upload Asset
        </Button>
      </div>
    </div>
  )
}
