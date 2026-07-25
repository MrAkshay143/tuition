import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ── Button ─────────────────────────────────────────────────
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'outline' | 'success' | 'error'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className, variant = 'primary', size = 'md', loading, disabled,
  leftIcon, rightIcon, children, ...props
}, ref) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    accent: 'btn-accent',
    outline: 'btn btn-secondary border border-[rgb(var(--border-strong))]',
    success: 'btn-primary bg-[rgb(var(--success))] text-white',
    error: 'btn-danger',
  }[variant]

  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    icon: 'btn w-9 h-9 p-0 rounded-[var(--radius-md)]',
  }[size]

  return (
    <button
      ref={ref}
      className={cn('btn', variantClass, sizeClass, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
})
Button.displayName = 'Button'

// ── Input ──────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  hint?: string
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className, error, label, hint, leftElement, rightElement, id, ...props
}, ref) => {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`
  return (
    <div className="form-group">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <div className="relative">
        {leftElement && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]">
            {leftElement}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn('input min-h-[44px]', error && 'input-error', leftElement && '!pl-10', rightElement && '!pr-10', className)}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]">
            {rightElement}
          </div>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  )
})
Input.displayName = 'Input'

// ── Textarea ───────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  className, error, label, id, ...props
}, ref) => {
  const inputId = id ?? `textarea-${Math.random().toString(36).slice(2)}`
  return (
    <div className="form-group">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        className={cn('input resize-none min-h-[100px]', error && 'input-error', className)}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  )
})
Textarea.displayName = 'Textarea'

// ── Select ─────────────────────────────────────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  label?: string
  options?: { value: string | number; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  className, error, label, options, placeholder, id, children, ...props
}, ref) => {
  const inputId = id ?? `select-${Math.random().toString(36).slice(2)}`
  return (
    <div className="form-group">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <select
        ref={ref}
        id={inputId}
        className={cn('input appearance-none cursor-pointer min-h-[44px]', error && 'input-error', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options && options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
        {children}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
})
Select.displayName = 'Select'

// ── Card ───────────────────────────────────────────────────
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  className, glass, padding = 'md', children, ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(glass ? 'card-glass' : 'card', {
      '': padding === 'none',
      'p-4': padding === 'sm',
      'p-5': padding === 'md',
      'p-6': padding === 'lg',
    }, className)}
    {...props}
  >
    {children}
  </div>
))
Card.displayName = 'Card'

// ── Badge ──────────────────────────────────────────────────
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'muted' | 'danger' | 'neutral'
  dot?: boolean
  children?: React.ReactNode
}


export const Badge = ({ className, variant = 'muted', dot, children, ...props }: BadgeProps) => {
  const mappedVariant = variant === 'danger' ? 'error' : variant === 'neutral' ? 'muted' : variant
  return (
    <span className={cn('badge', `badge-${mappedVariant}`, className)} {...props}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-[rgb(var(--primary))]': mappedVariant === 'primary',
          'bg-[rgb(var(--accent-dark))]': mappedVariant === 'accent',
          'bg-[rgb(var(--success))]': mappedVariant === 'success',
          'bg-[rgb(var(--warning))]': mappedVariant === 'warning',
          'bg-[rgb(var(--error))]': mappedVariant === 'error',
          'bg-[rgb(var(--text-muted))]': mappedVariant === 'muted',
        })} />
      )}
      {children}
    </span>
  )
}

// ── Avatar ─────────────────────────────────────────────────
export interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  online?: boolean
}

export const Avatar = ({ src, name = '?', size = 'md', className, online }: AvatarProps) => {
  const sizeClass = `avatar-${size}`
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="relative inline-flex flex-shrink-0">
      <div className={cn('avatar', sizeClass, className)}>
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {online !== undefined && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-[rgb(var(--bg-surface))]',
          size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3',
          online ? 'bg-[rgb(var(--success))]' : 'bg-[rgb(var(--text-muted))]',
        )} />
      )}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('skeleton', className)} {...props} />
)

// ── Spinner ────────────────────────────────────────────────
export const Spinner = ({ size = 20, className }: { size?: number; className?: string }) => (
  <Loader2 size={size} className={cn('animate-spin text-[rgb(var(--primary))]', className)} />
)

// ── Divider ────────────────────────────────────────────────
export const Divider = ({ className }: { className?: string }) => (
  <hr className={cn('divider', className)} />
)

// ── EmptyState ─────────────────────────────────────────────
export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="empty-state">
    {icon && <div className="empty-state-icon">{icon}</div>}
    <div>
      <p className="font-semibold text-[rgb(var(--text-primary))] text-sm">{title}</p>
      {description && <p className="text-[rgb(var(--text-muted))] text-xs mt-1">{description}</p>}
    </div>
    {action}
  </div>
)

// ── StatsCard ──────────────────────────────────────────────
export interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: { value: number; label: string }
  color?: string
  subtitle?: string
}

export const StatsCard = ({ title, value, icon, change, color = 'rgb(var(--primary))', subtitle }: StatsCardProps) => (
  <div className="stat-card group cursor-default">
    <div className="flex items-start justify-between">
      <div
        className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-white flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 12px ${color}40` }}
      >
        {icon}
      </div>
      {change && (
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full',
          change.value >= 0
            ? 'text-[rgb(34,160,74)] bg-[rgb(var(--success))/0.1]'
            : 'text-[rgb(var(--error))] bg-[rgb(var(--error))/0.1]',
        )}>
          {change.value >= 0 ? '+' : ''}{change.value}%
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-[rgb(var(--text-primary))] font-[Outfit]">{value}</p>
      <p className="text-xs text-[rgb(var(--text-muted))] font-medium mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-[rgb(var(--text-muted))] mt-1">{subtitle}</p>}
    </div>
    {change && (
      <p className="text-xs text-[rgb(var(--text-muted))]">{change.label}</p>
    )}
  </div>
)

// ── Toggle / Switch ─────────────────────────────────────────
export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export const Toggle = ({ checked, onChange, label, disabled, size = 'md' }: ToggleProps) => (
  <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
    <div
      className={cn(
        'relative rounded-full transition-all duration-200 flex-shrink-0',
        size === 'sm' ? 'w-8 h-4' : 'w-11 h-6',
        checked ? 'bg-[rgb(var(--primary))]' : 'bg-[rgb(var(--border-strong))]',
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className={cn(
        'absolute top-0.5 rounded-full bg-white shadow transition-transform duration-200',
        size === 'sm' ? 'w-3 h-3 left-0.5' : 'w-5 h-5 left-0.5',
        checked
          ? size === 'sm' ? 'translate-x-4' : 'translate-x-5'
          : 'translate-x-0',
      )} />
    </div>
    {label && <span className="text-sm text-[rgb(var(--text-primary))] font-medium select-none">{label}</span>}
  </label>
)

export { default as PremiumVideoPlayer } from './PremiumVideoPlayer'
export { default as CourseThumbnail } from './CourseThumbnail'

// ── SearchBar ──────────────────────────────────────────────
export interface SearchBarProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export const SearchBar = ({ value, onChange, placeholder = 'Search...', className }: SearchBarProps) => (
  <Input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={cn('w-64', className)}
  />
)

// ── FilterBar ──────────────────────────────────────────────
export interface FilterBarProps {
  options: { value: string; label: string }[]
  active: string
  onChange: (val: string) => void
  className?: string
}

export const FilterBar = ({ options, active, onChange, className }: FilterBarProps) => (
  <div className={cn('flex items-center gap-1 bg-[rgb(var(--bg-elevated))] p-1 rounded-lg border border-[rgb(var(--border))]', className)}>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          'px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
          active === opt.value
            ? 'bg-[rgb(var(--primary))] text-white'
            : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
)
// ── Overlays & Pagination & SEO ────────────────────────────────────
export * from './overlays'
export * from './Pagination'
export * from './SEO'
