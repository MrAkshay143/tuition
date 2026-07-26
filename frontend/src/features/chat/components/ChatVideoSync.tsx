/**
 * ChatVideoSync.tsx — Synchronized video watching panel inside Chat.
 *
 * HOST (teacher/admin):
 *   - Sees the full VideoPlayer with all controls
 *   - Every play/pause/seek fires onSync → parent sends "video-sync" over WebRTC
 *   - Can close the session (sends empty state to viewer)
 *
 * VIEWER (student):
 *   - Sees the same VideoPlayer but controls are blocked (transparent overlay)
 *   - Panel appears/disappears automatically based on incoming sync state
 *   - Receives play/pause/seek commands; player follows them imperatively
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, X, Minimize2, Maximize2,
  Play, Pause, Eye, Radio, Loader2,
  Film, BookOpen
} from 'lucide-react'
import VideoPlayer from '@/components/players'
import { detectProvider } from '@/lib/videoProviders'
import { formatTime } from '@/components/players/shared'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface VideoSyncState {
  videoUrl: string
  videoTitle: string
  mediaId: number
  playing: boolean
  time: number           // current seconds
  lastUpdated: number    // Date.now() — used to detect stale echo
}

export const EMPTY_VIDEO_SYNC: VideoSyncState = {
  videoUrl: '',
  videoTitle: '',
  mediaId: 0,
  playing: false,
  time: 0,
  lastUpdated: 0,
}

const VIDEO_SYNC_THRESHOLD = 2.5  // seconds — seek if drift > this

// ─── SyncedVideoPlayer (the internal player with imperative seek/play/pause) ──

interface SyncedPlayerProps {
  state: VideoSyncState
  isHost: boolean
  onSync: (patch: Partial<VideoSyncState>) => void
}

const SyncedVideoPlayer: React.FC<SyncedPlayerProps> = ({ state, isHost, onSync }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isRemoteUpdate = useRef(false)
  const [localTime, setLocalTime] = useState(state.time)
  const [localDuration, setLocalDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(state.playing)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideControlsTimer = useRef<any>(null)

  // Attach to native video element via DOM query (NativePlayer renders <video>)
  const attachToVideo = useCallback(() => {
    if (!containerRef.current) return null
    const v = containerRef.current.querySelector('video') as HTMLVideoElement | null
    if (v && v !== videoRef.current) {
      videoRef.current = v
      // Attach imperative event listeners
      const onTimeUpdate = () => {
        const t = v.currentTime
        setLocalTime(t)
        if (!isRemoteUpdate.current && isHost) {
          // Host — emit sync every ~1s (throttle via lastUpdated)
          // (fine-grained sync via onProgress below)
        }
      }
      const onPlay = () => {
        setIsPlaying(true)
        if (!isRemoteUpdate.current && isHost) {
          onSync({ playing: true, time: v.currentTime, lastUpdated: Date.now() })
        }
      }
      const onPause = () => {
        setIsPlaying(false)
        if (!isRemoteUpdate.current && isHost) {
          onSync({ playing: false, time: v.currentTime, lastUpdated: Date.now() })
        }
      }
      const onSeeked = () => {
        if (!isRemoteUpdate.current && isHost) {
          onSync({ time: v.currentTime, lastUpdated: Date.now() })
        }
      }
      const onMeta = () => setLocalDuration(v.duration || 0)
      const onWaiting = () => setIsBuffering(true)
      const onCanPlay = () => setIsBuffering(false)
      v.addEventListener('timeupdate', onTimeUpdate)
      v.addEventListener('play', onPlay)
      v.addEventListener('pause', onPause)
      v.addEventListener('seeked', onSeeked)
      v.addEventListener('loadedmetadata', onMeta)
      v.addEventListener('waiting', onWaiting)
      v.addEventListener('canplay', onCanPlay)
      return () => {
        v.removeEventListener('timeupdate', onTimeUpdate)
        v.removeEventListener('play', onPlay)
        v.removeEventListener('pause', onPause)
        v.removeEventListener('seeked', onSeeked)
        v.removeEventListener('loadedmetadata', onMeta)
        v.removeEventListener('waiting', onWaiting)
        v.removeEventListener('canplay', onCanPlay)
      }
    }
    return null
  }, [isHost, onSync])

  // Retry attaching (player renders asynchronously)
  useEffect(() => {
    let cleanup: (() => void) | null = null
    const tryAttach = () => { cleanup = attachToVideo() }
    tryAttach()
    const timer = setInterval(() => { if (!videoRef.current) tryAttach() }, 300)
    return () => { clearInterval(timer); cleanup?.() }
  }, [state.videoUrl, attachToVideo])

  // Apply incoming remote sync state to the local player (viewer or echo correction)
  useEffect(() => {
    const v = videoRef.current
    if (!v || !state.videoUrl) return

    // Apply playing state
    const applyState = async () => {
      isRemoteUpdate.current = true
      try {
        // Seek if needed
        if (Math.abs(v.currentTime - state.time) > VIDEO_SYNC_THRESHOLD) {
          v.currentTime = state.time
        }
        if (state.playing && v.paused) {
          await v.play().catch(() => {})
        } else if (!state.playing && !v.paused) {
          v.pause()
        }
      } finally {
        setTimeout(() => { isRemoteUpdate.current = false }, 800)
      }
    }
    applyState()
  }, [state.playing, state.time, state.lastUpdated])

  // Fullscreen listener
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  const showControls = () => {
    setControlsVisible(true)
    clearTimeout(hideControlsTimer.current)
    if (isPlaying) hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 2500)
  }

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isHost) return
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}) } else { v.pause() }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost) return
    const t = parseFloat(e.target.value)
    if (videoRef.current) videoRef.current.currentTime = t
    setLocalTime(t)
    onSync({ time: t, lastUpdated: Date.now() })
  }

  const toggleFS = () => {
    const el = containerRef.current as any
    try {
      if (document.fullscreenElement) document.exitFullscreen()
      else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)
    } catch {}
  }

  const provider = detectProvider(state.videoUrl)
  const isNative = provider.name === 'native'

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden select-none"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
    >
      {/* The real VideoPlayer (dynamic) */}
      <VideoPlayer
        videoUrl={state.videoUrl}
        title={state.videoTitle}
        autoPlay={state.playing}
        initialSeekSeconds={state.time}
      />

      {/* VIEWER overlay — blocks all controls for students */}
      {!isHost && (
        <div
          className="absolute inset-0 z-50 cursor-not-allowed"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        />
      )}

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 pointer-events-none">
          <Loader2 size={36} className="text-white/80 animate-spin" />
        </div>
      )}

      {/* HOST controls overlay (custom, over the player for fine sync) */}
      {isHost && isNative && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {/* Progress bar */}
          <input
            type="range" min={0} max={localDuration || 100} step={0.1} value={localTime}
            onChange={handleSeek}
            onClick={e => e.stopPropagation()}
            className="w-full h-1 accent-indigo-500 cursor-pointer hover:h-1.5 transition-all mb-2 bg-white/20 rounded-full"
          />
          <div className="flex items-center gap-3 text-white text-xs font-mono">
            <button onClick={togglePlay} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-white" />}
            </button>
            <span className="opacity-70">{formatTime(localTime)} / {formatTime(localDuration)}</span>
            <div className="flex-1" />
            <button onClick={toggleFS} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Student "live" badge */}
      {!isHost && (
        <div className="absolute top-3 left-3 z-40 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-[11px] font-bold pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  )
}

// ─── Main ChatVideoSync ─────────────────────────────────────────────────────

interface ChatVideoSyncProps {
  isHost: boolean
  syncState: VideoSyncState
  onSync: (state: VideoSyncState) => void
  onClose: () => void
  onPickVideo: () => void
  partnerName: string
}

export const ChatVideoSync: React.FC<ChatVideoSyncProps> = ({
  isHost,
  syncState,
  onSync,
  onClose,
  onPickVideo,
  partnerName,
}) => {
  const [isMinimized, setIsMinimized] = useState(false)

  const handleSyncPatch = useCallback((patch: Partial<VideoSyncState>) => {
    onSync({ ...syncState, ...patch })
  }, [syncState, onSync])

  const handleClose = () => {
    // Tell the other side the session ended
    onSync(EMPTY_VIDEO_SYNC)
    onClose()
  }

  const hasVideo = !!syncState.videoUrl

  return (
    <motion.div
      layout
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="border-b border-[rgb(var(--border))] bg-black overflow-hidden"
    >
      {/* Panel header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
            <Monitor size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[rgb(var(--text-primary))] truncate">
              Watch Together
            </p>
            <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">
              {isHost ? (
                hasVideo ? `Watching with ${partnerName}` : `Select a video to share`
              ) : (
                `${partnerName} is controlling playback`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Host controls */}
          {isHost && (
            <button
              onClick={onPickVideo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              title="Change video"
            >
              <Film size={13} />
              {hasVideo ? 'Change' : 'Pick Video'}
            </button>
          )}

          {/* Viewer indicator */}
          {!isHost && hasVideo && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold">
              <Eye size={12} />
              View Only
            </span>
          )}

          <button
            onClick={() => setIsMinimized(m => !m)}
            className="p-1.5 text-slate-400 hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] rounded-xl transition-all cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimise'}
          >
            {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
          </button>

          {isHost && (
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
              title="End watch session"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Video area */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {hasVideo ? (
              <SyncedVideoPlayer
                state={syncState}
                isHost={isHost}
                onSync={handleSyncPatch}
              />
            ) : isHost ? (
              /* Empty state for host — prompt to pick */
              <div className="flex flex-col items-center justify-center py-10 gap-4 bg-gradient-to-b from-slate-900 to-black">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                  <Film size={30} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-sm">No video selected</p>
                  <p className="text-xs text-white/50 mt-1">Pick a video from your media library or course</p>
                </div>
                <button
                  onClick={onPickVideo}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer"
                >
                  <BookOpen size={16} />
                  Select a Video
                </button>
              </div>
            ) : (
              /* Student waiting for host to pick */
              <div className="flex flex-col items-center justify-center py-10 gap-4 bg-gradient-to-b from-slate-900 to-black">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 flex items-center justify-center">
                  <Radio size={28} className="text-indigo-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-sm">Waiting for {partnerName}...</p>
                  <p className="text-xs text-white/50 mt-1">Your teacher will start the video shortly</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ChatVideoSync
