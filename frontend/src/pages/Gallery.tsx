import { Expand, Play, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { Card, Spinner, Button, SEO } from '@/components/ui'
import { useMediaList } from '@/api/resources/media'

export default function Gallery() {
  const { data, isLoading, isError, refetch } = useMediaList({ type: 'image', per_page: 30 })
  const gallery = data?.items || []
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <SEO title="Classroom Gallery" description="Browse through memories, event highlights, and moments from our digital classroom." />
      
      {/* Header */}
      <section className="text-slate-500 dark:text-slate-400 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[rgb(var(--text-primary))]">Classroom Gallery</h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mx-auto">
          Take a look at laboratory sessions, batch gatherings, and academic awards from offline events.
        </p>
      </section>

      {/* Grid */}
      
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size={32} className="text-indigo-500" />
          <p className="text-xs text-[rgb(var(--text-muted))]">Loading gallery images...</p>
        </div>
      )}

      {isError && (
        <Card className="p-8 max-w-md mx-auto text-center border-rose-500/20 bg-rose-500/5 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Failed to load gallery</h3>
            <p className="text-xs text-rose-500/80 mt-1">There was a problem connecting to the server.</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="border-rose-500/20 text-rose-600 hover:bg-rose-500/10">
            <RefreshCw size={14} className="mr-2" /> Try Again
          </Button>
        </Card>
      )}

      {!isLoading && !isError && gallery.length === 0 && (
        <Card className="p-16 max-w-md mx-auto text-center border-dashed border-[rgb(var(--border))] flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-500/10 text-slate-400 flex items-center justify-center">
            <ImageIcon size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[rgb(var(--text-primary))]">No Images Found</h3>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Event and classroom photos will appear here once uploaded.</p>
          </div>
        </Card>
      )}

      {!isLoading && !isError && gallery.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {gallery.map((item: any, idx: number) => (
            <div key={item.id || idx} className="break-inside-avoid relative group rounded-2xl overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] shadow-sm hover:shadow-md transition-all">
              <img 
                src={item.url || item.thumbnail} 
                alt={item.title || item.original_name} 
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="p-4 space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[rgb(var(--primary-light))] font-extrabold">{item.category?.name || 'Uncategorized'}</span>
                <h4 className="font-bold text-xs text-[rgb(var(--text-primary))]">{item.title || item.original_name}</h4>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

