/**
 * YTPlayer.tsx
 *
 * Uses the REAL YouTube IFrame API (new YT.Player) — same approach as Echo24x7 TVCustomPlayer.
 * Advantages over postMessage approach:
 *   - playerRef.current.getCurrentTime()  → exact, no estimation
 *   - playerRef.current.getDuration()     → always accurate
 *   - onStateChange                       → precise play/pause/ended/buffering detection
 *   - playerVars: controls:0, disablekb:1, modestbranding:1, iv_load_policy:3 → all chrome hidden
 *
 * Progress is polled every 250ms while playing (same as Echo24x7).
 * All events emitted to PlaybackEventBus for PlaybackController → ProgressManager → SyncQueue.
 * Volume, muted, playbackRate persisted via PlaybackStateStore.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Loader2 } from 'lucide-react'
import type { PlayerProps } from './shared'
import { formatTime } from './shared'
import { VIDEO_PROVIDERS } from '@/lib/videoProviders'
import { usePlayback } from '@/lib/PlaybackController'
import { usePlaybackPrefs, PLAYBACK_RATES } from '@/lib/PlaybackStateStore'
import { loadYouTubeIframeApi } from '@/lib/youtubeApi'

const ytProvider = VIDEO_PROVIDERS.find((p) => p.name === 'youtube')!

export default function YTPlayer({
  videoUrl, title, initialSeekSeconds, durationSeconds, autoPlay,
  onProgress, onPause, onEnded,
}: PlayerProps) {
  const { bus }                                         = usePlayback()
  const { volume, muted, playbackRate,
          setVolume, setMuted, setPlaybackRate }        = usePlaybackPrefs()

  // ── State ─────────────────────────────────────────────────────────────────
  const [started,      setStarted]      = useState(autoPlay ?? true)
  const [active,       setActive]       = useState(false)   // playing
  const [buffering,    setBuffering]    = useState(true)
  const [currentTime,  setCurrentTime]  = useState<number>(initialSeekSeconds ?? 0)
  const [duration,     setDuration]     = useState<number>(durationSeconds || 0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showRates,    setShowRates]    = useState(false)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const playerHostRef    = useRef<HTMLDivElement>(null)   // <div> that YT replaces with <iframe>
  const playerRef        = useRef<any>(null)               // YT.Player instance
  const containerRef     = useRef<HTMLDivElement>(null)
  const pollTimerRef     = useRef<any>(null)
  const controlsTimerRef = useRef<any>(null)
  const isActiveRef      = useRef(true)
  const hasSeekedRef     = useRef(false)
  const durationRef      = useRef(durationSeconds || 0)
  const volumeRef        = useRef(volume)
  const mutedRef         = useRef(muted)
  const rateRef          = useRef(playbackRate)

  // Keep refs in sync with prefs
  useEffect(() => { volumeRef.current  = volume },      [volume])
  useEffect(() => { mutedRef.current   = muted },       [muted])
  useEffect(() => { rateRef.current    = playbackRate },[playbackRate])

  // Reset & Auto-Play when video URL or seek target changes
  useEffect(() => {
    setActive(false); setBuffering(true)
    isActiveRef.current  = true
    hasSeekedRef.current = false
    setCurrentTime(initialSeekSeconds ?? 0)
    durationRef.current = durationSeconds || 0
    setDuration(durationSeconds || 0)
    clearInterval(pollTimerRef.current)

    const vid = ytProvider.extractId(videoUrl) ?? ''
    if (playerRef.current && vid) {
      try {
        const startSec = initialSeekSeconds && initialSeekSeconds > 2 ? Math.floor(initialSeekSeconds) : 0
        playerRef.current.loadVideoById({ videoId: vid, startSeconds: startSec })
        playerRef.current.playVideo?.()
        if (startSec > 0) {
          playerRef.current.seekTo?.(startSec, true)
        }
      } catch (e) {
        console.debug('Failed to load video on URL change:', e)
      }
    }
  }, [videoUrl, initialSeekSeconds, durationSeconds])

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(pollTimerRef.current)
    try { playerRef.current?.destroy?.() } catch {}
    playerRef.current = null
  }, [])

  // Fullscreen change listener
  useEffect(() => {
    const h = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement))
    document.addEventListener('fullscreenchange', h)
    document.addEventListener('webkitfullscreenchange', h)
    return () => {
      document.removeEventListener('fullscreenchange', h)
      document.removeEventListener('webkitfullscreenchange', h)
    }
  }, [])

  // ── Controls auto-hide (2 seconds after playing / mouse move) ────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlsTimerRef.current)
    if (isActiveRef.current) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 2000)
    }
  }, [])

  // ── Poll progress at 250ms while playing (same as Echo24x7) ──────────────
  const startPoll = useCallback(() => {
    clearInterval(pollTimerRef.current)
    pollTimerRef.current = setInterval(() => {
      const p = playerRef.current
      if (!p) return
      try {
        const t = p.getCurrentTime?.() ?? 0
        const d = p.getDuration?.()    ?? durationRef.current
        if (d > 0 && durationRef.current !== d) {
          durationRef.current = d
          setDuration(d)
        }
        setCurrentTime(t)
        if (t > 0) {
          bus.emit('timeupdate', { currentTime: t, duration: d })
          onProgress?.({ currentTime: t, duration: d })
        }
      } catch {}
    }, 250)
  }, [bus, onProgress])

  // ── Apply prefs to live player when they change ───────────────────────────
  useEffect(() => {
    if (!started || !playerRef.current) return
    try {
      if (muted) playerRef.current.mute?.()
      else       { playerRef.current.unMute?.(); playerRef.current.setVolume?.(volume) }
    } catch {}
  }, [volume, muted, started])

  useEffect(() => {
    if (!started || !playerRef.current) return
    try { playerRef.current.setPlaybackRate?.(playbackRate) } catch {}
  }, [playbackRate, started])

  // ── Load YT.Player once started ───────────────────────────────────────────
  useEffect(() => {
    if (!started || !playerHostRef.current) return
    let disposed = false

    setBuffering(true)
    const vid = ytProvider.extractId(videoUrl) ?? ''

    loadYouTubeIframeApi().then((YT: any) => {
      if (disposed || !playerHostRef.current) return

      if (playerRef.current) {
        // Player already exists — load new video at initialSeekSeconds resume position
        try {
          setActive(false); setBuffering(true)
          const startSec = initialSeekSeconds && initialSeekSeconds > 2 ? Math.floor(initialSeekSeconds) : 0
          playerRef.current.loadVideoById({
            videoId: vid,
            startSeconds: startSec,
          })
          playerRef.current.playVideo?.()
          if (startSec > 0) {
            playerRef.current.seekTo?.(startSec, true)
          }
        } catch {}
        return
      }

      try {
        playerRef.current = new YT.Player(playerHostRef.current, {
          videoId: vid,
          playerVars: {
            origin:         typeof window !== 'undefined' ? window.location.origin : undefined,
            autoplay:       1,
            controls:       0,    // hide YouTube controls
            disablekb:      1,    // disable keyboard shortcuts
            fs:             0,    // hide fullscreen button
            modestbranding: 1,    // minimal YouTube branding
            playsinline:    1,
            rel:            0,    // no related videos
            showinfo:       0,
            iv_load_policy: 3,    // hide video annotations
            start:          initialSeekSeconds && initialSeekSeconds > 0 ? Math.floor(initialSeekSeconds) : undefined,
          },
          events: {
            onReady: (e: any) => {
              if (disposed) return
              try {
                const p = e.target
                p.playVideo?.()
                p.unMute?.()
                p.setVolume?.(volumeRef.current)
                if (mutedRef.current) p.mute?.()
                p.setPlaybackRate?.(rateRef.current)
                if (!hasSeekedRef.current && initialSeekSeconds && initialSeekSeconds > 2) {
                  hasSeekedRef.current = true
                  p.seekTo?.(initialSeekSeconds, true)
                }
                const d = p.getDuration?.() || 0
                if (d > 0) { durationRef.current = d; setDuration(d) }
                bus.emit('ready', { duration: d })
              } catch {}
            },
            onStateChange: (e: any) => {
              if (disposed) return
              const YTState = (window as any).YT?.PlayerState
              try {
                switch (e.data) {
                  case YTState?.PLAYING: {
                    isActiveRef.current = true
                    setActive(true); setBuffering(false)
                    bus.emit('play', {})
                    startPoll()
                    resetControlsTimer()
                    break
                  }
                  case YTState?.PAUSED: {
                    clearInterval(pollTimerRef.current)
                    isActiveRef.current = false; setActive(false)
                    const t = playerRef.current?.getCurrentTime?.() ?? 0
                    bus.emit('pause', { currentTime: t })
                    onPause?.()
                    break
                  }
                  case YTState?.ENDED: {
                    clearInterval(pollTimerRef.current)
                    isActiveRef.current = false; setActive(false)
                    const t  = playerRef.current?.getCurrentTime?.() ?? 0
                    const d2 = playerRef.current?.getDuration?.()    ?? durationRef.current
                    bus.emit('ended', { currentTime: t, duration: d2 })
                    onEnded?.()
                    break
                  }
                  case YTState?.BUFFERING: {
                    setBuffering(true)
                    break
                  }
                  case -1: break // unstarted
                }
              } catch {}
            },
            onError: () => {
              setBuffering(false)
            },
          },
        })
      } catch {
        setBuffering(false)
      }
    }).catch(() => {
      setBuffering(false)
    })

    return () => { disposed = true }
  }, [started, videoUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Controls ──────────────────────────────────────────────────────────────
  const handleStartPlay = () => {
    setStarted(true)
    isActiveRef.current = true
  }

  const togglePlay = () => {
    if (!started) { handleStartPlay(); return }
    if (!playerRef.current) return
    if (isActiveRef.current) {
      playerRef.current.pauseVideo?.()
      clearInterval(pollTimerRef.current)
      isActiveRef.current = false; setActive(false)
    } else {
      playerRef.current.playVideo?.()
      isActiveRef.current = true; setActive(true)
      startPoll()
    }
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    if (muted) {
      playerRef.current.unMute?.(); playerRef.current.setVolume?.(volume || 80)
      setMuted(false)
    } else {
      playerRef.current.mute?.()
      setMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10); setVolume(v)
    if (!playerRef.current) return
    playerRef.current.setVolume?.(v)
    if (v === 0) { playerRef.current.mute?.(); setMuted(true) }
    else         { playerRef.current.unMute?.(); setMuted(false) }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    setCurrentTime(t)
    playerRef.current?.seekTo?.(t, true)
    bus.emit('seeked', { currentTime: t })
  }

  const toggleFullscreen = () => {
    const el = containerRef.current as any
    if (!el) return
    try {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement)
        (document.exitFullscreen || (document as any).webkitExitFullscreen).call(document)
      else
        (el.requestFullscreen || el.webkitRequestFullscreen).call(el)
    } catch {}
  }

  const vid  = ytProvider.extractId(videoUrl) ?? ''
  const thumb = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black overflow-hidden select-none"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onMouseLeave={() => { if (isActiveRef.current) setShowControls(false) }}
    >
      {/* ── Thumbnail / play cover ── */}
      {!started && (
        <button
          className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer group z-20"
          onClick={handleStartPlay}
          aria-label={`Play ${title}`}
        >
          <img
            src={thumb}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget
              if (!img.dataset.f) { img.dataset.f = '1'; img.src = `https://i.ytimg.com/vi/${vid}/default.jpg` }
            }}
          />
          <span className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
          <div className="w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-600 flex items-center justify-center text-white shadow-2xl transition-all duration-300 group-hover:scale-110 border border-white/20 z-30">
            <Play size={28} className="ml-1 fill-white" />
          </div>
          {initialSeekSeconds && initialSeekSeconds > 2 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/70 border border-white/10 rounded-full text-white text-[11px] font-mono z-30">
              Resume from {formatTime(initialSeekSeconds)}
            </div>
          )}
        </button>
      )}

      {/* ── YT.Player host + controls (shown after started) ── */}
      {started && (
        <>
          {/*
            Rohit Health Care player pattern:
            width: 100% ensures zero horizontal video cropping.
            height: 180% centered at top:50%, left:50% hides YouTube's top title bar
            and bottom watermark without cutting left/right video content.
          */}
          <div className="youtube-player-host-wrap absolute inset-0 overflow-hidden pointer-events-none">
            <div
              ref={playerHostRef}
              className="youtube-player-host"
              aria-label={title}
            />
          </div>

          {/* Click capture overlay */}
          <div
            className="absolute inset-0 z-20 cursor-pointer"
            onClick={togglePlay}
          />

          {/* Pause overlay icon (no gradient) */}
          {!active && !buffering && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-indigo-600/90 flex items-center justify-center border border-white/20 shadow-2xl">
                <Play size={24} className="ml-1 fill-white text-white" />
              </div>
            </div>
          )}

          {/* Buffering spinner */}
          {buffering && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 pointer-events-none">
              <Loader2 size={36} className="text-indigo-400 animate-spin" />
            </div>
          )}

          {/* Controls bar: Compact TV-style sleek bar on mobile */}
          <div
            className={`absolute inset-x-0 bottom-0 w-full z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div className="w-full bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-sm px-3 sm:px-4 pb-2 sm:pb-2.5 pt-3.5 sm:pt-4 space-y-1.5 sm:space-y-1.5 shadow-xl">
              {/* Thin Timeline bar (full width) with blue progress and blue point */}
              <div className="w-full px-0.5">
                <div className="relative w-full h-[3px] group cursor-pointer flex items-center">
                  {/* Track background */}
                  <div className="absolute inset-0 bg-white/30 dark:bg-[#0c0d24]/30 rounded-full" />
                  {/* Thin Blue Progress fill */}
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  {/* Thin Blue Scrub Point */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/50 transition-transform scale-100 group-hover:scale-125 pointer-events-none"
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration > 0 ? duration : 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Timeline"
                  />
                </div>
              </div>

              {/* TV-Style Compact Buttons row */}
              <div className="flex items-center gap-2 sm:gap-3 text-white text-[12px] font-medium leading-none pt-0.5">
                {/* Play/Pause */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay() }}
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 dark:bg-[#0c0d24]/20 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer flex items-center justify-center shrink-0"
                  aria-label={active ? 'Pause' : 'Play'}
                >
                  {active ? <Pause size={14} className="sm:w-[18px] sm:h-[18px] text-white" /> : <Play size={14} className="sm:w-[18px] sm:h-[18px] fill-white text-white ml-0.5" />}
                </button>

                {/* Mute/Volume */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute() }}
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 dark:bg-[#0c0d24]/20 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Mute"
                >
                  {muted ? <VolumeX size={14} className="sm:w-[18px] sm:h-[18px] text-white" /> : <Volume2 size={14} className="sm:w-[18px] sm:h-[18px] text-white" />}
                </button>

                {/* Volume Slider */}
                <div className="hidden sm:flex items-center relative w-16 h-[4px] group">
                  <div className="absolute inset-0 bg-white/30 dark:bg-[#0c0d24]/30 rounded-full" />
                  <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${muted ? 0 : volume}%` }} />
                  <input
                    type="range" min={0} max={100} value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Volume"
                  />
                </div>

                {/* Time Display */}
                <span className="text-[10px] sm:text-[12px] font-mono font-bold text-white/90 whitespace-nowrap pl-0.5 sm:pl-1 shrink-0">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <div className="flex-1" />

                {/* Speed selector */}
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowRates((v) => !v) }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/10 dark:bg-[#0c0d24]/20 hover:bg-white/25 text-white backdrop-blur-md text-[10px] sm:text-[12px] font-extrabold transition-all cursor-pointer"
                  >
                    {playbackRate}×
                  </button>
                  {showRates && (
                    <div className="absolute bottom-full right-0 mb-1.5 bg-black/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 py-1 min-w-[70px]">
                      {PLAYBACK_RATES.map((r) => (
                        <button
                          key={r}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPlaybackRate(r)
                            playerRef.current?.setPlaybackRate?.(r)
                            setShowRates(false)
                          }}
                          className={`block w-full px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-[12px] text-left transition-colors cursor-pointer ${playbackRate === r ? 'text-blue-400 font-extrabold bg-blue-500/20' : 'text-white/80 hover:bg-white/10'}`}
                        >
                          {r}×
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 dark:bg-[#0c0d24]/20 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Fullscreen"
                >
                  {isFullscreen ? <Minimize2 size={14} className="sm:w-[18px] sm:h-[18px] text-white" /> : <Maximize2 size={14} className="sm:w-[18px] sm:h-[18px] text-white" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
