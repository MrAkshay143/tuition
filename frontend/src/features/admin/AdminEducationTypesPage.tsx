import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Pencil, Trash2, GraduationCap, ChevronDown, ChevronUp, 
  GripVertical, Settings, Info, Building2, BookOpen, Award, 
  FileCheck, Code, Briefcase
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  useAdminEducationTypes,
  useCreateEducationType,
  useUpdateEducationType,
  useDeleteEducationType,
  useAdminPrograms,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
  useAdminSessions,
  type EducationType,
  type Program,
} from '@/api/resources/taxonomy'
import { Button, Card, Badge, Input, Spinner } from '@/components/ui'
import { Modal, ConfirmModal } from '@/components/ui/overlays'
import { cn } from '@/lib/utils'

// ── Icon selector helper ──────────────────────────────────────────────────────
const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.includes('school')) return Building2
  if (lower.includes('college')) return GraduationCap
  if (lower.includes('exam') || lower.includes('competitive')) return Award
  if (lower.includes('certif')) return FileCheck
  if (lower.includes('skill')) return Code
  if (lower.includes('profession') || lower.includes('training')) return Briefcase
  return BookOpen
}

// ── Education Type Form Modal ─────────────────────────────────────────────────
function EducationTypeModal({
  open, onClose, initial,
}: { open: boolean; onClose: () => void; initial?: EducationType | null }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [orderIndex, setOrderIndex] = useState(String(initial?.order_index ?? ''))

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setDescription(initial?.description ?? '')
      setOrderIndex(String(initial?.order_index ?? ''))
    }
  }, [open, initial])

  const create = useCreateEducationType()
  const update = useUpdateEducationType()
  const busy = create.isPending || update.isPending

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return }
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      order_index: orderIndex ? parseInt(orderIndex) : undefined,
      is_active: true,
    }
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...payload })
    } else {
      await create.mutateAsync(payload)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Education Type' : 'New Education Type'} size="sm">
      <div className="space-y-4 py-1">
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] block mb-1">Name *</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. School, College, Competitive Exams" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] block mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Short description shown on public pages"
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-base))] text-sm text-[rgb(var(--text-primary))] px-3 py-2 outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30 resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] block mb-1">Sort Order</label>
          <Input type="number" value={orderIndex} onChange={e => setOrderIndex(e.target.value)} placeholder="1" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={busy}>
            {busy ? <Spinner size={14} /> : (initial ? 'Save Changes' : 'Create')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Program Form Modal ────────────────────────────────────────────────────────
function ProgramModal({
  open, onClose, initial, educationTypeId,
}: { open: boolean; onClose: () => void; initial?: Program | null; educationTypeId?: number | null }) {
  const { data: sessions = [] } = useAdminSessions()
  const { data: educationTypes = [] } = useAdminEducationTypes()

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [eduTypeId, setEduTypeId] = useState(String(initial?.education_type_id ?? educationTypeId ?? ''))
  const [sessionId, setSessionId] = useState(String(initial?.academic_session_id ?? ''))
  const [orderIndex, setOrderIndex] = useState(String(initial?.order_index ?? ''))

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setDescription(initial?.description ?? '')
      setEduTypeId(String(initial?.education_type_id ?? educationTypeId ?? ''))
      setSessionId(String(initial?.academic_session_id ?? ''))
      setOrderIndex(String(initial?.order_index ?? ''))
    }
  }, [open, initial, educationTypeId])

  const create = useCreateProgram()
  const update = useUpdateProgram()
  const busy = create.isPending || update.isPending

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return }
    if (!eduTypeId) { toast.error('Education Type is required'); return }
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      education_type_id: parseInt(eduTypeId),
      academic_session_id: sessionId ? parseInt(sessionId) : null,
      order_index: orderIndex ? parseInt(orderIndex) : undefined,
      is_active: true,
    }
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...payload })
    } else {
      await create.mutateAsync(payload)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Program' : 'New Program'} size="sm">
      <div className="space-y-4 py-1">
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] block mb-1">Name *</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CBSE Class 10, JEE Main 2027" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] block mb-1">Education Type *</label>
          <select
            value={eduTypeId}
            onChange={e => setEduTypeId(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-base))] text-sm text-[rgb(var(--text-primary))] px-3 py-2 outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
          >
            <option value="">Select Education Type</option>
            {educationTypes.map(et => (
              <option key={et.id} value={et.id}>{et.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] block mb-1">Academic Session</label>
          <select
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-base))] text-sm text-[rgb(var(--text-primary))] px-3 py-2 outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
          >
            <option value="">None (e.g. Competitive programs)</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' (Current)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] block mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-base))] text-sm text-[rgb(var(--text-primary))] px-3 py-2 outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30 resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--text-secondary))] block mb-1">Sort Order</label>
          <Input type="number" value={orderIndex} onChange={e => setOrderIndex(e.target.value)} placeholder="1" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={busy}>
            {busy ? <Spinner size={14} /> : (initial ? 'Save Changes' : 'Create')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Education Types Page ─────────────────────────────────────────────────
export default function AdminEducationTypesPage() {
  const { data: educationTypes = [], isLoading } = useAdminEducationTypes()
  const { data: programs = [] } = useAdminPrograms()
  const { data: sessions = [] } = useAdminSessions()
  const deleteEduType = useDeleteEducationType()
  const deleteProgram = useDeleteProgram()

  const [etModal, setEtModal] = useState<{ open: boolean; item?: EducationType | null }>({ open: false })
  const [progModal, setProgModal] = useState<{ open: boolean; item?: Program | null; eduTypeId?: number | null }>({ open: false })
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; type: 'et' | 'prog'; id: number; name: string } | null>(null)
  
  // Collapse state (default: all expanded)
  const [collapsedTypes, setCollapsedTypes] = useState<Set<number>>(new Set())

  const toggleCollapse = (id: number) => {
    setCollapsedTypes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getProgramsFor = (eduTypeId: number) => programs.filter(p => p.education_type_id === eduTypeId)

  const handleDelete = async () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'et') {
      await deleteEduType.mutateAsync(confirmDelete.id)
    } else {
      await deleteProgram.mutateAsync(confirmDelete.id)
    }
    setConfirmDelete(null)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  )

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* 1. Single-Line Header Bar matching Users & Roles Pages */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <GraduationCap size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Education Types &amp; Programs
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Manage academic taxonomy and education programs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setEtModal({ open: true })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">New Education Type</span>
            <span className="inline sm:hidden">New Type</span>
          </Button>
        </div>
      </div>

      {/* 2. Education Types List */}
      {educationTypes.length === 0 ? (
        <Card className="py-16 text-slate-500 dark:text-slate-400 text-center border border-dashed border-[rgb(var(--border))]">
          <BookOpen size={40} className="mx-auto text-[rgb(var(--text-muted))] mb-3 opacity-50" />
          <p className="text-sm font-semibold text-[rgb(var(--text-secondary))]">No education types yet</p>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Create your first education type to get started</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {educationTypes.map(et => {
            const typePrograms = getProgramsFor(et.id)
            const isCollapsed = collapsedTypes.has(et.id)
            const CategoryIcon = getCategoryIcon(et.name)

            return (
              <Card key={et.id} className="border border-[rgb(var(--border))] overflow-hidden p-5 space-y-4">
                {/* Category Header Bar */}
                <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-[rgb(var(--border))]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <CategoryIcon size={18} className="sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-extrabold text-sm sm:text-base text-[rgb(var(--text-primary))] font-[Outfit] truncate">
                          {et.name}
                        </h2>
                        <Badge variant="success" className="text-[9px] uppercase font-mono bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 shrink-0">
                          ACTIVE
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] font-medium shrink-0">
                          {typePrograms.length} programs
                        </span>
                      </div>
                      {et.description && (
                        <p className="text-[11px] sm:text-xs text-[rgb(var(--text-muted))] mt-0.5 line-clamp-1">{et.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Add Program"
                      onClick={() => setProgModal({ open: true, eduTypeId: et.id })}
                      className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      type="button"
                      title="Edit Category"
                      onClick={() => setEtModal({ open: true, item: et })}
                      className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      title="Toggle Expand/Collapse"
                      onClick={() => toggleCollapse(et.id)}
                      className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-all cursor-pointer"
                    >
                      {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                    </button>
                  </div>
                </div>

                {/* Programs Grid (2 Columns per Category) */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {typePrograms.length === 0 ? (
                        <div className="p-4 text-slate-500 dark:text-slate-400 text-center text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-surface))] rounded-xl border border-[rgb(var(--border))]">
                          No programs yet in this category.{' '}
                          <button
                            type="button"
                            onClick={() => setProgModal({ open: true, eduTypeId: et.id })}
                            className="text-indigo-400 font-bold hover:underline"
                          >
                            + Add first program
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {typePrograms.map(prog => {
                            const sessionObj = sessions.find(s => s.id === prog.academic_session_id)
                            const sessionLabel = sessionObj ? sessionObj.name : 'Session 24-25'

                            return (
                              <div
                                key={prog.id}
                                className="p-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-all group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <GripVertical size={14} className="text-[rgb(var(--text-muted))] cursor-grab flex-shrink-0 opacity-40 group-hover:opacity-100" />
                                  <span className="font-bold text-xs text-[rgb(var(--text-primary))] truncate font-[Outfit]">
                                    {prog.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] px-2 py-0.5 rounded-md border border-[rgb(var(--border))] flex-shrink-0">
                                    {sessionLabel}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setProgModal({ open: true, item: prog })}
                                    className="p-1 rounded-md text-[rgb(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                                    title="Edit Program"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDelete({ open: true, type: 'prog', id: prog.id, name: prog.name })}
                                    className="p-1 rounded-md text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                    title="Delete Program"
                                  >
                                    <Settings size={13} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Add Program Link */}
                      <button
                        type="button"
                        onClick={() => setProgModal({ open: true, eduTypeId: et.id })}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all cursor-pointer pt-1"
                      >
                        <Plus size={14} /> Add Program
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })}
        </div>
      )}

      {/* 3. Footer Drag Info Note */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-[rgb(var(--text-muted))] pt-2">
        <Info size={14} className="text-indigo-400" /> Drag and drop programs to reorder them within a category.
      </div>

      {/* Modals */}
      <EducationTypeModal
        open={etModal.open}
        onClose={() => setEtModal({ open: false })}
        initial={etModal.item}
      />
      <ProgramModal
        open={progModal.open}
        onClose={() => setProgModal({ open: false })}
        initial={progModal.item}
        educationTypeId={progModal.eduTypeId}
      />
      {confirmDelete && (
        <ConfirmModal
          open={confirmDelete.open}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title={`Delete ${confirmDelete.type === 'et' ? 'Education Type' : 'Program'}`}
          message={`Delete "${confirmDelete.name}"?`}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </div>
  )
}
