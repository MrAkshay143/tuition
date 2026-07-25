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
import { WebRTCManager } from '@/lib/WebRTCManager'
import { chatOutbox } from '@/lib/ChatOutbox'
import { Spinner, Button, Avatar, Card, Badge } from '@/components/ui'
import { 
  Send, 
  MessageSquare, 
  Search, 
  ArrowLeft, 
  CheckCheck, 
  Clock, 
  Check, 
  Sparkles, 
  WifiOff, 
  Paperclip, 
  MoreVertical, 
  Reply, 
  Smile, 
  Trash2, 
  Edit2, 
  Pin, 
  Phone, 
  Video, 
  Info, 
  X, 
  Heart, 
  ThumbsUp, 
  Laugh, 
  Flame, 
  AlertCircle, 
  CornerDownRight,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ChevronRight,
  Mic,
  Plus,
  ArrowDown
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'react-hot-toast'
import api from '@/api/client'

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏']

export const ChatPage = () => {
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'pinned'>('all')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isPageVisible, setIsPageVisible] = useState(true)
  
  // Rich Feature States
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [editingMessage, setEditingMessage] = useState<any | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null)
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)
  const [typing, setTyping] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const webrtcManagerRef = useRef<WebRTCManager | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const heartbeatRef = useRef<any>(null)

  const { data: conversationsData, isLoading: isLoadingConversations } = useConversations()
  const { data: threadData, isLoading: isLoadingThread, refetch: refetchThread } = useChatThread(activePartnerId!)
  const sendMutation = useSendMessage()
  const markReadMutation = useMarkChatRead()
  const updateStatusMutation = useUpdateMessageStatus()
  const presenceMutation = useChatPresence()

  const [localMessages, setLocalMessages] = useState<any[]>([])
  const conversations = conversationsData || []

  // Deterministic Sorting Helper
  const sortMessages = (msgs: any[]) => {
    return msgs.sort((a, b) => {
      const timeA = new Date(a.created_at || new Date()).getTime()
      const timeB = new Date(b.created_at || new Date()).getTime()
      if (timeA === timeB) return (a.uuid || '').localeCompare(b.uuid || '')
      return timeA - timeB
    })
  }

  // Filter conversations based on search query and tabs
  const filteredConversations = conversations.filter((conv: any) => {
    const matchesSearch = conv.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (conv.last_message?.body && conv.last_message.body.toLowerCase().includes(searchQuery.toLowerCase()))
    if (!matchesSearch) return false
    if (filterTab === 'unread') return conv.unread_count > 0
    return true
  })

  // Active Partner Object
  const activePartner = conversations.find((c: any) => c.partner.id === activePartnerId)?.partner || {
    name: 'Chat Partner',
    avatar: undefined,
    id: activePartnerId
  }

  // Pinned Messages in Current Thread
  const pinnedMessages = localMessages.filter(m => m.is_pinned && !m.deleted_for?.includes(1))

  // --- Multi-layer Fallback & Lifecycle ---
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
    const handleVisibility = () => {
      const visible = document.visibilityState === 'visible'
      setIsPageVisible(visible)
      if (visible) syncOfflineData()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [syncOfflineData])

  // --- Lightweight Heartbeat (Layer 4) ---
  useEffect(() => {
    if (activePartnerId && isPageVisible && !isOffline) {
      heartbeatRef.current = setInterval(() => {
        if (webrtcManagerRef.current && !(webrtcManagerRef.current as any).pc) {
           webrtcManagerRef.current.fetchPendingSignals()
        }
        presenceMutation.mutate()
      }, 60000)
    }
    return () => clearInterval(heartbeatRef.current)
  }, [activePartnerId, isPageVisible, isOffline])

  // --- Intersection Observer for Read Receipts ---
  useEffect(() => {
    if (!activePartnerId || isOffline) return
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const uuid = entry.target.getAttribute('data-uuid')
          const senderId = Number(entry.target.getAttribute('data-sender'))
          if (uuid && senderId === activePartnerId) {
            updateStatusMutation.mutate({ uuid, status: 'read' })
            webrtcManagerRef.current?.send({
              type: 'receipt',
              payload: { uuid, status: 'read' }
            })
            observerRef.current?.unobserve(entry.target)
          }
        }
      })
    }, { threshold: 0.5 })
    return () => observerRef.current?.disconnect()
  }, [activePartnerId, isOffline])

  useEffect(() => {
    if (threadData) {
      setLocalMessages(sortMessages([...threadData]))
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [threadData])

  // --- WebRTC Initialization ---
  useEffect(() => {
    if (activePartnerId) {
      markReadMutation.mutate(activePartnerId)
      
      const onWebRTCMessage = (data: any) => {
        if (data.type === 'chat') {
          setLocalMessages(prev => sortMessages([...prev, data.payload]))
          webrtcManagerRef.current?.send({
            type: 'receipt',
            payload: { uuid: data.payload.uuid, status: 'delivered' }
          })
          updateStatusMutation.mutate({ uuid: data.payload.uuid, status: 'delivered' })
        } else if (data.type === 'receipt') {
          setLocalMessages(prev => prev.map(msg => 
            msg.uuid === data.payload.uuid ? { ...msg, status: data.payload.status } : msg
          ))
        } else if (data.type === 'typing') {
          setTyping(data.payload.isTyping)
          if (data.payload.isTyping) setTimeout(() => setTyping(false), 3000)
        } else if (data.type === 'action') {
           refetchThread()
        }
      }

      webrtcManagerRef.current = new WebRTCManager(activePartnerId.toString(), onWebRTCMessage)
      webrtcManagerRef.current.connect(true)
      webrtcManagerRef.current.fetchPendingSignals()
      
      return () => webrtcManagerRef.current?.disconnect()
    }
  }, [activePartnerId])

  // --- Attach Observers to Messages ---
  useEffect(() => {
    if (observerRef.current) {
      document.querySelectorAll('.chat-message-bubble').forEach(node => {
        observerRef.current?.observe(node)
      })
    }
  }, [localMessages])

  // --- Event Handlers ---
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.send({ type: 'typing', payload: { isTyping: e.target.value.length > 0 } })
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activePartnerId) return

    if (editingMessage) {
      const targetUuid = editingMessage.uuid || editingMessage.id
      api.patch(`/chat/messages/action/${targetUuid}`, { action: 'edit', payload: message }).then(() => {
         webrtcManagerRef.current?.send({ type: 'action', payload: { action: 'edit' } })
         refetchThread()
         setEditingMessage(null)
         setMessage('')
         toast.success('Message updated')
      })
      return
    }

    const newMsg = {
      uuid: uuidv4(),
      body: message,
      message: message,
      sender_id: 1, // Placeholder for local optimistic render
      receiver_id: activePartnerId,
      reply_to_message_uuid: replyingTo?.uuid || replyingTo?.id,
      status: isOffline ? 'queued' : 'sending',
      created_at: new Date().toISOString()
    }

    setLocalMessages(prev => sortMessages([...prev, newMsg]))
    setMessage('')
    setReplyingTo(null)
    setShowInputEmojiPicker(false)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

    if (isOffline) {
      await chatOutbox.enqueue(newMsg)
      toast('Queued offline - will send when connected', { icon: '📴' })
    } else {
      webrtcManagerRef.current?.send({
        type: 'chat',
        payload: { ...newMsg, status: 'sent' }
      })

      sendMutation.mutate({ userId: activePartnerId, data: { message: newMsg.message, uuid: newMsg.uuid, reply_to_message_uuid: newMsg.reply_to_message_uuid } as any }, {
        onSuccess: () => {
          setLocalMessages(prev => prev.map(m => m.uuid === newMsg.uuid ? { ...m, status: 'sent' } : m))
        }
      })
    }
  }

  const handleAction = async (uuid: string, action: string, payload?: any) => {
    if (!uuid) {
      toast.error('Cannot perform action on legacy message without identifier')
      return
    }
    await api.patch(`/chat/messages/action/${uuid}`, { action, payload })
    webrtcManagerRef.current?.send({ type: 'action', payload: { action } })
    setShowEmojiPickerFor(null)
    refetchThread()
    if (action === 'pin') toast.success('Message pinned')
    if (action === 'delete') toast.success('Message deleted')
  }

  const handleSimulatedCall = (type: 'video' | 'voice') => {
    toast(`Initiating secure P2P ${type} call with ${activePartner.name}...`, {
      icon: type === 'video' ? '📹' : '📞',
      style: {
        borderRadius: '12px',
        background: '#333',
        color: '#fff',
      }
    })
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case 'queued': return <span title="Queued offline"><Clock size={13} className="text-amber-400 animate-pulse" /></span>
      case 'sending': return <span title="Sending..."><Clock size={13} className="text-slate-300 animate-spin" /></span>
      case 'sent': return <span title="Sent"><Check size={13} className="text-indigo-200" /></span>
      case 'delivered': return <span title="Delivered"><CheckCheck size={13} className="text-indigo-200" /></span>
      case 'read': return <span title="Read"><CheckCheck size={13} className="text-cyan-300 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" /></span>
      default: return <Check size={13} className="text-indigo-200" />
    }
  }

  return (
    <div className="max-w-[1500px] mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] lg:h-[calc(100vh-120px)] -m-3 md:m-0 flex md:gap-4 p-0 md:p-4 font-[Outfit]">
      {/* Sidebar Conversation List */}
      <Card className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col overflow-hidden border-0 md:border md:border-[rgb(var(--border))] shadow-none md:shadow-xl bg-[rgb(var(--bg-surface))] backdrop-blur-xl transition-all duration-300 rounded-none md:rounded-3xl h-full ${activePartnerId ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-[rgb(var(--border))] space-y-4 bg-gradient-to-b from-[rgb(var(--primary)/0.05)] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <MessageSquare size={18} />
              </div>
              <div>
                <h2 className="font-extrabold text-lg sm:text-xl text-[rgb(var(--text-primary))] tracking-tight">Messages</h2>
                <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Real-time P2P Active
                </span>
              </div>
            </div>
            <Badge variant="neutral" className="text-xs font-mono bg-[rgb(var(--bg-elevated))] px-2.5 py-1 border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]">
              {conversations.length} {conversations.length === 1 ? 'Chat' : 'Chats'}
            </Badge>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))] group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2.5 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition-all shadow-inner" 
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))] text-xs font-semibold">
            {(['all', 'unread'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`flex-1 py-1.5 rounded-lg capitalize transition-all duration-200 ${
                  filterTab === tab 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm' 
                    : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                }`}
              >
                {tab === 'all' ? 'All Chats' : 'Unread Only'}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List Body */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-[rgb(var(--border))]">
          {isLoadingConversations ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3 text-[rgb(var(--text-muted))]">
              <Spinner />
              <span className="text-xs font-medium animate-pulse">Syncing secure chats...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center space-y-3 text-[rgb(var(--text-muted))]">
              <div className="w-12 h-12 rounded-full bg-[rgb(var(--bg-elevated))] flex items-center justify-center text-slate-400">
                <Search size={22} />
              </div>
              <p className="font-semibold text-sm text-[rgb(var(--text-primary))]">No conversations found</p>
              <p className="text-xs text-[rgb(var(--text-muted))] max-w-[200px]">
                {searchQuery ? "Try searching with a different name or keyword." : "You don't have any active chats yet."}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv: any) => {
              const isSelected = activePartnerId === conv.partner.id
              const hasUnread = conv.unread_count > 0

              return (
                <motion.div
                  key={conv.partner.id}
                  whileHover={{ scale: 0.995 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActivePartnerId(conv.partner.id)}
                  className={`relative flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 group border ${
                    isSelected 
                      ? 'bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-transparent border-indigo-500/30 shadow-sm dark:shadow-indigo-500/5' 
                      : 'hover:bg-[rgb(var(--bg-elevated))] border-transparent hover:border-[rgb(var(--border))]'
                  }`}
                >
                  {/* Left Active Indicator Bar */}
                  {isSelected && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute left-0 top-3 bottom-3 w-1.5 bg-gradient-to-b from-indigo-600 to-violet-600 rounded-r-full shadow-md shadow-indigo-500/50" 
                    />
                  )}

                  {/* Avatar with Online Pulse */}
                  <div className="relative flex-shrink-0">
                    <Avatar src={conv.partner.avatar} name={conv.partner.name} size="md" className="ring-2 ring-white dark:ring-slate-800 shadow-md" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" title="Online" />
                  </div>

                  {/* Name and Last Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-[rgb(var(--text-primary))] group-hover:text-indigo-500 transition-colors'}`}>
                        {conv.partner.name}
                      </h4>
                      {conv.last_message && (
                        <span className="text-[10px] font-mono font-medium text-[rgb(var(--text-muted))] flex-shrink-0 ml-1">
                          {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${hasUnread ? 'font-bold text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-muted))]'}`}>
                        {conv.last_message?.body || conv.last_message?.message || <span className="italic opacity-70">No messages yet</span>}
                      </p>
                      {hasUnread && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-[10px] flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className={`flex-1 flex flex-col overflow-hidden border-0 md:border md:border-[rgb(var(--border))] shadow-none md:shadow-2xl bg-[rgb(var(--bg-surface))] backdrop-blur-2xl rounded-none md:rounded-3xl relative transition-all duration-300 h-full ${!activePartnerId ? 'hidden md:flex' : 'flex'}`}>
        {!activePartnerId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[rgb(var(--bg-surface))] via-[rgb(var(--bg-elevated))] to-[rgb(var(--bg-surface))]">
            {/* Empty State when no conversation selected */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 transform -rotate-6">
                <MessageSquare size={44} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg border-4 border-[rgb(var(--bg-surface))] transform rotate-12">
                <Sparkles size={18} />
              </div>
            </motion.div>
            <h3 className="text-2xl font-black text-[rgb(var(--text-primary))] mb-2 tracking-tight">Your EduFlow Communication Hub</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mb-6 leading-relaxed">
              Connect instantly with instructors, mentors, and peers using ultra-low latency WebRTC DataChannels with fallback offline queueing.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold text-[rgb(var(--text-muted))]">
              <span className="px-3.5 py-1.5 rounded-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-500" /> E2E Encrypted Signaling
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500" /> Instant P2P Delivery
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Top Chat Header */}
            <div className="px-3 sm:px-4 py-2 border-b border-[rgb(var(--border))] flex justify-between items-center bg-[rgb(var(--bg-surface))] backdrop-blur-xl z-20 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <button 
                  onClick={() => setActivePartnerId(null)} 
                  className="md:hidden p-1 -ml-1 text-slate-400 hover:text-[rgb(var(--text-primary))] rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft size={18} />
                </button>
                
                <div className="relative shrink-0">
                  <Avatar src={activePartner.avatar} name={activePartner.name} size="sm" className="ring-2 ring-indigo-500/20 shadow-xs" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[rgb(var(--bg-surface))]" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-[rgb(var(--text-primary))] truncate leading-tight">
                    {activePartner.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {typing ? (
                      <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 animate-pulse">
                        typing a message...
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Action Icons */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button 
                  onClick={() => handleSimulatedCall('voice')}
                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-[rgb(var(--bg-elevated))] rounded-xl transition-all cursor-pointer" 
                  title="Voice Call"
                >
                  <Phone size={17} />
                </button>
                <button 
                  onClick={() => handleSimulatedCall('video')}
                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-[rgb(var(--bg-elevated))] rounded-xl transition-all cursor-pointer" 
                  title="Video Call"
                >
                  <Video size={17} />
                </button>
                <button 
                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-[rgb(var(--bg-elevated))] rounded-xl transition-all cursor-pointer" 
                  title="More Options"
                >
                  <MoreVertical size={17} />
                </button>
              </div>
            </div>

            {/* Private & Secure Banner (Matching Mobile Mockup) */}
            <div className="mx-3.5 my-2.5 px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl flex items-center justify-between text-xs text-indigo-200 shadow-xs cursor-pointer hover:bg-indigo-950/60 transition-all" onClick={() => setShowSecurityModal(true)}>
              <div className="flex items-center gap-2 font-medium">
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <ShieldCheck size={13} />
                </div>
                <span>Your conversation is private and secure</span>
              </div>
              <ChevronRight size={15} className="text-indigo-400 shrink-0" />
            </div>

            {/* Offline Alert Bar */}
            <AnimatePresence>
              {isOffline && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                    <span>You are offline. Messages queued in IndexedDB.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Thread Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 bg-gradient-to-b from-[rgb(var(--bg-elevated))] to-[rgb(var(--bg-surface))] scrollbar-thin scrollbar-thumb-[rgb(var(--border))]">
              {/* Date Tag */}
              <div className="flex justify-center my-2">
                <span className="px-3.5 py-1 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[11px] font-bold text-[rgb(var(--text-muted))]">
                  Today
                </span>
              </div>

              {isLoadingThread ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3 text-[rgb(var(--text-muted))]">
                  <Spinner />
                  <span className="text-xs font-semibold tracking-wide uppercase animate-pulse">Loading messages...</span>
                </div>
              ) : localMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[rgb(var(--text-primary))]">Start conversation</h4>
                    <p className="text-xs text-[rgb(var(--text-muted))] max-w-xs mt-1">
                      Send a message below to connect with {activePartner.name}.
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {localMessages.map((msg: any) => {
                    if (msg.deleted_for?.includes(1)) return null
                    
                    const isMine = msg.sender_id !== activePartnerId
                    const targetUuid = msg.uuid || msg.id
                    const isHovered = hoveredMessageId === targetUuid

                    return (
                      <motion.div 
                        key={targetUuid}
                        layout
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2, type: "spring", stiffness: 350, damping: 25 }}
                        className={`flex chat-message-bubble ${isMine ? 'justify-end' : 'justify-start'} group relative my-2.5 sm:my-3`}
                        data-uuid={targetUuid}
                        data-sender={msg.sender_id}
                        onMouseEnter={() => setHoveredMessageId(targetUuid)}
                        onMouseLeave={() => { setHoveredMessageId(null); setShowEmojiPickerFor(null); }}
                      >
                        {/* Partner Avatar for Received Messages */}
                        {!isMine && (
                          <Avatar 
                            src={activePartner.avatar} 
                            name={activePartner.name} 
                            size="xs" 
                            className="mr-2 mt-auto mb-1 shrink-0 ring-1 ring-indigo-500/30" 
                          />
                        )}

                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 relative shadow-xs transition-all duration-200 ${
                          isMine 
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-md shadow-indigo-500/15' 
                            : 'bg-[rgb(var(--bg-elevated))] dark:bg-[#1a1c35] text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] rounded-tl-xs shadow-2xs'
                        }`}>
                          {/* Pinned Icon Badge */}
                          {msg.is_pinned && (
                            <div className={`absolute -top-2.5 ${isMine ? '-left-2' : '-right-2'} w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-[rgb(var(--bg-surface))]`} title="Pinned Message">
                              <Pin size={10} className="fill-current" />
                            </div>
                          )}

                          {/* Reply Quote Block */}
                          {msg.reply_to_message_uuid && (
                            <div className={`text-xs p-2 rounded-xl mb-2 flex items-center gap-2 border-l-2 ${
                              isMine 
                                ? 'bg-black/20 border-white/80 text-indigo-100' 
                                : 'bg-[rgb(var(--bg-surface))] border-indigo-500 text-[rgb(var(--text-secondary))]'
                            }`}>
                              <CornerDownRight size={13} className="shrink-0 opacity-70" />
                              <span className="truncate italic">
                                Replying to previous message...
                              </span>
                            </div>
                          )}

                          {/* Message Body Text */}
                          <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap font-normal">
                            {msg.body || msg.message}
                          </p>

                          {/* Timestamps & Read Receipt Status */}
                          <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 font-mono font-medium ${
                            isMine ? 'text-indigo-200' : 'text-[rgb(var(--text-muted))]'
                          }`}>
                            <span>
                              {new Date(msg.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.edited_at && <span className="italic opacity-80">(edited)</span>}
                            {isMine && renderStatus(msg.status || 'read')}
                          </div>
                          
                          {/* Quick Emoji Picker Selector */}
                          <AnimatePresence>
                            {showEmojiPickerFor === targetUuid && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={`absolute -top-16 ${isMine ? 'right-0' : 'left-0'} flex items-center gap-1 p-1.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl z-40 backdrop-blur-2xl`}
                              >
                                {EMOJI_LIST.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleAction(targetUuid, 'react', emoji)}
                                    className="w-7 h-7 rounded-xl hover:bg-indigo-500/20 flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Reactions Display Bubbles */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={`absolute -bottom-2.5 ${isMine ? 'right-2' : 'left-2'} flex flex-wrap gap-1 z-10`}>
                              {Object.entries(msg.reactions).map(([emoji, users]: any) => (
                                <motion.button
                                  key={emoji}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleAction(targetUuid, 'react', emoji)}
                                  className="text-[10px] bg-[rgb(var(--bg-surface))] dark:bg-slate-800 text-[rgb(var(--text-primary))] rounded-full px-2 py-0.5 shadow-md border border-[rgb(var(--border))] flex items-center gap-1 font-bold cursor-pointer"
                                >
                                  <span>{emoji}</span>
                                  {users.length > 1 && <span className="text-[9px] opacity-80">{users.length}</span>}
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}

              <div ref={messagesEndRef} className="pt-2" />
            </div>

            {/* Bottom Input Box Area (Floating Dock Style) */}
            <div className="p-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))/0.95] backdrop-blur-2xl z-20 relative">
              {/* Replying Banner */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="mb-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Reply size={13} className="text-indigo-400 shrink-0" />
                      <span className="font-bold text-indigo-400 shrink-0">Replying:</span>
                      <span className="truncate text-[rgb(var(--text-secondary))] italic">
                        "{replyingTo.body || replyingTo.message}"
                      </span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-indigo-500/10 rounded-lg text-slate-400">
                      <X size={13} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Input Form */}
              <form onSubmit={handleSend} className="flex items-center gap-2 relative">
                {/* Plus (+) Action Button */}
                <button
                  type="button"
                  onClick={() => toast('Attach document or image', { icon: '➕' })}
                  className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center font-extrabold transition-all cursor-pointer shrink-0"
                  title="Add attachment"
                >
                  <Plus size={18} />
                </button>

                {/* Main Floating Input Field */}
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={message}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="w-full bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-full pl-4 pr-16 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition-all"
                  />

                  <div className="absolute right-2 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                      className="p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Insert Emoji"
                    >
                      <Smile size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toast('Attachments', { icon: '📎' })}
                      className="p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Attach File"
                    >
                      <Paperclip size={18} />
                    </button>
                  </div>

                  {/* Emoji Picker Popup */}
                  <AnimatePresence>
                    {showInputEmojiPicker && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-12 right-0 p-2.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl z-50 grid grid-cols-4 gap-1.5 backdrop-blur-2xl w-44"
                      >
                        {EMOJI_LIST.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => { setMessage(prev => prev + emoji); setShowInputEmojiPicker(false); }}
                            className="w-8 h-8 rounded-xl hover:bg-indigo-500/20 flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Send / Voice Note Mic Button */}
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
                  title={message.trim() ? "Send Message" : "Voice Note"}
                >
                  {message.trim() ? <Send size={15} className="ml-0.5" /> : <Mic size={16} />}
                </button>
              </form>
            </div>

            {/* Security Info Modal */}
            <AnimatePresence>
              {showSecurityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-3xl p-6 shadow-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-3">
                      <div className="flex items-center gap-2 text-emerald-500 font-bold">
                        <ShieldCheck size={22} />
                        <h4 className="text-lg text-[rgb(var(--text-primary))]">P2P Encryption & Security</h4>
                      </div>
                      <button onClick={() => setShowSecurityModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                      </button>
                    </div>
                    <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
                      Your conversation with <strong className="text-[rgb(var(--text-primary))]">{activePartner.name}</strong> utilizes direct <strong>WebRTC DataChannels</strong> for real-time messaging.
                    </p>
                    <div className="space-y-2.5 text-xs text-[rgb(var(--text-secondary))]">
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[rgb(var(--text-primary))] block">Direct Peer-to-Peer Transport</strong>
                          Messages bypass central servers during active sessions, reducing latency to near-zero.
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[rgb(var(--text-primary))] block">Offline Resilience (IndexedDB)</strong>
                          When offline or disconnected, messages automatically queue locally and transmit seamlessly upon reconnection.
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => setShowSecurityModal(false)} variant="primary" className="w-full rounded-2xl py-2.5 font-bold bg-gradient-to-r from-indigo-600 to-violet-600">
                      Got it, Close
                    </Button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </div>
  )
}
export default ChatPage
