/**
 * playbackDB.ts — Offline-first IndexedDB store for video playback progress.
 * Falls back to localStorage if IndexedDB is unavailable.
 * Stores: progress (per-lesson position) + sync_queue (pending server uploads)
 */

const DB_NAME = "eduflow_playback"
const DB_VERSION = 1

export interface PlaybackRecord {
  lessonId: number
  watchedSeconds: number
  percentage: number
  updatedAt: number
}

export interface PendingSync {
  lessonId: number
  watchedSeconds: number
  completed: boolean
  timestamp: number
}

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains("progress")) db.createObjectStore("progress", { keyPath: "lessonId" })
      if (!db.objectStoreNames.contains("sync_queue")) db.createObjectStore("sync_queue", { keyPath: "lessonId" })
    }
    req.onsuccess = () => { _db = req.result; resolve(_db) }
    req.onerror  = () => reject(req.error)
  })
}

export async function saveProgress(record: PlaybackRecord): Promise<void> {
  // Always write synchronously to localStorage (instant safety net)
  try {
    localStorage.setItem(`lesson_${record.lessonId}_time`, String(Math.floor(record.watchedSeconds)))
    localStorage.setItem(`lesson_${record.lessonId}_updatedAt`, String(record.updatedAt || Date.now()))
  } catch {}

  // Also write to IndexedDB (async)
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("progress", "readwrite")
      tx.objectStore("progress").put(record)
      tx.oncomplete = () => resolve()
      tx.onerror    = () => reject(tx.error)
    })
  } catch {}
}

export async function getProgress(lessonId: number): Promise<PlaybackRecord | null> {
  let idbRecord: PlaybackRecord | null = null
  try {
    const db = await openDB()
    idbRecord = await new Promise<PlaybackRecord | null>((resolve, reject) => {
      const tx = db.transaction("progress", "readonly")
      const req = tx.objectStore("progress").get(lessonId)
      req.onsuccess = () => resolve((req.result as PlaybackRecord) ?? null)
      req.onerror   = () => reject(req.error)
    })
  } catch {}

  // Check localStorage as well
  const lsSeconds = parseInt(localStorage.getItem(`lesson_${lessonId}_time`) || "0", 10)
  const lsUpdatedAt = parseInt(localStorage.getItem(`lesson_${lessonId}_updatedAt`) || "0", 10)

  if (idbRecord) {
    // Return whichever is newer
    if (lsUpdatedAt > (idbRecord.updatedAt || 0) && lsSeconds > 0) {
      return { lessonId, watchedSeconds: lsSeconds, percentage: 0, updatedAt: lsUpdatedAt }
    }
    return idbRecord
  }

  if (lsSeconds > 0) {
    return { lessonId, watchedSeconds: lsSeconds, percentage: 0, updatedAt: lsUpdatedAt || Date.now() }
  }

  return null
}

export async function clearProgress(lessonId: number): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction("progress", "readwrite")
      tx.objectStore("progress").delete(lessonId)
      tx.oncomplete = () => resolve()
    })
  } catch {}
  localStorage.removeItem(`lesson_${lessonId}_time`)
}

export async function getAllProgress(): Promise<PlaybackRecord[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx  = db.transaction("progress", "readonly")
      const req = tx.objectStore("progress").getAll()
      req.onsuccess = () => resolve((req.result as PlaybackRecord[]) ?? [])
      req.onerror   = () => reject(req.error)
    })
  } catch {
    const results: PlaybackRecord[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("lesson_") && key.endsWith("_time")) {
        const lessonId = parseInt(key.slice(7, -5), 10)
        const seconds  = parseInt(localStorage.getItem(key) || "0", 10)
        if (!isNaN(lessonId) && seconds > 0) results.push({ lessonId, watchedSeconds: seconds, percentage: 0, updatedAt: Date.now() })
      }
    }
    return results
  }
}

export async function queueSync(pending: PendingSync): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction("sync_queue", "readwrite")
      tx.objectStore("sync_queue").put(pending)
      tx.oncomplete = () => resolve()
    })
  } catch {}
}

export async function getPendingQueue(): Promise<PendingSync[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx  = db.transaction("sync_queue", "readonly")
      const req = tx.objectStore("sync_queue").getAll()
      req.onsuccess = () => resolve((req.result as PendingSync[]) ?? [])
      req.onerror   = () => reject(req.error)
    })
  } catch { return [] }
}

export async function removeFromQueue(lessonId: number): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction("sync_queue", "readwrite")
      tx.objectStore("sync_queue").delete(lessonId)
      tx.oncomplete = () => resolve()
    })
  } catch {}
}
