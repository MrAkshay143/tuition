/**
 * GenericEmbedPlayer.tsx
 * Iframe-only fallback for any provider without a postMessage API.
 * Progress is estimated via a visible-tab session timer.
 *
 * ⚠️  BEST-EFFORT TRACKING: This player cannot detect in-player pause,
 * seek, or buffering. Progress estimation assumes continuous playback
 * while the browser tab is visible. Use a provider SDK for exact tracking.
 */
import React, { useEffect, useRef, useState } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import type { PlayerProps } from "./shared"
import { detectProvider } from "@/lib/videoProviders"
import { usePlayback } from "@/lib/PlaybackController"

interface GenericEmbedPlayerProps extends PlayerProps {
  embedUrl?:     string
  providerLabel?: string
}

export default function GenericEmbedPlayer({
  videoUrl, title, initialSeekSeconds, durationSeconds,
  onProgress, onPause, onEnded,
  embedUrl: embedUrlProp, providerLabel,
}: GenericEmbedPlayerProps) {
  const { bus }    = usePlayback()
  const [loaded,   setLoaded]   = useState(false)
  const [showHint, setShowHint] = useState(false)
  const timerRef   = useRef<any>(null)
  const elapsedRef = useRef<number>(initialSeekSeconds ?? 0)
  const dur        = durationSeconds || 0

  const provider   = detectProvider(videoUrl)
  const label      = providerLabel ?? provider.label
  const embedUrl   = embedUrlProp ?? provider.getEmbedUrl(videoUrl, initialSeekSeconds ?? 0)

  useEffect(() => { elapsedRef.current = initialSeekSeconds ?? 0 }, [videoUrl, initialSeekSeconds])

  useEffect(() => {
    if (!loaded) return

    bus.emit("ready", { duration: dur })

    timerRef.current = setInterval(() => {
      if (document.visibilityState === "hidden") return
      elapsedRef.current += 1
      const payload = { currentTime: elapsedRef.current, duration: dur }
      bus.emit("timeupdate", payload)
      onProgress?.(payload)
      if (dur > 0 && elapsedRef.current >= dur * 0.98) {
        clearInterval(timerRef.current)
        bus.emit("ended", payload)
        onEnded?.()
      }
    }, 1000)

    const handleHide = () => {
      if (document.visibilityState === "hidden") {
        bus.emit("pause", { currentTime: elapsedRef.current })
        onPause?.()
      }
    }
    document.addEventListener("visibilitychange", handleHide)
    return () => { clearInterval(timerRef.current); document.removeEventListener("visibilitychange", handleHide) }
  }, [loaded, dur, bus, onProgress, onPause, onEnded])

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-slate-900/10 dark:bg-[#0a0b1e]">
          <Loader2 size={32} className="text-indigo-400 animate-spin" />
          <p className="text-white/50 text-sm">Loading {label}…</p>
        </div>
      )}
      <iframe src={embedUrl} title={title} className="w-full h-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen onLoad={() => setLoaded(true)} />
      {/* Best-effort badge */}
      <button
        onClick={() => setShowHint((v) => !v)}
        className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-medium hover:bg-amber-500/30 transition-colors z-10"
        title="Progress tracking info"
      >
        <AlertTriangle size={9} />
        Best-effort tracking
      </button>
      {showHint && (
        <div className="absolute top-9 left-2 max-w-xs bg-black/80 dark:bg-[#0a0b1e]/95 border border-amber-500/20 rounded-xl p-3 z-20 shadow-2xl text-white/70 text-[11px] leading-relaxed">
          <p className="font-semibold text-amber-400 mb-1">Progress is estimated</p>
          <p>{label} does not expose a real-time playback API without its SDK. Progress assumes continuous playback while this tab is visible. Pausing or seeking inside the player is not detected.</p>
        </div>
      )}
      <div className="absolute bottom-2 right-2 text-[9px] text-white/20 font-mono select-none pointer-events-none uppercase tracking-widest">{label}</div>
    </div>
  )
}
