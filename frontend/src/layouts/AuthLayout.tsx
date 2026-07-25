import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { GraduationCap, Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store'

export default function AuthLayout() {
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="min-h-[100dvh] bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))] flex flex-col justify-between transition-colors duration-200">
      
      {/* Mini Auth Navbar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]/40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white shadow">
            <GraduationCap size={16} />
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-base font-bold tracking-tight bg-gradient-to-r from-[rgb(var(--text-primary))] to-[rgb(var(--text-secondary))] bg-clip-text text-transparent">
            EduFlow
          </span>
        </div>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl border border-[rgb(var(--border))] hover:bg-[rgb(var(--border))]/30 transition-colors text-[rgb(var(--text-secondary))]"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </header>

      {/* Forms Area */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(circle_at_top,rgba(var(--primary),0.02),transparent_40%)]">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Mini Auth Footer */}
      <footer className="h-14 flex items-center justify-between px-6 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]/20 text-[10px] text-[rgb(var(--text-secondary))]/60">
        <span>© {new Date().getFullYear()} EduFlow. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <Link to="/terms" className="hover:underline">Terms</Link>
        </div>
      </footer>

    </div>
  )
}
