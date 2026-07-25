import React from 'react'
import { useApiQuery } from '@/api/resources/hooks'
import { Card, Badge, Spinner, Button } from '@/components/ui'
import { Award, Download, CheckCircle, ShieldCheck } from 'lucide-react'

export const StudentCertificatesPage = () => {
  const { data, isLoading } = useApiQuery(
    ['student', 'progress'],
    '/student/progress'
  )

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  const progress = data?.data || data || []
  const completedCourses = progress.filter((p: any) => p.completed_percentage === 100)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-[Outfit] text-[rgb(var(--text-primary))] flex items-center gap-2">
          <Award size={20} className="text-[rgb(var(--warning))]" /> My Certificates
        </h2>
        <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
          {completedCourses.length} certificate{completedCourses.length !== 1 ? 's' : ''} earned · Complete courses 100% to unlock new ones
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {completedCourses.map((c: any) => (
          <Card key={c.id} className="p-6 flex flex-col justify-between gap-5 relative overflow-hidden border-[rgb(var(--primary)/0.2)]"
            style={{ background: 'linear-gradient(135deg, rgb(var(--bg-surface)), rgb(var(--primary)/0.04))' }}
          >
            {/* Background Award Icon */}
            <div className="absolute -top-4 -right-4 text-[rgb(var(--primary)/0.08)] pointer-events-none">
              <Award size={120} />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start gap-3">
                <Badge variant="primary" className="uppercase text-[10px]">Course Completed</Badge>
                <div className="flex items-center gap-1.5 text-[rgb(var(--success))] text-xs font-bold bg-[rgb(var(--success)/0.1)] px-2.5 py-1 rounded-full">
                  <CheckCircle size={12} /> Verified
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-[rgb(var(--text-primary))] pr-6 leading-snug">
                  {c.course?.title || 'Unknown Course'}
                </h3>
                <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                  Completed: {new Date(c.updated_at).toLocaleDateString([], { dateStyle: 'medium' })}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] px-3 py-2 rounded-lg border border-[rgb(var(--border))]">
                <ShieldCheck size={14} className="text-[rgb(var(--primary))] flex-shrink-0" />
                Certificate ID: <span className="font-mono font-semibold text-[rgb(var(--primary))]">
                  {c.certificate_id || `CERT-${String(c.id).padStart(6, '0')}`}
                </span>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-[rgb(var(--border))]">
              {c.certificate_id ? (
                <Button
                  variant="primary"
                  className="w-full font-bold justify-center"
                  leftIcon={<Download size={15} />}
                  onClick={() => window.open(`/api/v1/certificates/${c.certificate_id}/download`, '_blank')}
                >
                  Download Certificate
                </Button>
              ) : (
                <Button className="w-full justify-center" variant="outline" disabled>
                  Generating Certificate…
                </Button>
              )}
            </div>
          </Card>
        ))}

        {completedCourses.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 border-2 border-dashed border-[rgb(var(--border))] rounded-2xl text-[rgb(var(--text-muted))]">
            <div className="w-20 h-20 rounded-2xl bg-[rgb(var(--bg-elevated))] flex items-center justify-center">
              <Award size={40} className="opacity-20" />
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
              <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-secondary))]">No Certificates Yet</h3>
              <p className="text-sm mt-1">Complete your first course to 100% by finishing all lessons, assignments, and exams to earn your first certificate.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
