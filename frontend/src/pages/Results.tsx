import { Award, Star, Compass, AlertCircle, RefreshCw, Trophy } from 'lucide-react'
import { Card, Badge, Button, Spinner, SEO } from '@/components/ui'
import { useAchievements } from '@/api/resources/cms'

export default function Results() {
  const { data, isLoading, isError, refetch } = useAchievements()
  const achievements = data?.items || []
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <SEO title="Student Achievements" description="Highlighting rank statistics and entrance results of student groups." />
      
      {/* Header */}
      <section className="text-slate-500 dark:text-slate-400 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgb(var(--primary))]/8 border border-[rgb(var(--primary))]/15 text-xs text-[rgb(var(--primary-light))] font-semibold">
          <Award size={12} /> Student Achievements
        </div>
        <h1 className="text-4xl font-extrabold text-[rgb(var(--text-primary))]">Classroom Rank Holders</h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mx-auto">
          Highlighting rank statistics and entrance results of student groups coached by Arjun Kumar.
        </p>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-500 dark:text-slate-400 text-center">
        <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-5">
          <div className="text-3xl font-extrabold text-[rgb(var(--primary))]">AIR 45</div>
          <div className="text-xs text-[rgb(var(--text-secondary))] font-bold mt-1">JEE Advanced Best Rank</div>
        </Card>
        <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-5">
          <div className="text-3xl font-extrabold text-slate-500 dark:text-emerald-500">AIR 112</div>
          <div className="text-xs text-[rgb(var(--text-secondary))] font-bold mt-1">NEET Medical Best Rank</div>
        </Card>
        <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-5">
          <div className="text-3xl font-extrabold text-orange-500">95%+</div>
          <div className="text-xs text-[rgb(var(--text-secondary))] font-bold mt-1">Board Average Score</div>
        </Card>
      </div>

      {/* Grid achievements list */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[rgb(var(--text-primary))]">Top Rank Showcase</h3>
        
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Spinner size={32} className="text-indigo-500" />
            <p className="text-xs text-[rgb(var(--text-muted))]">Loading achievements...</p>
          </div>
        )}

        {isError && (
          <Card className="p-8 text-center border-rose-500/20 bg-rose-500/5 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Failed to load achievements</h3>
              <p className="text-xs text-rose-500/80 mt-1">There was a problem connecting to the server.</p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="border-rose-500/20 text-rose-600 hover:bg-rose-500/10">
              <RefreshCw size={14} className="mr-2" /> Try Again
            </Button>
          </Card>
        )}

        {!isLoading && !isError && achievements.length === 0 && (
          <Card className="p-12 text-center border-dashed border-[rgb(var(--border))] flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-500/10 text-slate-400 flex items-center justify-center">
              <Trophy size={32} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[rgb(var(--text-primary))]">No Achievements Yet</h3>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Student ranks and results will appear here once published.</p>
            </div>
          </Card>
        )}

        {!isLoading && !isError && achievements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((ach: any, idx: number) => (
              <Card key={ach.id || idx} className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-6 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[rgb(var(--primary))]/10 to-[rgb(var(--accent))]/10 text-[rgb(var(--primary))] flex items-center justify-center flex-shrink-0">
                  {ach.image ? (
                    <img src={ach.image} alt={ach.student_name} loading="lazy" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Star size={18} fill="currentColor" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[rgb(var(--text-primary))]">{ach.student_name}</h4>
                    <Badge variant="muted" className="text-[9px] px-1.5 py-0.5">{ach.year}</Badge>
                  </div>
                  <div className="text-xs text-[rgb(var(--primary-light))] font-extrabold">{ach.rank || ach.score} - {ach.exam_name}</div>
                  {ach.testimonial && <div className="text-[10px] text-[rgb(var(--text-secondary))] italic line-clamp-2 mt-2">"{ach.testimonial}"</div>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

