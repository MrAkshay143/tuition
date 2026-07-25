import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown, Download, Columns } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Pagination } from './Pagination'

interface Column<T> {
  header: React.ReactNode
  accessor: keyof T | ((row: T) => React.ReactNode)
  sortable?: boolean
  sortKey?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void
  onRowClick?: (row: T) => void
  loading?: boolean
}

export function EnterpriseTable<T extends { id: number | string }>({
  columns,
  data,
  meta,
  onPageChange,
  onPerPageChange,
  onSortChange,
  onRowClick,
  loading = false,
}: Props<T>) {
  const [sortCol, setSortCol] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [visibleCols, setVisibleCols] = useState<number[]>(columns.map((_, i) => i))
  const [showColChooser, setShowColChooser] = useState(false)
  const colChooserRef = useRef<HTMLDivElement>(null)

  const rawRows = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : [])
  
  // Client-side sorting fallback if onSortChange is not provided
  const rows = React.useMemo(() => {
    if (onSortChange || !sortCol) return rawRows
    return [...rawRows].sort((a, b) => {
      const aVal = (a as any)[sortCol]
      const bVal = (b as any)[sortCol]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rawRows, sortCol, sortDir, onSortChange])

  // Close col chooser on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colChooserRef.current && !colChooserRef.current.contains(e.target as Node)) {
        setShowColChooser(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSort = (key: string) => {
    const nextDir = sortCol === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortCol(key)
    setSortDir(nextDir)
    if (onSortChange) {
      onSortChange(key, nextDir)
    }
  }

  const exportCSV = () => {
    if (rows.length === 0) return
    const headers = columns.map(c => c.header).join(',')
    const csvRows = rows.map(row =>
      columns.map(c => {
        const val = typeof c.accessor === 'function' ? '' : row[c.accessor]
        return `"${String(val ?? '').replace(/"/g, '""')}"`
      }).join(',')
    )
    const blob = new Blob([[headers, ...csvRows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const controlBtnClass = cn(
    'px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all',
    'bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]',
    'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--border))]'
  )

  const getPageNumbers = () => {
    if (!meta) return []
    const total = Number.isInteger(meta.last_page) && meta.last_page > 0 ? meta.last_page : 1
    const current = Number.isInteger(meta.current_page) && meta.current_page > 0 ? meta.current_page : 1
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total]
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
    }
    return [1, '...', current - 1, current, current + 1, '...', total]
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-row items-center justify-between gap-2 flex-wrap pb-2 border-b border-[rgb(var(--border))]/40">
        {/* Left Controls: Column Chooser & Export CSV */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block" ref={colChooserRef}>
            <button onClick={() => setShowColChooser(!showColChooser)} className={controlBtnClass}>
              <Columns className="w-3.5 h-3.5" /> <span>Columns</span>
            </button>
            {showColChooser && (
              <div className="absolute left-0 top-full mt-1 z-30 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-xl p-3 space-y-2 shadow-[var(--shadow-lg)] text-xs min-w-[160px]">
                {columns.map((c, i) => (
                  <label key={i} className="flex items-center gap-2 text-[rgb(var(--text-primary))] cursor-pointer select-none hover:text-[rgb(var(--primary))]">
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(i)}
                      onChange={() =>
                        setVisibleCols(
                          visibleCols.includes(i)
                            ? visibleCols.filter(idx => idx !== i)
                            : [...visibleCols, i]
                        )
                      }
                      className="rounded border-[rgb(var(--border))]"
                    />
                    {c.header}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button onClick={exportCSV} className={controlBtnClass}>
            <Download className="w-3.5 h-3.5" /> <span>Export CSV</span>
          </button>
        </div>

        {/* Right Controls: Show Per Page & Total Count */}
        <div className="flex items-center gap-2.5 shrink-0">
          {meta && onPerPageChange && (
            <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
              <span className="font-medium">Show</span>
              <select
                value={String(meta.per_page || 15)}
                onChange={(e) => {
                  const size = Number(e.target.value)
                  onPerPageChange(size)
                  onPageChange?.(1)
                }}
                className="bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-[rgb(var(--primary))] cursor-pointer font-semibold"
              >
                {[10, 15, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="font-medium">/ page</span>
            </div>
          )}
          <span className="text-xs text-[rgb(var(--text-muted))] whitespace-nowrap bg-[rgb(var(--bg-elevated))] px-2.5 py-1 rounded-lg border border-[rgb(var(--border))]">
            <span className="font-extrabold text-[rgb(var(--text-primary))]">{meta ? meta.total : rows.length}</span> total
          </span>
        </div>
      </div>

      {/* 1. Mobile Card List View (Visible only on mobile screens < sm) */}
      <div className="block sm:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[rgb(var(--primary))] border-t-transparent animate-spin" />
              Loading records...
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
            No records found.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "p-2.5 sm:p-3 rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--bg-surface))] flex items-center justify-between gap-2 shadow-xs transition-all hover:bg-[rgb(var(--bg-elevated))]",
                onRowClick && "cursor-pointer"
              )}
            >
              {/* Col 1: Checkbox + Avatar + Name & Email */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {columns[0] && (
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    {typeof columns[0].accessor === 'function' ? columns[0].accessor(row) : (row[columns[0].accessor as keyof T] as React.ReactNode)}
                  </div>
                )}
                {columns[1] && (
                  <div className="min-w-0 flex-1">
                    {typeof columns[1].accessor === 'function' ? columns[1].accessor(row) : (row[columns[1].accessor as keyof T] as React.ReactNode)}
                  </div>
                )}
              </div>

              {/* Col 2: Role Badge */}
              {columns[2] && (
                <div className="shrink-0 hidden xs:block">
                  {typeof columns[2].accessor === 'function' ? columns[2].accessor(row) : (row[columns[2].accessor as keyof T] as React.ReactNode)}
                </div>
              )}

              {/* Col 3: Status Badge + Subtitle Info (Joined Date) */}
              <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                {columns[3] && (
                  <div>
                    {typeof columns[3].accessor === 'function' ? columns[3].accessor(row) : (row[columns[3].accessor as keyof T] as React.ReactNode)}
                  </div>
                )}
                {columns[5] ? (
                  <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
                    Joined {new Date((row as any).created_at || Date.now()).toLocaleDateString()}
                  </span>
                ) : columns[4] ? (
                  <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
                    {typeof columns[4].accessor === 'function' ? columns[4].accessor(row) : String(row[columns[4].accessor as keyof T] ?? '')}
                  </span>
                ) : null}
              </div>

              {/* Col 4: Action Dropdown Menu Button */}
              {columns.length > 2 && (
                <div onClick={(e) => e.stopPropagation()} className="shrink-0 pl-1">
                  {(() => {
                    const lastCol = columns[columns.length - 1]
                    return typeof lastCol.accessor === 'function'
                      ? lastCol.accessor(row)
                      : (row[lastCol.accessor as keyof T] as React.ReactNode)
                  })()}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 2. Desktop Table View (Hidden on mobile < sm, visible on sm+) */}
      <div className="hidden sm:block enterprise-table-wrapper w-full min-w-0 overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
        <table className="min-w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-[rgb(var(--bg-elevated))] border-b-2 border-[rgb(var(--border))]">
              {columns.map((c, i) => {
                if (!visibleCols.includes(i)) return null
                return (
                  <th
                    key={i}
                    onClick={() => c.sortable && c.sortKey && handleSort(c.sortKey)}
                    className={cn(
                      'px-3 py-2.5 sm:px-4 sm:py-3 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider text-[rgb(var(--text-muted))] whitespace-nowrap',
                      c.sortable ? 'cursor-pointer select-none hover:bg-[rgb(var(--border))] hover:text-[rgb(var(--text-primary))] transition-colors' : ''
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {c.header}
                      {c.sortable && (
                        <ArrowUpDown
                          className={cn(
                            'w-3.5 h-3.5',
                            sortCol === c.sortKey ? 'text-[rgb(var(--primary))]' : 'text-[rgb(var(--text-muted))]'
                          )}
                        />
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[rgb(var(--border))]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-slate-500 dark:text-slate-400 text-center text-[rgb(var(--text-muted))] text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-[rgb(var(--primary))] border-t-transparent animate-spin" />
                    Loading records...
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-slate-500 dark:text-slate-400 text-center text-[rgb(var(--text-muted))] text-sm">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick ? 'cursor-pointer' : '',
                    'hover:bg-[rgb(var(--bg-elevated))]'
                  )}
                >
                  {columns.map((c, i) => {
                    if (!visibleCols.includes(i)) return null
                    return (
                      <td key={i} className="px-3 py-2.5 sm:px-4 sm:py-3 text-[rgb(var(--text-primary))] whitespace-nowrap">
                        {typeof c.accessor === 'function' ? c.accessor(row) : (row[c.accessor] as React.ReactNode)}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && onPageChange && (
        <Pagination
          currentPage={meta.current_page}
          totalPages={meta.last_page || 1}
          totalItems={meta.total}
          perPage={meta.per_page}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          className="border-t border-[rgb(var(--border))]/40 mt-2"
        />
      )}
    </div>
  )
}
