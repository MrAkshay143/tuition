/**
 * PlaybackController.tsx
 * React Context that acts as the central coordinator between:
 *   - Players (emit events via PlaybackEventBus)
 *   - ProgressManager (decides what/when to store)
 *   - SyncQueue (offline retry)
 *   - Server API (sync)
 *
 * CourseDetails wraps with <PlaybackProvider> and calls
 * notifyLessonStart() / notifyLessonClose() to drive the system.
 *
 * Players are pure renderers — they never touch storage directly.
 */
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { PlaybackEventBus } from './PlaybackEventBus'
import { progressManager }  from './ProgressManager'
import { syncQueue }         from './SyncQueue'
import { useAuthStore }      from '@/store'
import { api }               from '@/api/client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlaybackState {
  lessonId:   number | null
  courseId:   number | null
  currentTime: number
  duration:   number
  isPlaying:  boolean
  isBuffering: boolean
}

export interface StartLessonOpts {
  lessonId:         number
  courseId?:        number
  /** Pre-known duration (from lesson metadata). Used for seek validation. */
  knownDuration?:   number
}

export interface PlaybackContextValue {
  state:             PlaybackState
  bus:               PlaybackEventBus
  /** Call when a lesson is selected. Returns validated resume seconds. */
  notifyLessonStart: (opts: StartLessonOpts) => Promise<number>
  /** Call when the player is closed. */
  notifyLessonClose: () => void
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_STATE: PlaybackState = {
  lessonId:   null,
  courseId:   null,
  currentTime: 0,
  duration:   0,
  isPlaying:  false,
  isBuffering: false,
}

const DEFAULT_BUS = new PlaybackEventBus()

const PlaybackContext = createContext<PlaybackContextValue>({
  state:             DEFAULT_STATE,
  bus:               DEFAULT_BUS,
  notifyLessonStart: async () => 0,
  notifyLessonClose: () => {},
})

// ── Provider ──────────────────────────────────────────────────────────────────

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  // Stable refs so event-handler closures always see latest values
  const isAuthRef     = useRef(isAuthenticated)
  const stateRef      = useRef<PlaybackState>(DEFAULT_STATE)
  const debounceRef   = useRef<any>(null)
  const lastSyncedRef = useRef<number>(0)

  useEffect(() => { isAuthRef.current = isAuthenticated }, [isAuthenticated])

  // Stable bus instance — players subscribe/unsubscribe via useEffect
  const bus = useMemo(() => new PlaybackEventBus(), [])

  const [state, setStateRaw] = useState<PlaybackState>(DEFAULT_STATE)
  const setState = useCallback((fn: (s: PlaybackState) => PlaybackState) => {
    setStateRaw((prev) => {
      const next = fn(prev)
      stateRef.current = next
      return next
    })
  }, [])

  // ── API helper ─────────────────────────────────────────────────────────────
  const syncToServer = useCallback(async (
    lessonId: number,
    seconds:  number,
    completed: boolean
  ) => {
    await api.post(`/lessons/${lessonId}/progress`, {
      watch_seconds: Math.floor(seconds),
      position:      Math.floor(seconds),
      completed,
    })
  }, [])

  // ── Bus event subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [

      bus.on('ready', ({ duration }) => {
        setState((s) => ({ ...s, duration }))
      }),

      bus.on('buffering', ({ isBuffering }) => {
        setState((s) => ({ ...s, isBuffering }))
      }),

      bus.on('play', () => {
        setState((s) => ({ ...s, isPlaying: true, isBuffering: false }))
      }),

      bus.on('pause', ({ currentTime }) => {
        setState((s) => ({ ...s, isPlaying: false, currentTime }))
        const { lessonId, duration } = stateRef.current
        if (!lessonId || currentTime < 2) return
        // Immediate save on pause (no debounce)
        progressManager
          .saveAndSync(lessonId, currentTime, isAuthRef.current, syncToServer)
          .catch(() => {})
      }),

      bus.on('seeked', ({ currentTime }) => {
        setState((s) => ({ ...s, currentTime }))
        const { lessonId } = stateRef.current
        if (lessonId) progressManager.save(lessonId, currentTime, stateRef.current.duration)
      }),

      bus.on('ended', ({ currentTime, duration }) => {
        setState((s) => ({ ...s, isPlaying: false }))
        const { lessonId } = stateRef.current
        if (!lessonId) return
        progressManager
          .markComplete(lessonId, duration || currentTime, isAuthRef.current, syncToServer)
          .catch(() => {})
      }),

      bus.on('timeupdate', ({ currentTime, duration }) => {
        stateRef.current = {
          ...stateRef.current,
          currentTime,
          duration: duration || stateRef.current.duration,
        }
        setState((s) => ({ ...s, currentTime, duration: duration || s.duration }))

        const { lessonId } = stateRef.current
        if (!lessonId || currentTime < 2) return

        // Always save to memory + IndexedDB
        progressManager.save(lessonId, currentTime, duration)

        // Debounced server sync: only when ≥5s moved since last sync
        if (isAuthRef.current && Math.abs(currentTime - lastSyncedRef.current) >= 5) {
          clearTimeout(debounceRef.current)
          const capturedId   = lessonId
          const capturedTime = currentTime
          debounceRef.current = setTimeout(async () => {
            lastSyncedRef.current = capturedTime
            try {
              if (!navigator.onLine) {
                await syncQueue.enqueue(capturedId, Math.floor(capturedTime), false)
                return
              }
              await syncToServer(capturedId, capturedTime, false)
            } catch {
              await syncQueue.enqueue(capturedId, Math.floor(capturedTime), false)
            }
          }, 3000)
        }
      }),
    ]

    return () => unsubs.forEach((u) => u())
  }, [bus, setState, syncToServer])

  // ── Emergency save: tab close / visibility ─────────────────────────────────
  useEffect(() => {
    const flush = () => {
      const { lessonId, currentTime } = stateRef.current
      if (lessonId) progressManager.emergencySave(lessonId, currentTime, isAuthRef.current)
    }
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  // ── Online: flush retry queue ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return
    const flushOnline = () =>
      syncQueue.flush((lessonId, seconds, completed) =>
        syncToServer(lessonId, seconds, completed)
      )
    window.addEventListener('online', flushOnline)
    return () => window.removeEventListener('online', flushOnline)
  }, [isAuthenticated, syncToServer])

  // ── Public API ─────────────────────────────────────────────────────────────

  const notifyLessonStart = useCallback(async (opts: StartLessonOpts): Promise<number> => {
    clearTimeout(debounceRef.current)
    lastSyncedRef.current = 0

    // ── Emergency save for active lesson before switching ──
    const prevLessonId = stateRef.current.lessonId
    const prevTime     = stateRef.current.currentTime
    if (prevLessonId && prevLessonId !== opts.lessonId && prevTime > 2) {
      progressManager
        .saveAndSync(prevLessonId, prevTime, isAuthRef.current, syncToServer)
        .catch(() => {})
    }

    // Temporarily null out lessonId so stale events from dying player don't overwrite new lesson
    stateRef.current = { ...stateRef.current, lessonId: null }

    setState(() => ({
      lessonId:    opts.lessonId,
      courseId:    opts.courseId ?? null,
      currentTime: 0,
      duration:    opts.knownDuration ?? 0,
      isPlaying:   false,
      isBuffering: false,
    }))

    const serverFetch = isAuthRef.current
      ? async () => {
          const res = await api.get(`/lessons/${opts.lessonId}/progress`)
          return res?.data ?? null
        }
      : undefined

    return progressManager.getResume(
      opts.lessonId,
      isAuthRef.current,
      opts.knownDuration ?? 0,
      serverFetch
    )
  }, [setState])

  const notifyLessonClose = useCallback(() => {
    clearTimeout(debounceRef.current)
    // ⚠️  DO NOT call bus.clear() — same reason as above.
    setState(() => DEFAULT_STATE)
  }, [setState])

  const value = useMemo<PlaybackContextValue>(
    () => ({ state, bus, notifyLessonStart, notifyLessonClose }),
    [state, bus, notifyLessonStart, notifyLessonClose]
  )

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePlayback(): PlaybackContextValue {
  return useContext(PlaybackContext)
}
