/**
 * youtubeApi.ts
 * Singleton YouTube IFrame API loader.
 * Same pattern as Echo24x7/New Version/frontend/src/utils/youtube.js
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const win = window as any

let ytApiPromise: Promise<any> | null = null

export function loadYouTubeIframeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window unavailable'))
  if (win.YT?.Player) return Promise.resolve(win.YT)
  if (ytApiPromise) return ytApiPromise

  ytApiPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('YouTube iframe API load timeout (10s)'))
    }, 10_000)

    const previousReady = win.onYouTubeIframeAPIReady
    win.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout)
      try { previousReady?.() } catch {}
      resolve(win.YT)
    }

    if (!document.querySelector('script[data-yt-iframe-api]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.defer = true
      script.dataset.ytIframeApi = 'true'
      script.onerror = () => { clearTimeout(timeout); reject(new Error('Failed to load YouTube iframe API')) }
      document.body.appendChild(script)
    }
  })

  return ytApiPromise
}
