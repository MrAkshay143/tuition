/**
 * NativePlayer.tsx — HTML5 video player.
 * Emits all events via PlaybackEventBus.
 * Applies volume, muted, playbackRate from PlaybackStateStore.
 */
import React, { useEffect, useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Loader2 } from "lucide-react"
import type { PlayerProps } from "./shared"
import { formatTime } from "./shared"
import { usePlayback }       from "@/lib/PlaybackController"
import { usePlaybackPrefs, PLAYBACK_RATES } from "@/lib/PlaybackStateStore"

export default function NativePlayer({
  videoUrl, title, initialSeekSeconds, durationSeconds,
  onProgress, onPause, onEnded,
}: PlayerProps) {
  const { bus }                                                       = usePlayback()
  const { volume, muted, playbackRate, setVolume, setMuted, setPlaybackRate } = usePlaybackPrefs()

  const videoRef     = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [active,       setActive]       = useState(false)
  const [currentTime,  setCurrentTime]  = useState<number>(initialSeekSeconds ?? 0)
  const [duration,     setDuration]     = useState<number>(durationSeconds || 0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [buffering,    setBuffering]    = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [error,        setError]        = useState(false)
  const controlsTimerRef = useRef<any>(null)

  // Apply prefs to video element
  useEffect(() => {
    const v = videoRef.current; if (!v) return
    v.volume = Math.max(0, Math.min(1, volume / 100))
    v.muted  = muted
  }, [volume, muted])
  useEffect(() => {
    const v = videoRef.current; if (!v) return
    v.playbackRate = playbackRate
  }, [playbackRate])

  useEffect(() => {
    const v = videoRef.current; if (!v) return
    v.volume = volume / 100; v.muted = muted; v.playbackRate = playbackRate
    if (initialSeekSeconds && initialSeekSeconds > 0) v.currentTime = initialSeekSeconds
    v.play().catch(() => {})
    setError(false)
  }, [videoUrl, initialSeekSeconds])

  const resetControlsTimer = () => {
    setShowControls(true); clearTimeout(controlsTimerRef.current)
    if (active) controlsTimerRef.current = setTimeout(() => setShowControls(false), 2000)
  }
  useEffect(() => {
    const h = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement))
    document.addEventListener("fullscreenchange", h); document.addEventListener("webkitfullscreenchange", h)
    return () => { document.removeEventListener("fullscreenchange", h); document.removeEventListener("webkitfullscreenchange", h) }
  }, [])

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return
    if (active) { v.pause(); setActive(false) } else { v.play(); setActive(true) }
  }
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !muted; setMuted(!muted) }
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10); setVolume(val)
    const v = videoRef.current; if (!v) return
    v.volume = val / 100; if (val === 0) { setMuted(true); v.muted = true } else { setMuted(false); v.muted = false }
  }
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value); setCurrentTime(t)
    const v = videoRef.current; if (v) { v.currentTime = t; bus.emit("seeked", { currentTime: t }) }
  }
  const toggleFullscreen = () => {
    const el = containerRef.current as any
    try { if (document.fullscreenElement || (document as any).webkitFullscreenElement) (document.exitFullscreen || (document as any).webkitExitFullscreen).call(document)
      else (el.requestFullscreen || el.webkitRequestFullscreen).call(el) } catch {}
  }

  return (
    <div ref={containerRef} className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 group select-none" onMouseMove={resetControlsTimer} onMouseLeave={() => active && setShowControls(false)}>
      <video
        ref={videoRef} src={videoUrl} className="w-full h-full object-contain" playsInline autoPlay
        onPlay       ={() => { setActive(true);  bus.emit("play", {}) }}
        onPause      ={() => { const t = videoRef.current?.currentTime ?? 0; setActive(false); bus.emit("pause", { currentTime: t }); onPause?.() }}
        onEnded      ={() => { const t = videoRef.current?.currentTime ?? 0; const d = videoRef.current?.duration ?? 0; setActive(false); bus.emit("ended", { currentTime: t, duration: d }); onEnded?.() }}
        onWaiting    ={() => { setBuffering(true);  bus.emit("buffering", { isBuffering: true }) }}
        onCanPlay    ={() => { setBuffering(false); bus.emit("buffering", { isBuffering: false }) }}
        onError      ={() => setError(true)}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget; const d = v.duration
          setDuration(d); bus.emit("ready", { duration: d })
          v.playbackRate = playbackRate; v.volume = volume / 100; v.muted = muted
          if (initialSeekSeconds && initialSeekSeconds > 0) v.currentTime = initialSeekSeconds
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget; const t = v.currentTime; const d = v.duration || 0
          setCurrentTime(t)
          if (t > 1) { bus.emit("timeupdate", { currentTime: t, duration: d }); onProgress?.({ currentTime: t, duration: d }) }
        }}
      />
      {error && (<div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 dark:bg-[#0a0b1e] text-white text-sm z-50">Unable to load video. Please check the URL.</div>)}
      {!active && !error && (<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none"><div className="w-14 h-14 rounded-full bg-indigo-600/90 flex items-center justify-center text-white shadow-2xl border border-white/20"><Play size={24} className="ml-1 fill-white" /></div></div>)}
      <div className="absolute inset-0 z-30 cursor-pointer" onClick={togglePlay} />
      <div className={`absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-40 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="mb-2"><input type="range" min={0} max={duration > 0 ? duration : 100} step={0.1} value={currentTime} onChange={handleSeek} onClick={(e) => e.stopPropagation()} className="w-full h-1 bg-white dark:bg-[#0c0d24]/20 accent-indigo-500 rounded-lg cursor-pointer hover:h-1.5 transition-all" /></div>
        <div className="flex items-center gap-2.5 w-full text-white text-xs font-mono">
          <button onClick={(e) => { e.stopPropagation(); togglePlay() }} className="p-1.5 rounded-lg hover:bg-white dark:bg-[#0c0d24]/20 transition-colors flex-shrink-0 cursor-pointer">{active ? <Pause size={16} /> : <Play size={16} className="fill-white" />}</button>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); toggleMute() }} className="p-1.5 rounded-lg hover:bg-white dark:bg-[#0c0d24]/20 transition-colors cursor-pointer">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
            <input type="range" min={0} max={100} value={muted ? 0 : volume} onChange={handleVolumeChange} onClick={(e) => e.stopPropagation()} className="hidden sm:block w-16 h-1 bg-white dark:bg-[#0c0d24]/20 accent-indigo-500 rounded-lg cursor-pointer" />
          </div>
          <span className="text-[11px] text-white/80">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex-1" />
          <select value={playbackRate} onChange={(e) => { const r = parseFloat(e.target.value) as any; setPlaybackRate(r); const v = videoRef.current; if (v) v.playbackRate = r }} onClick={(e) => e.stopPropagation()} className="bg-transparent text-[11px] font-bold cursor-pointer outline-none border-none text-white/80 hover:text-white">
            {PLAYBACK_RATES.map((r) => <option key={r} value={r} className="bg-black">{r}×</option>)}
          </select>
          <button onClick={(e) => { e.stopPropagation(); toggleFullscreen() }} className="p-1.5 rounded-lg hover:bg-white dark:bg-[#0c0d24]/20 transition-colors flex-shrink-0 cursor-pointer">{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        </div>
      </div>
      {buffering && (<div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center pointer-events-none"><Loader2 size={36} className="text-indigo-400 animate-spin" /></div>)}
    </div>
  )
}
