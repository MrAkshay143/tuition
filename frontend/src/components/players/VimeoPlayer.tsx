/**
 * VimeoPlayer.tsx - Vimeo player via postMessage.
 * Emits all events via PlaybackEventBus.
 * Applies volume, muted, playbackRate from PlaybackStateStore.
 */
import React, { useEffect, useRef, useState, useCallback } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Loader2 } from "lucide-react"
import CourseThumbnail from "@/components/ui/CourseThumbnail"
import type { PlayerProps } from "./shared"
import { formatTime } from "./shared"
import { VIDEO_PROVIDERS } from "@/lib/videoProviders"
import { usePlayback }       from "@/lib/PlaybackController"
import { usePlaybackPrefs, PLAYBACK_RATES } from "@/lib/PlaybackStateStore"

const vimeoProvider = VIDEO_PROVIDERS.find((p) => p.name === "vimeo")!

export default function VimeoPlayer({
  videoUrl, title, initialSeekSeconds, durationSeconds,
  onProgress, onPause, onEnded,
}: PlayerProps) {
  const { bus }                                      = usePlayback()
  const { volume, muted, playbackRate, setVolume, setMuted, setPlaybackRate } = usePlaybackPrefs()

  const [started,      setStarted]      = useState(true)
  const [active,       setActive]       = useState(false)
  const [playerWidth,  setPlayerWidth]  = useState(0)
  const [currentTime,  setCurrentTime]  = useState<number>(initialSeekSeconds ?? 0)
  const [duration,     setDuration]     = useState<number>(durationSeconds || 0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [buffering,    setBuffering]    = useState(false)
  const [showControls, setShowControls] = useState(true)

  const iframeRef        = useRef<HTMLIFrameElement>(null)
  const containerRef     = useRef<HTMLDivElement>(null)
  const hasSeekedRef     = useRef(false)
  const controlsTimerRef = useRef<any>(null)

  useEffect(() => {
    setStarted(true); setActive(false); hasSeekedRef.current = false
    setCurrentTime(initialSeekSeconds ?? 0); setDuration(durationSeconds || 0)
  }, [videoUrl, initialSeekSeconds, durationSeconds])

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const ro = new ResizeObserver((e) => { for (const x of e) setPlayerWidth(x.contentRect.width) })
    ro.observe(el); return () => ro.disconnect()
  }, [])

  const resetControlsTimer = useCallback(() => {
    setShowControls(true); clearTimeout(controlsTimerRef.current)
    if (active) controlsTimerRef.current = setTimeout(() => setShowControls(false), 2000)
  }, [active])
  useEffect(() => { if (active) resetControlsTimer(); else setShowControls(true) }, [active, resetControlsTimer])

  useEffect(() => {
    const h = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement))
    document.addEventListener("fullscreenchange", h); document.addEventListener("webkitfullscreenchange", h)
    return () => { document.removeEventListener("fullscreenchange", h); document.removeEventListener("webkitfullscreenchange", h) }
  }, [])

  const sendCmd = useCallback((method: string, value?: any) => {
    try { iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ method, value }), "*") } catch {}
  }, [])

  useEffect(() => { if (started) { sendCmd("setVolume", muted ? 0 : volume / 100) } }, [volume, muted, started, sendCmd])
  useEffect(() => { if (started) sendCmd("setPlaybackRate", playbackRate) }, [playbackRate, started, sendCmd])

  useEffect(() => {
    if (!started) return
    const handle = (event: MessageEvent) => {
      try {
        if (typeof event.data !== "string") return
        const data = JSON.parse(event.data)
        if (data.event === "ready") {
          ;["timeupdate","play","pause","finish","bufferstart","bufferend","loaded"].forEach((ev) => sendCmd("addEventListener", ev))
          sendCmd("setVolume", muted ? 0 : volume / 100)
          sendCmd("setPlaybackRate", playbackRate)
          if (!hasSeekedRef.current && initialSeekSeconds && initialSeekSeconds > 0) {
            hasSeekedRef.current = true; sendCmd("seekTo", initialSeekSeconds); setCurrentTime(initialSeekSeconds)
          }
          bus.emit("ready", { duration: 0 })
        } else if (data.event === "loaded" && data.data?.duration) {
          setDuration(data.data.duration); bus.emit("ready", { duration: data.data.duration })
        } else if (data.event === "timeupdate" && data.data) {
          const t = data.data.seconds ?? 0; const d = data.data.duration ?? 0
          setCurrentTime(t); if (d > 0) setDuration(d)
          if (t > 1) { bus.emit("timeupdate", { currentTime: t, duration: d }); onProgress?.({ currentTime: t, duration: d }) }
        } else if (data.event === "play")        { setActive(true);  setBuffering(false); bus.emit("play", {}) }
          else if (data.event === "pause")       { setActive(false); bus.emit("pause", { currentTime }); onPause?.() }
          else if (data.event === "finish")      { setActive(false); bus.emit("ended", { currentTime, duration }); onEnded?.() }
          else if (data.event === "bufferstart") { setBuffering(true);  bus.emit("buffering", { isBuffering: true }) }
          else if (data.event === "bufferend")   { setBuffering(false); bus.emit("buffering", { isBuffering: false }) }
      } catch {}
    }
    window.addEventListener("message", handle)
    return () => window.removeEventListener("message", handle)
  }, [started, initialSeekSeconds, playbackRate, volume, muted, duration, currentTime, bus, onProgress, onPause, onEnded, sendCmd])

  const handleStartPlay = () => { setStarted(true); setActive(true); hasSeekedRef.current = false; setTimeout(() => { sendCmd("play"); if (initialSeekSeconds && initialSeekSeconds > 0) sendCmd("seekTo", initialSeekSeconds) }, 500) }
  const togglePlay = () => {
    if (!started) { handleStartPlay(); return }
    if (active) { sendCmd("pause"); setActive(false); bus.emit("pause", { currentTime }); onPause?.() }
    else        { sendCmd("play");  setActive(true);  bus.emit("play", {}) }
  }
  const toggleMute = () => { if (muted) { sendCmd("setVolume", (volume || 80)/100); setMuted(false) } else { sendCmd("setVolume", 0); setMuted(true) } }
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const v = parseInt(e.target.value, 10); setVolume(v); sendCmd("setVolume", v/100); if (v === 0) setMuted(true); else setMuted(false) }
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { const t = parseFloat(e.target.value); setCurrentTime(t); sendCmd("seekTo", t); bus.emit("seeked", { currentTime: t }) }
  const toggleFullscreen = () => {
    const el = containerRef.current as any
    try { if (document.fullscreenElement || (document as any).webkitFullscreenElement) (document.exitFullscreen || (document as any).webkitExitFullscreen).call(document)
      else (el.requestFullscreen || el.webkitRequestFullscreen).call(el) } catch {}
  }
  const embedUrl = `https://player.vimeo.com/video/${vimeoProvider.extractId(videoUrl) ?? ""}?api=1&autoplay=1&title=0&byline=0&portrait=0`

  return (
    <div ref={containerRef} className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 group select-none" onMouseMove={resetControlsTimer} onMouseLeave={() => active && setShowControls(false)}>
      {!started && (
        <button className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer overflow-hidden z-20 group" onClick={handleStartPlay} aria-label={`Play ${title}`}>
          <CourseThumbnail title={title} className="absolute inset-0 w-full h-full scale-105 group-hover:scale-110 transition-transform duration-700" />
          <span className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className={`${playerWidth < 400 ? "w-12 h-12" : "w-16 h-16"} rounded-full bg-indigo-600/90 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-all border border-white/20 z-30`}>
            <Play size={playerWidth < 400 ? 20 : 28} className="ml-1 fill-white" />
          </div>
        </button>
      )}
      {started && (
        <div className="w-full h-full relative z-10 bg-black overflow-hidden">
          <iframe ref={iframeRef} src={embedUrl} title={title} className="w-full h-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          <div className="absolute inset-0 z-20 cursor-pointer" onClick={togglePlay} />
          {!active && (<div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25 pointer-events-none"><div className="w-14 h-14 rounded-full bg-indigo-600/90 flex items-center justify-center text-white shadow-2xl border border-white/20"><Play size={24} className="ml-1 fill-white" /></div></div>)}
          <div className={`absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-40 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <div className="mb-2"><input type="range" min={0} max={duration > 0 ? duration : 100} step={0.1} value={currentTime} onChange={handleSeek} onClick={(e) => e.stopPropagation()} className="w-full h-1 bg-white/20 dark:bg-[#0c0d24]/20 accent-indigo-500 rounded-lg cursor-pointer hover:h-1.5 transition-all" /></div>
            <div className="flex items-center gap-2.5 w-full text-white text-xs font-mono">
              <button onClick={(e) => { e.stopPropagation(); togglePlay() }} className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-white dark:bg-[#0c0d24]/20 transition-colors flex-shrink-0 cursor-pointer">{active ? <Pause size={16} /> : <Play size={16} className="fill-white" />}</button>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); toggleMute() }} className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-white dark:bg-[#0c0d24]/20 transition-colors cursor-pointer">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
                <input type="range" min={0} max={100} value={muted ? 0 : volume} onChange={handleVolumeChange} onClick={(e) => e.stopPropagation()} className="hidden sm:block w-16 h-1 bg-white/20 dark:bg-[#0c0d24]/20 accent-indigo-500 rounded-lg cursor-pointer" />
              </div>
              <span className="text-[11px] text-white/80">{formatTime(currentTime)} / {formatTime(duration)}</span>
              <div className="flex-1" />
              <select value={playbackRate} onChange={(e) => setPlaybackRate(parseFloat(e.target.value) as any)} onClick={(e) => e.stopPropagation()} className="bg-transparent text-[11px] font-bold cursor-pointer outline-none border-none text-white/80 hover:text-white">
                {PLAYBACK_RATES.map((r) => <option key={r} value={r} className="bg-black">{r}×</option>)}
              </select>
              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen() }} className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-white dark:bg-[#0c0d24]/20 transition-colors flex-shrink-0 cursor-pointer">{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
            </div>
          </div>
        </div>
      )}
      {started && buffering && (<div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center pointer-events-none"><Loader2 size={36} className="text-indigo-400 animate-spin" /></div>)}
    </div>
  )
}
