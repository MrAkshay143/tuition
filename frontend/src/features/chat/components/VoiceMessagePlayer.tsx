import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Mic, Music } from 'lucide-react'

interface VoiceMessagePlayerProps {
  src: string
  isMine: boolean
  type?: 'voice' | 'audio'
  fileName?: string
}

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ src, isMine, type = 'voice', fileName }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateProgress = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    }
    const handleLoaded = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadedmetadata', handleLoaded)
    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadedmetadata', handleLoaded)
    }
  }, [src])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (!audioRef.current || !audioRef.current.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * audioRef.current.duration
    setProgress(pct * 100)
    setCurrentTime(pct * audioRef.current.duration)
  }

  const fmt = (t: number) => {
    if (!t || isNaN(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2.5 min-w-[200px] py-1 pr-1 select-none">
      <button
        onClick={togglePlay}
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all shadow-sm ${
          isMine
            ? 'bg-white/20 hover:bg-white/35 text-white'
            : 'bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300'
        }`}
      >
        {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <div
          className="relative w-full h-1.5 rounded-full overflow-hidden cursor-pointer group"
          style={{ background: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.15)' }}
          onClick={handleSeek}
        >
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-100 ${
              isMine ? 'bg-white' : 'bg-indigo-500'
            }`}
            style={{ width: `${progress}%` }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${
              isMine ? 'bg-white' : 'bg-indigo-600'
            }`}
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        <div className={`flex justify-between text-[10px] font-medium tabular-nums ${
          isMine ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
        }`}>
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <div className={`flex flex-col items-center ${isMine ? 'text-white/40' : 'text-slate-400 dark:text-slate-500'}`}>
        {type === 'voice' ? <Mic size={12} /> : <Music size={12} />}
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  )
}

export default VoiceMessagePlayer
