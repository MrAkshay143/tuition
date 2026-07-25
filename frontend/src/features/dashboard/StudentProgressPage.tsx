import { useApiQuery } from '@/api/resources/hooks'
import { Award, BarChart3, CheckCircle, Clock, BookOpen, ChevronRight } from 'lucide-react'
import { downloadCertificate } from '@/api/resources/certificates'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { useNavigate } from 'react-router-dom'

export default function StudentProgressPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useApiQuery(
    ['student', 'progress'],
    '/student/progress',
    undefined,
    { staleTime: 1000 * 60 * 5 }
  )

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  const completions = data || []
  const totalCourses = completions.length
  const completedCount = completions.filter((c: any) => c.completed_percentage === 100).length
  const inProgressCount = completions.filter((c: any) => c.completed_percentage > 0 && c.completed_percentage < 100).length

  return (
    <div className="space-y-5 pb-12 font-[Outfit]">
      {/* 1. Minimalist Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[rgb(var(--text-primary))] font-semibold">Learning Journey</span>
          </div>
        </div>
        {completedCount > 0 && (
          <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full animate-pulse shadow-xs">
            {completedCount} COMPLETED
          </span>
        )}
      </div>

      {/* 2. Compact One-Line Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <BookOpen size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Courses</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{totalCourses}</h3>
            <p className="text-[10px] text-indigo-500 font-semibold mt-1">Enrolled classrooms</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Completed</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{completedCount}</h3>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">Milestone achieved</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[90%] rounded-full"></div>
          </div>
        </Card>

        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between min-w-[160px] flex-1 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">In Progress</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{inProgressCount}</h3>
            <p className="text-[10px] text-amber-500 font-semibold mt-1">Ongoing lessons</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[65%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 3. Main Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-extrabold text-xs text-[rgb(var(--text-primary))] uppercase tracking-wider px-0.5">My Course Progress</h3>
          {completions.length === 0 ? (
            <Card className="p-8 text-center border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-2.5">
                <Award size={24} />
              </div>
              <h4 className="font-extrabold text-sm text-[rgb(var(--text-primary))] mb-1">No enrolled courses yet</h4>
              <p className="text-xs text-[rgb(var(--text-secondary))] max-w-xs mx-auto mb-3">
                Enroll in a course and start watching lessons to see your real-time learning progress here.
              </p>
              <Button onClick={() => navigate('/student/courses')} className="font-extrabold text-xs rounded-xl h-8 py-1 px-4">
                Browse My Courses
              </Button>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {completions.map((comp: any) => (
                <Card key={comp.id} className="p-3.5 sm:p-4 border border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--bg-surface))] hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-xs sm:text-sm text-[rgb(var(--text-primary))] truncate">{comp.course?.title || 'Untitled Course'}</h4>
                        {comp.completed_percentage === 100 ? (
                          <Badge variant="success" className="text-[9px] font-extrabold uppercase px-2 py-0.5">COMPLETED</Badge>
                        ) : (
                          <Badge variant="primary" className="text-[9px] font-extrabold uppercase px-2 py-0.5">IN PROGRESS</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-[rgb(var(--text-secondary))] font-semibold">
                        <span>Course Completion</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{comp.completed_percentage ?? 0}%</span>
                      </div>

                      <div className="w-full bg-[rgb(var(--bg-elevated))] h-1.5 rounded-full overflow-hidden border border-[rgb(var(--border))]">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-700"
                          style={{ width: `${comp.completed_percentage ?? 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgb(var(--border))]">
                      {comp.completed_percentage === 100 && comp.certificate_id ? (
                        <Button
                          size="sm"
                          className="font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-xl px-3 py-1 h-8"
                          onClick={() => downloadCertificate(comp.certificate_id, `Certificate-${comp.course?.title?.replace(/\s+/g, '-')}.pdf`)}
                        >
                          <Award size={14} className="mr-1" /> Certificate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-bold text-xs rounded-xl px-3 py-1 h-8 hover:bg-indigo-500/10 hover:text-indigo-600 border-[rgb(var(--border))]"
                          onClick={() => navigate(`/student/courses/${comp.course?.id || comp.course_id}`)}
                        >
                          Continue Learning <ChevronRight size={13} className="ml-1 inline" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-extrabold text-xs text-[rgb(var(--text-primary))] uppercase tracking-wider px-0.5">How Progress Works</h3>
          <Card className="p-3.5 sm:p-4 space-y-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <h4 className="font-extrabold text-sm text-[rgb(var(--text-primary))]">Automated Milestones</h4>
            <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
              Every video lesson watched, note downloaded, and assignment submitted contributes to your live course progress percentage.
            </p>
            <div className="pt-2 border-t border-[rgb(var(--border))] space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-[rgb(var(--text-muted))] text-[11px]">100% Completion</span>
                <span className="text-emerald-500 font-extrabold text-[11px]">Certificate Granted</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[rgb(var(--text-muted))] text-[11px]">Verification</span>
                <span className="text-indigo-400 font-extrabold text-[11px]">Digital Signatures</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
