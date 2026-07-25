import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCheck, Filter } from 'lucide-react'
import { useNotificationStore } from '@/store'
import { useNotifications, useMarkRead, useMarkAllRead } from '@/api/resources/notifications'
import { Button, Skeleton, EmptyState, Drawer } from '@/components/ui'
import { timeAgo, cn } from '@/lib/utils'
import type { NotificationType } from '@/types'

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Classes', value: 'live_class' },
  { label: 'Assignments', value: 'assignment' },
  { label: 'Exams', value: 'exam' },
  { label: 'Certificates', value: 'certificate' },
  { label: 'Announcements', value: 'announcement' },
]

const NOTIF_ICONS: Record<string, string> = {
  live_class: '📹',
  assignment: '📝',
  exam: '📋',
  certificate: '🏆',
  announcement: '📢',
  default: '🔔',
}

export default function NotificationCentre() {
  const { isOpen, setOpen, activeFilter, setFilter, markRead } = useNotificationStore()
  const { mutate: markReadApi } = useMarkRead()
  const { mutate: markAllReadApi, isPending: markingAll } = useMarkAllRead()
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications(activeFilter)

  const loaderRef = useRef<HTMLDivElement>(null)

  // Infinite scroll observer
  const observe = useCallback(() => {
    if (!loaderRef.current || !hasNextPage) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage()
    }, { threshold: 0.1 })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasNextPage, fetchNextPage])

  useEffect(() => {
    const cleanup = observe()
    return cleanup
  }, [observe])

  const allNotifications = data?.pages.flatMap((p) => p.data) ?? []

  const handleNotifClick = (id: string, read_at: string | null) => {
    if (!read_at) {
      markRead(id)
      markReadApi(id)
    }
  }

  return (
    <Drawer open={isOpen} onClose={() => setOpen(false)} position="right" width="400px">
      <div className="flex flex-col h-full bg-[rgb(var(--bg-surface))] max-w-[100vw] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-[rgb(var(--border))] shrink-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Bell size={18} className="text-[rgb(var(--primary))] shrink-0" />
            <h3 className="font-extrabold text-sm sm:text-base text-[rgb(var(--text-primary))] font-[Outfit] truncate">Notifications</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadApi()}
              loading={markingAll}
              leftIcon={<CheckCheck size={14} />}
              className="text-xs font-semibold px-2 sm:px-3 py-1 cursor-pointer shrink-0"
            >
              <span className="hidden sm:inline">Mark all read</span>
              <span className="inline sm:hidden">Read all</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg cursor-pointer shrink-0">
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-[rgb(var(--border))] scrollbar-hide shrink-0 min-w-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={cn(
                'px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0',
                activeFilter === f.value
                  ? 'bg-[rgb(var(--primary))] text-white shadow-xs'
                  : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]',
              )}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto min-w-0 w-full">
          {isLoading ? (
            <div className="flex flex-col">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3.5 sm:p-4 border-b border-[rgb(var(--border))] min-w-0">
                  <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : allNotifications.length === 0 ? (
            <EmptyState
              icon={<Bell size={28} />}
              title="No notifications"
              description="You're all caught up!"
            />
          ) : (
            <>
              {allNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-3 p-3 sm:p-4 border-b border-[rgb(var(--border))] transition-colors cursor-pointer select-none min-w-0 w-full overflow-hidden',
                    !notif.read_at ? 'bg-[rgb(var(--primary)/0.04)] hover:bg-[rgb(var(--primary)/0.08)]' : 'hover:bg-[rgb(var(--bg-elevated))]'
                  )}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => handleNotifClick(notif.id, notif.read_at)}
                >
                  <div className={cn(
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg flex-shrink-0 shadow-xs',
                    !notif.read_at
                      ? 'bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]'
                      : 'bg-[rgb(var(--bg-elevated))]',
                  )}>
                    {NOTIF_ICONS[notif.icon] ?? NOTIF_ICONS.default}
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-start justify-between gap-1.5 min-w-0">
                      <p className={cn(
                        'text-xs sm:text-sm leading-snug break-words flex-1 min-w-0',
                        !notif.read_at
                          ? 'font-bold text-[rgb(var(--text-primary))]'
                          : 'font-medium text-[rgb(var(--text-secondary))]',
                      )}>
                        {notif.title}
                      </p>
                      {!notif.read_at && (
                        <span className="w-2 h-2 rounded-full bg-[rgb(var(--primary))] shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-[rgb(var(--text-muted))] mt-1 line-clamp-2 break-words">{notif.body}</p>
                    <p className="text-[10px] sm:text-[11px] text-[rgb(var(--text-muted))] mt-1.5 font-mono">{timeAgo(notif.created_at)}</p>
                  </div>
                </motion.div>
              ))}

              <div ref={loaderRef} className="py-4 flex justify-center">
                {isFetchingNextPage && (
                  <div className="w-5 h-5 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Drawer>
  )
}
