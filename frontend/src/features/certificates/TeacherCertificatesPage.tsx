import React, { useState } from 'react'
import { Card, Badge, Spinner, Button } from '@/components/ui'
import { EnterpriseTable } from '@/components/ui/EnterpriseTable'
import { Award, Download, Search, Shield, Users, CheckCircle, Sparkles, Filter, Calendar, ExternalLink, RefreshCw } from 'lucide-react'
import { useApiQuery } from '@/api/resources/hooks'

export const TeacherCertificatesPage = () => {
  const [search, setSearch] = useState('')
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'recent'>('all')
  const [certPage, setCertPage] = useState(1)
  const [certPerPage, setCertPerPage] = useState(10)

  const { data: certsData, isLoading, refetch } = useApiQuery(
    ['teacher', 'certificates'],
    '/certificates'
  )

  React.useEffect(() => {
    setCertPage(1)
  }, [search, filterPeriod])

  const certificates: any[] = Array.isArray(certsData) ? certsData : (certsData?.data || [])

  const filtered = React.useMemo(() => {
    let result = certificates

    if (filterPeriod === 'recent') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      result = result.filter(c => new Date(c.issued_at || c.created_at) >= thirtyDaysAgo)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        `${c.user?.first_name || ''} ${c.user?.last_name || ''} ${c.user?.name || ''}`.toLowerCase().includes(q) ||
        c.course?.title?.toLowerCase().includes(q) ||
        (c.certificate_number || c.id || '').toString().toLowerCase().includes(q)
      )
    }

    return result
  }, [certificates, search, filterPeriod])

  const totalCertCount = filtered.length
  const lastCertPage = Math.max(1, Math.ceil(totalCertCount / certPerPage))
  const paginatedCerts = React.useMemo(() => {
    const start = (certPage - 1) * certPerPage
    return filtered.slice(start, start + certPerPage)
  }, [filtered, certPage, certPerPage])

  const uniqueStudents = React.useMemo(() => {
    const ids = new Set(certificates.map(c => c.user_id || c.user?.id).filter(Boolean))
    return ids.size
  }, [certificates])

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-[1400px] mx-auto pb-12 text-left">
      {/* Page Banner */}
      <div className="flex flex-row items-center justify-between gap-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl p-3 sm:p-3.5 shadow-xs">
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h1 className="text-sm sm:text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] shrink-0">
              Student Certificates
            </h1>
            <span className="hidden sm:inline text-[rgb(var(--text-muted))] text-xs">•</span>
            <p className="hidden sm:block text-xs text-[rgb(var(--text-muted))] truncate">
              Track and verify course completion certificates issued to enrolled students.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetch()}
              className="p-1.5 sm:p-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Certificates"
            >
              <RefreshCw size={14} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

      {/* 2. KPI Summary Stats Row */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Total Issued</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{certificates.length}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Unique Students</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{uniqueStudents}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border border-[rgb(var(--border))] flex items-center justify-between gap-3 min-w-[200px] flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-wider">Verified Records</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{certificates.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <Card className="p-3 sm:p-4 border border-[rgb(var(--border))] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            type="text"
            placeholder="Search by student name, course or certificate ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setFilterPeriod('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterPeriod === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setFilterPeriod('recent')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterPeriod === 'recent'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </Card>

      {/* 4. Certificates Display (Mobile Card List + Desktop Table) */}
      <Card className="p-3 sm:p-4 border border-[rgb(var(--border))] overflow-hidden flex flex-col min-h-[400px]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Award size={40} className="mx-auto mb-3 text-[rgb(var(--text-muted))] opacity-30" />
            <p className="text-xs sm:text-sm font-medium text-[rgb(var(--text-muted))]">
              {search ? 'No certificates match your search query.' : 'No certificates issued yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List View (< sm) */}
            <div className="block sm:hidden space-y-3">
              {paginatedCerts.map((cert: any) => (
                <div
                  key={cert.id}
                  className="p-3.5 border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg-elevated))] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[rgb(var(--border))] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {cert.user?.first_name?.charAt(0) || cert.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-[rgb(var(--text-primary))] font-[Outfit]">
                          {cert.user?.first_name} {cert.user?.last_name} {cert.user?.name}
                        </h4>
                        <p className="text-[10px] text-[rgb(var(--text-muted))]">{cert.user?.email}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                      #{cert.certificate_number || cert.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-[rgb(var(--text-muted))] font-medium text-[11px]">Course Title</span>
                    <Badge variant="muted" className="text-[10px] font-bold max-w-[180px] truncate">
                      {cert.course?.title || 'Certified Course'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-[rgb(var(--border))] pt-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-[rgb(var(--text-muted))] font-medium">
                      <Calendar size={12} />
                      <span>{new Date(cert.issued_at || cert.created_at).toLocaleDateString()}</span>
                    </div>

                    <a
                      href={cert.pdf_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                    >
                      <Download size={13} /> Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block">
              <EnterpriseTable
                columns={[
                  {
                    header: 'CERTIFICATE ID',
                    accessor: (cert: any) => (
                      <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                        #{cert.certificate_number || cert.id}
                      </span>
                    )
                  },
                  {
                    header: 'STUDENT',
                    accessor: (cert: any) => (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                          {cert.user?.first_name?.charAt(0) || cert.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[rgb(var(--text-primary))] font-[Outfit]">
                            {cert.user?.first_name} {cert.user?.last_name} {cert.user?.name}
                          </div>
                          <div className="text-[10px] text-[rgb(var(--text-muted))]">{cert.user?.email}</div>
                        </div>
                      </div>
                    )
                  },
                  {
                    header: 'COURSE',
                    accessor: (cert: any) => (
                      <Badge variant="muted" className="text-[10px] font-semibold">{cert.course?.title || 'Course'}</Badge>
                    )
                  },
                  {
                    header: 'ISSUED DATE',
                    accessor: (cert: any) => (
                      <span className="text-xs text-[rgb(var(--text-secondary))] font-medium">
                        {new Date(cert.issued_at || cert.created_at).toLocaleDateString()}
                      </span>
                    )
                  },
                  {
                    header: 'ACTION',
                    accessor: (cert: any) => (
                      <div className="flex justify-end text-right">
                        <a
                          href={cert.pdf_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                        >
                          <Download size={13} /> Download PDF
                        </a>
                      </div>
                    )
                  }
                ]}
                data={paginatedCerts}
                meta={{
                  current_page: certPage,
                  last_page: lastCertPage,
                  per_page: certPerPage,
                  total: totalCertCount,
                }}
                onPageChange={(p) => setCertPage(p)}
                onPerPageChange={(pp) => {
                  setCertPerPage(pp)
                  setCertPage(1)
                }}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

