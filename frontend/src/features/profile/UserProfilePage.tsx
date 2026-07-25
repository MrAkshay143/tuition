import React, { useState } from 'react'
import { useApiQuery, useApiMutation } from '@/api/resources/hooks'
import { Card, Button, Badge, Spinner, Input } from '@/components/ui'
import { useAuthStore } from '@/store'
import { 
  User, Mail, Phone, ShieldCheck, KeyRound, Monitor, 
  CheckCircle2, Lock, Laptop, Save, Pencil, Eye, EyeOff,
  LogOut, ArrowRight, ShieldAlert, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

export const UserProfilePage = () => {
  const { user, setUser } = useAuthStore()

  // Form states
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // Profile update mutation
  const updateProfileMutation = useApiMutation<any, any>(
    '/auth/profile',
    'put',
    {
      onSuccess: () => {
        toast.success('Profile updated successfully')
        if (user) setUser({ ...user, name, email, phone } as any)
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to update profile')
      }
    }
  )

  // Password change mutation
  const changePasswordMutation = useApiMutation<any, any>(
    '/auth/change-password',
    'post',
    {
      onSuccess: () => {
        toast.success('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to change password')
      }
    }
  )

  // Revoke other sessions mutation
  const revokeSessionsMutation = useApiMutation<any, any>(
    '/sessions/revoke-other',
    'post',
    {
      onSuccess: () => {
        toast.success('Revoked all other active sessions')
      }
    }
  )

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutateAsync({ name, email, phone })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    changePasswordMutation.mutateAsync({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword
    })
  }

  const userInitial = user?.name ? user.name.trim()[0].toUpperCase() : 'P'
  const userRole = (user?.role || 'admin').toUpperCase()

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-[1400px] mx-auto pb-12 text-left">
      {/* Page Banner */}
      <div className="flex flex-row items-center justify-between gap-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-3 sm:p-3.5 shadow-xs">
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h1 className="text-sm sm:text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] shrink-0">
              User Profile
            </h1>
            <span className="hidden sm:inline text-[rgb(var(--text-muted))] text-xs">•</span>
            <p className="hidden sm:block text-xs text-[rgb(var(--text-muted))] truncate">
              Manage personal account identity, email, and security settings.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 sm:p-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Profile"
            >
              <RefreshCw size={14} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

      {/* Hero Profile Banner Box */}
      <Card className="p-6 border border-[rgb(var(--border))] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden bg-gradient-to-r from-purple-900/10 via-[rgb(var(--bg-surface))] to-[rgb(var(--bg-surface))]">
        <div className="flex items-center gap-5">
          {/* Large Avatar Initial Box */}
          <div className="w-18 h-18 rounded-2xl bg-purple-600/30 text-purple-300 border border-purple-500/30 font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-purple-900/20">
            {userInitial}
          </div>

          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">
                {user?.name || 'Platform Admin'}
              </h1>
              <span className="text-[9px] font-extrabold font-mono uppercase tracking-wider text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-md">
                {userRole}
              </span>
            </div>

            <p className="text-xs text-[rgb(var(--text-muted))] flex items-center gap-1.5 font-mono">
              <Mail size={13} className="text-purple-400" /> {user?.email || 'admin@eduflow.test'}
            </p>
          </div>
        </div>

        {/* Top Right Active Status Badge */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> ACCOUNT ACTIVE
          </span>
        </div>
      </Card>

      {/* 2. Main 2-Column Grid matching Reference Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Personal Details & Security Password */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Personal Details Card */}
          <Card className="p-5 border border-[rgb(var(--border))]">
            <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-[rgb(var(--border))]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">
                    Personal Details
                  </h2>
                  <p className="text-[11px] text-[rgb(var(--text-muted))]">
                    Manage your personal information and contact details.
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] rounded-xl px-3 py-1 cursor-pointer"
              >
                <Pencil size={12} className="mr-1 inline" /> Edit
              </Button>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 transition-all font-semibold"
                    placeholder="Platform Admin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 transition-all font-semibold"
                      placeholder="admin@eduflow.test"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] outline-none focus:border-indigo-500/50 transition-all font-semibold"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
                  disabled={updateProfileMutation.isPending}
                >
                  <Save size={14} /> Save Personal Details
                </Button>
              </div>
            </form>
          </Card>

          {/* Security & Password Card */}
          <Card className="p-5 border border-[rgb(var(--border))]">
            <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-[rgb(var(--border))]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">
                    Security & Password
                  </h2>
                  <p className="text-[11px] text-[rgb(var(--text-muted))]">
                    Keep your account secure by updating your password.
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] rounded-xl px-3 py-1 cursor-pointer"
              >
                <Pencil size={12} className="mr-1 inline" /> Edit
              </Button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 transition-all font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                  >
                    {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 transition-all font-mono"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                    >
                      {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 transition-all font-mono"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                    >
                      {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
                  disabled={changePasswordMutation.isPending}
                >
                  <Lock size={14} /> Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Active Sessions */}
        <div className="flex flex-col gap-5">
          <Card className="p-5 border border-[rgb(var(--border))] flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Monitor size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">
                      Active Sessions
                    </h2>
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">
                      You're currently signed in on these devices.
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => revokeSessionsMutation.mutateAsync({})} 
                  disabled={revokeSessionsMutation.isPending}
                  className="text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut size={12} /> Revoke Others
                </Button>
              </div>

              {/* Sessions List matching Reference Screenshot */}
              <div className="flex flex-col gap-3">
                {/* Session Item 1: Firefox on Windows */}
                <div className="p-3 border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Laptop size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                        Firefox on Windows
                      </p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
                        127.0.0.1 • <span className="text-slate-500 dark:text-emerald-400 font-semibold">Current Session</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-extrabold font-mono uppercase bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    ACTIVE
                  </span>
                </div>

                {/* Session Item 2: Chrome on Windows 11 */}
                <div className="p-3 border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-surface))] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Laptop size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                        Chrome on Windows 11
                      </p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
                        127.0.0.1 • 2h ago
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-extrabold font-mono uppercase bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Link */}
            <div className="pt-4 mt-4 border-t border-[rgb(var(--border))]">
              <a
                href="#sessions"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-between w-full font-[Outfit]"
              >
                <span>View all sessions</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
