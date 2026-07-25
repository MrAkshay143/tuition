import { BookOpen, Calendar, ArrowRight, AlertCircle, RefreshCw, FileText } from 'lucide-react'
import { Card, Button, Badge, Spinner, SEO } from '@/components/ui'
import { Link } from 'react-router-dom'
import { useBlogs } from '@/api/resources/cms'

export default function Blog() {
  const { data, isLoading, isError, refetch } = useBlogs()
  const blogs = data?.items || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <SEO title="Classroom Blog" description="Read conceptual summaries, test prep strategies, and academic advice." />
      <section className="text-slate-500 dark:text-slate-400 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[rgb(var(--text-primary))]">Classroom Blog</h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mx-auto">
          Read conceptual summaries, test prep strategies, and academic advice written directly by our teachers.
        </p>
      </section>

      <div className="space-y-6">
        
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Spinner size={32} className="text-indigo-500" />
            <p className="text-xs text-[rgb(var(--text-muted))]">Loading blog posts...</p>
          </div>
        )}

        {isError && (
          <Card className="p-8 text-center border-rose-500/20 bg-rose-500/5 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Failed to load blogs</h3>
              <p className="text-xs text-rose-500/80 mt-1">There was a problem connecting to the server.</p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="border-rose-500/20 text-rose-600 hover:bg-rose-500/10">
              <RefreshCw size={14} className="mr-2" /> Try Again
            </Button>
          </Card>
        )}

        {!isLoading && !isError && blogs.length === 0 && (
          <Card className="p-12 text-center border-dashed border-[rgb(var(--border))] flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-500/10 text-slate-400 flex items-center justify-center">
              <FileText size={32} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[rgb(var(--text-primary))]">No Posts Found</h3>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Check back later for new academic articles and summaries.</p>
            </div>
          </Card>
        )}

        {!isLoading && !isError && blogs.length > 0 && blogs.map((post: any) => (
          <Card key={post.id} className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] text-[rgb(var(--text-secondary))] font-medium uppercase tracking-wide">
                <Calendar size={12} /> {new Date(post.published_at || post.created_at).toLocaleDateString()} 
                {post.read_time && <span>• {post.read_time}</span>}
                {post.category && <span>• {post.category.name}</span>}
              </div>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] hover:text-[rgb(var(--primary))] transition-colors">
                <Link to={`/blog/${post.slug || post.id}`}>{post.title}</Link>
              </h3>
              <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed line-clamp-2">
                {post.excerpt || post.body.substring(0, 150) + '...'}
              </p>
            </div>
            <Link to={`/blog/${post.slug || post.id}`}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight size={12} />}>
                Read Article
              </Button>
            </Link>
          </Card>
        ))}
      </div>

    </div>
  )
}

