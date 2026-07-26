import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

function checkIsChunkLoadError(err: any): boolean {
  if (!err) return false
  const msg = typeof err === 'string' ? err : err.message || ''
  const stack = err.stack || ''
  const str = typeof err.toString === 'function' ? err.toString() : ''
  
  const lower = `${msg} ${stack} ${str}`.toLowerCase()
  return (
    lower.includes('dynamically imported module') ||
    lower.includes('failed to fetch') ||
    lower.includes('importing a module script failed') ||
    lower.includes('chunkloaderror') ||
    lower.includes('loading chunk')
  )
}

function UpdateOrErrorCard({ 
  isChunkLoadError, 
  errorMessage, 
  onReload, 
  onHome 
}: { 
  isChunkLoadError: boolean
  errorMessage?: string
  onReload: () => void
  onHome?: () => void
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4 sm:p-6 text-left animate-in fade-in duration-300">
      <div className="w-full max-w-sm p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-[#1b1c3d] bg-white/95 dark:bg-[#0c0d24]/95 backdrop-blur-md shadow-2xl text-center space-y-5 transition-all">
        {/* Sleek Icon Header */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center mx-auto transition-transform hover:scale-105 duration-300 ${
          isChunkLoadError 
            ? 'bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400 shadow-sm shadow-indigo-500/10' 
            : 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 text-red-500 dark:text-red-400 shadow-sm shadow-red-500/10'
        }`}>
          {isChunkLoadError ? (
            <Sparkles size={26} className="animate-pulse" />
          ) : (
            <AlertTriangle size={26} />
          )}
        </div>
        
        {/* Compact Typography */}
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-[Outfit] tracking-tight">
            {isChunkLoadError ? 'Update available' : 'Application error'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#8e91b5] leading-relaxed max-w-[260px] mx-auto">
            {isChunkLoadError 
              ? 'A new version is available. Reload to update.'
              : (errorMessage || 'An unexpected rendering error occurred.')
            }
          </p>
        </div>

        {/* Responsive Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <Button 
            variant="primary" 
            className="w-full sm:w-auto flex-1 justify-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 hover:shadow-lg hover:shadow-indigo-500/20" 
            onClick={onReload}
          >
            <RefreshCw size={14} className={isChunkLoadError ? 'animate-spin' : ''} /> 
            {isChunkLoadError ? 'Reload to update' : 'Reload page'}
          </Button>
          {onHome && (
            <Button 
              variant="secondary" 
              className="w-full sm:w-auto flex-1 justify-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95 border-slate-200 dark:border-[#2a2b50] hover:bg-slate-100 dark:hover:bg-[#151636]" 
              onClick={onHome}
            >
              <Home size={14} /> Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  )
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

      const isChunk = checkIsChunkLoadError(this.state.error)

      return (
        <UpdateOrErrorCard
          isChunkLoadError={isChunk}
          errorMessage={this.state.error?.message}
          onReload={() => {
            this.setState({ hasError: false, error: null })
            const currentUrl = new URL(window.location.href)
            currentUrl.searchParams.set('cb', String(Date.now()))
            window.location.replace(currentUrl.toString())
          }}
          onHome={() => {
            this.setState({ hasError: false, error: null })
            window.location.href = '/'
          }}
        />
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

  const isChunkLoadError = checkIsChunkLoadError(error)

  React.useEffect(() => {
    if (isChunkLoadError) {
      const attemptRecovery = async () => {
        const lastReload = sessionStorage.getItem('chunk_error_reload')
        const now = Date.now()
        
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('chunk_error_reload', String(now))
          
          try {
            // 1. Clear all service worker caches
            if ('caches' in window) {
              const cacheNames = await caches.keys()
              await Promise.all(cacheNames.map(name => caches.delete(name)))
            }
            // 2. Unregister service workers
            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations()
              await Promise.all(registrations.map(r => r.unregister()))
            }
          } catch (err) {
            console.error('Failed to clear caches', err)
          }

          // 3. Bust the HTML cache by appending a timestamp query parameter
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.set('cb', String(now)) // cache-bust
          window.location.replace(currentUrl.toString())
        }
      }
      attemptRecovery()
    }
  }, [isChunkLoadError])

  return (
    <UpdateOrErrorCard
      isChunkLoadError={isChunkLoadError}
      errorMessage={errorMessage}
      onReload={() => window.location.reload()}
      onHome={() => navigate('/')}
    />
  )
}
