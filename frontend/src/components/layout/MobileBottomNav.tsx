import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Radio, ClipboardList, MessageSquare, Users, Bell, Calendar, Award, Settings } from 'lucide-react'
import { useAuthStore, useNotificationStore } from '@/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface Tab { label: string; to: string; icon: React.ElementType; badge?: boolean }

const teacherTabs: Tab[] = [
  { label: 'Home', to: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Students', to: '/teacher/students', icon: Users },
  { label: 'Certs', to: '/teacher/certificates', icon: Award },
  { label: 'Calendar', to: '/teacher/calendar', icon: Calendar },
  { label: 'Chat', to: '/teacher/chat', icon: MessageSquare, badge: true },
  { label: 'Settings', to: '/teacher/settings', icon: Settings },
]

const studentTabs: Tab[] = [
  { label: 'Home', to: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Courses', to: '/student/courses', icon: BookOpen },
  { label: 'Live', to: '/student/live-classes', icon: Radio },
  { label: 'Tasks', to: '/student/assignments', icon: ClipboardList },
  { label: 'Chat', to: '/student/chat', icon: MessageSquare, badge: true },
]

const adminTabs: Tab[] = [
  { label: 'Overview', to: '/admin/overview', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Alerts', to: '/admin/announcements', icon: Bell },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

const tabsByRole: Record<string, Tab[]> = { 
  teacher: teacherTabs, 
  student: studentTabs, 
  admin: adminTabs 
}

export default function MobileBottomNav() {
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  if (!user) return null
  const roleKey = (user.role || 'teacher').toLowerCase()
  const tabs = tabsByRole[roleKey] ?? teacherTabs

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => cn('mobile-nav-item', isActive && 'active')}
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center">
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  {tab.badge && unreadCount > 0 && (
                    <motion.span
                      className="absolute -top-1.5 -right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold leading-none">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-indigo-500"
                  />
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
