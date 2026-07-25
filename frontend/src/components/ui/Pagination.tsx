import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  perPage?: number
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  perPageOptions?: number[]
  className?: string
  showPerPage?: boolean
  showDetails?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage = 15,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 15, 25, 50, 100],
  className,
  showPerPage = true,
  showDetails = true,
}: PaginationProps) {
  if (!totalPages || totalPages <= 0) return null

  // Calculate page number numbers to render (e.g. 1 2 3 ... 9 10)
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    const total = totalPages

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(total - 1, currentPage + 1)

      if (currentPage <= 3) {
        end = 4
      } else if (currentPage >= total - 2) {
        start = total - 3
      }

      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < total - 1) pages.push('...')
      pages.push(total)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  const safeCurrentPage = Number(currentPage) || 1
  const safePerPage = Number(perPage) || 15
  const safeTotalItems = Number(totalItems) || 0
  
  const startItem = totalItems !== undefined ? Math.min((safeCurrentPage - 1) * safePerPage + 1, safeTotalItems) : 0
  const endItem = totalItems !== undefined ? Math.min(safeCurrentPage * safePerPage, safeTotalItems) : 0

  return (
    <div className={cn('flex flex-col lg:flex-row items-center justify-between gap-2.5 sm:gap-5 py-2 sm:py-4 px-2 w-full', className)}>
      {/* Left: Summary text & Per-page selector */}
      <div className="flex w-full lg:w-auto flex-row items-center justify-between lg:justify-center gap-3 text-xs text-[rgb(var(--text-secondary))] font-medium">
        {showDetails && totalItems !== undefined && (
          <span className="block">
            <span className="hidden sm:inline">Showing </span>
            <strong className="text-[rgb(var(--text-primary))]">{startItem}</strong>
            <span className="hidden sm:inline"> to </span><span className="sm:hidden">-</span>
            <strong className="text-[rgb(var(--text-primary))]">{endItem}</strong> of{' '}
            <strong className="text-[rgb(var(--text-primary))]">{totalItems}</strong>
            <span className="hidden sm:inline"> entries</span>
          </span>
        )}

        {showPerPage && onPerPageChange && (
          <div className="flex items-center justify-center gap-1.5">
            <span className="hidden sm:inline">Show</span>
            <select
              value={String(perPage || 15)}
              onChange={(e) => {
                const size = Number(e.target.value)
                onPerPageChange(size)
                onPageChange(1)
              }}
              className="bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] text-xs rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer transition-all"
            >
              {perPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="hidden sm:inline">/ page</span>
          </div>
        )}
      </div>

      {/* Right: Clickable Page Number Buttons */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer h-8"
        >
          <ChevronLeft size={14} className="sm:-ml-1" /> <span className="hidden sm:inline">Prev</span>
        </button>

        {pageNumbers.map((item, idx) => {
          if (item === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 sm:px-2 py-1 text-xs text-[rgb(var(--text-muted))] font-bold select-none">
                ...
              </span>
            )
          }

          const pageNum = item as number
          const isActive = pageNum === currentPage

          return (
            <button
              key={`page-${pageNum}-${idx}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'min-w-[28px] sm:min-w-[32px] h-8 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all border cursor-pointer items-center justify-center',
                isActive
                  ? 'bg-indigo-600 dark:bg-[#5046e5] text-white border-indigo-500 shadow-md shadow-indigo-500/20 flex'
                  : 'bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] border-[rgb(var(--border))] hidden sm:flex'
              )}
            >
              {pageNum}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer h-8"
        >
          <span className="hidden sm:inline">Next</span> <ChevronRight size={14} className="sm:-mr-1" />
        </button>
      </div>
    </div>
  )
}
