import React, { useEffect, useRef, useState } from 'react'
import {
  Mic, MicOff,
  Video, VideoOff,
  PhoneOff, Phone,
  Maximize2, Minimize2,
  Monitor, RefreshCcw,
  FlipHorizontal,
  User
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'

interface AudioVideoCallUIProps {
  status: CallStatus
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isVideo: boolean
  isScreenSharing: boolean
  partnerName: string
  partnerAvatar?: string
  onEnd: () => void
  onAnswer: () => void
  onReject: () => void
  onSwitchCamera: () => void
  onToggleScreenShare: () => void
}

const AudioVideoCallUI: React.FC<AudioVideoCallUIProps> = ({
  status,
  localStream,
  remoteStream,
  isVideo,
  isScreenSharing,
  partnerName,
  partnerAvatar,
  onEnd,
  onAnswer,
  onReject,
  onSwitchCamera,
  onToggleScreenShare,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(!isVideo)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isSwapped, setIsSwapped] = useState(false)
  const [isMirrored, setIsMirrored] = useState(true)
  const [pipPos, setPipPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const dragStart = useRef({ x: 0, y: 0 })
  const dragActive = useRef(false)
  const dragStartTime = useRef(0)

  // Assign streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
      localStream.getAudioTracks().forEach(t => t.enabled = !isMuted)
      localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOff)
    }
  }, [localStream, isMuted, isVideoOff])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Call duration timer
  useEffect(() => {
    if (status === 'connected') {
      const t = setInterval(() => setCallDuration(d => d + 1), 1000)
      return () => clearInterval(t)
    }
  }, [status])

  // Auto-timeout outgoing call after 60s
  useEffect(() => {
    if (status === 'calling') {
      const t = setTimeout(onEnd, 60000)
      return () => clearTimeout(t)
    }
  }, [status, onEnd])

  // Cleanup on unmount
  useEffect(() => () => {
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }, [])

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(t => t.enabled = isMuted)
    setIsMuted(m => !m)
  }

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(t => t.enabled = isVideoOff)
    setIsVideoOff(v => !v)
  }

  const fmtDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  // Touch drag handlers for PiP
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMinimized) return
    dragActive.current = false
    dragStartTime.current = Date.now()
    const t = e.touches[0]
    dragStart.current = { x: t.clientX - pipPos.x, y: t.clientY - pipPos.y }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMinimized) return
    const t = e.touches[0]
    const nx = t.clientX - dragStart.current.x
    const ny = t.clientY - dragStart.current.y
    if (Math.abs(nx - pipPos.x) > 5 || Math.abs(ny - pipPos.y) > 5) {
      dragActive.current = true
      setIsDragging(true)
    }
    if (dragActive.current) setPipPos({ x: nx, y: ny })
  }
  const handleTouchEnd = () => {
    if (isMinimized) return
    if (!dragActive.current && Date.now() - dragStartTime.current < 200) {
      setIsSwapped(p => !p)
      setPipPos({ x: 0, y: 0 })
    }
    dragActive.current = false
    setIsDragging(false)
  }

  if (status === 'idle') return null

  const mainClass = 'absolute inset-0 w-full h-full object-cover z-0 flex items-center justify-center bg-gray-900'
  const pipClass = `absolute shadow-xl border border-white/15 rounded-2xl z-10 overflow-hidden
    ${isMinimized ? 'opacity-0 pointer-events-none' : 'bottom-28 right-3 w-28 h-44 sm:w-36 sm:h-56'}
    ${isDragging ? 'transition-none cursor-grabbing' : 'transition-all duration-300 cursor-grab'}`
  const pipStyle = { transform: `translate(${pipPos.x}px, ${pipPos.y}px)` }

  // Incoming call overlay
  if (status === 'incoming') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      >
        <div className="w-full max-w-xs bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <div className="p-8 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping scale-150" />
              {partnerAvatar ? (
                <img src={partnerAvatar} alt={partnerName} className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/50 relative z-10" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center ring-4 ring-indigo-500/50 relative z-10">
                  <User size={36} className="text-white" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
                {isVideo ? 'Incoming Video Call' : 'Incoming Voice Call'}
              </p>
              <h3 className="text-white text-xl font-bold">{partnerName}</h3>
            </div>
          </div>
          <div className="flex border-t border-white/10">
            <button
              onClick={onReject}
              className="flex-1 py-5 flex flex-col items-center gap-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                <PhoneOff size={22} className="text-white" />
              </div>
              <span className="text-xs font-semibold">Decline</span>
            </button>
            <button
              onClick={onAnswer}
              className="flex-1 py-5 flex flex-col items-center gap-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce">
                <Phone size={22} className="text-white" />
              </div>
              <span className="text-xs font-semibold">Accept</span>
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`fixed z-[100] transition-all duration-300 shadow-2xl overflow-hidden bg-black
      ${isMinimized ? 'bottom-20 right-4 w-44 h-64 rounded-2xl border border-white/20' : 'inset-0 flex flex-col'}`}
    >
      <div className="relative flex-1 w-full h-full">
        {/* Remote / Main */}
        <div
          className={isSwapped ? pipClass : mainClass}
          style={isSwapped ? pipStyle : {}}
          onTouchStart={isSwapped ? handleTouchStart : undefined}
          onTouchMove={isSwapped ? handleTouchMove : undefined}
          onTouchEnd={isSwapped ? handleTouchEnd : undefined}
        >
          {remoteStream && !isVideoOff ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
              {partnerAvatar ? (
                <img src={partnerAvatar} alt={partnerName} className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/30 mb-4" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center ring-4 ring-indigo-500/30 mb-4">
                  <User size={40} className="text-white" />
                </div>
              )}
              <p className="text-white font-bold text-lg">{partnerName}</p>
              <p className="text-white/60 text-sm mt-1 animate-pulse">
                {status === 'calling' ? 'Calling...' : 'Connecting...'}
              </p>
            </div>
          )}
        </div>

        {/* Local / PiP */}
        <div
          className={!isSwapped ? pipClass : mainClass}
          style={!isSwapped ? pipStyle : {}}
          onTouchStart={!isSwapped ? handleTouchStart : undefined}
          onTouchMove={!isSwapped ? handleTouchMove : undefined}
          onTouchEnd={!isSwapped ? handleTouchEnd : undefined}
        >
          <video
            ref={localVideoRef}
            autoPlay playsInline muted
            className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''} ${isVideoOff ? 'hidden' : ''}`}
          />
          <div className={`w-full h-full flex items-center justify-center bg-slate-800 ${!isVideoOff ? 'hidden' : ''}`}>
            <VideoOff size={24} className="text-slate-500" />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMirrored(m => !m) }}
            className="absolute top-1.5 left-1.5 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-20"
            title="Mirror"
          >
            <FlipHorizontal size={12} />
          </button>
        </div>

        {/* Duration + Minimize */}
        {status === 'connected' && !isMinimized && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-sm font-mono font-bold px-3 py-1 rounded-full z-20">
            {fmtDuration(callDuration)}
          </div>
        )}
        <button
          onClick={() => setIsMinimized(m => !m)}
          className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors z-20"
        >
          {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
        </button>
      </div>

      {/* Controls Bar */}
      <div className={`bg-black/80 backdrop-blur-md p-5 pb-8 flex flex-wrap justify-center items-center gap-4 transition-transform
        ${isMinimized ? 'translate-y-full absolute bottom-0 w-full' : 'translate-y-0'}`}
      >
        <CtrlBtn active={isMuted} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </CtrlBtn>
        {isVideo && (
          <>
            <CtrlBtn active={isVideoOff} onClick={toggleVideo} title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}>
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </CtrlBtn>
            <CtrlBtn onClick={onSwitchCamera} title="Switch Camera">
              <RefreshCcw size={22} />
            </CtrlBtn>
            <CtrlBtn active={isScreenSharing} onClick={onToggleScreenShare} title="Share Screen">
              <Monitor size={22} />
            </CtrlBtn>
          </>
        )}
        <button
          onClick={onEnd}
          className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/40 transform hover:scale-105 active:scale-95 transition-all"
          title="End Call"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  )
}

const CtrlBtn: React.FC<{ active?: boolean; onClick: () => void; title: string; children: React.ReactNode }> = ({ active, onClick, title, children }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-full transition-all duration-200 ${
      active ? 'bg-white text-black shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'
    }`}
    title={title}
  >
    {children}
  </button>
)

export default AudioVideoCallUI
