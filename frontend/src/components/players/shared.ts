/**
 * shared.ts — Shared PlayerProps interface and utilities used by all provider players.
 * Every player in this directory must accept PlayerProps and nothing else.
 */

export interface PlayerProps {
  videoUrl: string
  title: string
  /** Lesson ID used for scoped progress keys */
  lessonId?: number
  /** Seconds to seek to on first play (resume position) */
  initialSeekSeconds?: number
  /** Known duration in seconds (pre-populated from DB) */
  durationSeconds?: number
  /** Optional watermark text overlaid on the player */
  watermarkText?: string
  /** Fired every ~1s with current playback position */
  onProgress?: (progress: { currentTime: number; duration: number }) => void
  /** Fired immediately when the user pauses (or tab hidden) */
  onPause?: () => void
  /** Fired when the video reaches the end */
  onEnded?: () => void
}

export function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) return "00:00"
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  const pad = (n: number) => (n < 10 ? "0" + n : String(n))
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
