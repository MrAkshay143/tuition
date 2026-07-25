import { FileText, Download, Lock, AlertCircle, RefreshCw, FileQuestion } from 'lucide-react'
import { Card, Button, Spinner, SEO } from '@/components/ui'
import { Link } from 'react-router-dom'
import { useMediaList } from '@/api/resources/media'

export default function StudyMaterials() {
  const { data, isLoading, isError, refetch } = useMediaList({ type: 'document', per_page: 20 })
  const notes = data?.items || []
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <SEO title="Study Materials" description="Access downloadable worksheets, summary guides, and revision sheets." />
      
      {/* Header */}
      <section className="text-slate-500 dark:text-slate-400 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[rgb(var(--text-primary))]">Study Materials</h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mx-auto">
          Access downloadable worksheets, summary guides, and revision sheets designed directly by Arjun Kumar.
        </p>
      </section>

      {/* Grid notes */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[rgb(var(--text-primary))]">Downloadable Resources</h3>
        
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Spinner size={32} className="text-indigo-500" />
            <p className="text-xs text-[rgb(var(--text-muted))]">Loading study materials...</p>
          </div>
        )}

        {isError && (
          <Card className="p-8 text-center border-rose-500/20 bg-rose-500/5 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Failed to load materials</h3>
              <p className="text-xs text-rose-500/80 mt-1">There was a problem connecting to the server.</p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="border-rose-500/20 text-rose-600 hover:bg-rose-500/10">
              <RefreshCw size={14} className="mr-2" /> Try Again
            </Button>
          </Card>
        )}

        {!isLoading && !isError && notes.length === 0 && (
          <Card className="p-12 text-center border-dashed border-[rgb(var(--border))] flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-500/10 text-slate-400 flex items-center justify-center">
              <FileQuestion size={32} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[rgb(var(--text-primary))]">No Materials Found</h3>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Study materials and worksheets will appear here once uploaded.</p>
            </div>
          </Card>
        )}

        {!isLoading && !isError && notes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notes.map((note: any, idx: number) => (
              <Card key={note.id || idx} className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-[rgb(var(--text-primary))] leading-tight line-clamp-2">{note.title || note.original_name}</h4>
                    <span className="text-[10px] text-[rgb(var(--text-secondary))]">{note.extension?.toUpperCase() || 'DOCUMENT'} • {note.human_readable_size || 'Unknown Size'}</span>
                  </div>
                </div>

                <Link to="/login">
                  <Button variant="outline" size="sm" leftIcon={<Lock size={12} />} className="text-xs px-2.5 h-8">
                    Unlock
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}


