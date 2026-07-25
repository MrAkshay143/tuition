import React, { useState } from 'react'
import { useApiQuery, useApiMutation } from '@/api/resources/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { Card, Spinner, Input, Button, Badge } from '@/components/ui'
import { useTheme } from '@/design-system/hooks/useTheme'
import { useAuthStore } from '@/store'
import { toast } from 'react-hot-toast'
import { AssetPickerDrawer } from '../media/AssetPickerDrawer'
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Shield, Bell, Palette,
  Sun, Moon, Monitor, LogOut, Camera, CheckCircle2, Sparkles, Save, ShieldCheck, RefreshCw
} from 'lucide-react'

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme()
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const [isPickerOpen, setIsPickerOpen] = useState(false)

  // Fetch current user settings/profile
  const { data: prefsData, isLoading, refetch } = useApiQuery(
    ['notifications', 'preferences'],
    '/notifications/preferences'
  )

  const updateMutation = useApiMutation<any, any>(
    '/notifications/preferences',
    'put',
    {
      onMutate: async (newPrefs) => {
        await queryClient.cancelQueries({ queryKey: ['notifications', 'preferences'] })
        const previous = queryClient.getQueryData(['notifications', 'preferences'])
        queryClient.setQueryData(['notifications', 'preferences'], newPrefs)
        return { previous }
      },
      onError: (err, newPrefs, context: any) => {
        if (context?.previous) {
          queryClient.setQueryData(['notifications', 'preferences'], context.previous)
        }
        toast.error('Failed to update preference')
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] })
      }
    }
  )

  const updateProfileMutation = useApiMutation<any, any>(
    '/auth/profile',
    'put',
    {
      onSuccess: () => {
        toast.success('Profile updated successfully')
        setUser({ ...user, name, email, phone } as any)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to update profile')
      }
    }
  )

  const changePasswordMutation = useApiMutation<any, any>(
    '/auth/change-password',
    'post',
    {
      onSuccess: () => {
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to change password')
      }
    }
  )

  const revokeSessionsMutation = useApiMutation<any, any>(
    '/sessions/revoke-other',
    'post'
  )

  const avatarMutation = useApiMutation<any, any>(
    '/auth/profile',
    'put',
    {
      onSuccess: (data, variables) => {
        toast.success('Avatar updated successfully')
        setUser({ ...user, avatar: variables.avatar } as any)
        setIsPickerOpen(false)
      },
      onError: () => toast.error('Failed to update avatar')
    }
  )

  const preferences = prefsData || {
    email: true,
    live_class_reminder: true,
    assignment_due: true,
    exam_reminder: true,
    new_content: false
  }

  const activeNotifCount = Object.values(preferences).filter(Boolean).length

  const handleToggle = (key: string) => {
    updateMutation.mutate({
      ...preferences,
      [key]: !preferences[key]
    })
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate({ name, email, phone })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return toast.error('Please fill in password fields')
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match')
    }
    changePasswordMutation.mutate({ current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword })
  }

  const handleAvatarSelect = (media: any) => {
    if (!media || (!media.url && !media.path)) return
    avatarMutation.mutateAsync({ avatar: media.url || media.path }).catch(() => {})
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto pb-12 text-left">
      {/* Page Banner */}
      <div className="flex flex-row items-center justify-between gap-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-3 sm:p-3.5 shadow-xs">
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h1 className="text-sm sm:text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] shrink-0">
              Settings & Preferences
            </h1>
            <span className="hidden sm:inline text-[rgb(var(--text-muted))] text-xs">•</span>
            <p className="hidden sm:block text-xs text-[rgb(var(--text-muted))] truncate">
              Manage personal profile, security, appearance, and notifications.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetch()}
              className="p-1.5 sm:p-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Preferences"
            >
              <RefreshCw size={14} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

      {/* 2. Top Summary KPI Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Account Role</p>
              <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] capitalize">
                {user?.role || 'Educator'}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Security Level</p>
              <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">Verified Protected</h3>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Palette size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Interface Theme</p>
              <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] capitalize">
                {theme} Mode
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Alert Channels</p>
              <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">
                {activeNotifCount} Active
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Main Settings 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Personal Profile & Theme Selection */}
        <div className="flex flex-col gap-5">
          {/* Profile Information Card */}
          <Card className="p-4 sm:p-5 border border-[rgb(var(--border))] space-y-4">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] font-[Outfit]">Profile Details</h3>
                  <p className="text-[11px] text-[rgb(var(--text-muted))]">Manage your personal account credentials.</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 py-1">
              <div className="relative shrink-0">
                <img
                  src={user?.avatar || `/images/default-avatar.svg`}
                  alt="Avatar"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[rgb(var(--border))] shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-1.5 cursor-pointer shadow-md transition-all"
                  title="Change avatar"
                >
                  <Camera size={13} />
                </button>
              </div>
              
              <AssetPickerDrawer
                open={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                typeFilter="image"
                onSelect={handleAvatarSelect}
              />

              <div className="min-w-0">
                <div className="font-bold text-sm text-[rgb(var(--text-primary))] font-[Outfit] truncate">{user?.name || 'Educator'}</div>
                <div className="text-[11px] text-[rgb(var(--text-muted))] font-mono truncate">{user?.email}</div>
                <span className="inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {user?.role || 'Teacher'}
                </span>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-3.5 pt-2 border-t border-[rgb(var(--border))]">
              <div>
                <label className="block text-xs font-bold text-[rgb(var(--text-secondary))] mb-1">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter full name" 
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[rgb(var(--text-secondary))] mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                  <Input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))]" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[rgb(var(--text-secondary))] mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                  <Input 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))]" 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending} 
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Theme Selection Card */}
          <Card className="p-4 sm:p-5 border border-[rgb(var(--border))] space-y-3.5">
            <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] pb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Palette size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] font-[Outfit]">Appearance Theme</h3>
                <p className="text-[11px] text-[rgb(var(--text-muted))]">Choose your preferred visual theme for the platform.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {[
                { key: 'light', label: 'Light', icon: Sun },
                { key: 'dark', label: 'Dark', icon: Moon },
                { key: 'system', label: 'System', icon: Monitor },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key as any)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-2 relative ${
                    theme === key
                      ? 'border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:border-indigo-500/30'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {theme === key && (
                    <CheckCircle2 size={12} className="absolute top-1.5 right-1.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Security & Notifications */}
        <div className="flex flex-col gap-5">
          {/* Password & Security Card */}
          <Card className="p-4 sm:p-5 border border-[rgb(var(--border))] space-y-4">
            <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] pb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] font-[Outfit]">Password & Security</h3>
                <p className="text-[11px] text-[rgb(var(--text-muted))]">Update your password to keep your account secure.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[rgb(var(--text-secondary))] mb-1">Current Password</label>
                <div className="relative">
                  <Input 
                    required 
                    type={showCurrentPw ? 'text' : 'password'} 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] font-mono" 
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

              <div>
                <label className="block text-xs font-bold text-[rgb(var(--text-secondary))] mb-1">New Password</label>
                <div className="relative">
                  <Input 
                    required 
                    minLength={8} 
                    type={showNewPw ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] font-mono" 
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
                <label className="block text-xs font-bold text-[rgb(var(--text-secondary))] mb-1">Confirm New Password</label>
                <div className="relative">
                  <Input 
                    required 
                    minLength={8} 
                    type={showConfirmPw ? 'text' : 'password'} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] font-mono" 
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

              <div className="flex justify-end pt-1">
                <Button 
                  type="submit" 
                  disabled={changePasswordMutation.isPending} 
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Shield size={14} />
                  {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
            
            <div className="pt-3 border-t border-[rgb(var(--border))] flex justify-end">
              <button 
                type="button" 
                onClick={() => revokeSessionsMutation.mutateAsync({}).then(() => toast.success('All other device sessions revoked'))} 
                className="w-full sm:w-auto px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold hover:bg-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut size={14} />
                Revoke All Other Active Sessions
              </button>
            </div>
          </Card>

          {/* Notifications Preferences Card */}
          <Card className="p-4 sm:p-5 border border-[rgb(var(--border))] space-y-4">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] font-[Outfit]">Notification Preferences</h3>
                  <p className="text-[11px] text-[rgb(var(--text-muted))]">Choose which platform alerts you want to receive.</p>
                </div>
              </div>
              {isLoading && <Spinner size={16} />}
            </div>
            
            <div className="space-y-3">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive important updates and announcements via email' },
                { key: 'live_class_reminder', label: 'Live Class Reminders', desc: 'Alerts 15 minutes before your scheduled live classes' },
                { key: 'assignment_due', label: 'Assignment Deadlines', desc: 'Notifications for student submission deadlines' },
                { key: 'exam_reminder', label: 'Exam Reminders', desc: 'Alerts for upcoming student examinations' },
                { key: 'new_content', label: 'New Content Alerts', desc: 'Notifications when new course modules are added' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-3 last:border-0 last:pb-0 gap-3">
                  <div>
                    <div className="font-bold text-xs text-[rgb(var(--text-primary))]">{item.label}</div>
                    <div className="text-[10px] text-[rgb(var(--text-muted))]">{item.desc}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={!!preferences[item.key]}
                      onChange={() => handleToggle(item.key)}
                      disabled={isLoading || updateMutation.isPending}
                    />
                    <div className="w-9 h-5 bg-[rgb(var(--border))] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

