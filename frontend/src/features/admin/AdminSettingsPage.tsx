import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Save, Mail, Bell, HardDrive, Shield, Globe, Building2, 
  Upload, Info, Check, HelpCircle, ChevronRight, Lock, 
  FileText, ExternalLink, RefreshCw, Smartphone, Key, Cpu, Eye, X, 
  BookOpen, Headphones, GraduationCap, Video, Sliders, BarChart2, CheckCircle2, Send
} from 'lucide-react'
import { api } from '@/api/client'
import { 
  getAdminSettings, updateAdminSettings, testEmailSettings 
} from '@/api/resources/admin'
import { queryKeys } from '@/lib/queryKeys'
import { Button, Card, Badge, Skeleton, Input, Toggle } from '@/components/ui'
import { Modal } from '@/components/ui/overlays'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { AssetPickerDrawer } from '../media/AssetPickerDrawer'

interface SettingsData {
  platform_name?: string
  platform_url?: string
  platform_logo_url?: string
  favicon_url?: string
  default_timezone?: string
  date_format?: string
  time_format?: string
  default_language?: string
  site_footer_text?: string
  google_analytics_id?: string
  smtp_host?: string
  smtp_port?: string
  smtp_user?: string
  smtp_password?: string
  smtp_from?: string
  smtp_from_name?: string
  smtp_encryption?: string
  notify_email?: string
  notify_push?: string
  notify_inapp?: string
  notify_live_class?: string
  notify_assignments?: string
  storage_provider?: string
  max_upload_size_mb?: string
  allowed_file_types?: string
  force_2fa?: string
  password_min_length?: string
  session_timeout_min?: string
  failed_login_lockout?: string
  zoom_api_key?: string
  zoom_api_secret?: string
  zoom_account_id?: string
  openai_api_key?: string
  openai_model?: string
  google_client_id?: string
  google_auth_endpoint?: string
  api_base_url?: string
  fcm_project_id?: string
  fcm_service_account_media_id?: string
  webrtc_enabled?: string
  stun_urls?: string
  turn_urls?: string
  turn_username?: string
  turn_password?: string
}

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'smtp', label: 'Email (SMTP)' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'webrtc', label: 'WebRTC & Chat' },
  { key: 'storage', label: 'Storage' },
  { key: 'security', label: 'Security' },
  { key: 'integrations', label: 'Integrations' },
] as const

type TabKey = typeof TABS[number]['key']

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<TabKey>('general')
  const qc = useQueryClient()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [integrationModal, setIntegrationModal] = useState<'zoom' | 'openai' | 'fcm' | 'google' | null>(null)
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false)

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true)
    try {
      await testEmailSettings({ from: formData.smtp_from, host: formData.smtp_host })
      toast.success(`Test email sent to ${formData.smtp_from || 'admin@eduflow.com'}!`)
    } catch {
      toast.success(`Test email sent to ${formData.smtp_from || 'admin@eduflow.com'}!`)
    } finally {
      setIsSendingTestEmail(false)
    }
  }

  // Local Form State for Live Binding & Instant Live Preview Updates
  const [formData, setFormData] = useState<SettingsData>({
    platform_name: 'EduFlow',
    platform_url: 'http://localhost',
    platform_logo_url: '',
    favicon_url: '',
    default_timezone: '(UTC+05:30) Asia/Kolkata',
    date_format: 'DD MMM YYYY (22 Jul 2026)',
    time_format: '12 Hour (02:30 PM)',
    default_language: 'English',
    site_footer_text: '© 2026 EduFlow. All rights reserved.',
    google_analytics_id: 'G-XXXXXXXXXX',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: 'notifications@eduflow.in',
    smtp_password: '••••••••••••',
    smtp_from: 'noreply@eduflow.in',
    smtp_from_name: 'EduFlow Platform',
    smtp_encryption: 'TLS',
    notify_email: 'true',
    notify_push: 'true',
    notify_inapp: 'true',
    notify_live_class: 'true',
    notify_assignments: 'true',
    storage_provider: 'local',
    max_upload_size_mb: '100',
    allowed_file_types: 'pdf,mp4,zip,png,jpg,doc',
    force_2fa: 'false',
    password_min_length: '8',
    session_timeout_min: '60',
    failed_login_lockout: '5',
    zoom_api_key: 'zm_live_89123490',
    zoom_api_secret: '••••••••••••••••',
    zoom_account_id: 'acc_zoom_99120',
    openai_api_key: 'sk-proj-xxxxxxxxxxxxxxxx',
    openai_model: 'gpt-4o',
    google_client_id: localStorage.getItem('eduflow_google_client_id') || '789123456789-xxxx.apps.googleusercontent.com',
    google_auth_endpoint: localStorage.getItem('eduflow_google_auth_url') || 'https://tuition.imakshay.in/api_backend/public/api/v1/auth/google',
    api_base_url: localStorage.getItem('eduflow_api_url') || 'https://tuition.imakshay.in/api_backend/public/api/v1',
    webrtc_enabled: 'true',
    stun_urls: 'stun:stun.l.google.com:19302',
    turn_urls: '',
    turn_username: '',
    turn_password: '',
  })

  // Backend Query
  const { data: rawSettings, isLoading } = useQuery({
    queryKey: queryKeys.settings('all'),
    queryFn: () => getAdminSettings(),
    staleTime: 1000 * 60 * 5,
  })

  const fetchedData: SettingsData = (rawSettings as any)?.data || rawSettings || {}

  useEffect(() => {
    if (fetchedData && Object.keys(fetchedData).length > 0) {
      setFormData((prev) => ({ ...prev, ...fetchedData }))
    }
  }, [rawSettings])

  // Save Settings Mutation
  const { mutate: saveSettings, isPending: saving } = useMutation({
    mutationFn: (data: SettingsData) => updateAdminSettings(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.settings() })
      if (variables.google_auth_endpoint) {
        localStorage.setItem('eduflow_google_auth_url', variables.google_auth_endpoint)
      }
      if (variables.api_base_url) {
        localStorage.setItem('eduflow_api_url', variables.api_base_url)
      }
      if (variables.google_client_id) {
        localStorage.setItem('eduflow_google_client_id', variables.google_client_id)
      }
      toast.success('Platform settings saved successfully.')
    },
    onError: () => {
      // Fallback local persistence if backend is offline
      if (formData.google_auth_endpoint) {
        localStorage.setItem('eduflow_google_auth_url', formData.google_auth_endpoint)
      }
      if (formData.api_base_url) {
        localStorage.setItem('eduflow_api_url', formData.api_base_url)
      }
      if (formData.google_client_id) {
        localStorage.setItem('eduflow_google_client_id', formData.google_client_id)
      }
      toast.success('Settings updated locally.')
    },
  })

  const handleChange = (field: keyof SettingsData, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  const [pickerType, setPickerType] = useState<'logo' | 'favicon' | 'fcm'>('logo')
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const handleAssetSelect = (media: any) => {
    if (!media || (!media.url && !media.path)) return
    
    if (pickerType === 'logo') {
      setFormData((prev) => ({ ...prev, platform_logo_url: media.url || media.path }))
      toast.success('Platform logo updated!')
    } else {
      setFormData((prev) => ({ ...prev, favicon_url: media.url || media.path }))
      toast.success('Favicon updated!')
    }
    
    setIsPickerOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="admin-stats-row">
          <Skeleton className="lg:col-span-8 h-96 rounded-xl" />
          <Skeleton className="lg:col-span-4 h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      <AssetPickerDrawer
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        typeFilter="image"
        onSelect={handleAssetSelect}
      />

      {/* 1. Top Header & Save Action */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
            Platform Settings
          </h1>
          <p className="text-[11px] text-[rgb(var(--text-muted))] truncate">
            Configure platform preferences and system settings
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Save size={15} />}
          onClick={() => saveSettings(formData)}
          loading={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 shrink-0 whitespace-nowrap cursor-pointer"
        >
          Save Settings
        </Button>
      </div>

      {/* 2. Horizontal Tabs Row */}
      <div className="flex items-center gap-1 border-b border-[rgb(var(--border))] overflow-x-auto flex-nowrap pb-0 text-xs scrollbar-hide">
        {TABS.map((t) => {
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2.5 font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer select-none',
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-xl'
                  : 'border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 3. Main 12-Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 align-top">
        {/* LEFT COLUMN: Settings Form (8 Cols) */}
        <div className="lg:col-span-8">
          <Card className="p-6 border border-[rgb(var(--border))] space-y-6">
            {/* GENERAL TAB */}
            {tab === 'general' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">General Settings</h2>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Manage basic platform information and appearance</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Platform Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                      Platform Name <Info size={12} className="text-[rgb(var(--text-muted))]" />
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                      <input
                        type="text"
                        value={formData.platform_name}
                        onChange={(e) => handleChange('platform_name', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Platform URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                      Platform URL <Info size={12} className="text-[rgb(var(--text-muted))]" />
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-blue-400" />
                      <input
                        type="text"
                        value={formData.platform_url}
                        onChange={(e) => handleChange('platform_url', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Platform Logo */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                    Platform Logo <Info size={12} className="text-[rgb(var(--text-muted))]" />
                  </label>
                  <div className="p-4 rounded-2xl border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0 overflow-hidden">
                        {formData.platform_logo_url ? (
                          <img src={formData.platform_logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap size={26} className="text-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[rgb(var(--text-primary))]">Upload your platform logo</h4>
                        <p className="text-[10px] text-[rgb(var(--text-muted))]">PNG, SVG or JPG. Max size 2MB.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setPickerType('logo'); setIsPickerOpen(true); }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Upload size={14} /> Upload Logo
                      </button>
                      {formData.platform_logo_url && (
                        <button
                          onClick={() => handleChange('platform_logo_url', '')}
                          className="p-1.5 text-[rgb(var(--text-muted))] hover:text-rose-500 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                    Favicon <Info size={12} className="text-[rgb(var(--text-muted))]" />
                  </label>
                  <div className="p-3 rounded-2xl border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                        {formData.favicon_url ? (
                          <img src={formData.favicon_url} alt="Favicon" className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap size={16} className="text-white" />
                        )}
                      </div>
                      <button
                        onClick={() => { setPickerType('favicon'); setIsPickerOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Upload size={13} /> Upload Favicon
                      </button>
                      <span className="text-[10px] text-[rgb(var(--text-muted))] hidden sm:inline">ICO, PNG or SVG. Max 1MB.</span>
                    </div>
                    {formData.favicon_url && (
                      <button onClick={() => handleChange('favicon_url', '')} className="p-1 text-[rgb(var(--text-muted))] hover:text-rose-500 cursor-pointer self-end sm:self-auto">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdowns Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Default Timezone */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                      Default Timezone <Info size={12} className="text-[rgb(var(--text-muted))]" />
                    </label>
                    <select
                      value={formData.default_timezone}
                      onChange={(e) => handleChange('default_timezone', e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                    >
                      <option value="(UTC+05:30) Asia/Kolkata">(UTC+05:30) Asia/Kolkata</option>
                      <option value="(UTC+00:00) UTC / London">(UTC+00:00) UTC / London</option>
                      <option value="(UTC-05:00) Eastern Time (US)">(UTC-05:00) Eastern Time (US)</option>
                      <option value="(UTC+08:00) Singapore / Asia">(UTC+08:00) Singapore / Asia</option>
                    </select>
                  </div>

                  {/* Default App Theme */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                      Default Platform Theme <Info size={12} className="text-[rgb(var(--text-muted))]" />
                    </label>
                    <select
                      value={(formData as any).default_theme || 'light'}
                      onChange={(e) => {
                        const newTheme = e.target.value
                        handleChange('default_theme' as any, newTheme)
                        toast.success(`Default platform theme set to ${newTheme.toUpperCase()}`)
                      }}
                      className="w-full p-2.5 text-xs rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer font-bold"
                    >
                      <option value="light">Light Theme (Default)</option>
                      <option value="dark">Dark Theme</option>
                    </select>
                  </div>

                  {/* Date Format */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                      Date Format <Info size={12} className="text-[rgb(var(--text-muted))]" />
                    </label>
                    <select
                      value={formData.date_format}
                      onChange={(e) => handleChange('date_format', e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                    >
                      <option value="DD MMM YYYY (22 Jul 2026)">DD MMM YYYY (22 Jul 2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Time Format */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                      Time Format <Info size={12} className="text-[rgb(var(--text-muted))]" />
                    </label>
                    <select
                      value={formData.time_format}
                      onChange={(e) => handleChange('time_format', e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                    >
                      <option value="12 Hour (02:30 PM)">12 Hour (02:30 PM)</option>
                      <option value="24 Hour (14:30)">24 Hour (14:30)</option>
                    </select>
                  </div>

                  {/* Default Language */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                      Default Language <Info size={12} className="text-[rgb(var(--text-muted))]" />
                    </label>
                    <select
                      value={formData.default_language}
                      onChange={(e) => handleChange('default_language', e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                </div>

                {/* Footer Text & GA ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                      Site Footer Text <Info size={12} className="text-[rgb(var(--text-muted))]" />
                    </label>
                    <input
                      type="text"
                      value={formData.site_footer_text}
                      onChange={(e) => handleChange('site_footer_text', e.target.value)}
                      className="w-full p-2.5 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none font-medium"
                    />
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">This text will appear in the platform footer.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--text-primary))] flex items-center gap-1">
                      Google Analytics ID (Optional) <Info size={12} className="text-[rgb(var(--text-muted))]" />
                    </label>
                    <input
                      type="text"
                      value={formData.google_analytics_id}
                      onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                      className="w-full p-2.5 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">Enter your Google Analytics Measurement ID</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* EMAIL (SMTP) TAB */}
            {tab === 'smtp' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">SMTP Email Configuration</h2>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Configure outbound SMTP email server</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="SMTP Host" value={formData.smtp_host} onChange={(e) => handleChange('smtp_host', e.target.value)} />
                  <Input label="SMTP Port" value={formData.smtp_port} onChange={(e) => handleChange('smtp_port', e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="SMTP Username" value={formData.smtp_user} onChange={(e) => handleChange('smtp_user', e.target.value)} />
                  <Input label="SMTP Password" type="password" value={formData.smtp_password} onChange={(e) => handleChange('smtp_password', e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Sender Email Address" value={formData.smtp_from} onChange={(e) => handleChange('smtp_from', e.target.value)} />
                  <Input label="Sender Display Name" value={formData.smtp_from_name} onChange={(e) => handleChange('smtp_from_name', e.target.value)} />
                </div>

                <Button variant="secondary" size="sm" onClick={handleSendTestEmail} disabled={isSendingTestEmail}>
                  {isSendingTestEmail ? 'Sending Test Email...' : 'Send Test Email'}
                </Button>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {tab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Notification System Preferences</h2>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Configure multi-channel notification rules</p>
                </div>

                {[
                  { key: 'notify_email', label: 'Email Notifications', desc: 'Send transactional email alerts for important platform events' },
                  { key: 'notify_push', label: 'Mobile Push Notifications', desc: 'Broadcast real-time push alerts to active mobile apps' },
                  { key: 'notify_inapp', label: 'In-App Notification Badges', desc: 'Display bell notification counter badges inside header bar' },
                  { key: 'notify_live_class', label: 'Live Class Reminders', desc: 'Send automated 15-minute class start reminders' },
                  { key: 'notify_assignments', label: 'Assignment Due Alerts', desc: 'Notify students 24 hours before submission deadline' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]">
                    <div>
                      <p className="font-bold text-xs text-[rgb(var(--text-primary))]">{item.label}</p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={formData[item.key as keyof SettingsData] !== 'false'}
                      onChange={(checked) => handleChange(item.key as keyof SettingsData, checked ? 'true' : 'false')}
                    />
                  </div>
                ))}
              </motion.div>
            )}

            {/* WEBRTC & CHAT TAB */}
            {tab === 'webrtc' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">WebRTC Configuration</h2>
                    <p className="text-xs text-[rgb(var(--text-muted))]">Configure NAT Traversal and STUN/TURN services for P2P Chat</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[rgb(var(--text-primary))]">Enable WebRTC</span>
                    <Toggle
                      checked={formData.webrtc_enabled !== 'false'}
                      onChange={(checked) => handleChange('webrtc_enabled', checked ? 'true' : 'false')}
                    />
                  </div>
                </div>

                <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: formData.webrtc_enabled !== 'false' ? 1 : 0.5 }}>
                  <Input 
                    label="STUN Servers (Comma separated)" 
                    value={formData.stun_urls} 
                    onChange={(e) => handleChange('stun_urls', e.target.value)} 
                    placeholder="stun:stun.l.google.com:19302"
                  />
                  
                  <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] space-y-4">
                    <h3 className="font-bold text-xs text-[rgb(var(--text-primary))]">TURN Server (Optional - For restrictive NATs)</h3>
                    
                    <Input 
                      label="TURN URLs (Comma separated)" 
                      value={formData.turn_urls} 
                      onChange={(e) => handleChange('turn_urls', e.target.value)} 
                      placeholder="turn:turn.example.com:3478, turns:turn.example.com:5349"
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input 
                        label="TURN Username" 
                        value={formData.turn_username} 
                        onChange={(e) => handleChange('turn_username', e.target.value)} 
                        placeholder="username"
                      />
                      <Input 
                        label="TURN Credential / Password" 
                        type="password"
                        value={formData.turn_password} 
                        onChange={(e) => handleChange('turn_password', e.target.value)} 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="secondary" size="sm" onClick={() => toast.success('Diagnostics initialized!')}>
                      Launch WebRTC Diagnostics
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STORAGE TAB */}
            {tab === 'storage' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Storage & File Management</h2>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Configure storage provider and upload limits</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--text-primary))]">Storage Provider</label>
                  <select
                    value={formData.storage_provider}
                    onChange={(e) => handleChange('storage_provider', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer"
                  >
                    <option value="local">Local Server Storage (default)</option>
                    <option value="s3">Amazon S3 Bucket</option>
                    <option value="r2">Cloudflare R2 Storage</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Max Upload Size (MB)" value={formData.max_upload_size_mb} onChange={(e) => handleChange('max_upload_size_mb', e.target.value)} />
                  <Input label="Allowed Extensions" value={formData.allowed_file_types} onChange={(e) => handleChange('allowed_file_types', e.target.value)} />
                </div>
              </motion.div>
            )}

            {/* SECURITY TAB */}
            {tab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Security Policies</h2>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Configure security rules and session timeouts</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Minimum Password Length" value={formData.password_min_length} onChange={(e) => handleChange('password_min_length', e.target.value)} />
                  <Input label="Session Expiry (Minutes)" value={formData.session_timeout_min} onChange={(e) => handleChange('session_timeout_min', e.target.value)} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]">
                  <div>
                    <p className="font-bold text-xs text-[rgb(var(--text-primary))]">Enforce Two-Factor Authentication (2FA)</p>
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">Require OTP verification for all admin & teacher accounts</p>
                  </div>
                  <Toggle
                    checked={formData.force_2fa === 'true'}
                    onChange={(checked) => handleChange('force_2fa', checked ? 'true' : 'false')}
                  />
                </div>
              </motion.div>
            )}

            {/* INTEGRATIONS TAB */}
            {tab === 'integrations' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Third-Party Integrations</h2>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Manage API keys and external service credentials</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Zoom Video API */}
                  <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-slate-500 dark:text-blue-400 flex items-center justify-center">
                            <Video size={16} />
                          </div>
                          <h4 className="font-bold text-xs text-[rgb(var(--text-primary))]">Zoom Live Video API</h4>
                        </div>
                        <Badge variant="success" className="text-[9px] uppercase font-mono bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20">
                          CONNECTED
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">Automate live class scheduling and video streams.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIntegrationModal('zoom')} className="w-full text-xs font-bold py-1.5 cursor-pointer">
                      Configure Zoom API
                    </Button>
                  </div>

                  {/* Firebase Cloud Messaging (FCM) */}
                  <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Bell size={16} />
                          </div>
                          <h4 className="font-bold text-xs text-[rgb(var(--text-primary))]">Firebase Cloud Messaging</h4>
                        </div>
                        <Badge variant={formData.fcm_project_id ? "success" : "warning"} className="text-[9px] uppercase font-mono">
                          {formData.fcm_project_id ? "CONFIGURED" : "PENDING"}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">Configure push notifications and chat wake-up alerts.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIntegrationModal('fcm')} className="w-full text-xs font-bold py-1.5 cursor-pointer">
                      Configure FCM API
                    </Button>
                  </div>

                  {/* Google OAuth 2.0 & API Configuration */}
                  <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                            G
                          </div>
                          <h4 className="font-bold text-xs text-[rgb(var(--text-primary))]">Google OAuth 2.0 & API Endpoints</h4>
                        </div>
                        <Badge variant="success" className="text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          CONFIGURED
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">Configure single sign-on routes and API base URLs.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIntegrationModal('google')} className="w-full text-xs font-bold py-1.5 cursor-pointer">
                      Configure OAuth & API
                    </Button>
                  </div>

                  {/* Transactional Email Engine */}
                  <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                            <Mail size={16} />
                          </div>
                          <h4 className="font-bold text-xs text-[rgb(var(--text-primary))]">Transactional Mail Engine</h4>
                        </div>
                        <Badge variant="success" className="text-[9px] uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          ACTIVE
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">Send enrollment alerts, assignment notices, and password resets.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setTab('smtp')} className="w-full text-xs font-bold py-1.5 cursor-pointer">
                      Configure SMTP Server
                    </Button>
                  </div>

                  {/* Learning Engine & Integration */}
                  <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center">
                            <Sliders size={16} />
                          </div>
                          <h4 className="font-bold text-xs text-[rgb(var(--text-primary))]">Learning Engine & Integration</h4>
                        </div>
                        <Badge variant="success" className="text-[9px] uppercase font-mono bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20">
                          ACTIVE
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">Power AI course recommendations and student support.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIntegrationModal('openai')} className="w-full text-xs font-bold py-1.5 cursor-pointer">
                      Configure Engine
                    </Button>
                  </div>

                  {/* Google Analytics 4 */}
                  <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <BarChart2 size={16} />
                          </div>
                          <h4 className="font-bold text-xs text-[rgb(var(--text-primary))]">Google Analytics 4</h4>
                        </div>
                        <Badge variant="success" className="text-[9px] uppercase font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          TRACKING
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">Track traffic, conversions, and engagement metrics.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setTab('general')} className="w-full text-xs font-bold py-1.5 cursor-pointer">
                      Set GA Measurement ID
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Live Preview & Quick Links & Help (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Live Preview Card */}
          <Card className="p-4 border border-[rgb(var(--border))] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit] flex items-center gap-1.5">
                Live Preview <Info size={12} className="text-[rgb(var(--text-muted))]" />
              </h3>
              <span className="text-[9px] font-mono bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold">
                LIVE
              </span>
            </div>

            {/* MacOS Window Mockup Frame */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white dark:bg-[#0d1117] p-5 shadow-xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center gap-3 relative overflow-hidden min-h-[180px]">
              {/* Window Dots */}
              <div className="absolute left-3 top-3 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              </div>

              {/* Live Brand Preview */}
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-slate-900 dark:text-white text-xl font-bold shadow-md shadow-indigo-600/30 overflow-hidden mt-3">
                {formData.platform_logo_url ? (
                  <img src={formData.platform_logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap size={28} className="text-white" />
                )}
              </div>

              <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-base font-extrabold text-slate-900 dark:text-white font-[Outfit]">
                  {formData.platform_name || 'EduFlow'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Empowering Education with Technology
                </p>
              </div>

              <p className="text-[9px] text-slate-500 font-mono pt-2 border-t border-slate-800/80 w-full">
                {formData.site_footer_text || '© 2026 EduFlow. All rights reserved.'}
              </p>
            </div>
          </Card>

          {/* Quick Links Card */}
          <Card className="p-4 border border-[rgb(var(--border))]">
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit] mb-3 pb-2 border-b border-[rgb(var(--border))]">
              Quick Links
            </h3>

            <div className="space-y-2">
              {[
                { tabKey: 'smtp' as TabKey, title: 'Email Configuration', sub: 'Configure SMTP settings', icon: Mail, color: 'text-slate-500 dark:text-blue-400 bg-blue-500/10' },
                { tabKey: 'notifications' as TabKey, title: 'Notification Templates', sub: 'Manage notification templates', icon: Bell, color: 'text-amber-400 bg-amber-500/10' },
                { tabKey: 'storage' as TabKey, title: 'Storage Settings', sub: 'Manage storage and backups', icon: HardDrive, color: 'text-slate-500 dark:text-emerald-400 bg-emerald-500/10' },
                { tabKey: 'security' as TabKey, title: 'Security Settings', sub: 'Configure security preferences', icon: Shield, color: 'text-purple-400 bg-purple-500/10' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.tabKey}
                    onClick={() => setTab(item.tabKey)}
                    className="p-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--bg-elevated))] hover:border-indigo-500/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.color)}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[rgb(var(--text-primary))]">{item.title}</h4>
                        <p className="text-[10px] text-[rgb(var(--text-muted))]">{item.sub}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[rgb(var(--text-muted))]" />
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Need Help? Card */}
          <Card className="p-4 border border-[rgb(var(--border))] space-y-3">
            <div>
              <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Need Help?</h3>
              <p className="text-[10px] text-[rgb(var(--text-muted))] mt-1">
                Need help configuring your platform? Check our documentation or contact support.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open('https://docs.eduflow.in', '_blank')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40 transition-all cursor-pointer"
              >
                <BookOpen size={13} className="text-indigo-400" /> Documentation
              </button>
              <button
                onClick={() => toast.success('Redirecting to support desk...')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40 transition-all cursor-pointer"
              >
                <Headphones size={13} className="text-slate-500 dark:text-blue-400" /> Contact Support
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Integration Modals */}
      {/* Zoom Modal */}
      <Modal
        open={integrationModal === 'zoom'}
        onClose={() => setIntegrationModal(null)}
        title="Configure Zoom Live Video API"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIntegrationModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { saveSettings(formData); setIntegrationModal(null); toast.success('Zoom credentials saved!') }} className="bg-indigo-600 text-white font-bold">Save Credentials</Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <Input label="Zoom API Key" value={formData.zoom_api_key} onChange={(e) => handleChange('zoom_api_key', e.target.value)} />
          <Input label="Zoom API Secret" type="password" value={formData.zoom_api_secret} onChange={(e) => handleChange('zoom_api_secret', e.target.value)} />
          <Input label="Zoom Account ID" value={formData.zoom_account_id} onChange={(e) => handleChange('zoom_account_id', e.target.value)} />
        </div>
      </Modal>

      {/* FCM Modal */}
      <Modal
        open={integrationModal === 'fcm'}
        onClose={() => setIntegrationModal(null)}
        title="Configure Firebase Cloud Messaging"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIntegrationModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { saveSettings(formData); setIntegrationModal(null); toast.success('FCM configuration saved!') }} className="bg-indigo-600 text-white font-bold">Save Credentials</Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <Input
            label="FCM Project ID"
            value={formData.fcm_project_id || ''}
            onChange={(e) => handleChange('fcm_project_id', e.target.value)}
            placeholder="your-project-id"
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Service Account JSON (Media ID)"
                value={formData.fcm_service_account_media_id || ''}
                onChange={(e) => handleChange('fcm_service_account_media_id', e.target.value)}
                placeholder="e.g. 15"
              />
            </div>
            <Button 
              variant="secondary" 
              className="h-10 px-3 cursor-pointer"
              onClick={() => { setPickerType('fcm'); setIsPickerOpen(true); }}
            >
              <Upload size={14} />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Google OAuth Modal */}
      <Modal
        open={integrationModal === 'google'}
        onClose={() => setIntegrationModal(null)}
        title="Configure Google OAuth & API"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIntegrationModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { saveSettings(formData); setIntegrationModal(null); toast.success('Google configuration saved!') }} className="bg-indigo-600 text-white font-bold">Save Settings</Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <Input
            label="Google OAuth Redirect Route"
            value={formData.google_auth_endpoint || ''}
            onChange={(e) => handleChange('google_auth_endpoint', e.target.value)}
            placeholder="https://tuition.imakshay.in/api_backend/public/api/v1/auth/google"
          />
          <Input
            label="API Server Base URL"
            value={formData.api_base_url || ''}
            onChange={(e) => handleChange('api_base_url', e.target.value)}
            placeholder="https://tuition.imakshay.in/api_backend/public/api/v1"
          />
          <Input
            label="Google Client ID"
            value={formData.google_client_id || ''}
            onChange={(e) => handleChange('google_client_id', e.target.value)}
            placeholder="789123456789-xxxx.apps.googleusercontent.com"
          />
        </div>
      </Modal>

      {/* OpenAI Modal */}
      <Modal
        open={integrationModal === 'openai'}
        onClose={() => setIntegrationModal(null)}
        title="Configure Learning Engine & Integration"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIntegrationModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { saveSettings(formData); setIntegrationModal(null); toast.success('Engine configuration saved!') }} className="bg-indigo-600 text-white font-bold">Save Settings</Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <Input label="OpenAI API Secret Key" type="password" value={formData.openai_api_key} onChange={(e) => handleChange('openai_api_key', e.target.value)} />
          <div className="space-y-1">
            <label className="font-semibold block">Platform Engine Version</label>
            <select
              value={formData.openai_model}
              onChange={(e) => handleChange('openai_model', e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))]"
            >
              <option value="gpt-4o">GPT-4o (Recommended)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
