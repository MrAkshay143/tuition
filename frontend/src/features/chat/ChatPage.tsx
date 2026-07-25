import React, { useState, useEffect, useRef } from 'react'
import { useConversations, useChatThread, useSendMessage, useMarkChatRead } from '@/api/resources/chat'
import { Spinner, Input, Button, Avatar, Card, Badge } from '@/components/ui'
import { Send, MessageSquare, Search, ArrowLeft, CheckCheck, Clock, UserCheck, MessageCircle, Sparkles, Bell } from 'lucide-react'

export const ChatPage = () => {
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversationsData, isLoading: isLoadingConversations } = useConversations()
  const { data: threadData, isLoading: isLoadingThread } = useChatThread(activePartnerId!)
  const sendMutation = useSendMessage()
  const markReadMutation = useMarkChatRead()

  const conversations = conversationsData || []
  const thread = threadData?.data || [] // Paginated data

  useEffect(() => {
    if (activePartnerId) {
      markReadMutation.mutate(activePartnerId)
    }
  }, [activePartnerId, threadData])

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activePartnerId) return
    
    sendMutation.mutate({ userId: activePartnerId, data: { body: message } }, {
      onSuccess: () => setMessage('')
    })
  }

  const activePartner = conversations.find((c: any) => c.partner.id === activePartnerId)?.partner

  const [mobileShowThread, setMobileShowThread] = useState(false)
  const [search, setSearch] = useState('')

  const filteredConversations = React.useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter((c: any) =>
      `${c.partner.first_name || ''} ${c.partner.last_name || ''} ${c.partner.name || ''}`.toLowerCase().includes(q)
    )
  }, [conversations, search])

  const totalUnread = React.useMemo(() => {
    return conversations.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0)
  }, [conversations])

  return (
    <div className="flex flex-col gap-3 md:gap-4 max-w-[1400px] mx-auto pb-2 md:pb-12 text-left h-[calc(100dvh-135px)] md:h-auto">
      {/* KPI Summary Stats Row (Desktop Only) */}

      {/* 2. KPI Summary Stats Row (Desktop Only) */}
      <div className="hidden md:flex admin-stats-row overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Conversations</p>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{conversations.length}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Unread Alerts</p>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{totalUnread}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Direct Contacts</p>
              <h3 className="text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{conversations.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Main Chat Interface Wrapper (Full Fit App Style on Mobile) */}
      <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-260px)] min-h-[380px] md:min-h-[520px] md:max-h-[800px] border border-[rgb(var(--border))] rounded-2xl overflow-hidden bg-[rgb(var(--bg-surface))] shadow-xs">
        {/* Sidebar: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-[rgb(var(--border))] flex flex-col bg-[rgb(var(--bg-surface))] shrink-0 ${mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 sm:p-4 border-b border-[rgb(var(--border))] space-y-2.5">
            <h2 className="text-lg font-bold font-[Outfit] text-[rgb(var(--text-primary))]">Direct Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" size={14} />
              <input 
                type="text" 
                placeholder="Search students or contacts..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="flex justify-center p-8"><Spinner /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[rgb(var(--text-muted))] text-xs font-medium">
                No conversations found.
              </div>
            ) : (
              filteredConversations.map((c: any) => {
                const isSelected = activePartnerId === c.partner.id
                return (
                  <div 
                    key={c.partner.id} 
                    className={`p-3 sm:p-3.5 border-b border-[rgb(var(--border))] cursor-pointer hover:bg-[rgb(var(--bg-elevated))] transition-colors flex items-center gap-3 relative ${
                      isSelected 
                        ? 'bg-indigo-500/10 border-l-4 border-l-indigo-600' 
                        : 'border-l-4 border-l-transparent'
                    }`}
                    onClick={() => {
                      setActivePartnerId(c.partner.id)
                      setMobileShowThread(true)
                    }}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={`${c.partner.first_name || ''} ${c.partner.last_name || ''}`} src={c.partner.avatar} size="md" />
                      <span className="w-3 h-3 bg-emerald-500 border-2 border-[rgb(var(--bg-surface))] rounded-full absolute bottom-0 right-0" />
                      {c.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-extrabold shadow-sm">
                          {c.unread_count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-xs text-[rgb(var(--text-primary))] truncate font-[Outfit]">
                          {c.partner.first_name} {c.partner.last_name}
                        </h4>
                        {c.last_message && (
                          <span className="text-[10px] text-[rgb(var(--text-muted))] shrink-0 ml-1">
                            {new Date(c.last_message.created_at).toLocaleTimeString([], {timeStyle: 'short'})}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate ${c.unread_count > 0 ? 'font-extrabold text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-muted))]'}`}>
                        {c.last_message ? c.last_message.body : 'Start a conversation'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Main Area: Active Thread */}
        <div className={`flex-1 flex flex-col bg-[rgb(var(--bg-surface))] ${!mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
          {activePartnerId ? (
            <>
              {/* Active Header Bar */}
              <div className="p-3 sm:p-4 border-b border-[rgb(var(--border))] flex items-center justify-between bg-[rgb(var(--bg-surface))] z-10">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setMobileShowThread(false)} 
                    className="md:hidden p-1.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-all flex items-center gap-1 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <div className="relative shrink-0">
                    <Avatar name={`${activePartner?.first_name || ''} ${activePartner?.last_name || ''}`} src={activePartner?.avatar} size="sm" />
                    <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-[rgb(var(--bg-surface))] rounded-full absolute bottom-0 right-0" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-[rgb(var(--text-primary))] font-[Outfit]">
                      {activePartner?.first_name} {activePartner?.last_name}
                    </h3>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                      {activePartner?.role || 'Student'} • Active Now
                    </p>
                  </div>
                </div>
              </div>

              {/* Message History Thread */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-[rgb(var(--bg-surface))] flex flex-col-reverse">
                {isLoadingThread ? (
                  <div className="flex justify-center p-8"><Spinner /></div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {[...thread].reverse().map((msg: any) => {
                      const isMe = msg.sender_id !== activePartnerId
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs' 
                              : 'bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] rounded-tl-xs shadow-xs'
                          }`}>
                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                            {msg.attached_media && msg.attached_media.length > 0 && (
                              <div className="mt-2 space-y-1 pt-1 border-t border-white/20">
                                {msg.attached_media.map((media: any) => (
                                  <a 
                                    key={media.id} 
                                    href={media.file_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={`flex items-center gap-1.5 text-xs font-bold ${isMe ? 'text-indigo-100 hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:underline'}`}
                                  >
                                    <span className="truncate max-w-[150px] underline">{media.title || 'Attachment'}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                            <div className={`text-[9px] mt-1.5 text-right flex items-center justify-end gap-1 ${isMe ? 'text-indigo-200' : 'text-[rgb(var(--text-muted))]'}`}>
                              <span>{new Date(msg.created_at).toLocaleTimeString([], {timeStyle: 'short'})}</span>
                              {isMe && <CheckCheck size={12} className="text-indigo-200" />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input Form */}
              <div className="p-3 sm:p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                  <Input 
                    className="flex-1 bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] border-[rgb(var(--border))] focus:bg-[rgb(var(--bg-surface))] text-xs rounded-xl py-2"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sendMutation.isPending}
                  />
                  <Button 
                    type="submit" 
                    disabled={!message.trim() || sendMutation.isPending}
                    className="px-4 sm:px-5 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 text-xs shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {sendMutation.isPending ? <Spinner size={15} /> : <Send size={15} />}
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[rgb(var(--text-muted))] p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <MessageSquare size={28} />
              </div>
              <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] font-[Outfit]">Your Direct Messages</h3>
              <p className="text-xs mt-1 text-[rgb(var(--text-muted))] max-w-sm">Select a contact from the list to start a real-time conversation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
