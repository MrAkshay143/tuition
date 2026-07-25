import React, { useState } from 'react'
import { useApiQuery } from '@/api/resources/hooks'
import { Card, Badge, Spinner, Button } from '@/components/ui'
import { downloadCertificate } from '@/api/resources/certificates'
import { Award, Download, CheckCircle, ShieldCheck, Sparkles, Search, BookOpen, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const StudentCertificatesPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const { data, isLoading } = useApiQuery(
    ['student', 'progress'],
    '/student/progress'
  )

  if (isLoading) return <div className="flex justify-center p-16"><Spinner /></div>

  const progress = data?.data || data || []
  const completedCourses = progress.filter((p: any) => p.completed_percentage === 100)
  const inProgressCourses = progress.filter((p: any) => p.completed_percentage < 100)

  const displayedCertificates = completedCourses.filter((c: any) =>
    !searchQuery || c.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-5 pb-12 font-[Outfit]">
      {/* 1. Minimalist Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Certificates & Credentials</span>
          </div>
        </div>
        {completedCourses.length > 0 && (
          <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full animate-pulse shadow-xs flex items-center gap-1">
            <Sparkles size={11} className="inline" /> {completedCourses.length} EARNED
          </span>
        )}
      </div>

      {/* 2. Compact One-Line Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Award size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Earned Certs</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{completedCourses.length}</h3>
            <p className="text-[10px] text-amber-500 font-semibold mt-1">Verified credentials</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <ShieldCheck size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">In Progress</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{inProgressCourses.length}</h3>
            <p className="text-[10px] text-indigo-500 font-semibold mt-1">Courses underway</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-500 h-full w-[60%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <ShieldCheck size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Official Status</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">100%</h3>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">Verified & accredited</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[100%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 2. Filter & Search Bar */}
      {completedCourses.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[rgb(var(--bg-surface))] p-3 rounded-2xl border border-[rgb(var(--border))] shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[rgb(var(--text-secondary))] px-2">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" /> All certificates are officially verified and tamper-proof.
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
            <input 
              type="text" 
              placeholder="Search certificates..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition-all"
            />
          </div>
        </div>
      )}

      {/* 3. Certificates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {displayedCertificates.map((c: any) => (
          <Card key={c.id} className="p-0 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-[rgb(var(--bg-surface))] border border-amber-500/30 dark:border-amber-500/20 rounded-2xl group shadow-sm">
            {/* Top Decorative Gold/Amber Banner Ribbon */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 p-3 flex items-center justify-between text-slate-950">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-950/15 flex items-center justify-center font-bold">
                  <Award size={16} className="text-slate-950" />
                </div>
                <span className="font-black text-xs uppercase tracking-wider font-[Outfit]">Verified Certificate</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950/15 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                <CheckCircle size={11} /> Official
              </div>
            </div>

            {/* Main Card Content Body */}
            <div className="p-4 sm:p-5 space-y-3.5 relative z-10">
              {/* Background Watermark Icon */}
              <div className="absolute -top-2 -right-2 text-amber-500/5 dark:text-amber-400/5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <Award size={120} />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">EduFlow Accredited</span>
                <h3 className="font-black text-base sm:text-lg text-[rgb(var(--text-primary))] leading-snug group-hover:text-amber-500 transition-colors line-clamp-2">
                  {c.course?.title || 'Course Certificate'}
                </h3>
                <p className="text-[11px] text-[rgb(var(--text-muted))] font-medium pt-0.5">
                  Issued on: <strong className="text-[rgb(var(--text-primary))]">{new Date(c.updated_at).toLocaleDateString([], { dateStyle: 'medium' })}</strong>
                </p>
              </div>

              {/* Certificate Credential Bar */}
              <div className="flex items-center justify-between text-[11px] bg-[rgb(var(--bg-elevated))] px-3 py-2 rounded-xl border border-[rgb(var(--border))]">
                <span className="flex items-center gap-1.5 font-bold text-[rgb(var(--text-secondary))]">
                  <ShieldCheck size={14} className="text-amber-500 shrink-0" /> Credential ID:
                </span>
                <span className="font-mono font-extrabold text-[rgb(var(--text-primary))] text-xs truncate max-w-[130px]">
                  {c.certificate_id || `CERT-${String(c.id).padStart(6, '0')}`}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                {c.certificate_id ? (
                  <Button
                    className="flex-1 font-extrabold text-xs py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 rounded-xl justify-center cursor-pointer border-0"
                    onClick={() => downloadCertificate(c.certificate_id, `Certificate-${c.course?.title?.replace(/\s+/g, '-')}.pdf`)}
                  >
                    <Download size={14} className="mr-1.5" /> Download PDF
                  </Button>
                ) : (
                  <Button className="w-full justify-center font-bold text-xs py-2 rounded-xl" variant="outline" disabled>
                    Generating Certificate…
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {completedCourses.length === 0 && (
          <div className="col-span-full py-14 flex flex-col items-center justify-center text-center p-6 bg-[rgb(var(--bg-surface))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl">
            <div className="w-14 h-14 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3 shadow-2xs">
              <Award size={28} />
            </div>
            <h3 className="font-extrabold text-base text-[rgb(var(--text-primary))] mb-1">No certificates earned yet</h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] max-w-sm leading-relaxed mb-5">
              Complete any course to 100% to unlock your official completion certificate.
            </p>
            {inProgressCourses.length > 0 && (
              <div className="w-full max-w-md bg-[rgb(var(--bg-elevated))] p-4 rounded-xl border border-[rgb(var(--border))] text-left space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">Courses In Progress ({inProgressCourses.length})</span>
                {inProgressCourses.slice(0, 2).map((prog: any) => (
                  <div key={prog.id} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[rgb(var(--text-primary))] truncate max-w-[200px]">{prog.course?.title}</span>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-extrabold px-2.5 cursor-pointer" onClick={() => navigate(`/student/courses/${prog.course?.id || prog.course_id}`)}>
                      Resume ({prog.completed_percentage}%)
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {inProgressCourses.length === 0 && (
              <Button onClick={() => navigate('/student/courses')} className="font-extrabold text-xs rounded-xl px-5 py-2 cursor-pointer">
                <BookOpen size={14} className="mr-1.5 inline" /> Browse My Courses
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
