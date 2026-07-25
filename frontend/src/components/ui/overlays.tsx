import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

// ── Modal ──────────────────────────────────────────────────
export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
  closeOnOverlay?: boolean
  description?: string
  className?: string
}

export const Modal = ({
  open, onClose, title, size = 'md', children, footer, closeOnOverlay = true, description, className,
}: ModalProps) => {
  const modalRef = React.useRef<HTMLDivElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const onCloseRef = React.useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCloseRef.current()
      return
    }

    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement as HTMLElement
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), select:not([disabled])'
        )
        if (focusable.length > 0) {
          focusable[0].focus()
        }
      }
    }, 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus()
      }
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeOnOverlay ? onClose : undefined}
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            className={cn(
              'modal',
              'bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] shadow-[var(--shadow-xl)] flex flex-col overflow-hidden',
              'w-full max-w-full sm:max-w-none',
              'mt-auto sm:my-auto',
              'max-h-[88vh] sm:max-h-[calc(100vh-32px)]',
              'rounded-t-[var(--radius-xl)] rounded-b-none sm:rounded-[var(--radius-xl)]',
              size === 'sm' && 'sm:max-w-[420px]',
              size === 'md' && 'sm:max-w-[560px]',
              size === 'lg' && 'sm:max-w-[720px]',
              size === 'xl' && 'sm:max-w-[900px]',
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="modal-header">
                <div>
                  <h2 id="modal-title" className="text-lg font-semibold text-[rgb(var(--text-primary))] font-[Outfit]">
                    {title}
                  </h2>
                  {description && <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">{description}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                  <X size={18} />
                </Button>
              </div>
            )}
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Confirm Modal ──────────────────────────────────────────
export interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  confirmText?: string
  cancelLabel?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'error' | 'secondary' | 'ghost' | 'accent' | 'outline'
  confirmVariant?: string
  loading?: boolean
}

export const ConfirmModal = ({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', confirmText,
  cancelLabel = 'Cancel', cancelText,
  variant = 'danger', confirmVariant,
  loading,
}: ConfirmModalProps) => {
  const finalConfirmLabel = confirmText || confirmLabel
  const finalCancelLabel = cancelText || cancelLabel
  const finalVariant = (confirmVariant || variant) as any

  return (
    <Modal open={open} onClose={onClose} size="sm" title={title}>
      <p className="text-sm text-[rgb(var(--text-secondary))]">{message}</p>
      <div className="flex gap-3 mt-6 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>{finalCancelLabel}</Button>
        <Button variant={finalVariant} onClick={onConfirm} loading={loading}>{finalConfirmLabel}</Button>
      </div>
    </Modal>
  )
}

// ── Drawer ─────────────────────────────────────────────────
export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  position?: 'right' | 'left'
  width?: string
}

export const Drawer = ({
  open, onClose, title, children, position = 'right', width = '400px',
}: DrawerProps) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-[rgb(var(--bg-overlay))] z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 bottom-0 z-60 flex flex-col bg-[rgb(var(--bg-surface))] border-x border-[rgb(var(--border))] w-full md:w-[var(--drawer-width)] max-w-[100vw]"
            style={{ [position]: 0, '--drawer-width': width } as React.CSSProperties}
            initial={{ x: position === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: position === 'right' ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border))]">
                <h3 className="font-semibold text-[rgb(var(--text-primary))] font-[Outfit]">{title}</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X size={18} />
                </Button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Global listener bus to ensure ONLY ONE dropdown is open at a time app-wide
const dropdownOpenListeners = new Set<(activeId: string) => void>()

// ── Dropdown Menu ──────────────────────────────────────────
export type DropdownItem =
  | { divider: true; label?: string; icon?: React.ReactNode; onClick?: undefined; danger?: undefined; disabled?: undefined }
  | { divider?: false; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }

export interface DropdownProps {
  trigger: React.ReactElement
  items: DropdownItem[]
  align?: 'left' | 'right'
  closeOnOutsideClick?: boolean
}

export const Dropdown = ({ trigger, items, align = 'right', closeOnOutsideClick = false }: DropdownProps) => {
  const [open, setOpen] = React.useState(false)
  const [coords, setCoords] = React.useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: false,
  })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const idRef = React.useRef(Math.random().toString(36).substring(2, 9))

  // Close when another dropdown opens
  useEffect(() => {
    const listener = (activeId: string) => {
      if (activeId !== idRef.current) {
        setOpen(false)
      }
    }
    dropdownOpenListeners.add(listener)
    return () => {
      dropdownOpenListeners.delete(listener)
    }
  }, [])

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const placeAbove = spaceBelow < 210 && rect.top > 210

    setCoords({
      top: placeAbove ? rect.top : rect.bottom,
      left: align === 'right' ? rect.right : rect.left,
      placeAbove,
    })
  }, [align])

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open) {
      // Notify all other dropdowns to close immediately
      dropdownOpenListeners.forEach((fn) => fn(idRef.current))
      updateCoords()
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!open) return

    const handleOutsideClick = (e: MouseEvent) => {
      if (!closeOnOutsideClick) return
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }

    if (closeOnOutsideClick) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      if (closeOnOutsideClick) {
        document.removeEventListener('mousedown', handleOutsideClick)
      }
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open, closeOnOutsideClick])

  return (
    <div className="inline-flex" ref={triggerRef}>
      <div onClick={toggleOpen} className="inline-flex cursor-pointer">
        {trigger}
      </div>

      {open &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              className="dropdown"
              style={{
                position: 'fixed',
                top: coords.placeAbove ? 'auto' : `${coords.top + 4}px`,
                bottom: coords.placeAbove ? `${window.innerHeight - coords.top + 4}px` : 'auto',
                left: align === 'right' ? 'auto' : `${coords.left}px`,
                right: align === 'right' ? `${window.innerWidth - coords.left}px` : 'auto',
                zIndex: 999999,
              }}
              initial={{ opacity: 0, scale: 0.95, y: coords.placeAbove ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: coords.placeAbove ? 4 : -4 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
            >
              {items.map((item, i) =>
                item.divider ? (
                  <div key={i} className="h-px bg-[rgb(var(--border))] my-1 mx-1" />
                ) : (
                  <button
                    key={i}
                    className={cn(
                      'dropdown-item w-full text-left',
                      item.danger && 'danger',
                      item.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!item.disabled) {
                        item.onClick?.()
                        setOpen(false)
                      }
                    }}
                    disabled={item.disabled}
                  >
                    {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                    {item.label}
                  </button>
                )
              )}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}

// ── Tooltip ────────────────────────────────────────────────
export const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <div className="tooltip-wrapper">
    {children}
    <div className="tooltip">{content}</div>
  </div>
)
