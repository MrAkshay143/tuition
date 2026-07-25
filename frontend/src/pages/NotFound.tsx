import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-4 py-12 space-y-5 select-none">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
        <AlertCircle size={28} className="sm:w-8 sm:h-8" />
      </div>

      <div className="space-y-1.5 max-w-xs sm:max-w-md mx-auto">
        <span className="text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          404 Error
        </span>
        <h1 className="text-xl sm:text-3xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight pt-1">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))] font-medium">
          The requested page could not be found.
        </p>
      </div>

      <Link to="/" className="pt-2">
        <Button variant="primary" className="px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm rounded-xl font-bold">
          Back to Home
        </Button>
      </Link>
    </div>
  )
}
