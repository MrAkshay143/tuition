import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { GraduationCap, Sun, Moon, Send, Mail, Phone, ArrowRight, Search, User, LogOut, ChevronDown, LayoutDashboard, Settings, Menu, X, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/design-system/hooks/useTheme'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'

interface ExploreResponse {
  settings: {
    app_name: string
    landing_nav_links: Array<{ label: string; to?: string; section?: string }>
    landing_footer_links: {
      quick_links: Array<{ label: string; to?: string; section?: string }>
      resources: Array<{ label: string; to: string }>
      legal: Array<{ label: string; to: string }>
      contact: {
        email: string
        phone: string
        hours: string
      }
    }
    landing_social_links: Array<{ platform: string; url: string }>
  }
}

export default function PublicLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuthStore()
  
  const [scrolled, setScrolled] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { data } = useQuery({
    queryKey: ['public', 'explore'],
    queryFn: async () => {
      const res = await api.get<{ data: ExploreResponse }>('/public/explore')
      return res.data
    },
  })

  const cms = data?.settings
  const appName = cms?.app_name ?? 'EduFlow'
  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Courses', to: '/courses' },
    { label: 'Live Classes', to: '/live-classes' },
    { label: 'About Us', to: '/about' },
    { label: 'Testimonials', to: '/testimonials' },
    { label: 'Contact', to: '/contact' },
  ]

  const handleNavClick = (link: { label: string; to?: string; section?: string }) => {
    if (link.section) {
      if (location.pathname !== '/') {
        navigate(`/#${link.section}`)
      } else {
        const el = document.getElementById(link.section)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      navigate(link.to ?? '/')
    }
  }

  const getDashboardPath = () => {
    const role = typeof user?.role === 'string' ? user.role : (user?.role as any)?.slug || 'student'
    if (role === 'admin' || role === 'super_admin') return '/admin/overview'
    if (role === 'teacher') return '/teacher/dashboard'
    return '/student/dashboard'
  }

  const handleLogout = async () => {
    setUserDropdownOpen(false)
    await logout()
    toast.success('Successfully logged out')
    navigate('/login')
  }

  return (
    <div className="min-h-[100dvh] bg-[rgb(var(--bg-base))] dark:bg-[#060713] text-[rgb(var(--text-primary))] dark:text-white font-sans flex flex-col justify-between selection:bg-indigo-500/30 transition-colors duration-200">
      {/* Header Bar with Vibrant Colorful Light Theme Backdrop */}
      <header className={`sticky top-0 z-50 transition-all duration-300 border-b relative ${
        scrolled 
          ? 'border-indigo-200/80 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/95 via-purple-50/90 to-pink-50/95 dark:from-[#060713]/90 dark:via-[#090b21]/90 dark:to-[#060713]/90 backdrop-blur-xl shadow-md shadow-indigo-500/10' 
          : 'border-indigo-100/60 dark:border-transparent bg-gradient-to-r from-indigo-50/80 via-purple-50/70 to-pink-50/80 dark:from-[#060713]/60 dark:via-[#090b21]/60 dark:to-[#060713]/60 backdrop-blur-md'
      }`}>
        {/* Vibrant colorful top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#594fe6] via-fuchsia-500 to-pink-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-[#594fe6] to-[#7964ff] flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <GraduationCap size={19} />
            </div>
            <span className="text-xl font-extrabold tracking-tight font-[Outfit] text-[rgb(var(--text-primary))] dark:text-white">
              {appName}
            </span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
            {navLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => handleNavClick(link)}
                className={`transition-all cursor-pointer px-3.5 py-1.5 rounded-full ${
                  location.pathname === link.to
                    ? 'text-white bg-[#594fe6] dark:bg-[#181938] dark:border dark:border-[#3b3a6e] shadow-sm font-bold' 
                    : 'text-[rgb(var(--text-secondary))] dark:text-[#a5a7c5] hover:text-[rgb(var(--text-primary))] dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            <button
              onClick={() => navigate('/courses')}
              className="hidden sm:block p-1.5 text-[rgb(var(--text-secondary))] dark:text-[#a5a7c5] hover:text-[rgb(var(--text-primary))] dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-[#141636]"
              title="Search Courses"
            >
              <Search size={16} />
            </button>

            <button
              onClick={toggleTheme}
              className="hidden sm:block p-1.5 text-[rgb(var(--text-secondary))] dark:text-[#a5a7c5] hover:text-[rgb(var(--text-primary))] dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-[#141636]"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {isAuthenticated && user ? (
              /* Authenticated User Profile Badge & Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full bg-slate-100 dark:bg-[#12132e] border border-slate-200 dark:border-[#262852] hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#594fe6] to-[#7964ff] text-white flex items-center justify-center text-xs font-extrabold uppercase shadow-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <span className="text-xs font-bold text-[rgb(var(--text-primary))] dark:text-white max-w-[100px] truncate hidden sm:inline-block font-[Outfit]">
                    {user.name || 'User'}
                  </span>
                  <ChevronDown size={14} className={`text-[rgb(var(--text-secondary))] transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-[rgb(var(--bg-surface))] dark:bg-[#0c0d24] border border-[rgb(var(--border))] dark:border-[#20224d] rounded-2xl shadow-2xl z-50 p-2 text-xs divide-y divide-slate-100 dark:divide-[#1b1c3d]"
                    >
                      <div className="p-2.5 space-y-0.5 text-left">
                        <p className="font-extrabold text-sm text-[rgb(var(--text-primary))] dark:text-white font-[Outfit] truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-[rgb(var(--text-secondary))] dark:text-[#8e91b5] truncate">
                          {user.email}
                        </p>
                        <span className="inline-block mt-1 text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-md capitalize">
                          {typeof user.role === 'string' ? user.role : (user.role as any)?.name || 'Student'}
                        </span>
                      </div>

                      <div className="py-1 space-y-0.5 text-left">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false)
                            navigate(getDashboardPath())
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[rgb(var(--text-primary))] dark:text-[#c4c6e5] hover:bg-indigo-50 dark:hover:bg-[#181938] hover:text-indigo-600 dark:hover:text-white font-semibold transition-colors cursor-pointer"
                        >
                          <LayoutDashboard size={14} className="text-indigo-500" /> Dashboard
                        </button>

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false)
                            navigate('/profile')
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[rgb(var(--text-primary))] dark:text-[#c4c6e5] hover:bg-indigo-50 dark:hover:bg-[#181938] hover:text-indigo-600 dark:hover:text-white font-semibold transition-colors cursor-pointer"
                        >
                          <User size={14} className="text-indigo-500" /> My Profile
                        </button>

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false)
                            navigate('/settings')
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[rgb(var(--text-primary))] dark:text-[#c4c6e5] hover:bg-indigo-50 dark:hover:bg-[#181938] hover:text-indigo-600 dark:hover:text-white font-semibold transition-colors cursor-pointer"
                        >
                          <Settings size={14} className="text-indigo-500" /> Settings
                        </button>
                      </div>

                      <div className="pt-1 text-left">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors cursor-pointer"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Unauthenticated Single Login Button */
              <Link to="/login">
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-[#594fe6] to-[#7964ff] hover:opacity-95 text-white font-bold text-xs px-5 py-2 border-0 shadow-[0_0_20px_rgba(108,99,255,0.35)] flex items-center gap-1.5 cursor-pointer"
                >
                  Login <ArrowRight size={13} />
                </Button>
              </Link>
            )}
            
            {/* Mobile Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="lg:hidden p-2 text-[rgb(var(--text-secondary))] dark:text-[#a5a7c5] hover:text-[rgb(var(--text-primary))] dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-[#141636]"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 ml-0.5 text-[rgb(var(--text-secondary))] dark:text-[#a5a7c5] hover:text-[rgb(var(--text-primary))] dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-[#141636]"
              title="Open Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[rgb(var(--bg-surface))] dark:bg-[#060713] border-l border-[rgb(var(--border))] dark:border-[#1b1c3d] shadow-2xl z-[70] lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--border))] dark:border-[#1b1c3d]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#594fe6] to-[#7964ff] flex items-center justify-center text-white shadow-sm">
                    <GraduationCap size={15} />
                  </div>
                  <span className="text-lg font-extrabold tracking-tight font-[Outfit] text-[rgb(var(--text-primary))] dark:text-white">
                    {appName}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141636] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
                {navLinks.map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleNavClick(link)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      location.pathname === link.to
                        ? 'text-indigo-600 bg-indigo-50 dark:text-white dark:bg-[#181938] dark:border dark:border-[#3b3a6e]' 
                        : 'text-[rgb(var(--text-secondary))] dark:text-[#a5a7c5] hover:text-[rgb(var(--text-primary))] hover:bg-slate-50 dark:hover:text-white dark:hover:bg-[#141636]'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              <div className="p-5 border-t border-[rgb(var(--border))] dark:border-[#1b1c3d] flex items-center justify-between">
                <span className="text-xs font-semibold text-[rgb(var(--text-secondary))] dark:text-slate-400">Appearance</span>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 p-2 px-3 rounded-lg border border-[rgb(var(--border))] dark:border-[#2b2d54] hover:bg-slate-50 dark:hover:bg-[#141636] transition-colors text-xs font-semibold"
                >
                  {isDark ? (
                    <><Sun size={14} className="text-amber-500" /> Light Mode</>
                  ) : (
                    <><Moon size={14} className="text-indigo-500" /> Dark Mode</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Viewport */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Multi-Column Footer with soft colorful aesthetics (Compact on Mobile, Unchanged on Desktop) */}
      <footer className="relative border-t border-indigo-100 dark:border-indigo-500/10 bg-gradient-to-br from-white via-indigo-50/30 to-fuchsia-50/30 dark:from-[#05070e] dark:via-indigo-950/20 dark:to-fuchsia-950/10 pt-6 sm:pt-12 pb-5 sm:pb-8 text-xs text-[rgb(var(--text-secondary))] dark:text-slate-400 overflow-hidden">
        {/* Soft colorful background glow */}
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(120,95,255,0.15)_0%,transparent_70%)] rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-8">
          {/* Col 1: Brand Info & Social Icons */}
          <div className="space-y-2.5 sm:space-y-4 col-span-2 lg:col-span-1 flex flex-col items-center sm:items-start text-slate-500 dark:text-slate-400 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <GraduationCap size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <span className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] dark:text-white font-[Outfit]">{appName}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[rgb(var(--text-secondary))] dark:text-slate-400 leading-relaxed max-w-sm sm:max-w-none">
              Smart learning for a smarter you. Join thousands of students mastering concepts with expert mentors.
            </p>
            {/* Social Icons (Colorful in Light Theme, Official X Logo) */}
            <div className="flex items-center gap-2 sm:gap-2.5 pt-0.5 sm:pt-1">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-[#1877F2] dark:text-[#3b82f6] border border-blue-500/20 flex items-center justify-center hover:scale-110 hover:bg-blue-500/20 transition-all shadow-xs" aria-label="Facebook" title="Facebook">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-900/20 dark:border-white/20 flex items-center justify-center hover:scale-110 hover:bg-slate-900/20 transition-all shadow-xs" aria-label="X" title="X (Twitter)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-[#E4405F] dark:text-[#f43f5e] border border-rose-500/20 flex items-center justify-center hover:scale-110 hover:bg-rose-500/20 transition-all shadow-xs" aria-label="Instagram" title="Instagram">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500/10 dark:bg-red-500/20 text-[#FF0000] dark:text-[#ef4444] border border-red-500/20 flex items-center justify-center hover:scale-110 hover:bg-red-500/20 transition-all shadow-xs" aria-label="YouTube" title="YouTube">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><polygon points="10 15 15 12 10 9 10 15"/></svg>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase font-[Outfit] text-[rgb(var(--text-primary))] dark:text-white tracking-wider">Quick Links</h4>
              <div className="w-5 sm:w-6 h-[2px] bg-indigo-600 dark:bg-indigo-500 rounded-full mt-1" />
            </div>
            <ul className="space-y-1.5 sm:space-y-2.5 text-[10.5px] sm:text-[11px]">
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Home</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/courses" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Courses</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/live-classes" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Live Classes</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/exams" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Exams</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/about" className="hover:text-indigo-600 dark:hover:text-white transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase font-[Outfit] text-[rgb(var(--text-primary))] dark:text-white tracking-wider">Resources</h4>
              <div className="w-5 sm:w-6 h-[2px] bg-indigo-600 dark:bg-indigo-500 rounded-full mt-1" />
            </div>
            <ul className="space-y-1.5 sm:space-y-2.5 text-[10.5px] sm:text-[11px]">
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/exams" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Practice Tests</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/live-classes" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Live Schedule</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/study-materials" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Notes</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/assignments" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Assignments</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/faq" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Col 4: Support */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase font-[Outfit] text-[rgb(var(--text-primary))] dark:text-white tracking-wider">Support</h4>
              <div className="w-5 sm:w-6 h-[2px] bg-indigo-600 dark:bg-indigo-500 rounded-full mt-1" />
            </div>
            <ul className="space-y-1.5 sm:space-y-2.5 text-[10.5px] sm:text-[11px]">
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/contact" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Contact Us</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/faq" className="hover:text-indigo-600 dark:hover:text-white transition-colors">FAQ</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight size={11} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" /><Link to="/terms" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Col 5: Get In Touch */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase font-[Outfit] text-[rgb(var(--text-primary))] dark:text-white tracking-wider">Get In Touch</h4>
              <div className="w-5 sm:w-6 h-[2px] bg-indigo-600 dark:bg-indigo-500 rounded-full mt-1" />
            </div>
            <ul className="space-y-1.5 sm:space-y-2.5 text-[10.5px] sm:text-[11px]">
              <li className="flex items-center gap-1.5">
                <Mail size={12} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span className="truncate">support@eduflow.in</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Phone size={12} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>+91 12345 67890</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Clock size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="truncate">Mon - Sat: 9:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-10 pt-3 sm:pt-5 border-t border-[rgb(var(--border))] dark:border-slate-900 text-slate-500 dark:text-slate-400 text-center text-[10px] sm:text-[11px] text-[rgb(var(--text-muted))] font-mono">
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
