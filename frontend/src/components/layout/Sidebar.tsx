import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, BookOpen, Video, Radio, FileText,
  ClipboardList, BookOpenCheck, Award, BarChart3, MessageSquare,
  Bell, Calendar, Settings, ChevronLeft, ChevronRight, X,
  GraduationCap, Layers, LogOut, Shield, Activity, CalendarDays, FlaskConical, ShieldCheck,
  Library, HelpCircle, Sparkles
} from 'lucide-react'
import { useUIStore, useAuthStore, useNotificationStore } from '@/store'
import { useLogout } from '@/api/resources/auth'
import { usePermission } from '@/contexts/PermissionContext'
import { Avatar, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

type NavItem =
  | { section: string; label?: undefined; to?: undefined; icon?: undefined; badge?: undefined; permission?: string }
  | { label: string; to: string; icon: React.ReactNode; badge?: number; section?: undefined; permission?: string }

const teacherNav: NavItem[] = [
  { label: 'Dashboard', to: '/teacher/dashboard', icon: <LayoutDashboard size={17} /> },
  { section: 'Manage' },
  { label: 'Students', to: '/teacher/students', icon: <Users size={17} /> },
  { label: 'Batches', to: '/teacher/batches', icon: <Layers size={17} /> },
  { section: 'Content' },
  { label: 'Courses', to: '/teacher/courses', icon: <BookOpen size={17} /> },
  { label: 'Media Library', to: '/teacher/media', icon: <Library size={17} /> },
  { label: 'Live Classes', to: '/teacher/live-classes', icon: <Radio size={17} /> },
  { section: 'Assessment' },
  { label: 'Assignments', to: '/teacher/assignments', icon: <ClipboardList size={17} /> },
  { label: 'Question Bank', to: '/teacher/question-bank', icon: <HelpCircle size={17} /> },
  { label: 'Exams', to: '/teacher/exams', icon: <BookOpenCheck size={17} /> },
  { label: 'Certificates', to: '/teacher/certificates', icon: <Award size={17} /> },
  { section: 'Engage' },
  { label: 'Chat', to: '/teacher/chat', icon: <MessageSquare size={17} /> },
  { label: 'Announcements', to: '/teacher/announcements', icon: <Bell size={17} /> },
  { label: 'Calendar', to: '/teacher/calendar', icon: <Calendar size={17} /> },
  { section: 'Insights' },
  { label: 'Analytics', to: '/teacher/analytics', icon: <BarChart3 size={17} /> },
  { section: 'Account' },
  { label: 'Settings', to: '/teacher/settings', icon: <Settings size={17} /> },
]

const studentNav: NavItem[] = [
  { label: 'Dashboard', to: '/student/dashboard', icon: <LayoutDashboard size={17} /> },
  { label: 'My Courses', to: '/student/courses', icon: <BookOpen size={17} /> },
  { label: 'Live Classes', to: '/student/live-classes', icon: <Radio size={17} /> },
  { label: 'Notes', to: '/student/notes', icon: <FileText size={17} /> },
  { label: 'Assignments', to: '/student/assignments', icon: <ClipboardList size={17} /> },
  { label: 'Exams', to: '/student/exams', icon: <BookOpenCheck size={17} /> },
  { label: 'Progress', to: '/student/progress', icon: <BarChart3 size={17} /> },
  { label: 'Chat', to: '/student/chat', icon: <MessageSquare size={17} /> },
  { label: 'Calendar', to: '/student/calendar', icon: <Calendar size={17} /> },
  { label: 'Certificates', to: '/student/certificates', icon: <Award size={17} /> },
  { label: 'Settings', to: '/student/settings', icon: <Settings size={17} /> },
]

const adminNav: NavItem[] = [
  { section: 'System Administration' },
  { label: 'Overview', to: '/admin/overview', icon: <LayoutDashboard size={17} /> },
  { label: 'User Management', to: '/admin/users', icon: <Users size={17} /> },
  { label: 'Role & Permissions', to: '/admin/roles', icon: <ShieldCheck size={17} /> },
  { label: 'Platform Settings', to: '/admin/settings', icon: <Settings size={17} /> },
  { label: 'Activity Logs', to: '/admin/logs', icon: <FileText size={17} /> },
  { label: 'Security', to: '/admin/security', icon: <Shield size={17} /> },
  { label: 'Operations', to: '/admin/operations', icon: <Activity size={17} /> },
  { label: 'Announcements', to: '/admin/announcements', icon: <Bell size={17} /> },
  { label: 'Backup & Export', to: '/admin/backup', icon: <BookOpen size={17} /> },

  { section: 'Taxonomy' },
  { label: 'Education Types', to: '/admin/education-types', icon: <GraduationCap size={17} /> },
  { label: 'Programs', to: '/admin/programs', icon: <Layers size={17} /> },
  { label: 'Subjects', to: '/admin/subjects', icon: <FlaskConical size={17} /> },
  { label: 'Academic Sessions', to: '/admin/sessions', icon: <CalendarDays size={17} /> },

  { section: 'Academic Management' },
  { label: 'Students', to: '/admin/students', icon: <Users size={17} /> },
  { label: 'Courses Catalog', to: '/admin/courses', icon: <BookOpen size={17} /> },
  { label: 'Batches', to: '/admin/batches', icon: <Layers size={17} /> },

  { section: 'Assessment & Reports' },
  { label: 'Assignments', to: '/admin/assignments', icon: <ClipboardList size={17} /> },
  { label: 'Exams Bank', to: '/admin/exams', icon: <BookOpenCheck size={17} /> },
  { label: 'Analytics', to: '/admin/analytics', icon: <BarChart3 size={17} /> },
]

const navByRole: Record<string, NavItem[]> = { teacher: teacherNav, student: studentNav, admin: adminNav }

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { mutate: logout } = useLogout()
  const location = useLocation()

  const userRole = (user?.role || '').toLowerCase()
  let activeRole = 'teacher'
  if (userRole.includes('admin') || location.pathname.startsWith('/admin')) {
    activeRole = 'admin'
  } else if (userRole.includes('student') || location.pathname.startsWith('/student')) {
    activeRole = 'student'
  } else {
    activeRole = 'teacher'
  }

  const nav = navByRole[activeRole] || teacherNav

  return (
    <div className={cn(
      'sidebar-wrapper bg-[rgb(var(--bg-surface))] border-r border-[rgb(var(--border))] shadow-xs transition-all duration-200',
      sidebarCollapsed ? 'collapsed' : 'mobile-open'
    )}>
      <div className="sidebar flex flex-col h-full p-3">
        {/* Logo & Header */}
        <div className="sidebar-logo flex items-center justify-between pb-3 border-b border-[rgb(var(--border))] mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
              <GraduationCap size={20} />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate leading-none">
                  EduFlow
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider mt-0.5">
                  {activeRole} Portal
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="lg:hidden flex p-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--border))] transition-all cursor-pointer shadow-2xs"
            title="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Card Top Pill (Mobile Only) */}
        {!sidebarCollapsed && (
          <div className="lg:hidden mb-3 p-2.5 rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-3">
            <Avatar src={user?.avatar} name={user?.name || 'User'} size="sm" online />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[rgb(var(--text-primary))] truncate font-[Outfit]">
                {user?.name || 'Educator'}
              </p>
              <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">
                {user?.email || '+91 98765 43210'}
              </p>
            </div>
          </div>
        )}

        {/* Nav Items Scroll List */}
        <nav className="flex-1 overflow-y-auto space-y-1 pr-1 sidebar-nav-scroll text-left">
          {nav.map((item, idx) => {
            if ('section' in item && item.section) {
              if (sidebarCollapsed) return null
              return (
                <div
                  key={`section-${item.section}-${idx}`}
                  className="px-3.5 pt-3.5 pb-1 text-[10px] font-extrabold text-[rgb(var(--text-muted))] uppercase tracking-wider font-[Outfit]"
                >
                  {item.section}
                </div>
              )
            }

            const badge = item.label === 'Chat' ? unreadCount : item.badge
            const itemKey = `nav-${item.label}-${item.to}-${idx}`

            const navItem = (
              <NavLink
                key={itemKey}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024 && !sidebarCollapsed) {
                    toggleSidebar()
                  }
                }}
                className={({ isActive }) => cn(
                  'sidebar-item group flex items-center gap-3 px-3.5 py-2.5 lg:py-2 rounded-xl text-xs font-semibold transition-all relative min-h-[40px]',
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold border-l-4 border-indigo-600 shadow-2xs' 
                    : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-elevated))] hover:text-[rgb(var(--text-primary))] border-l-4 border-l-transparent'
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="truncate flex-1 font-[Outfit]">
                    {item.label}
                  </span>
                )}
                {badge && badge > 0 && !sidebarCollapsed && (
                  <span className="ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            )

            return sidebarCollapsed ? (
              <div key={itemKey} title={item.label} className="tooltip-wrapper">{navItem}</div>
            ) : navItem
          })}
        </nav>

        {/* User Card Footer (Desktop View) */}
        <div className="border-t border-[rgb(var(--border))] pt-3 mt-auto flex flex-col gap-1.5">
          <NavLink
            to={user?.role === 'admin' ? '/admin/settings' : '/teacher/profile'}
            className={cn(
              'hidden lg:flex items-center gap-2.5 p-2 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] hover:border-indigo-500/30 transition-all text-left cursor-pointer',
              sidebarCollapsed && 'justify-center p-1.5'
            )}
          >
            <Avatar src={user?.avatar} name={user?.name || 'User'} size="sm" online />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[rgb(var(--text-primary))] truncate font-[Outfit]">{user?.name}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                  {user?.role || 'Educator'}
                </p>
              </div>
            )}
          </NavLink>

          <button
            className={cn(
              'sidebar-item w-full flex items-center gap-2.5 px-3.5 py-2.5 lg:py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer',
              sidebarCollapsed && 'justify-center px-0'
            )}
            onClick={() => logout()}
            title="Logout"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
