import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, User, AlertCircle } from 'lucide-react'
import { Button, Card, Spinner, SEO } from '@/components/ui'
import { useBlog } from '@/api/resources/cms'

export default function BlogDetails() {
  const { id } = useParams()
  const { data: post, isLoading, isError } = useBlog(id as string)

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-32 flex flex-col items-center justify-center gap-3">
        <Spinner size={32} className="text-indigo-500" />
        <p className="text-xs text-[rgb(var(--text-muted))]">Loading article...</p>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-slate-500 dark:text-slate-400 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold">Article not found</h2>
        <p className="text-sm">The article you are looking for does not exist or has been removed.</p>
        <Link to="/blog">
          <Button variant="primary">Back to Blog</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      
      <SEO title={post.title} description={post.excerpt || post.body.substring(0, 160)} />

      <Link to="/blog">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />}>
          Back to Blog
        </Button>
      </Link>

      <article className="space-y-6">
        {post.cover_image && (
          <img src={post.cover_image} alt={post.title} loading="lazy" className="w-full h-auto rounded-2xl object-cover shadow-sm mb-6" />
        )}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[rgb(var(--text-primary))] leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-[rgb(var(--text-secondary))] font-medium">
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
            {post.read_time && <span className="flex items-center gap-1"><Clock size={12} /> {post.read_time}</span>}
            <span className="flex items-center gap-1"><User size={12} /> Written by {post.author?.name || 'Teacher'}</span>
          </div>
        </div>

        <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-8 text-sm text-[rgb(var(--text-secondary))] leading-relaxed space-y-4 whitespace-pre-wrap">
          {post.body}
        </Card>
      </article>

    </div>
  )
}

