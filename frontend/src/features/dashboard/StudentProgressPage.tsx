import { useApiQuery } from '@/api/resources/hooks'
import { Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/api/client'
import { Button, Card, Badge, Spinner } from '@/components/ui'

export default function StudentProgressPage() {
  const { data, isLoading } = useApiQuery(
    ['student', 'progress'],
    '/student/progress',
    undefined,
    { staleTime: 1000 * 60 * 5 }
  )

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  const completions = data || []

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold font-[Outfit] tracking-tight text-[rgb(var(--text-primary))]">Learning Journey</h1>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 font-[Inter]">
            Review your completions, history timeline, and print certificates.
          </p>
        </div>
        <Badge variant="muted" className="self-start sm:self-auto text-[10px]">Journey Logs</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">My Classroom Certifications</h3>
            {completions.length === 0 ? (
              <p className="text-xs text-[rgb(var(--text-secondary))] py-4 text-slate-500 dark:text-slate-400 text-center">
                No certifications earned yet. Complete a course to earn one.
              </p>
            ) : (
              <div className="space-y-4">
                {completions.map((comp: any) => (
                  <div key={comp.id} className="p-4 border border-[rgb(var(--border))] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">{comp.course?.title}</h4>
                        {comp.completed_percentage === 100 && (
                          <Badge variant="success">COMPLETED</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-[rgb(var(--text-secondary))]">
                        Completion: <span className="font-bold">{comp.completed_percentage}%</span>
                      </p>

                      {/* Progress bar */}
                      <div className="w-48 bg-[rgb(var(--border))] h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[rgb(var(--primary))] h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${comp.completed_percentage ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {comp.completed_percentage === 100 && comp.certificate_id && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="font-bold flex items-center gap-1.5 flex-shrink-0"
                        onClick={() => toast.success(`Certificate #${comp.certificate_id} - print-ready!`)}
                      >
                        <Award size={14} /> Certificate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <Card className="p-5 space-y-4 h-fit">
          <h3 className="font-bold text-sm text-[rgb(var(--text-primary))] font-[Outfit]">Journey Timeline Notes</h3>
          <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed font-[Inter]">
            Every completed lecture and exam results in live database progress updates.
            Upon reaching 100% completion in any classroom course, an enterprise completion certificate is automatically compiled.
          </p>
          <div className="pt-2 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[rgb(var(--text-muted))]">Total Courses</span>
              <span className="font-bold text-[rgb(var(--text-primary))]">{completions.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[rgb(var(--text-muted))]">Completed</span>
              <span className="font-bold text-slate-500 dark:text-emerald-500">
                {completions.filter((c: any) => c.completed_percentage === 100).length}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[rgb(var(--text-muted))]">In Progress</span>
              <span className="font-bold text-[rgb(var(--primary))]">
                {completions.filter((c: any) => c.completed_percentage > 0 && c.completed_percentage < 100).length}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
