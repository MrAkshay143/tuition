import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Mail, Phone, Clock, MessageSquare, Send, User, FileText, MapPin, PhoneCall,
  ExternalLink, Copy, Check
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const contactSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email address is required'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactForm = z.infer<typeof contactSchema>

export default function Contact() {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success('Your message has been sent successfully!')
    reset()
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`Copied ${fieldName} to clipboard!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="bg-[rgb(var(--bg-base))] dark:bg-[#050614] text-[rgb(var(--text-primary))] dark:text-white font-sans min-h-[100dvh] pb-12 sm:pb-16 pt-4 sm:pt-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        
        {/* Header Section */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 py-1 sm:py-2 text-left w-full border-b border-[rgb(var(--border))]/40 dark:border-[#1b1c3d]/60 pb-4 sm:pb-6">
          
          <div className="space-y-1.5 sm:space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[rgb(var(--bg-surface))] dark:bg-[#181938] border border-[rgb(var(--border))] dark:border-[#2e2f61] text-[rgb(var(--primary))] dark:text-[#a594ff] text-[10px] sm:text-[11px] font-semibold shadow-sm">
              <MessageSquare size={11} fill="currentColor" className="text-[rgb(var(--primary))] dark:text-[#a594ff]" /> Get in Touch
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[rgb(var(--text-primary))] dark:text-white font-[Outfit] tracking-tight leading-tight">
              We're Here <span className="bg-gradient-to-r from-[#7964ff] to-[#a855f7] bg-clip-text text-transparent">To Help You</span>
            </h1>

            <p className="text-[11px] sm:text-xs text-[rgb(var(--text-secondary))] dark:text-[#8e91b5] leading-relaxed">
              Have questions about courses, batches, or any technical issues? Reach out to us - we'd love to assist you.
            </p>
          </div>

          <div className="relative hidden lg:flex items-center justify-center w-64 h-36 pointer-events-none">
            <div className="absolute w-44 h-44 bg-purple-600/15 rounded-full blur-2xl" />
            
            <svg className="w-60 h-36 text-[#6c63ff] opacity-90" viewBox="0 0 400 240" fill="none">
              <ellipse cx="200" cy="120" rx="150" ry="50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" strokeOpacity="0.3" />
              <ellipse cx="200" cy="120" rx="100" ry="32" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
              
              <g transform="translate(110, 45)">
                <rect x="0" y="20" width="180" height="110" rx="20" fill="#594fe6" />
                <path d="M0 24 L90 80 L180 24" stroke="#7964ff" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M10 120 L70 70" stroke="#483ec7" strokeWidth="3" />
                <path d="M170 120 L110 70" stroke="#483ec7" strokeWidth="3" />
                
                <g transform="translate(15, -30)">
                  <rect x="0" y="0" width="60" height="40" rx="16" fill="#6366f1" />
                  <path d="M12 40 L8 48 L22 40 Z" fill="#6366f1" />
                  <circle cx="20" cy="20" r="3" fill="white" />
                  <circle cx="30" cy="20" r="3" fill="white" />
                  <circle cx="40" cy="20" r="3" fill="white" />
                </g>
              </g>

              <circle cx="70" cy="120" r="4" fill="#a855f7" />
              <circle cx="330" cy="100" r="5" fill="#6366f1" />
              <circle cx="270" cy="160" r="3" fill="#818cf8" />
            </svg>
          </div>

        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start w-full">
          {/* Form Card */}
          <div className="lg:col-span-7 bg-[rgb(var(--bg-surface))] dark:bg-[#0c0d24] border border-[rgb(var(--border))] dark:border-[#1b1c3d] rounded-[20px] sm:rounded-[24px] p-4 sm:p-8 shadow-2xl space-y-3.5 sm:space-y-5 text-left">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#594fe6] text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Send size={15} className="sm:w-[16px] sm:h-[16px]" />
              </div>
              <div>
                <h2 className="text-slate-500 dark:text-slate-400 text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] dark:text-white font-[Outfit]">
                  Send us a Message
                </h2>
                <p className="text-[11px] sm:text-xs text-[rgb(var(--text-secondary))] dark:text-[#8e91b5]">
                  Our team will get back to you as soon as possible.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] sm:text-xs font-bold text-[rgb(var(--text-primary))] dark:text-[#c4c6e5]">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-secondary))] dark:text-[#8e91b5]">
                    <User size={14} />
                  </div>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full bg-[rgb(var(--bg-base))] dark:bg-[#080918] border border-[rgb(var(--border))] dark:border-[#1b1d3d] rounded-xl pl-9 pr-3.5 py-2 sm:py-2.5 text-xs text-[rgb(var(--text-primary))] dark:text-white placeholder-[rgb(var(--text-muted))] dark:placeholder-[#5c5f8a] focus:outline-none focus:border-[#594fe6] transition-colors"
                  />
                </div>
                {errors.name && <p className="text-[10px] text-red-400 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] sm:text-xs font-bold text-[rgb(var(--text-primary))] dark:text-[#c4c6e5]">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-secondary))] dark:text-[#8e91b5]">
                    <Mail size={14} />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full bg-[rgb(var(--bg-base))] dark:bg-[#080918] border border-[rgb(var(--border))] dark:border-[#1b1d3d] rounded-xl pl-9 pr-3.5 py-2 sm:py-2.5 text-xs text-[rgb(var(--text-primary))] dark:text-white placeholder-[rgb(var(--text-muted))] dark:placeholder-[#5c5f8a] focus:outline-none focus:border-[#594fe6] transition-colors"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-400 font-semibold">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] sm:text-xs font-bold text-[rgb(var(--text-primary))] dark:text-[#c4c6e5]">
                  Subject
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-secondary))] dark:text-[#8e91b5]">
                    <FileText size={14} />
                  </div>
                  <input
                    {...register('subject')}
                    type="text"
                    placeholder="What is your message about?"
                    className="w-full bg-[rgb(var(--bg-base))] dark:bg-[#080918] border border-[rgb(var(--border))] dark:border-[#1b1d3d] rounded-xl pl-9 pr-3.5 py-2 sm:py-2.5 text-xs text-[rgb(var(--text-primary))] dark:text-white placeholder-[rgb(var(--text-muted))] dark:placeholder-[#5c5f8a] focus:outline-none focus:border-[#594fe6] transition-colors"
                  />
                </div>
                {errors.subject && <p className="text-[10px] text-red-400 font-semibold">{errors.subject.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] sm:text-xs font-bold text-[rgb(var(--text-primary))] dark:text-[#c4c6e5]">
                  Message
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-3 pointer-events-none text-[rgb(var(--text-secondary))] dark:text-[#8e91b5]">
                    <MessageSquare size={14} />
                  </div>
                  <textarea
                    {...register('message')}
                    rows={3}
                    placeholder="Type your message here..."
                    className="w-full bg-[rgb(var(--bg-base))] dark:bg-[#080918] border border-[rgb(var(--border))] dark:border-[#1b1d3d] rounded-xl pl-9 pr-3.5 py-2 sm:py-2.5 text-xs text-[rgb(var(--text-primary))] dark:text-white placeholder-[rgb(var(--text-muted))] dark:placeholder-[#5c5f8a] focus:outline-none focus:border-[#594fe6] transition-colors resize-none"
                  />
                </div>
                {errors.message && <p className="text-[10px] text-red-400 font-semibold">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#594fe6] to-[#7964ff] hover:opacity-95 text-white font-extrabold text-xs py-2.5 sm:py-3.5 rounded-xl shadow-[0_0_20px_rgba(89,79,230,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer border-0 mt-1"
              >
                <Send size={13} /> Send Message
              </button>
            </form>
          </div>

          {/* Right Column: Contact Info & Location Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5 text-left w-full">
            <div className="bg-[rgb(var(--bg-surface))] dark:bg-[#0c0d24] border border-[rgb(var(--border))] dark:border-[#1b1c3d] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-2xl space-y-3.5 sm:space-y-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#594fe6] text-white flex items-center justify-center shadow-md flex-shrink-0">
                  <PhoneCall size={14} className="sm:w-[16px] sm:h-[16px]" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[rgb(var(--text-primary))] dark:text-white font-[Outfit]">
                  Contact Information
                </h3>
              </div>

              <div className="space-y-2 pt-0.5">
                <div className="bg-[rgb(var(--bg-base))] dark:bg-[#080918] border border-[rgb(var(--border))] dark:border-[#1b1d3d] rounded-xl p-2.5 px-3 sm:p-3 sm:px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Mail size={14} className="sm:w-[15px] sm:h-[15px]" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9.5px] sm:text-[10px] text-[rgb(var(--text-secondary))] dark:text-[#8e91b5] font-semibold">Support Email</span>
                      <span className="text-[11px] sm:text-xs font-bold text-[rgb(var(--text-primary))] dark:text-white font-mono truncate block">support@eduflow.in</span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard('support@eduflow.in', 'Support Email')}
                    className="p-1 text-[rgb(var(--text-secondary))] dark:text-[#8e91b5] hover:text-[rgb(var(--text-primary))] dark:hover:text-white transition-colors cursor-pointer flex-shrink-0"
                    title="Copy Email"
                  >
                    {copiedField === 'Support Email' ? <Check size={13} className="text-slate-500 dark:text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>

                <div className="bg-[rgb(var(--bg-base))] dark:bg-[#080918] border border-[rgb(var(--border))] dark:border-[#1b1d3d] rounded-xl p-2.5 px-3 sm:p-3 sm:px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-slate-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Phone size={14} className="sm:w-[15px] sm:h-[15px]" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9.5px] sm:text-[10px] text-[rgb(var(--text-secondary))] dark:text-[#8e91b5] font-semibold">Phone Support</span>
                      <span className="text-[11px] sm:text-xs font-bold text-[rgb(var(--text-primary))] dark:text-white font-mono truncate block">+91 98765 43210</span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard('+91 98765 43210', 'Phone Number')}
                    className="p-1 text-[rgb(var(--text-secondary))] dark:text-[#8e91b5] hover:text-[rgb(var(--text-primary))] dark:hover:text-white transition-colors cursor-pointer flex-shrink-0"
                    title="Copy Phone Number"
                  >
                    {copiedField === 'Phone Number' ? <Check size={13} className="text-slate-500 dark:text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>

                <div className="bg-[rgb(var(--bg-base))] dark:bg-[#080918] border border-[rgb(var(--border))] dark:border-[#1b1d3d] rounded-xl p-2.5 px-3 sm:p-3 sm:px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="sm:w-[15px] sm:h-[15px]" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9.5px] sm:text-[10px] text-[rgb(var(--text-secondary))] dark:text-[#8e91b5] font-semibold">Support Hours</span>
                      <span className="text-[11px] sm:text-xs font-bold text-[rgb(var(--text-primary))] dark:text-white font-sans truncate block">Mon - Sat: 9:00 AM - 8:00 PM</span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard('Mon - Sat: 9:00 AM - 8:00 PM', 'Support Hours')}
                    className="p-1 text-[rgb(var(--text-secondary))] dark:text-[#8e91b5] hover:text-[rgb(var(--text-primary))] dark:hover:text-white transition-colors cursor-pointer flex-shrink-0"
                    title="Copy Support Hours"
                  >
                    {copiedField === 'Support Hours' ? <Check size={13} className="text-slate-500 dark:text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[rgb(var(--bg-surface))] dark:bg-[#0c0d24] border border-[rgb(var(--border))] dark:border-[#1b1c3d] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#594fe6] text-white flex items-center justify-center shadow-md flex-shrink-0">
                  <MapPin size={14} className="sm:w-[16px] sm:h-[16px]" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[rgb(var(--text-primary))] dark:text-white font-[Outfit]">
                  Our Location
                </h3>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-[11px] sm:text-xs font-bold text-[rgb(var(--text-primary))] dark:text-white font-[Outfit]">
                  Private Classroom Center
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[rgb(var(--text-secondary))] dark:text-[#8e91b5]">
                  {import.meta.env.VITE_CONTACT_ADDRESS || "Contact Support for Address"}
                </p>
              </div>

              <div className="w-full h-20 sm:h-28 rounded-xl bg-slate-50 dark:bg-[#080918] border border-slate-200 dark:border-[#1b1d3d] relative overflow-hidden flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#483ec7_1px,transparent_1px)] [background-size:12px_12px]" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#594fe6] text-white flex items-center justify-center shadow-[0_0_15px_rgba(89,79,230,0.8)] border-2 border-white animate-bounce">
                    <MapPin size={14} fill="currentColor" className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase bg-slate-50 dark:bg-[#080918]/90 px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#1b1d3d] mt-1 shadow-md">
                    Location
                  </span>
                </div>
              </div>

              <a
                href={import.meta.env.VITE_CONTACT_MAPS_URL || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] sm:text-xs text-[rgb(var(--text-primary))] dark:text-white hover:text-indigo-400 font-semibold flex items-center justify-between pt-1.5 border-t border-[rgb(var(--border))] dark:border-[#1b1c3d] transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink size={13} className="text-slate-500 dark:text-[#8e91b5]" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
