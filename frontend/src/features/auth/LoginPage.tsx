import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, GraduationCap, Mail, Lock, ChevronLeft, ArrowLeft, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button, Input } from '@/components/ui'
import { useLogin, useForgotPassword } from '@/api/resources/auth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSubmitted, setResetSubmitted] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const { mutate: login, isPending: isLoginPending } = useLogin()
  const { mutate: forgotPassword, isPending: isResetPending } = useForgotPassword()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginForm) => login({ ...data })

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail || !resetEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    forgotPassword(resetEmail, {
      onSuccess: () => {
        setResetSubmitted(true)
      }
    })
  }

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true)
    toast.loading('Redirecting to Google Sign-In...', { id: 'google-oauth' })
    
    const customRoute = localStorage.getItem('eduflow_google_auth_url')
    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
    
    let googleRedirect = customRoute
    if (!googleRedirect) {
      googleRedirect = backendUrl && backendUrl !== '/'
        ? `${backendUrl}/api/v1/auth/google` 
        : 'https://tuition.imakshay.in/api_backend/public/api/v1/auth/google'
    }
    
    setTimeout(() => {
      window.location.href = googleRedirect
    }, 600)
  }

  return (
    <div className="h-[100dvh] w-full flex bg-[rgb(var(--bg-base))] relative overflow-hidden select-none text-[rgb(var(--text-primary))] font-sans">
      
      {/* Floating Top-Left Back Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link 
          to="/" 
          className="w-10 h-10 rounded-full bg-[rgb(var(--bg-surface))]/80 backdrop-blur-md border border-[rgb(var(--border))]/80 shadow-md flex items-center justify-center text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--primary-light))] hover:scale-105 active:scale-95 transition-all"
          title="Back to Home"
        >
          <ChevronLeft size={18} />
        </Link>
      </div>

      {/* Left Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[rgb(var(--bg-surface))] via-[rgb(var(--bg-elevated))] to-[rgb(var(--bg-base))] relative overflow-hidden items-center justify-center h-full border-r border-[rgb(var(--border))]/55">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236C63FF' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        
        <div className="relative text-slate-500 dark:text-slate-400 text-center px-16 z-10 space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center shadow-2xl mx-auto border border-[rgb(var(--border))]/10">
            <GraduationCap size={36} className="text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="font-extrabold text-[rgb(var(--text-primary))] text-4xl tracking-tight font-[Outfit]">EduFlow</h1>
            <p className="text-[rgb(var(--primary-light))] text-sm uppercase tracking-widest font-bold">Private Digital Classroom</p>
          </div>

          <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed max-w-sm mx-auto font-medium">
            Access your personalized student portal, join live interactive lectures, download note resources, and track your assignments.
          </p>
        </div>
      </div>

      {/* Right Column: 3D Card Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-3.5 sm:p-6 h-full relative z-10 min-w-0 perspective-1000">
        
        {/* Card Flip Container */}
        <motion.div
          className="w-full max-w-md my-auto relative transform-style-3d transition-transform duration-300"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >

          {/* FRONT SIDE: LOGIN FORM */}
          <div 
            className="w-full bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl sm:rounded-[24px] p-4 sm:p-6 md:p-8 shadow-2xl backface-hidden max-h-[94vh] overflow-y-auto scrollbar-hide"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {/* Mobile brand header */}
            <div className="flex items-center justify-center gap-2 mb-3.5 sm:mb-5 lg:hidden">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white shadow-md shrink-0">
                <GraduationCap size={18} />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">EduFlow</h2>
            </div>

            <div className="space-y-1 text-left mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Welcome Back</h2>
              <p className="text-xs text-[rgb(var(--text-secondary))]">Please enter your credentials to access the platform.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:gap-4 text-left" noValidate>
              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="student@eduflow.ai"
                autoComplete="email"
                error={errors.email?.message}
                leftElement={<Mail size={15} />}
                className="focus:ring-1 focus:ring-[rgb(var(--primary))]"
              />

              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                leftElement={<Lock size={15} />}
                rightElement={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="cursor-pointer text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                className="focus:ring-1 focus:ring-[rgb(var(--primary))]"
              />

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded accent-[rgb(var(--primary))]" />
                  <span className="text-xs text-[rgb(var(--text-secondary))]">Remember me</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => setIsFlipped(true)} 
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoginPending}
                className="w-full mt-1 bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary-dark))] text-white border-0 py-2.5 rounded-xl font-bold justify-center cursor-pointer text-xs sm:text-sm shadow-md shadow-indigo-600/20"
              >
                Sign In to Portal
              </Button>
            </form>

            {/* Social OAuth block */}
            <div className="flex items-center gap-3 my-3.5 sm:my-5">
              <div className="flex-1 h-px bg-[rgb(var(--border))]/60" />
              <span className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-bold tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-[rgb(var(--border))]/60" />
            </div>

            <Button
              variant="outline"
              size="lg"
              loading={isGoogleLoading}
              className="w-full justify-center rounded-xl border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-elevated))] text-xs h-9 sm:h-10 gap-2 flex items-center font-bold cursor-pointer transition-all"
              leftIcon={
                <svg width={18} height={18} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
              }
              onClick={handleGoogleLogin}
            >
              Sign In with Google
            </Button>
          </div>

          {/* BACK SIDE: RESET PASSWORD FORM */}
          <div 
            className="w-full bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl sm:rounded-[24px] p-4 sm:p-6 md:p-8 shadow-2xl backface-hidden absolute inset-0 rotate-y-180 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false)
                    setResetSubmitted(false)
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors cursor-pointer bg-transparent border-0"
                >
                  <ArrowLeft size={15} /> Back to Sign In
                </button>

                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <KeyRound size={16} />
                </div>
              </div>

              <div className="space-y-1 text-left mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))] font-[Outfit]">
                  Reset Password
                </h2>
                <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
                  Enter your registered account email address. We will send you an official recovery link.
                </p>
              </div>

              {resetSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 my-4">
                  <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-[rgb(var(--text-primary))]">Check Your Email</h3>
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      We sent recovery instructions to <strong className="text-[rgb(var(--text-primary))]">{resetEmail}</strong>.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsFlipped(false)
                      setResetSubmitted(false)
                    }}
                    className="w-full text-xs font-bold py-2 rounded-xl mt-2 cursor-pointer"
                  >
                    Return to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4 text-left">
                  <Input
                    type="email"
                    label="Registered Email"
                    placeholder="name@eduflow.ai"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    leftElement={<Mail size={15} />}
                    required
                    className="focus:ring-1 focus:ring-amber-500"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isResetPending}
                    className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 py-2.5 rounded-xl font-bold justify-center cursor-pointer text-xs sm:text-sm shadow-md shadow-amber-500/20"
                  >
                    Send Recovery Link
                  </Button>
                </form>
              )}
            </div>

            <div className="pt-4 border-t border-[rgb(var(--border))]/60 text-center">
              <p className="text-[10px] text-[rgb(var(--text-muted))]">
                Need extra assistance? Contact administrator support at +91 98765 43210.
              </p>
            </div>
          </div>

        </motion.div>
      </div>

    </div>
  )
}
