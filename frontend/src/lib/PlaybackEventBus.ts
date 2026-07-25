/**
 * PlaybackEventBus.ts
 * Lightweight typed event emitter.
 * Players call bus.emit() to report state changes.
 * PlaybackController subscribes and decides what to store/sync.
 * No React dependency — works in any player type.
 */

export type PlaybackEventMap = {
  /** Player is loaded and duration is known. Fire once per video load. */
  ready:      { duration: number }
  /** Video started playing (or resumed after buffering). */
  play:       Record<string, never>
  /** User or player paused the video. */
  pause:      { currentTime: number }
  /** Current playback position updated (~1s intervals). */
  timeupdate: { currentTime: number; duration: number }
  /** User seeked to a new position. */
  seeked:     { currentTime: number }
  /** Video reached the end. */
  ended:      { currentTime: number; duration: number }
  /** Buffering state changed. */
  buffering:  { isBuffering: boolean }
  /** Unrecoverable player error. */
  error:      { message: string }
}

type Handler<T> = (payload: T) => void

export class PlaybackEventBus {
  // Use a symbol tag so the type narrowing in on/off/emit works
  private readonly _listeners: Partial<{
    [K in keyof PlaybackEventMap]: Set<Handler<PlaybackEventMap[K]>>
  }> = {}

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof PlaybackEventMap>(
    event: K,
    handler: Handler<PlaybackEventMap[K]>
  ): () => void {
    if (!this._listeners[event]) {
      this._listeners[event] = new Set() as any
    }
    ;(this._listeners[event] as Set<Handler<PlaybackEventMap[K]>>).add(handler)
    return () => this.off(event, handler)
  }

  /** Unsubscribe a specific handler. */
  off<K extends keyof PlaybackEventMap>(
    event: K,
    handler: Handler<PlaybackEventMap[K]>
  ): void {
    ;(this._listeners[event] as Set<Handler<PlaybackEventMap[K]>> | undefined)
      ?.delete(handler)
  }

  /** Emit an event to all subscribers. Errors in handlers are caught and logged. */
  emit<K extends keyof PlaybackEventMap>(
    event: K,
    payload: PlaybackEventMap[K]
  ): void {
    ;(this._listeners[event] as Set<Handler<PlaybackEventMap[K]>> | undefined)
      ?.forEach((h) => {
        try { h(payload) } catch (e) {
          console.warn(`[PlaybackEventBus] Error in "${event}" handler:`, e)
        }
      })
  }

  /** Remove all listeners (call on component unmount or lesson switch). */
  clear(): void {
    for (const key of Object.keys(this._listeners) as Array<keyof PlaybackEventMap>) {
      delete this._listeners[key]
    }
  }
}

/** Singleton bus instance shared across the app. */
export const globalPlaybackBus = new PlaybackEventBus()
