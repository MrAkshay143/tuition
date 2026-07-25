/**
 * SyncQueue.ts
 * Offline-first progress sync queue with exponential backoff.
 * Wraps the IndexedDB sync_queue from playbackDB with retry logic.
 *
 * Retry schedule (in-memory, resets on page refresh):
 *   attempt 0 → immediate
 *   attempt 1 → 1s
 *   attempt 2 → 2s
 *   attempt 3 → 4s
 *   attempt 4 → 8s
 *   attempt 5 → 16s
 *   attempt 6+ → give up entry (remove from queue)
 */
import { queueSync, getPendingQueue, removeFromQueue } from './playbackDB'

const MAX_RETRIES = 6
const BASE_BACKOFF_MS = 1000

/** In-memory retry state - persists the queue in IndexedDB but tracks retry count in RAM. */
const retryState = new Map<number, { count: number; nextAt: number }>()

function getBackoffMs(attempt: number): number {
  return BASE_BACKOFF_MS * Math.pow(2, Math.min(attempt, MAX_RETRIES))
}

export type SyncApiFn = (
  lessonId: number,
  watchedSeconds: number,
  completed: boolean
) => Promise<void>

class SyncQueue {
  private _isFlushing = false

  /**
   * Add or update an entry. If the lesson already has a pending entry,
   * replaces it with the newer time (deduplication).
   */
  async enqueue(
    lessonId: number,
    watchedSeconds: number,
    completed: boolean
  ): Promise<void> {
    await queueSync({
      lessonId,
      watchedSeconds,
      completed,
      timestamp: Date.now(),
    })
  }

  /**
   * Flush all pending entries against the API.
   * Skips entries that are in their backoff window.
   * Removes entries that exceed MAX_RETRIES.
   */
  async flush(apiFn: SyncApiFn): Promise<void> {
    if (this._isFlushing) return
    if (!navigator.onLine) return
    this._isFlushing = true

    try {
      const pending = await getPendingQueue()
      const now = Date.now()

      for (const item of pending) {
        const retry = retryState.get(item.lessonId) ?? { count: 0, nextAt: 0 }

        // Still in backoff window - skip
        if (now < retry.nextAt) continue

        // Exceeded max retries - remove permanently
        if (retry.count >= MAX_RETRIES) {
          await removeFromQueue(item.lessonId)
          retryState.delete(item.lessonId)
          console.warn(`[SyncQueue] Giving up on lesson ${item.lessonId} after ${MAX_RETRIES} retries`)
          continue
        }

        try {
          await apiFn(item.lessonId, item.watchedSeconds, item.completed)
          await removeFromQueue(item.lessonId)
          retryState.delete(item.lessonId)
        } catch {
          const nextCount = retry.count + 1
          retryState.set(item.lessonId, {
            count: nextCount,
            nextAt: now + getBackoffMs(nextCount),
          })
        }
      }
    } finally {
      this._isFlushing = false
    }
  }

  /** Check if there are any pending entries. */
  async hasPending(): Promise<boolean> {
    const pending = await getPendingQueue()
    return pending.length > 0
  }
}

/** Singleton - import this everywhere. */
export const syncQueue = new SyncQueue()
