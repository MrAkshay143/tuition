import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center px-4 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
        <AlertCircle size={32} />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-[rgb(var(--text-primary))]">404 - Page Not Found</h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] max-w-sm mx-auto">
          The page you are trying to access does not exist or has been moved to a new route.
        </p>
      </div>

      <Link to="/">
        <Button variant="primary" size="lg">
          Return to Home
        </Button>
      </Link>
    </div>
  )
}
