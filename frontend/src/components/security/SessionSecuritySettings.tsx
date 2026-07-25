import React, { useState, useEffect } from 'react'
import { Shield, Clock, KeyRound, AlertTriangle, Save } from 'lucide-react'
import { api } from '../../api/client'
import { toast } from 'react-hot-toast'

interface PolicyData {
  global: {
    session_limit_global: number
    policy_global: string
    session_idle_timeout_minutes: number
    session_absolute_timeout_days: number
    trusted_device_lifetime_days: number
    max_trusted_devices: number
    remember_device_enabled: boolean
  }
  roles: {
    student: { max_sessions: number; policy: string }
    teacher: { max_sessions: number; policy: string }
    admin: { max_sessions: number; policy: string }
  }
}

export const SessionSecuritySettings: React.FC = () => {
  const [data, setData] = useState<PolicyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPolicies = async () => {
    setLoading(true)
    try {
      const res = await api.get<PolicyData>('/admin/security/session-policies')
      setData(res)
    } catch {
      toast.error('Failed to load session security policies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    try {
      await api.put('/admin/security/session-policies', {
        session_limit_student: data.roles.student.max_sessions,
        session_limit_teacher: data.roles.teacher.max_sessions,
        session_limit_admin: data.roles.admin.max_sessions,
        policy_student: data.roles.student.policy,
        policy_teacher: data.roles.teacher.policy,
        policy_admin: data.roles.admin.policy,
        session_idle_timeout_minutes: data.global.session_idle_timeout_minutes,
        session_absolute_timeout_days: data.global.session_absolute_timeout_days,
        trusted_device_lifetime_days: data.global.trusted_device_lifetime_days,
        remember_device_enabled: data.global.remember_device_enabled,
      })
      toast.success('Session security policies updated!')
    } catch {
      toast.error('Failed to save security policies.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) {
    return <div className="p-8 text-slate-500 dark:text-slate-400 text-center text-xs text-gray-400">Loading security configuration...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white font-[Outfit]">Session Security & Login Limits</h3>
          <p className="text-xs text-[rgb(var(--text-secondary))]">Configure login policies, timeouts & device binding</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Role Limits & Policy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['student', 'teacher', 'admin'] as const).map((role) => (
          <div key={role} className="glass p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white capitalize">{role} Policy</span>
              <span className="px-2 py-0.5 text-[10px] font-bold text-violet-400 bg-violet-500/10 rounded-md">
                Role Default
              </span>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 font-medium block mb-1">Max Concurrent Sessions</label>
              <input
                type="number"
                min={1}
                max={50}
                value={data.roles[role].max_sessions}
                onChange={(e) =>
                  setData({
                    ...data,
                    roles: {
                      ...data.roles,
                      [role]: { ...data.roles[role], max_sessions: parseInt(e.target.value) || 1 },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0c0d24]/5 border border-white/10 text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 font-medium block mb-1">Enforcement Policy</label>
              <select
                value={data.roles[role].policy}
                onChange={(e) =>
                  setData({
                    ...data,
                    roles: {
                      ...data.roles,
                      [role]: { ...data.roles[role], policy: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0c0d24]/5 border border-white/10 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="REPLACE_CURRENT" className="bg-gray-900 text-white">Replace Current (Auto Logout Old)</option>
                <option value="DENY_NEW" className="bg-gray-900 text-white">Deny New Login</option>
                <option value="PROMPT_USER" className="bg-gray-900 text-white">Prompt User Confirmation</option>
                <option value="REMOVE_LEAST_RECENT" className="bg-gray-900 text-white">Remove Least Recent Session</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Global Timeouts & Device Settings */}
      <div className="glass p-5 rounded-2xl border border-white/10 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-400" /> Session Timeouts & Trust Lifetimes
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] text-gray-400 font-medium block mb-1">Idle Timeout (Minutes)</label>
            <input
              type="number"
              value={data.global.session_idle_timeout_minutes}
              onChange={(e) =>
                setData({
                  ...data,
                  global: { ...data.global, session_idle_timeout_minutes: parseInt(e.target.value) || 120 },
                })
              }
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0c0d24]/5 border border-white/10 text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 font-medium block mb-1">Absolute Max Lifetime (Days)</label>
            <input
              type="number"
              value={data.global.session_absolute_timeout_days}
              onChange={(e) =>
                setData({
                  ...data,
                  global: { ...data.global, session_absolute_timeout_days: parseInt(e.target.value) || 30 },
                })
              }
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0c0d24]/5 border border-white/10 text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 font-medium block mb-1">Trusted Device Duration (Days)</label>
            <input
              type="number"
              value={data.global.trusted_device_lifetime_days}
              onChange={(e) =>
                setData({
                  ...data,
                  global: { ...data.global, trusted_device_lifetime_days: parseInt(e.target.value) || 30 },
                })
              }
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0c0d24]/5 border border-white/10 text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
