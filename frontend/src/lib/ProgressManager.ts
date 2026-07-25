/**
 * ProgressManager.ts
 * Central authority for all progress persistence decisions.
 *
 * Storage stack (in order of speed):
 *   1. Memory cache  — O(1), no I/O, lost on page close
 *   2. IndexedDB     — fast async, survives refresh
 *   3. localStorage  — synchronous fallback for beforeunload
 *   4. SyncQueue     — IndexedDB-backed retry queue for offline/API failures
 *   5. Server API    — ground truth for cross-device sync
 *
 * Conflict resolution: "newest timestamp wins" on getResume().
 */
import { saveProgress, getProgress, clearProgress } from './playbackDB'
import { syncQueue } from './SyncQueue'

// ── Types ────────────────────────────────────────────────────────────────────

interface MemoryEntry {
  seconds:    number
  updatedAt:  number  // epoch ms
}

interface ServerProgressRecord {
  watched_seconds: number
  updated_at:      string  // ISO 8601
}

// ── ProgressManager class ─────────────────────────────────────────────────────

export class ProgressManager {
  private readonly _cache = new Map<number, MemoryEntry>()

  // ── Fast path: called on every timeupdate tick ────────────────────────────

  /** Write to memory + IndexedDB. Never throws. Never blocks. */
  save(lessonId: number, currentTime: number, duration: number): void {
    // Memory (synchronous, instant)
    this._cache.set(lessonId, { seconds: currentTime, updatedAt: Date.now() })

    // IndexedDB (async, fire-and-forget)
    const pct = duration > 0 ? (currentTime / duration) * 100 : 0
    saveProgress({
      lessonId,
      watchedSeconds: currentTime,
      percentage:     pct,
      updatedAt:      Date.now(),
    }).catch(() => {})
  }

  // ── Pause / visibility change path: includes server sync ─────────────────

  /** Called immediately on pause. Syncs to server (or queues if offline). */
  async saveAndSync(
    lessonId:        number,
    currentTime:     number,
    isAuthenticated: boolean,
    apiFn:           (lessonId: number, seconds: number, completed: boolean) => Promise<void>
  ): Promise<void> {
    this.save(lessonId, currentTime, 0)

    if (!isAuthenticated || currentTime < 2) return

    try {
      if (!navigator.onLine) {
        await syncQueue.enqueue(lessonId, Math.floor(currentTime), false)
        return
      }
      await apiFn(lessonId, Math.floor(currentTime), false)
    } catch {
      await syncQueue.enqueue(lessonId, Math.floor(currentTime), false)
    }
  }

  // ── Resume position resolution ────────────────────────────────────────────

  /**
   * Returns the best resume position for a lesson.
   *
   * Resolution order:
   *   - Guest: memory cache → IndexedDB
   *   - Auth:  memory cache → IndexedDB ←vs→ server (newest timestamp wins)
   *
   * @returns Validated resume seconds (never negative, never past duration - 3s)
   */
  async getResume(
    lessonId:        number,
    isAuthenticated: boolean,
    duration:        number = 0,
    serverFetchFn?:  () => Promise<ServerProgressRecord | null>
  ): Promise<number> {
    // 1. Memory cache
    const cached = this._cache.get(lessonId)

    // 2. IndexedDB
    const localRecord = await getProgress(lessonId)
    const localSeconds   = localRecord?.watchedSeconds ?? (cached?.seconds ?? 0)
    const localTimestamp = localRecord?.updatedAt       ?? (cached?.updatedAt ?? 0)

    if (!isAuthenticated || !serverFetchFn) {
      return this._validateSeek(localSeconds, duration)
    }

    // 3. Server (auth only — cross-device conflict resolution)
    try {
      const server = await serverFetchFn()
      if (!server) return this._validateSeek(localSeconds, duration)

      const serverSeconds     = server.watched_seconds ?? 0
      const serverTimestampMs = server.updated_at ? new Date(server.updated_at).getTime() : 0

      // Newest timestamp or highest progress wins
      const best = (!serverTimestampMs || localTimestamp >= serverTimestampMs)
        ? Math.max(localSeconds, serverSeconds)
        : serverSeconds

      return this._validateSeek(best, duration)
    } catch {
      // Server unreachable — use local
      return this._validateSeek(localSeconds, duration)
    }
  }

  // ── Completion ────────────────────────────────────────────────────────────

  /** Mark lesson complete. Clears local record and syncs to server. */
  async markComplete(
    lessonId:        number,
    duration:        number,
    isAuthenticated: boolean,
    apiFn:           (lessonId: number, seconds: number, completed: boolean) => Promise<void>
  ): Promise<void> {
    this._cache.delete(lessonId)
    await clearProgress(lessonId).catch(() => {})

    if (!isAuthenticated) return

    const seconds = Math.floor(duration || 0)
    try {
      if (!navigator.onLine) {
        await syncQueue.enqueue(lessonId, seconds, true)
        return
      }
      await apiFn(lessonId, seconds, true)
    } catch {
      await syncQueue.enqueue(lessonId, seconds, true)
    }
  }

  // ── Emergency path: tab close / beforeunload ──────────────────────────────

  /**
   * Synchronous emergency save.
   * Uses localStorage (sync) + fetch keepalive (survives page unload).
   */
  emergencySave(
    lessonId:        number,
    currentTime:     number,
    isAuthenticated: boolean
  ): void {
    if (!lessonId || currentTime < 2) return

    // localStorage — synchronous, always works
    try {
      localStorage.setItem(`lesson_${lessonId}_time`, String(Math.floor(currentTime)))
      localStorage.setItem(`lesson_${lessonId}_updatedAt`, String(Date.now()))
    } catch {}

    // Keepalive fetch — survives page close on most browsers
    if (isAuthenticated) {
      try {
        const base  = (import.meta as any).env?.VITE_API_URL ?? '/api/v1'
        const token = localStorage.getItem('eduflow_token') ?? ''
        fetch(`${base}/lessons/${lessonId}/progress`, {
          method:    'POST',
          keepalive: true,
          headers:   {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            watch_seconds: Math.floor(currentTime),
            position:      Math.floor(currentTime),
          }),
        }).catch(() => {})
      } catch {}
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Clamp resume position to a safe range:
   *   - Never negative
   *   - Never within 3s of end (would instantly trigger 'ended')
   */
  private _validateSeek(seconds: number, duration: number): number {
    if (!seconds || seconds < 2) return 0
    const safeMax = duration > 0 ? Math.max(0, duration - 3) : Infinity
    return Math.min(seconds, safeMax)
  }
}

/** Singleton — import this wherever storage decisions are needed. */
export const progressManager = new ProgressManager()
