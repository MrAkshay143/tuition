import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, ArrowLeft, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useForgotPassword } from '@/api/resources/auth'

const schema = z.object({ email: z.string().email('Enter a valid email address') })

export default function ForgotPasswordPage() {
  const { mutate, isPending, isSuccess } = useForgotPassword()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  return (
    <div className="min-h-[100dvh] w-full flex bg-gradient-to-br from-indigo-50/90 via-purple-50/30 to-slate-50 dark:from-[#050614] dark:to-[#08091c] relative overflow-hidden select-none text-slate-900 dark:text-white font-sans items-center justify-center p-4 sm:p-6">
      
      {/* Floating Top-Left Back Button */}
      <div className="absolute top-3.5 left-3.5 sm:top-6 sm:left-6 z-20">
        <Link 
          to="/login" 
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 dark:bg-[#0c0d24]/80 backdrop-blur-md border border-slate-200 dark:border-[#20224d] shadow-md flex items-center justify-center text-slate-600 dark:text-[#a5a7c5] hover:text-indigo-600 dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Back to Login"
        >
          <ChevronLeft size={18} />
        </Link>
      </div>

      {/* Background radial glow spotlight */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-[360px] sm:max-w-md bg-white dark:bg-[#0c0d24] border border-slate-200/90 dark:border-[#1b1c3d] rounded-2xl sm:rounded-[28px] p-5 sm:p-8 shadow-2xl relative z-10 my-auto shrink-0"
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col items-center text-center gap-2.5 mb-5 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white shadow-xl">
            <GraduationCap size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">Reset Password</h1>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Enter your registered email to receive password reset instructions.</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-2xl border border-emerald-500/20">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base text-[rgb(var(--text-primary))]">Reset Link Sent!</p>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-1 leading-relaxed">
                A password reset link has been dispatched to your email address. Please check your inbox and spam folder.
              </p>
            </div>
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.1)] hover:bg-[rgb(var(--primary)/0.15)] rounded-xl transition-all mt-2"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit((d) => mutate(d.email))} className="flex flex-col gap-3.5 sm:gap-4" noValidate>
            <Input
              {...register('email')}
              type="email"
              label="Email Address"
              placeholder="student@eduflow.ai"
              error={errors.email?.message}
              leftElement={<Mail size={15} />}
              className="focus:ring-1 focus:ring-[rgb(var(--primary))]"
            />

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full mt-1 bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary-dark))] text-white border-0 py-2.5 rounded-xl font-bold justify-center cursor-pointer text-xs sm:text-sm shadow-md shadow-indigo-600/20" 
              loading={isPending}
            >
              Send Reset Link
            </Button>

            <Link 
              to="/login" 
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors pt-1"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  )
}
