import React, { useState } from 'react'
import { useApiQuery } from '@/api/resources/hooks'
import { Card, Badge, Spinner, Input, Button } from '@/components/ui'
import { Download, FileText, Search, File } from 'lucide-react'

export const StudentNotesPage = () => {
  const [search, setSearch] = useState('')

  const { data: notesData, isLoading } = useApiQuery(
    ['student', 'media', 'document'],
    '/student/media?type=document'
  )

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  const notes = (notesData?.data || notesData || []).filter((note: any) => 
    note.name.toLowerCase().includes(search.toLowerCase()) || 
    note.original_name.toLowerCase().includes(search.toLowerCase())
  )

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-[Outfit] text-[rgb(var(--text-primary))]">Class Notes & Materials</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">Download and study resources provided by your teachers.</p>
        </div>
      </div>

      <div className="bg-[rgb(var(--bg-surface))] p-4 rounded-xl border border-[rgb(var(--border))] flex items-center gap-3">
        <Search className="text-[rgb(var(--text-muted))] ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Search materials by name..." 
          className="bg-transparent border-none focus:outline-none flex-1 text-sm text-[rgb(var(--text-primary))]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note: any) => (
          <Card key={note.id} className="p-5 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-2">
                <Badge className="uppercase text-[10px]" variant={note.extension === 'pdf' ? 'danger' : 'primary'}>
                  {note.extension || 'DOC'}
                </Badge>
                <span className="text-xs text-[rgb(var(--text-muted))] font-medium">{formatSize(note.size_bytes || note.size)}</span>
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] line-clamp-2" title={note.name || note.original_name}>
                {note.name || note.original_name}
              </h3>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full flex gap-2 font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50" 
                onClick={() => window.open(note.url, '_blank')}
              >
                <Download size={16} /> Download File
              </Button>
            </div>
          </Card>
        ))}

        {notes.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-[rgb(var(--text-muted))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl bg-gray-50/50">
            <FileText size={48} className="mb-4 text-gray-300" />
            <h3 className="font-bold text-lg text-gray-500">No materials found</h3>
            <p className="text-sm">Try adjusting your search terms or check back later.</p>
          </div>
        )}
      </div>
    </div>
  )
}
