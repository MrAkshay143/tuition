import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application UI:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-8 my-12 mx-auto max-w-xl text-slate-500 dark:text-slate-400 text-center glass border border-red-500/30 rounded-2xl bg-red-500/5 space-y-4">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 font-[Outfit]">
            Something went wrong
          </h2>
          <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-xs font-bold text-white bg-[rgb(var(--primary))] hover:opacity-90 rounded-lg shadow transition-opacity"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError() as any
  const navigate = useNavigate()
  
  const errorMessage = 
    isRouteErrorResponse(error)
      ? `${error.status} ${error.statusText}`
      : error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'An unexpected application error occurred.'

  const isChunkLoadError = 
    error?.message?.toLowerCase().includes('dynamically imported module') ||
    error?.message?.toLowerCase().includes('failed to fetch') ||
    error?.message?.toLowerCase().includes('importing a module script failed') ||
    error?.stack?.toLowerCase().includes('dynamically imported module') ||
    (error && typeof error.toString === 'function' && error.toString().toLowerCase().includes('dynamically imported module'))

  React.useEffect(() => {
    if (isChunkLoadError) {
      const lastReload = sessionStorage.getItem('chunk_error_reload')
      const now = Date.now()
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('chunk_error_reload', String(now))
        window.location.reload()
      }
    }
  }, [isChunkLoadError])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-left">
      <div className="w-full max-w-md p-8 rounded-2xl border border-slate-200 dark:border-[#1b1c3d] bg-white dark:bg-[#0c0d24] shadow-2xl text-slate-500 dark:text-slate-400 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
          <AlertTriangle size={28} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-white font-[Outfit]">
            {isChunkLoadError ? 'Update Available' : 'Application Error'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#8e91b5] leading-relaxed max-w-sm mx-auto">
            {isChunkLoadError 
              ? 'A new version of the application was deployed. Reloading latest version...'
              : errorMessage
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button 
            variant="primary" 
            className="gap-2 text-xs font-bold" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} /> Reload Page
          </Button>
          <Button 
            variant="secondary" 
            className="gap-2 text-xs font-bold" 
            onClick={() => navigate('/')}
          >
            <Home size={14} /> Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
