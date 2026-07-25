import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileBottomNav from './MobileBottomNav'
import GlobalSearchModal from './GlobalSearchModal'
import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden cursor-pointer"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar />

      <main className={cn('main-content', sidebarCollapsed && 'sidebar-collapsed')}>
        <Header />
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            className="page-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <GlobalSearchModal />
      <MobileBottomNav />
    </div>
  )
}

export function AdminShell() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden cursor-pointer"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar />
      <main className={cn('main-content', sidebarCollapsed && 'sidebar-collapsed')}>
        <Header />
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            className="page-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <GlobalSearchModal />
      <MobileBottomNav />
    </div>
  )
}
