import React, { useState, useEffect } from 'react'
import { Laptop, Smartphone, Tablet, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react'
import { api } from '../../api/client'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui'

interface SessionItem {
  id: number
  uuid: string
  device_name: string
  device_type: string
  browser: string
  operating_system: string
  ip_address: string
  is_current: boolean
  is_trusted: boolean
  last_activity_at: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const DeviceSessionsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: SessionItem[] }>('/sessions')
      setSessions(res.data)
    } catch {
      toast.error('Failed to load device sessions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchSessions()
  }, [isOpen])

  const handleRevoke = async (uuid: string) => {
    try {
      await api.delete(`/sessions/${uuid}`)
      toast.success('Session revoked.')
      fetchSessions()
    } catch {
      toast.error('Failed to revoke session.')
    }
  }

  const handleRevokeOthers = async () => {
    try {
      await api.post('/sessions/revoke-other')
      toast.success('Logged out of all other devices.')
      fetchSessions()
    } catch {
      toast.error('Failed to revoke other sessions.')
    }
  }

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose} 
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Active Device Sessions</span>
            <p className="text-xs text-[rgb(var(--text-secondary))] font-normal mt-0.5">Manage devices logged into your account</p>
          </div>
        </div>
      }
    >

        {loading ? (
          <div className="py-12 text-slate-500 dark:text-slate-400 text-center text-xs text-gray-400">Loading active sessions...</div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="flex justify-end">
              <button
                onClick={handleRevokeOthers}
                className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out Other Devices
              </button>
            </div>

            {sessions.map((s) => (
              <div
                key={s.uuid}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  s.is_current
                    ? 'border-violet-500/50 bg-violet-500/5'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#0c0d24]/5 text-gray-300">
                    {s.device_type === 'mobile' ? (
                      <Smartphone className="w-5 h-5" />
                    ) : s.device_type === 'tablet' ? (
                      <Tablet className="w-5 h-5" />
                    ) : (
                      <Laptop className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{s.device_name}</span>
                      {s.is_current && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
                      {s.browser} • {s.operating_system} • IP: {s.ip_address}
                    </p>
                  </div>
                </div>

                {!s.is_current && (
                  <button
                    onClick={() => handleRevoke(s.uuid)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Revoke session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
    </Modal>
  )
}
