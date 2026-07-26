import React, { useState, useRef, useEffect } from 'react'
import { Mic, X, Send, Square } from 'lucide-react'

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void
  onCancel: () => void
  disabled?: boolean
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel, disabled }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedDuration, setRecordedDuration] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)
  const startTimeRef = useRef<number>(0)

  const startRecording = async () => {
    if (disabled) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : {}
      const recorder = new MediaRecorder(stream, options)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setRecordedBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start(100)
      recorderRef.current = recorder
      startTimeRef.current = Date.now()
      setIsRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state === 'inactive') return
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
    setRecordedDuration(duration)
    recorderRef.current.stop()
    clearInterval(timerRef.current)
    setIsRecording(false)
  }

  const handleSend = () => {
    if (!recordedBlob) return
    onSend(recordedBlob, recordedDuration)
    cleanup()
  }

  const handleCancel = () => {
    if (isRecording) {
      recorderRef.current?.stop()
      clearInterval(timerRef.current)
    }
    cleanup()
    onCancel()
  }

  const cleanup = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setRecordedBlob(null)
    setElapsed(0)
    setIsRecording(false)
  }

  useEffect(() => () => { clearInterval(timerRef.current) }, [])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // Phase 1: recording
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse-border">
        <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-red-400 rounded-full transition-colors" title="Cancel">
          <X size={16} />
        </button>
        <div className="flex items-center gap-1.5 flex-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-red-500">{fmt(elapsed)}</span>
          <span className="text-xs text-slate-400 font-medium">Recording...</span>
        </div>
        <button
          onClick={stopRecording}
          className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md shadow-red-500/30"
          title="Stop recording"
        >
          <Square size={14} className="fill-current" />
        </button>
      </div>
    )
  }

  // Phase 2: preview before send
  if (audioUrl && recordedBlob) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-full">
        <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-red-400 rounded-full transition-colors" title="Discard">
          <X size={16} />
        </button>
        <audio src={audioUrl} controls className="h-6 flex-1 min-w-0" style={{ maxWidth: '160px' }} />
        <span className="text-[10px] font-mono text-[rgb(var(--text-muted))] shrink-0">{fmt(recordedDuration)}</span>
        <button
          onClick={handleSend}
          className="p-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full hover:from-indigo-500 hover:to-violet-500 shadow-md transition-all"
          title="Send voice message"
        >
          <Send size={14} />
        </button>
      </div>
    )
  }

  // Phase 0: idle mic button
  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className="w-9 h-9 rounded-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:opacity-40"
      title="Hold to record voice message"
    >
      <Mic size={16} />
    </button>
  )
}

export default VoiceRecorder
