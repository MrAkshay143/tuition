import { useEffect } from 'react'
import { Toaster, useToasterStore, toast } from 'react-hot-toast'
import Router from '@/router'
import { useThemeStore } from '@/store'
import { PermissionProvider } from '@/contexts/PermissionContext'

export default function App() {
  const { toasts } = useToasterStore()

  // Prevent duplicate toast messages from stacking
  useEffect(() => {
    const visibleToasts = toasts.filter((t) => t.visible)
    const seenMessages = new Set()
    
    visibleToasts.forEach((t) => {
      // Use message content as unique identifier for duplicates
      const msg = t.message ? String(t.message) : ''
      if (msg && seenMessages.has(msg)) {
        toast.dismiss(t.id)
      } else if (msg) {
        seenMessages.add(msg)
      }
    })
  }, [toasts])
  const { theme } = useThemeStore()

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  return (
    <PermissionProvider>
      <Router />
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{ zIndex: 9999999 }}
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgb(var(--bg-surface))',
            color: 'rgb(var(--text-primary))',
            border: '1px solid rgb(var(--border))',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          },
        }}
      />
    </PermissionProvider>
  )
}
