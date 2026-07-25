/**
 * PlaybackStateStore.ts
 * Persisted Zustand slice for user playback preferences.
 * Restored on every lesson start so users never re-set volume/speed.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const
export type PlaybackRate = (typeof PLAYBACK_RATES)[number]

interface PlaybackPrefsState {
  volume:       number       // 0-100
  muted:        boolean
  playbackRate: PlaybackRate

  setVolume:       (v: number) => void
  setMuted:        (m: boolean) => void
  setPlaybackRate: (r: PlaybackRate) => void
}

export const usePlaybackPrefs = create<PlaybackPrefsState>()(
  persist(
    (set) => ({
      volume:       80,
      muted:        false,
      playbackRate: 1.0,

      setVolume:       (volume)       => set({ volume }),
      setMuted:        (muted)        => set({ muted }),
      setPlaybackRate: (playbackRate) => set({ playbackRate }),
    }),
    {
      name:    'eduflow-playback-prefs',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
