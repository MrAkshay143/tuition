import React, { useState } from 'react'
import { useApiQuery } from '@/api/resources/hooks'
import { Card, Badge, Spinner, Button } from '@/components/ui'
import { Download, FileText, Search, File, BookOpen } from 'lucide-react'

export const StudentNotesPage = () => {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'doc'>('all')

  const { data: notesData, isLoading } = useApiQuery(
    ['student', 'media', 'document'],
    '/student/media?type=document'
  )

  if (isLoading) return <div className="flex justify-center p-16"><Spinner /></div>

  const rawNotes = notesData?.data || notesData || []
  const notes = rawNotes.filter((note: any) => {
    const matchesSearch = !search || 
      note.name?.toLowerCase().includes(search.toLowerCase()) || 
      note.original_name?.toLowerCase().includes(search.toLowerCase())
    const ext = (note.extension || '').toLowerCase()
    const matchesType = typeFilter === 'all' 
      ? true 
      : typeFilter === 'pdf' 
      ? ext === 'pdf' 
      : ext !== 'pdf'
    return matchesSearch && matchesType
  })

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const pdfCount = rawNotes.filter((n: any) => (n.file_path || '').toLowerCase().endsWith('.pdf') || (n.original_name || '').toLowerCase().endsWith('.pdf')).length
  const otherCount = rawNotes.length - pdfCount

  return (
    <div className="space-y-5 pb-12 font-[Outfit]">
      {/* 1. Minimalist Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Notes & Materials</span>
          </div>
        </div>
        <Badge variant="neutral" className="text-xs font-mono bg-[rgb(var(--bg-elevated))] px-2.5 py-1 border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]">
          {rawNotes.length} Total Files
        </Badge>
      </div>

      {/* 2. Compact One-Line Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
              <FileText size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Materials</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{rawNotes.length}</h3>
            <p className="text-[10px] text-violet-500 font-semibold mt-1">Study resources</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-violet-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <FileText size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">PDF Documents</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{pdfCount}</h3>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">Ready to download</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[75%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <FileText size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Other Formats</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{otherCount}</h3>
            <p className="text-[10px] text-amber-500 font-semibold mt-1">Docs & worksheets</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[60%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[rgb(var(--bg-surface))] p-3 rounded-2xl border border-[rgb(var(--border))] shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] overflow-x-auto scrollbar-none whitespace-nowrap">
          {(['all', 'pdf', 'doc'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTypeFilter(tab)}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer capitalize whitespace-nowrap ${
                typeFilter === tab 
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                  : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-surface))] hover:text-[rgb(var(--text-primary))]'
              }`}
            >
              {tab === 'all' ? `All Files (${rawNotes.length})` : tab === 'pdf' ? 'PDFs' : 'Docs & Others'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
          <input 
            type="text" 
            placeholder="Search notes by name..." 
            className="w-full pl-9 pr-4 py-2 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Responsive Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {notes.map((note: any) => (
          <Card key={note.id} className="p-4 sm:p-5 flex flex-col justify-between h-48 group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Badge 
                  className="uppercase text-[9px] font-extrabold px-2 py-0.5 tracking-wider shadow-2xs" 
                  variant={note.extension === 'pdf' ? 'danger' : 'primary'}
                >
                  {note.extension || 'DOC'}
                </Badge>
                <span className="text-[11px] text-[rgb(var(--text-muted))] font-mono font-semibold bg-[rgb(var(--bg-elevated))] px-2 py-0.5 rounded-md border border-[rgb(var(--border))]">
                  {formatSize(note.size_bytes || note.size)}
                </span>
              </div>
              
              <div className="flex items-start gap-2.5 pt-0.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20 group-hover:scale-105 transition-transform">
                  <File size={18} />
                </div>
                <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" title={note.name || note.original_name}>
                  {note.name || note.original_name}
                </h3>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-[rgb(var(--border))]">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full flex items-center justify-center gap-1.5 font-extrabold text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl py-2 transition-all shadow-xs cursor-pointer" 
                onClick={() => window.open(note.url, '_blank')}
              >
                <Download size={14} /> Download File
              </Button>
            </div>
          </Card>
        ))}

        {notes.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center p-8 bg-[rgb(var(--bg-surface))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl">
            <div className="w-16 h-16 rounded-3xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-4 shadow-sm">
              <FileText size={32} />
            </div>
            <h3 className="font-extrabold text-lg text-[rgb(var(--text-primary))] mb-1">No study materials found</h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] max-w-sm">
              {search || typeFilter !== 'all' ? "No documents match your filter or search query." : "Your teachers haven't uploaded any class notes or documents yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
