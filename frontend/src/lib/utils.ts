import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ── Class name helper ─────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Bytes formatter ───────────────────────────────────────────────────
export function formatBytes(bytes: number | string | undefined | null, decimals = 1): string {
  if (bytes === undefined || bytes === null || bytes === '') return '0 B'
  if (typeof bytes === 'string') {
    if (/[a-zA-Z]/.test(bytes)) return bytes
    bytes = parseFloat(bytes)
  }
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  if (i < 0 || isNaN(i)) return '0 B'
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

// ── Date formatters ───────────────────────────────────────────────────
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', ...options,
  })
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const timestamp = new Date(dateStr).getTime()
  if (isNaN(timestamp)) return dateStr
  const diff = Date.now() - timestamp
  const sec  = Math.max(0, Math.floor(diff / 1000))
  if (sec < 60)   return 'just now'
  const min  = Math.floor(sec / 60)
  if (min < 60)   return `${min}m ago`
  const hrs  = Math.floor(min / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  const wks  = Math.floor(days / 7)
  if (wks < 4)    return `${wks}w ago`
  const mths = Math.floor(days / 30)
  if (mths < 12)  return `${mths}mo ago`
  return `${Math.floor(mths / 12)}y ago`
}

// ── Number formatters ─────────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function formatPercent(value: number, total: number): string {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

// ── String helpers ────────────────────────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen) + '…'
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── Color helpers ─────────────────────────────────────────────────────
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0 0'
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

// ── Grade color ───────────────────────────────────────────────────────
export function gradeColor(score: number): string {
  if (score >= 90) return 'rgb(var(--success))'
  if (score >= 75) return 'rgb(var(--accent))'
  if (score >= 50) return 'rgb(var(--warning))'
  return 'rgb(var(--error))'
}

// ── File helpers ──────────────────────────────────────────────────────
export function getFileIcon(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('pdf'))   return '📄'
  if (t.includes('ppt'))   return '📊'
  if (t.includes('doc'))   return '📝'
  if (t.includes('xls'))   return '📈'
  if (t.includes('zip'))   return '🗜️'
  if (t.includes('image') || ['jpg','jpeg','png','gif','webp'].some((e) => t.includes(e))) return '🖼️'
  if (['mp4','mov','avi','webm'].some((e) => t.includes(e))) return '🎬'
  return '📎'
}

// ── Debounce ──────────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
}

// ── Sleep ─────────────────────────────────────────────────────────────
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
