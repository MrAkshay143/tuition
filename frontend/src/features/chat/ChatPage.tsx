import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useConversations,
  useChatThread,
  useSendMessage,
  useMarkChatRead,
  useUpdateMessageStatus,
  useChatPresence
} from '@/api/resources/chat'
import { useMe } from '@/api/resources/auth'
import { WebRTCManager } from '@/lib/WebRTCManager'
import { chatOutbox } from '@/lib/ChatOutbox'
import { Spinner, Avatar, Card, Badge } from '@/components/ui'
import {
  Send, MessageSquare, Search, ArrowLeft, CheckCheck, Clock, Check,
  Sparkles, WifiOff, Paperclip, MoreVertical, Reply, Smile, Trash2,
  Edit2, Pin, Phone, Video, X, AlertCircle, CornerDownRight, Mic,
  Plus, ShieldCheck, Zap, File, Download, Play,
  PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Volume2, Monitor
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'react-hot-toast'
import api from '@/api/client'
import VoiceMessagePlayer from './components/VoiceMessagePlayer'
import VoiceRecorder from './components/VoiceRecorder'
import ImageLightbox from './components/ImageLightbox'
import AudioVideoCallUI, { CallStatus } from './components/AudioVideoCallUI'
import { ChatVideoSync, EMPTY_VIDEO_SYNC } from './components/ChatVideoSync'
import type { VideoSyncState } from './components/ChatVideoSync'
import { ChatVideoPickerDrawer } from './components/ChatVideoPickerDrawer'

// Emoji reactions set
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏']

// Helper: format relative time
const fmtTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

// Helper: is URL a YouTube link
const getYouTubeId = (url: string) => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

// Helper: linkify text
const Linkify: React.FC<{ text: string; isMine: boolean }> = ({ text, isMine }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return (
    <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.match(urlRegex) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline break-all ${isMine ? 'text-blue-200' : 'text-blue-500 dark:text-blue-400'}`}
          >
            {part}
          </a>
        ) : part
      )}
    </p>
  )
}

// Message content renderer
const MessageContent: React.FC<{
  msg: any
  isMine: boolean
  onImageClick: (url: string) => void
}> = ({ msg, isMine, onImageClick }) => {
  const body = msg.body || msg.message || msg.text || ''
  const type = msg.message_type || msg.type || 'text'
  const mediaUrl = msg.media?.url || msg.media_url
  const mediaType = msg.media?.mime_type || msg.file_type || ''
  const fileName = msg.media?.title || msg.file_name || 'File'

  // Deleted
  if (msg.deleted_at || msg.isDeleted) {
    return (
      <p className={`italic text-xs flex items-center gap-1.5 ${isMine ? 'text-white/60' : 'text-slate-500'}`}>
        <Trash2 size={12} /> This message was deleted
      </p>
    )
  }

  // Call log
  if (type === 'call') {
    const isMissed = body.toLowerCase().includes('missed')
    const isOutgoing = isMine
    const Icon = isMissed ? PhoneMissed : (isOutgoing ? PhoneOutgoing : PhoneIncoming)
    return (
      <div className="flex items-center gap-2.5 py-0.5">
        <div className={`p-2 rounded-full ${isMissed ? 'bg-red-500' : isMine ? 'bg-white/20' : 'bg-emerald-500/20'} text-${isMissed ? 'white' : isMine ? 'white' : 'emerald-600'}`}>
          <Icon size={14} />
        </div>
        <div>
          <p className={`text-xs font-bold ${isMissed ? (isMine ? 'text-red-300' : 'text-red-500') : ''}`}>{body}</p>
          {msg.call_duration && (
            <p className={`text-[10px] ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
              Duration: {Math.floor(msg.call_duration / 60)}m {msg.call_duration % 60}s
            </p>
          )}
        </div>
      </div>
    )
  }

  // Voice message
  if (type === 'voice' && mediaUrl) {
    return <VoiceMessagePlayer src={mediaUrl} isMine={isMine} type="voice" />
  }

  // Media/file
  if ((type === 'media' || type === 'file') && mediaUrl) {
    const isImage = mediaType.startsWith('image/')
    const isAudio = mediaType.startsWith('audio/')
    const isVideo = mediaType.startsWith('video/')

    if (isAudio) return <VoiceMessagePlayer src={mediaUrl} isMine={isMine} type="audio" fileName={fileName} />

    if (isImage) {
      return (
        <div
          className="rounded-xl overflow-hidden max-w-[220px] border border-white/10 cursor-pointer hover:opacity-90 transition-opacity shadow-md"
          onClick={() => onImageClick(mediaUrl)}
        >
          <img src={mediaUrl} alt={fileName} className="w-full h-auto object-cover" loading="lazy" />
        </div>
      )
    }

    if (isVideo) {
      return (
        <div className="rounded-xl overflow-hidden max-w-[260px] bg-black border border-white/10 shadow-md">
          <video src={mediaUrl} controls className="w-full h-auto max-h-48" />
        </div>
      )
    }

    // Generic file
    return (
      <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border min-w-[180px] ${
        isMine ? 'bg-black/20 border-white/10' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5'
      }`}>
        <div className={`p-2 rounded-lg ${isMine ? 'bg-white/10' : 'bg-indigo-50 dark:bg-indigo-500/10'}`}>
          <File size={18} className={isMine ? 'text-white/80' : 'text-indigo-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold truncate ${isMine ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{fileName}</p>
          <p className={`text-[10px] uppercase font-bold ${isMine ? 'text-white/50' : 'text-slate-400'}`}>
            {mediaType.split('/')[1] || 'File'}
          </p>
        </div>
        <a
          href={mediaUrl}
          download={fileName}
          onClick={e => e.stopPropagation()}
          className={`p-1.5 rounded-lg transition-colors ${isMine ? 'hover:bg-white/20 text-white' : 'hover:bg-indigo-50 dark:hover:bg-white/10 text-indigo-500'}`}
          title="Download"
        >
          <Download size={14} />
        </a>
      </div>
    )
  }

  // YouTube embed
  const ytId = getYouTubeId(body)
  if (ytId) {
    return (
      <div className="space-y-2 min-w-[200px]">
        <a
          href={body}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative group rounded-xl overflow-hidden aspect-video bg-black border border-white/10 shadow-md"
        >
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt="YouTube video"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play size={20} className="text-white fill-current ml-1" />
            </div>
          </div>
        </a>
        <p className={`text-[10px] truncate ${isMine ? 'text-white/60' : 'text-slate-400'}`}>{body}</p>
      </div>
    )
  }

  // Plain text with linkify
  return <Linkify text={body} isMine={isMine} />
}

// Message status tick
const StatusTick: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'queued': return <span title="Queued offline"><Clock size={12} className="text-amber-400 animate-pulse" /></span>
    case 'sending': return <span title="Sending..."><Clock size={12} className="text-indigo-200 animate-spin" /></span>
    case 'sent': return <span title="Sent"><Check size={12} className="text-indigo-200" /></span>
    case 'delivered': return <span title="Delivered"><CheckCheck size={12} className="text-indigo-200" /></span>
    case 'read': return <span title="Read"><CheckCheck size={12} className="text-cyan-300 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" /></span>
    default: return <Check size={12} className="text-indigo-200" />
  }
}

// ── Main ChatPage ──────────────────────────────────────────────────────────────
export const ChatPage = () => {
  // Core state
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [localMessages, setLocalMessages] = useState<any[]>([])

  // Rich chat states
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [editingMessage, setEditingMessage] = useState<any>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null)
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)
  const [typing, setTyping] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [showSecurityModal, setShowSecurityModal] = useState(false)

  // Video sync state
  const [videoSyncState, setVideoSyncState] = useState<VideoSyncState>(EMPTY_VIDEO_SYNC)
  const [showVideoSync, setShowVideoSync] = useState(false)
  const [showVideoPicker, setShowVideoPicker] = useState(false)

  // Call state
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const screenShareStreamRef = useRef<MediaStream | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const webrtcManagerRef = useRef<WebRTCManager | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const heartbeatRef = useRef<any>(null)
  const typingTimeoutRef = useRef<any>(null)
  const longPressTimerRef = useRef<any>(null)

  // API hooks
  const { data: conversationsData, isLoading: isLoadingConversations } = useConversations()
  const { data: threadData, isLoading: isLoadingThread, refetch: refetchThread } = useChatThread(activePartnerId!)
  const { data: me } = useMe()
  const sendMutation = useSendMessage()
  const markReadMutation = useMarkChatRead()
  const updateStatusMutation = useUpdateMessageStatus()
  const presenceMutation = useChatPresence()

  // Role detection
  const isHost = me?.role === 'teacher' || me?.role === 'admin'

  const conversations = conversationsData || []

  // Filtered conversations
  const filteredConversations = conversations.filter((conv: any) => {
    const matchesSearch =
      conv.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.last_message?.body || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (filterTab === 'unread') return conv.unread_count > 0
    return true
  })

  const activePartner = conversations.find((c: any) => c.partner.id === activePartnerId)?.partner || {
    name: 'Chat Partner', avatar: undefined, id: activePartnerId
  }

  // Sorting
  const sortMessages = (msgs: any[]) =>
    [...msgs].sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime()
      const tB = new Date(b.created_at || 0).getTime()
      if (tA === tB) return (a.uuid || '').localeCompare(b.uuid || '')
      return tA - tB
    })

  // Sync thread data into local messages
  useEffect(() => {
    if (threadData) setLocalMessages(sortMessages(threadData))
  }, [threadData])

  // Auto-scroll
  useEffect(() => {
    const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    return () => clearTimeout(t)
  }, [localMessages.length, typing])

  // Online/offline & visibility
  const syncOfflineData = useCallback(async () => {
    if (!activePartnerId || isOffline) return
    const queued = await chatOutbox.getQueuedMessages()
    for (const msg of queued) {
      if (msg.receiver_id === activePartnerId) {
        sendMutation.mutate({ userId: activePartnerId, data: msg })
        await chatOutbox.removeFromQueue(msg.uuid)
        webrtcManagerRef.current?.send({ type: 'chat', payload: msg })
      }
    }
    refetchThread()
    webrtcManagerRef.current?.fetchPendingSignals()
  }, [activePartnerId, isOffline, refetchThread])

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); syncOfflineData() }
    const handleOffline = () => setIsOffline(true)
    const handleVis = () => {
      const v = document.visibilityState === 'visible'
      setIsPageVisible(v)
      if (v) syncOfflineData()
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVis)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVis)
    }
  }, [syncOfflineData])

  // Heartbeat
  useEffect(() => {
    if (activePartnerId && isPageVisible && !isOffline) {
      heartbeatRef.current = setInterval(() => {
        webrtcManagerRef.current?.fetchPendingSignals()
        presenceMutation.mutate()
      }, 60000)
    }
    return () => clearInterval(heartbeatRef.current)
  }, [activePartnerId, isPageVisible, isOffline])

  // Read receipt observer
  useEffect(() => {
    if (!activePartnerId || isOffline) return
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const uuid = entry.target.getAttribute('data-uuid')
          const senderId = Number(entry.target.getAttribute('data-sender'))
          if (uuid && senderId === activePartnerId) {
            updateStatusMutation.mutate({ uuid, status: 'read' })
            webrtcManagerRef.current?.send({ type: 'receipt', payload: { uuid, status: 'read' } })
            observerRef.current?.unobserve(entry.target)
          }
        }
      })
    }, { threshold: 0.5 })
    return () => observerRef.current?.disconnect()
  }, [activePartnerId, isOffline])

  // Attach observer to messages
  useEffect(() => {
    if (observerRef.current) {
      document.querySelectorAll('.chat-msg-bubble').forEach(n => observerRef.current?.observe(n))
    }
  }, [localMessages])

  // WebRTC setup
  useEffect(() => {
    if (!activePartnerId) return
    markReadMutation.mutate(activePartnerId)

    const onWebRTCMessage = (data: any) => {
      switch (data.type) {
        case 'chat':
          setLocalMessages(prev => sortMessages([...prev, data.payload]))
          webrtcManagerRef.current?.send({ type: 'receipt', payload: { uuid: data.payload.uuid, status: 'delivered' } })
          updateStatusMutation.mutate({ uuid: data.payload.uuid, status: 'delivered' })
          break
        case 'receipt':
          setLocalMessages(prev => prev.map(m => m.uuid === data.payload.uuid ? { ...m, status: data.payload.status } : m))
          break
        case 'typing':
          setTyping(data.payload.isTyping)
          if (data.payload.isTyping) {
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => setTyping(false), 3500)
          }
          break
        case 'action':
          refetchThread()
          break
        case 'call-offer':
          setCallStatus('incoming')
          setIsVideoCall(data.payload.isVideo)
          break
        case 'call-answer':
          setCallStatus('connected')
          break
        case 'call-reject':
          toast('Call declined')
          endCall()
          break
        case 'call-end':
          endCall()
          break
        case 'video-sync':
          // Student receives sync from teacher
          if (!isHost) {
            setVideoSyncState(data.payload)
            if (data.payload.videoUrl) setShowVideoSync(true)
            else { setShowVideoSync(false); setVideoSyncState(EMPTY_VIDEO_SYNC) }
          }
          break
      }
    }

    webrtcManagerRef.current = new WebRTCManager(activePartnerId.toString(), onWebRTCMessage)
    webrtcManagerRef.current.connect(true)
    webrtcManagerRef.current.fetchPendingSignals()
    return () => {
      webrtcManagerRef.current?.disconnect()
      endCall()
      // Clean up video sync when switching chats
      setShowVideoSync(false)
      setVideoSyncState(EMPTY_VIDEO_SYNC)
    }
  }, [activePartnerId])

  // Close context menu on outside click
  useEffect(() => {
    if (!showContextMenu) return
    const handler = () => setShowContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showContextMenu])

  // ── Handlers ──

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    webrtcManagerRef.current?.send({ type: 'typing', payload: { isTyping: e.target.value.length > 0 } })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activePartnerId) return

    if (editingMessage) {
      const targetId = editingMessage.uuid || editingMessage.id
      await api.patch(`/chat/messages/action/${targetId}`, { action: 'edit', payload: message })
      webrtcManagerRef.current?.send({ type: 'action', payload: { action: 'edit' } })
      refetchThread()
      setEditingMessage(null)
      setMessage('')
      toast.success('Message updated')
      return
    }

    const newMsg = {
      uuid: uuidv4(),
      body: message,
      message,
      sender_id: 0, // replaced by server
      receiver_id: activePartnerId,
      reply_to_message_uuid: replyingTo?.uuid || replyingTo?.id,
      status: isOffline ? 'queued' : 'sending',
      created_at: new Date().toISOString(),
    }

    setLocalMessages(prev => sortMessages([...prev, newMsg]))
    setMessage('')
    setReplyingTo(null)
    setShowInputEmojiPicker(false)

    if (isOffline) {
      await chatOutbox.enqueue(newMsg)
      toast('Queued — will send when back online', { icon: '📴' })
      return
    }

    webrtcManagerRef.current?.send({ type: 'chat', payload: { ...newMsg, status: 'sent' } })
    sendMutation.mutate(
      { userId: activePartnerId, data: { message: newMsg.message, uuid: newMsg.uuid, reply_to_message_uuid: newMsg.reply_to_message_uuid } as any },
      { onSuccess: () => setLocalMessages(prev => prev.map(m => m.uuid === newMsg.uuid ? { ...m, status: 'sent' } : m)) }
    )
  }

  const handleVoiceSend = async (blob: Blob, duration: number) => {
    if (!activePartnerId) return
    setShowVoiceRecorder(false)
    const formData = new FormData()
    formData.append('file', blob, `voice-${Date.now()}.webm`)
    formData.append('type', 'voice')
    try {
      // Step 1: Upload media
      const uploadRes = await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const mediaId = uploadRes.data?.data?.id || uploadRes.data?.id
      if (!mediaId) throw new Error('Media upload failed')
      // Step 2: Send message with media_id
      const res = await api.post(`/chat/messages/${activePartnerId}`, { message: '🎤 Voice message', type: 'voice', media_id: mediaId, uuid: uuidv4() })
      const savedMsg = res.data?.data || res.data
      setLocalMessages(prev => sortMessages([...prev, { ...savedMsg, message_type: 'voice', status: 'sent' }]))
      webrtcManagerRef.current?.send({ type: 'action', payload: { action: 'new_voice' } })
    } catch (err) {
      toast.error('Failed to send voice message')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activePartnerId) return
    e.target.value = ''
    try {
      const formData = new FormData()
      formData.append('file', file)
      toast.loading('Uploading...', { id: 'upload' })
      const uploadRes = await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const mediaId = uploadRes.data?.data?.id || uploadRes.data?.id
      if (!mediaId) throw new Error('Upload failed')
      const res = await api.post(`/chat/messages/${activePartnerId}`, { message: file.name, type: 'media', media_id: mediaId, uuid: uuidv4() })
      const savedMsg = res.data?.data || res.data
      setLocalMessages(prev => sortMessages([...prev, { ...savedMsg, status: 'sent' }]))
      webrtcManagerRef.current?.send({ type: 'action', payload: { action: 'new_file' } })
      toast.success('File sent', { id: 'upload' })
    } catch {
      toast.error('Upload failed', { id: 'upload' })
    }
  }

  const handleAction = async (uuid: string, action: string, payload?: any) => {
    if (!uuid) return
    await api.patch(`/chat/messages/action/${uuid}`, { action, payload })
    webrtcManagerRef.current?.send({ type: 'action', payload: { action } })
    setShowContextMenu(null)
    setShowEmojiPickerFor(null)
    refetchThread()
    if (action === 'pin') toast.success('Message pinned')
    if (action === 'delete') toast.success('Message deleted')
  }

  const handleLongPress = (id: string) => {
    setSelectionMode(true)
    setSelectedIds(prev => new Set([...prev, id]))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      if (s.size === 0) setSelectionMode(false)
      return s
    })
  }

  const exitSelection = () => { setSelectionMode(false); setSelectedIds(new Set()) }

  const deleteSelected = async () => {
    for (const id of selectedIds) {
      await api.patch(`/chat/messages/action/${id}`, { action: 'delete', payload: 'me' })
    }
    refetchThread()
    exitSelection()
    toast.success(`${selectedIds.size} message(s) deleted`)
  }

  // ── Call handlers ──
  const startCall = async (withVideo: boolean) => {
    if (!activePartnerId) return
    setIsVideoCall(withVideo)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo })
      setLocalStream(stream)
      setCallStatus('calling')
      webrtcManagerRef.current?.send({ type: 'call-offer', payload: { isVideo: withVideo } })
    } catch {
      toast.error('Could not access microphone/camera')
    }
  }

  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoCall })
      setLocalStream(stream)
      setCallStatus('connected')
      webrtcManagerRef.current?.send({ type: 'call-answer', payload: {} })
    } catch {
      toast.error('Could not access microphone/camera')
    }
  }

  const rejectCall = () => {
    webrtcManagerRef.current?.send({ type: 'call-reject', payload: {} })
    endCall()
  }

  const endCall = () => {
    localStream?.getTracks().forEach(t => t.stop())
    screenShareStreamRef.current?.getTracks().forEach(t => t.stop())
    setLocalStream(null)
    setRemoteStream(null)
    setCallStatus('idle')
    setIsScreenSharing(false)
    webrtcManagerRef.current?.send({ type: 'call-end', payload: {} })
  }

  const switchCamera = async () => {
    if (!localStream) return
    const track = localStream.getVideoTracks()[0]
    const constraints = track?.getConstraints()
    const newFacing = constraints?.facingMode === 'environment' ? 'user' : 'environment'
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacing }, audio: true })
      const newTrack = newStream.getVideoTracks()[0]
      if (track) localStream.removeTrack(track)
      localStream.addTrack(newTrack)
      setLocalStream(new MediaStream([...localStream.getAudioTracks(), newTrack]))
    } catch { toast.error('Could not switch camera') }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenShareStreamRef.current?.getTracks().forEach(t => t.stop())
      setIsScreenSharing(false)
    } else {
      try {
        const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true })
        screenShareStreamRef.current = screenStream
        setIsScreenSharing(true)
        screenStream.getVideoTracks()[0].onended = () => setIsScreenSharing(false)
      } catch { toast.error('Screen sharing not supported or denied') }
    }
  }

  // ── Video sync handlers ──
  const handleVideoSync = useCallback((state: VideoSyncState) => {
    setVideoSyncState(state)
    // Broadcast to peer
    webrtcManagerRef.current?.send({ type: 'video-sync', payload: state })
    if (!state.videoUrl) {
      setShowVideoSync(false)
      setVideoSyncState(EMPTY_VIDEO_SYNC)
    }
  }, [])

  const handleVideoPickerSelect = useCallback((item: any) => {
    const newState: VideoSyncState = {
      videoUrl: item.url,
      videoTitle: item.title || 'Video',
      mediaId: item.id,
      playing: true,
      time: 0,
      lastUpdated: Date.now(),
    }
    setVideoSyncState(newState)
    setShowVideoSync(true)
    setShowVideoPicker(false)
    // Broadcast immediately so student gets the video
    webrtcManagerRef.current?.send({ type: 'video-sync', payload: newState })
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Audio/Video Call UI (portal-style overlay) */}
      <AnimatePresence>
        {callStatus !== 'idle' && (
          <AudioVideoCallUI
            status={callStatus}
            localStream={localStream}
            remoteStream={remoteStream}
            isVideo={isVideoCall}
            isScreenSharing={isScreenSharing}
            partnerName={activePartner?.name || 'Partner'}
            partnerAvatar={activePartner?.avatar}
            onEnd={endCall}
            onAnswer={answerCall}
            onReject={rejectCall}
            onSwitchCamera={switchCamera}
            onToggleScreenShare={toggleScreenShare}
          />
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      <div className="max-w-[1500px] mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] lg:h-[calc(100vh-120px)] -m-3 md:m-0 flex md:gap-4 p-0 md:p-4 font-[Outfit]">

        {/* ── LEFT: Conversation List Sidebar ─────────────────────────────── */}
        <Card className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col overflow-hidden border-0 md:border md:border-[rgb(var(--border))] shadow-none md:shadow-xl bg-[rgb(var(--bg-surface))] backdrop-blur-xl transition-all duration-300 rounded-none md:rounded-3xl h-full ${activePartnerId ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Sidebar Header */}
          <div className="p-4 sm:p-5 border-b border-[rgb(var(--border))] space-y-3 bg-gradient-to-b from-[rgb(var(--primary)/0.05)] to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-[rgb(var(--text-primary))] tracking-tight">Messages</h2>
                  <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live
                  </span>
                </div>
              </div>
              <Badge variant="neutral" className="text-xs font-mono">{conversations.length} Chats</Badge>
            </div>

            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))] group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-9 py-2.5 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 p-1 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] text-xs font-semibold">
              {(['all', 'unread'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg capitalize transition-all duration-200 ${
                    filterTab === tab ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm' : 'text-[rgb(var(--text-secondary))]'
                  }`}
                >
                  {tab === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 scrollbar-thin scrollbar-thumb-[rgb(var(--border))]">
            {isLoadingConversations ? (
              <div className="p-12 flex flex-col items-center gap-3 text-[rgb(var(--text-muted))]">
                <Spinner />
                <span className="text-xs font-medium animate-pulse">Loading chats...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[rgb(var(--bg-elevated))] flex items-center justify-center text-slate-400">
                  <MessageSquare size={20} />
                </div>
                <p className="font-semibold text-sm text-[rgb(var(--text-primary))]">No conversations found</p>
                <p className="text-xs text-[rgb(var(--text-muted))] max-w-[200px]">
                  {searchQuery ? 'Try a different search.' : 'You have no active chats yet.'}
                </p>
              </div>
            ) : filteredConversations.map((conv: any) => {
              const isSelected = activePartnerId === conv.partner.id
              const hasUnread = conv.unread_count > 0
              return (
                <motion.div
                  key={conv.partner.id}
                  whileHover={{ scale: 0.997 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActivePartnerId(conv.partner.id)}
                  className={`relative flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-transparent border-indigo-500/30 shadow-sm'
                      : 'hover:bg-[rgb(var(--bg-elevated))] border-transparent hover:border-[rgb(var(--border))]'
                  }`}
                >
                  {isSelected && (
                    <motion.div layoutId="activeBar" className="absolute left-0 top-3 bottom-3 w-1.5 bg-gradient-to-b from-indigo-600 to-violet-600 rounded-r-full shadow-md shadow-indigo-500/50" />
                  )}
                  <div className="relative shrink-0">
                    <Avatar src={conv.partner.avatar} name={conv.partner.name} size="md" className="ring-2 ring-white dark:ring-slate-800 shadow-sm" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-indigo-500 font-extrabold' : 'text-[rgb(var(--text-primary))]'}`}>
                        {conv.partner.name}
                      </h4>
                      {conv.last_message && (
                        <span className="text-[10px] font-mono text-[rgb(var(--text-muted))] shrink-0 ml-1">
                          {fmtTime(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${hasUnread ? 'font-bold text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-muted))]'}`}>
                        {conv.last_message?.body || conv.last_message?.message || <span className="italic opacity-60">No messages yet</span>}
                      </p>
                      {hasUnread && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-[10px] flex items-center justify-center shadow-md shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>

        {/* ── RIGHT: Active Chat Area ─────────────────────────────────────── */}
        <Card className={`flex-1 flex flex-col overflow-hidden border-0 md:border md:border-[rgb(var(--border))] shadow-none md:shadow-2xl bg-[rgb(var(--bg-surface))] backdrop-blur-2xl rounded-none md:rounded-3xl relative h-full ${!activePartnerId ? 'hidden md:flex' : 'flex'}`}>

          {!activePartnerId ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[rgb(var(--bg-surface))] via-[rgb(var(--bg-elevated))] to-[rgb(var(--bg-surface))]">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, type: 'spring' }} className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 transform -rotate-6">
                  <MessageSquare size={44} />
                </div>
              </motion.div>
              <h3 className="text-2xl font-black text-[rgb(var(--text-primary))] mb-2">EduFlow Messages</h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mb-6 leading-relaxed">
                Connect with teachers, students, and peers instantly. Send messages, voice notes, files, and start audio/video calls.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold text-[rgb(var(--text-muted))]">
                <span className="px-3.5 py-1.5 rounded-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-1.5"><ShieldCheck size={13} className="text-indigo-500" /> Encrypted</span>
                <span className="px-3.5 py-1.5 rounded-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-1.5"><Zap size={13} className="text-amber-500" /> P2P Realtime</span>
                <span className="px-3.5 py-1.5 rounded-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-1.5"><Volume2 size={13} className="text-emerald-500" /> Voice & Video Calls</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

              {/* Chat Header */}
              <div className="px-3 sm:px-4 py-2.5 border-b border-[rgb(var(--border))] flex justify-between items-center bg-[rgb(var(--bg-surface))] backdrop-blur-xl z-20 shadow-sm">
                
                {/* Selection mode header */}
                {selectionMode ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <button onClick={exitSelection} className="p-1.5 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"><X size={18} /></button>
                      <span className="font-bold text-sm text-[rgb(var(--text-primary))]">{selectedIds.size} selected</span>
                    </div>
                    <button
                      onClick={deleteSelected}
                      disabled={selectedIds.size === 0}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button onClick={() => setActivePartnerId(null)} className="md:hidden p-1 -ml-1 text-slate-400 hover:text-[rgb(var(--text-primary))] rounded-xl transition-colors cursor-pointer">
                        <ArrowLeft size={18} />
                      </button>
                      <div className="relative shrink-0">
                        <Avatar src={activePartner.avatar} name={activePartner.name} size="sm" className="ring-2 ring-indigo-500/20" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[rgb(var(--bg-surface))]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] truncate">{activePartner.name}</h3>
                        <div className="text-[10px] mt-0.5">
                          {typing ? (
                            <span className="font-bold text-indigo-400 animate-pulse flex items-center gap-1">
                              <span className="flex gap-0.5">
                                {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                              </span>
                              typing...
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startCall(false)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer" title="Voice Call">
                        <Phone size={17} />
                      </button>
                      <button onClick={() => startCall(true)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all cursor-pointer" title="Video Call">
                        <Video size={17} />
                      </button>
                      {/* Watch Together — teacher/admin only */}
                      {isHost && (
                        <button
                          onClick={() => {
                            if (showVideoSync) {
                              // Close: send empty state to viewer
                              handleVideoSync({ ...EMPTY_VIDEO_SYNC, lastUpdated: Date.now() })
                            } else {
                              setShowVideoSync(true)
                              setShowVideoPicker(true)
                            }
                          }}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                            showVideoSync
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                              : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'
                          }`}
                          title="Watch Together"
                        >
                          <Monitor size={17} />
                        </button>
                      )}
                      <button className="p-1.5 text-slate-400 hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] rounded-xl transition-all cursor-pointer" title="More">
                        <MoreVertical size={17} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Offline Alert */}
              <AnimatePresence>
                {isOffline && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                    You are offline — messages will be queued.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video Sync Panel */}
              <AnimatePresence>
                {showVideoSync && activePartnerId && (
                  <ChatVideoSync
                    isHost={isHost}
                    syncState={videoSyncState}
                    onSync={handleVideoSync}
                    onClose={() => {
                      setShowVideoSync(false)
                      setVideoSyncState(EMPTY_VIDEO_SYNC)
                    }}
                    onPickVideo={() => setShowVideoPicker(true)}
                    partnerName={activePartner?.name || 'Partner'}
                  />
                )}
              </AnimatePresence>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-gradient-to-b from-[rgb(var(--bg-elevated))] to-[rgb(var(--bg-surface))] scrollbar-thin scrollbar-thumb-[rgb(var(--border))]">

                {/* Date label */}
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[11px] font-bold text-[rgb(var(--text-muted))]">Today</span>
                </div>

                {isLoadingThread ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Spinner />
                    <span className="text-xs font-semibold text-[rgb(var(--text-muted))] animate-pulse uppercase tracking-wide">Loading messages...</span>
                  </div>
                ) : localMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Sparkles size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[rgb(var(--text-primary))]">Start the conversation</h4>
                      <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Say hello to {activePartner.name}!</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {localMessages.map((msg: any) => {
                      if (msg.deleted_for?.includes(activePartnerId)) return null
                      const isMine = msg.sender_id !== activePartnerId
                      const targetId = msg.uuid || String(msg.id)
                      const isSelected = selectedIds.has(targetId)

                      return (
                        <motion.div
                          key={targetId}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.18, type: 'spring', stiffness: 400, damping: 28 }}
                          className={`flex chat-msg-bubble ${isMine ? 'justify-end' : 'justify-start'} group relative my-2 ${selectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-indigo-500/5 rounded-2xl' : ''}`}
                          data-uuid={targetId}
                          data-sender={msg.sender_id}
                          onMouseEnter={() => !selectionMode && setHoveredMessageId(targetId)}
                          onMouseLeave={() => { setHoveredMessageId(null); setShowEmojiPickerFor(null) }}
                          onMouseDown={() => {
                            longPressTimerRef.current = setTimeout(() => handleLongPress(targetId), 600)
                          }}
                          onMouseUp={() => clearTimeout(longPressTimerRef.current)}
                          onTouchStart={() => {
                            longPressTimerRef.current = setTimeout(() => handleLongPress(targetId), 600)
                          }}
                          onTouchEnd={() => clearTimeout(longPressTimerRef.current)}
                          onClick={() => selectionMode && toggleSelect(targetId)}
                        >
                          {/* Selection checkbox */}
                          {selectionMode && (
                            <div className={`flex items-center mr-2 shrink-0 ${isMine ? 'order-last ml-2 mr-0' : ''}`}>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-400 dark:border-slate-600'}`}>
                                {isSelected && <Check size={11} className="text-white" />}
                              </div>
                            </div>
                          )}

                          {/* Partner avatar for received */}
                          {!isMine && (
                            <Avatar src={activePartner.avatar} name={activePartner.name} size="xs" className="mr-2 mt-auto mb-1 shrink-0 ring-1 ring-indigo-500/20" />
                          )}

                          <div className={`max-w-[85%] sm:max-w-[72%] rounded-2xl px-3.5 py-2.5 relative shadow-sm transition-all duration-150 ${
                            isMine
                              ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-sm shadow-indigo-500/20'
                              : 'bg-[rgb(var(--bg-elevated))] dark:bg-[#1a1c35] text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] rounded-tl-sm'
                          } ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}>

                            {/* Pinned badge */}
                            {msg.is_pinned && (
                              <div className={`absolute -top-2.5 ${isMine ? '-left-2' : '-right-2'} w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-[rgb(var(--bg-surface))]`} title="Pinned">
                                <Pin size={10} className="fill-current" />
                              </div>
                            )}

                            {/* Reply quote */}
                            {msg.reply_to_message_uuid && (
                              <div className={`text-xs p-2 rounded-xl mb-2 flex items-center gap-2 border-l-2 ${
                                isMine ? 'bg-black/20 border-white/70 text-indigo-100' : 'bg-[rgb(var(--bg-surface))] border-indigo-500 text-[rgb(var(--text-secondary))]'
                              }`}>
                                <CornerDownRight size={12} className="shrink-0 opacity-70" />
                                <span className="truncate italic text-[11px]">Replying to a message...</span>
                              </div>
                            )}

                            {/* Content */}
                            <MessageContent msg={msg} isMine={isMine} onImageClick={setLightboxSrc} />

                            {/* Meta row: time + status */}
                            <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 font-mono ${isMine ? 'text-indigo-200' : 'text-[rgb(var(--text-muted))]'}`}>
                              {msg.edited_at && <span className="italic opacity-80">(edited)</span>}
                              <span>{fmtTime(msg.created_at)}</span>
                              {isMine && <StatusTick status={msg.status || 'sent'} />}
                            </div>

                            {/* Reactions display */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className={`absolute -bottom-3 ${isMine ? 'right-2' : 'left-2'} flex flex-wrap gap-1 z-10`}>
                                {Object.entries(msg.reactions).map(([emoji, users]: any) => (
                                  <motion.button
                                    key={emoji}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={e => { e.stopPropagation(); handleAction(targetId, 'react', emoji) }}
                                    className="text-[10px] bg-[rgb(var(--bg-surface))] dark:bg-slate-800 border border-[rgb(var(--border))] rounded-full px-1.5 py-0.5 shadow-md flex items-center gap-0.5 font-bold cursor-pointer"
                                  >
                                    <span>{emoji}</span>
                                    {users.length > 1 && <span className="text-[9px] opacity-70">{users.length}</span>}
                                  </motion.button>
                                ))}
                              </div>
                            )}

                            {/* Emoji reaction picker (hover) */}
                            <AnimatePresence>
                              {showEmojiPickerFor === targetId && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className={`absolute -top-12 ${isMine ? 'right-0' : 'left-0'} flex items-center gap-1 p-1.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl z-40 backdrop-blur-xl`}
                                  onClick={e => e.stopPropagation()}
                                >
                                  {EMOJI_LIST.map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleAction(targetId, 'react', emoji)}
                                      className="w-7 h-7 rounded-xl hover:bg-indigo-500/20 flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Hover quick action buttons */}
                          {!selectionMode && hoveredMessageId === targetId && (
                            <div className={`absolute top-0 ${isMine ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} flex items-center gap-1 z-30`}>
                              <button onClick={e => { e.stopPropagation(); setShowEmojiPickerFor(showEmojiPickerFor === targetId ? null : targetId) }} className="p-1.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-lg text-slate-400 hover:text-indigo-400 shadow-sm transition-colors cursor-pointer" title="React">
                                <Smile size={14} />
                              </button>
                              <button onClick={e => { e.stopPropagation(); setReplyingTo(msg) }} className="p-1.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-lg text-slate-400 hover:text-indigo-400 shadow-sm transition-colors cursor-pointer" title="Reply">
                                <Reply size={14} />
                              </button>
                              {isMine && (
                                <button
                                  onClick={e => { e.stopPropagation(); setEditingMessage(msg); setMessage(msg.body || msg.message || '') }}
                                  className="p-1.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-lg text-slate-400 hover:text-amber-400 shadow-sm transition-colors cursor-pointer" title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}
                              <button onClick={e => { e.stopPropagation(); handleAction(targetId, 'pin') }} className="p-1.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-lg text-slate-400 hover:text-amber-400 shadow-sm transition-colors cursor-pointer" title="Pin">
                                <Pin size={14} />
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleAction(targetId, 'delete', 'me') }} className="p-1.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-lg text-slate-400 hover:text-red-400 shadow-sm transition-colors cursor-pointer" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}

                <div ref={messagesEndRef} className="pt-4" />
              </div>

              {/* ── Input Area ─────────────────────────────────────────────── */}
              <div className="p-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]/95 backdrop-blur-2xl z-20">

                {/* Editing banner */}
                <AnimatePresence>
                  {editingMessage && (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                      className="mb-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Edit2 size={12} className="text-amber-400 shrink-0" />
                        <span className="font-bold text-amber-400">Editing:</span>
                        <span className="truncate italic text-[rgb(var(--text-secondary))]">{editingMessage.body || editingMessage.message}</span>
                      </div>
                      <button onClick={() => { setEditingMessage(null); setMessage('') }} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X size={13} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reply banner */}
                <AnimatePresence>
                  {replyingTo && (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                      className="mb-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Reply size={12} className="text-indigo-400 shrink-0" />
                        <span className="font-bold text-indigo-400 shrink-0">Reply:</span>
                        <span className="truncate italic text-[rgb(var(--text-secondary))]">{replyingTo.body || replyingTo.message}</span>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X size={13} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Voice Recorder */}
                <AnimatePresence>
                  {showVoiceRecorder && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-2">
                      <VoiceRecorder
                        onSend={handleVoiceSend}
                        onCancel={() => setShowVoiceRecorder(false)}
                        disabled={isOffline}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main input form */}
                {!showVoiceRecorder && (
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    {/* Hidden file input */}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip" />

                    {/* Attach + */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 rounded-full bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title="Attach file or image"
                    >
                      <Plus size={18} />
                    </button>

                    {/* Text input */}
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="text"
                        value={message}
                        onChange={handleTyping}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e as any) }}
                        placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
                        className="w-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-full pl-4 pr-16 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition-all"
                      />
                      <div className="absolute right-2 flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setShowInputEmojiPicker(v => !v)}
                          className="p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                          title="Emoji"
                        >
                          <Smile size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                          title="Attach"
                        >
                          <Paperclip size={17} />
                        </button>
                      </div>

                      {/* Emoji picker popup */}
                      <AnimatePresence>
                        {showInputEmojiPicker && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute bottom-12 right-0 p-2.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl z-50 grid grid-cols-4 gap-1.5 backdrop-blur-xl w-44"
                          >
                            {EMOJI_LIST.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => { setMessage(p => p + emoji); setShowInputEmojiPicker(false) }}
                                className="w-8 h-8 rounded-xl hover:bg-indigo-500/20 flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Mic button (shows recorder) */}
                    {!message.trim() && (
                      <button
                        type="button"
                        onClick={() => setShowVoiceRecorder(true)}
                        disabled={isOffline}
                        className="w-9 h-9 rounded-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-40"
                        title="Voice message"
                      >
                        <Mic size={16} />
                      </button>
                    )}

                    {/* Send button */}
                    {message.trim() && (
                      <button
                        type="submit"
                        className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                        title="Send"
                      >
                        <Send size={15} className="ml-0.5" />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Video Picker Drawer */}
      {activePartnerId && (
        <ChatVideoPickerDrawer
          open={showVideoPicker}
          onClose={() => setShowVideoPicker(false)}
          partnerId={activePartnerId}
          onSelect={handleVideoPickerSelect}
        />
      )}
    </>
  )
}

export default ChatPage
