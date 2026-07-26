import { motion } from 'framer-motion'
import {
  Users, BookOpen, Layers, ClipboardList, Video, TrendingUp,
  Clock, Radio, HardDrive, Plus, ChevronRight, Calendar,
  ExternalLink, RefreshCw, Sparkles,
} from 'lucide-react'
import { useDashboardBundle } from '@/api/bundles'
import { useAuthStore } from '@/store'
import { Skeleton, Button, Badge, Avatar, Card } from '@/components/ui'
import { formatBytes, formatDate, timeAgo } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Link } from 'react-router-dom'

// Animation variants
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

// ── Skeleton placeholders ─────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="admin-stats-row">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-56 col-span-2 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  )
}

// ── Custom Recharts tooltip ───────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-xs shadow-lg">
      <p className="font-semibold text-[rgb(var(--text-primary))] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function TeacherDashboard() {
  const { user } = useAuthStore()
  const { data: bundle, isLoading } = useDashboardBundle()

  if (isLoading) return <DashboardSkeleton />

  const b = bundle || {
    stats: { total_students: 0, active_students: 0, total_batches: 0, total_courses: 0, pending_assignments: 0, todays_classes: 0 },
    storage: { used_bytes: 0, total_bytes: 1000000000, percentage: 0 },
    weekly_activity: [],
    recent_submissions: [],
    todays_classes: [],
    upcoming_classes: [],
    activity_feed: [],
  }
  const storagePercent = Math.round(b.storage?.percentage || 0)



  return (
    <motion.div className="flex flex-col gap-4 max-w-[1400px] mx-auto pb-12 text-left" variants={container} initial="hidden" animate="show">
      {/* Welcome Hero Banner */}
      <motion.div variants={item}
        className="relative overflow-hidden rounded-2xl p-3.5 sm:p-4 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] shadow-xs"
      >
        <div className="relative z-10 flex flex-row items-center justify-between gap-3">
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] shrink-0">
              Welcome, {user?.name?.split(' ')[0]} 👋
            </h2>
            <span className="hidden sm:inline text-[rgb(var(--text-muted))] text-xs">•</span>
            <p className="hidden sm:block text-xs text-[rgb(var(--text-muted))] truncate font-medium">
              {b.stats.pending_assignments} pending reviews • {b.stats.todays_classes} class{b.stats.todays_classes !== 1 ? 'es' : ''} scheduled today.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 sm:p-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-all cursor-pointer flex items-center justify-center"
              title="Refresh Dashboard"
            >
              <RefreshCw size={14} />
            </button>
            <Link to="/teacher/live-classes">
              <Button
                variant="primary"
                leftIcon={<Radio size={14} />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 px-3 rounded-xl font-bold cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span className="hidden sm:inline">Go</span> Live
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Top 4 KPI Metrics Sparkline Cards Row */}
      <motion.div variants={item} className="admin-stats-row">
        {/* Card 1: Total Students */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Total Students</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{b.stats.total_students}</h3>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold whitespace-nowrap">{b.stats.active_students} active</p>
            </div>
          </div>
          <div className="w-10 h-5 text-purple-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Batches */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Layers size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Batches</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{b.stats.total_batches}</h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">Active batches</p>
            </div>
          </div>
          <div className="w-10 h-5 text-emerald-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,25 Q30,5 60,15 T100,10" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Courses */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Courses</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{b.stats.total_courses}</h3>
              <p className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">Assigned courses</p>
            </div>
          </div>
          <div className="w-10 h-5 text-amber-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,35 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Pending Reviews */}
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <ClipboardList size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider whitespace-nowrap">Pending Reviews</p>
              <h3 className="text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-tight">{b.stats.pending_assignments}</h3>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap">Need grading</p>
            </div>
          </div>
          <div className="w-10 h-5 text-blue-500/40 flex-shrink-0">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-2">
              <path d="M0,20 Q25,35 50,15 T100,25" />
            </svg>
          </div>
        </Card>
      </motion.div>

      {/* Charts + Today's Classes */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Activity Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="widget-header mb-4 flex items-center justify-between">
            <h3 className="widget-title">Weekly Activity</h3>
            <div className="flex items-center gap-2 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] px-2.5 py-1 rounded-xl shadow-xs">
              <Clock size={13} className="text-[rgb(var(--primary))]" />
              <select className="bg-transparent text-[11px] font-semibold text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer">
                <option value="7_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 7 Days</option>
                <option value="30_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 30 Days</option>
                <option value="90_days" className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">Last 90 Days</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={b.weekly_activity} margin={{ top: 10, right: 10, bottom: 5, left: -15 }}>
              <defs>
                <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(108,99,255)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(108,99,255)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLessons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(0,212,170)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(0,212,170)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }}
                tickLine={false}
                axisLine={false}
                dy={6}
                tickFormatter={(v) => {
                  if (!v) return ''
                  const parts = String(v).split('-')
                  if (parts.length === 3) {
                    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
                    return d.toLocaleDateString('en-US', { weekday: 'short' })
                  }
                  return v
                }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }}
                tickLine={false}
                axisLine={false}
                dx={-4}
              />
              <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.06)' }} content={<CustomTooltip />} />
              <Area type="monotone" dataKey="students_active" name="Active Students"
                stroke="rgb(108,99,255)" fill="url(#gradStudents)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="lessons_completed" name="Lessons Completed"
                stroke="rgb(0,212,170)" fill="url(#gradLessons)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Storage Widget */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="widget-header">
            <h3 className="widget-title">Storage</h3>
            <HardDrive size={16} className="text-[rgb(var(--text-muted))]" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-[rgb(var(--text-secondary))]">Used</span>
              <span className="font-semibold text-[rgb(var(--text-primary))]">{formatBytes(b.storage.used_bytes)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[rgb(var(--border))] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: storagePercent < 60 ? 'rgb(var(--accent))' : storagePercent < 80 ? 'rgb(var(--warning))' : 'rgb(var(--error))' }}
                initial={{ width: 0 }}
                animate={{ width: `${storagePercent}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-xs text-[rgb(var(--text-muted))]">
              <span>{storagePercent}% used</span>
              <span>{formatBytes(b.storage.total_bytes)} total</span>
            </div>
          </div>

          {/* Today's Classes mini */}
          <div className="border-t border-[rgb(var(--border))] pt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">Today's Classes</span>
              <Link to="/teacher/live-classes" className="text-xs text-[rgb(var(--primary))] hover:underline">View all</Link>
            </div>
            {b.todays_classes.length === 0 ? (
              <p className="text-xs text-[rgb(var(--text-muted))]">No classes scheduled today.</p>
            ) : (
              b.todays_classes.slice(0, 3).map((cls) => (
                <div key={cls.id} className="flex items-center gap-3 p-2 rounded-lg bg-[rgb(var(--bg-elevated))]">
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--primary)/0.12)] flex items-center justify-center flex-shrink-0">
                    <Radio size={14} className="text-[rgb(var(--primary))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[rgb(var(--text-primary))] truncate">{cls.title}</p>
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">
                      {new Date(cls.scheduled_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{cls.duration_minutes} min
                    </p>
                  </div>
                  <Badge variant={cls.status === 'live' ? 'success' : 'muted'} dot>
                    {cls.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.div>

      {/* Recent Submissions + Upcoming Classes */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Reviews */}
        <Card className="p-5">
          <div className="widget-header mb-4">
            <h3 className="widget-title">Pending Reviews</h3>
            <Link to="/teacher/assignments">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>View all</Button>
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {b.recent_submissions.length === 0 ? (
              <p className="text-sm text-[rgb(var(--text-muted))] py-6 text-slate-500 dark:text-slate-400 text-center">No pending reviews</p>
            ) : (
              b.recent_submissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgb(var(--bg-elevated))] transition-colors">
                  <Avatar src={sub.student.avatar} name={sub.student.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">{sub.student.name}</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">Submitted {timeAgo(sub.submitted_at)}</p>
                  </div>
                  <Badge variant="warning" dot>Review</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Classes */}
        <Card className="p-5">
          <div className="widget-header mb-4">
            <h3 className="widget-title">Upcoming Classes</h3>
            <Link to="/teacher/live-classes">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>View all</Button>
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {b.upcoming_classes.length === 0 ? (
              <p className="text-sm text-[rgb(var(--text-muted))] py-6 text-slate-500 dark:text-slate-400 text-center">No upcoming classes scheduled.</p>
            ) : (
              b.upcoming_classes.slice(0, 4).map((cls) => (
                <div key={cls.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgb(var(--bg-elevated))] transition-colors cursor-pointer"
                  onClick={() => window.open(cls.meeting_url, '_blank')}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--accent)))' }}
                  >
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate">{cls.title}</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      {formatDate(cls.scheduled_at, { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' at '}
                      {new Date(cls.scheduled_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={cls.provider === 'zoom' ? 'primary' : 'accent'}>
                      {cls.provider}
                    </Badge>
                    <ExternalLink size={13} className="text-[rgb(var(--text-muted))]" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <Card className="p-5">
          <h3 className="widget-title mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Add Student', icon: <Users size={20} />, to: '/teacher/students', color: 'rgb(var(--primary))' },
              { label: 'Schedule Class', icon: <Radio size={20} />, to: '/teacher/live-classes', color: 'rgb(var(--accent-dark))' },
              { label: 'New Assignment', icon: <ClipboardList size={20} />, to: '/teacher/assignments', color: 'rgb(var(--warning))' },
              { label: 'Upload Video', icon: <Video size={20} />, to: '/teacher/videos', color: 'rgb(var(--error))' },
            ].map((action) => (
              <Link key={action.to} to={action.to}>
                <motion.div
                  whileHover={{ scale: 1.03, translateY: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[rgb(var(--border))] hover:border-[rgb(var(--border-strong))] hover:shadow-md transition-all text-slate-500 dark:text-slate-400 text-center cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ background: `linear-gradient(135deg, ${action.color}, ${action.color}aa)`, boxShadow: `0 4px 12px ${action.color}30` }}
                  >
                    {action.icon}
                  </div>
                  <span className="text-xs font-semibold text-[rgb(var(--text-secondary))]">{action.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>

    </motion.div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
