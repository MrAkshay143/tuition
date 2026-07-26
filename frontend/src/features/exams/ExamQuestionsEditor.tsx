import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExam, useExamQuestions, useAddQuestion, useRemoveQuestion, useAttachQuestion, useUpdateQuestion } from '@/api/resources/exams'
import { useApiQuery } from '@/api/resources/hooks'
import { Button, Card, Badge, Spinner, Input, Select, Modal } from '@/components/ui'
import { ArrowLeft, Trash2, Plus, CheckSquare, Square, CheckCircle2, HelpCircle, Award, Eye, EyeOff, Library, Search, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export const ExamQuestionsEditor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: exam, isLoading: isExamLoading } = useExam(id || '')
  const { data: questions, isLoading: isQuestionsLoading } = useExamQuestions(id || '')
  
  const addMutation = useAddQuestion(id || '')
  const attachMutation = useAttachQuestion(id || '')
  const removeMutation = useRemoveQuestion(id || '')
  const updateMutation = useUpdateQuestion(id || '')

  const [isAdding, setIsAdding] = useState(false)
  const [addMode, setAddMode] = useState<'create' | 'bank'>('create')
  
  // Create Question State
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState('mcq')
  const [qMarks, setQMarks] = useState(1)
  const [options, setOptions] = useState([{ text: '' }, { text: '' }])
  const [correctAnswer, setCorrectAnswer] = useState('')

  // Bank Question State
  const [bankSearch, setBankSearch] = useState('')
  const [selectedBankIds, setSelectedBankIds] = useState<number[]>([])
  
  // UI State
  const [expandedQs, setExpandedQs] = useState<Record<string, boolean>>({})
  const [editingMarksId, setEditingMarksId] = useState<number | null>(null)
  const [editingMarksValue, setEditingMarksValue] = useState<number>(0)

  const { data: bankQuestions = [], isLoading: isBankLoading } = useApiQuery(
    ['admin', 'question-bank'],
    '/questions?per_page=100',
    undefined,
    {
      enabled: isAdding && addMode === 'bank',
      select: (list: any) => {
        if (Array.isArray(list) && list.length > 0) {
          return list.map((q: any) => ({
            id: q.id,
            question_text: q.content || q.question_text || q.question || '',
            type: q.type || 'mcq',
            difficulty: (q.difficulty?.name || q.difficulty || 'medium').toLowerCase(),
            subject: q.topic?.subject?.name || q.subject || 'General',
            marks: q.default_marks || q.marks || 4
          }))
        }
        return []
      }
    }
  )

  const filteredBankQuestions = useMemo(() => {
    return bankQuestions.filter((q: any) => 
      q.question_text.toLowerCase().includes(bankSearch.toLowerCase()) ||
      q.subject.toLowerCase().includes(bankSearch.toLowerCase())
    )
  }, [bankQuestions, bankSearch])

  if (isExamLoading || isQuestionsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Spinner size={36} />
      <span className="text-xs text-[rgb(var(--text-muted))] font-semibold">Loading Exam Questions...</span>
    </div>
  )

  const handleAddOption = () => setOptions([...options, { text: '' }])
  const handleRemoveOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx))

  const handleSaveQuestion = () => {
    if (!qText.trim()) return toast.error('Question text is required')
    if (qType === 'mcq') {
      const validOptions = options.filter(o => o.text.trim())
      if (validOptions.length < 2) return toast.error('MCQ requires at least 2 options')
      if (!correctAnswer) return toast.error('Select a correct answer for MCQ')
    }

    addMutation.mutate({
      question: qText,
      type: qType,
      marks: Number(qMarks),
      options: qType === 'mcq' ? options.map(o => o.text) : undefined,
      correct_answer: qType === 'mcq' ? correctAnswer : undefined,
      sort_order: (questions?.length || 0) + 1
    }, {
      onSuccess: () => {
        setIsAdding(false)
        setQText('')
        setQType('mcq')
        setQMarks(1)
        setOptions([{ text: '' }, { text: '' }])
        setCorrectAnswer('')
      }
    })
  }

  const handleToggleBankSelection = (id: number) => {
    setSelectedBankIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleAttachBulk = () => {
    if (selectedBankIds.length === 0) return
    attachMutation.mutate({
      question_ids: selectedBankIds,
      marks: 4, // Default marks for bulk attach
      sort_order: (questions?.length || 0) + 1
    }, {
      onSuccess: () => {
        setIsAdding(false)
        setSelectedBankIds([])
      }
    })
  }

  const handleSaveMarks = (qId: number) => {
    if (editingMarksId === qId) {
      updateMutation.mutate({ qId, data: { marks: editingMarksValue } })
      setEditingMarksId(null)
    }
  }

  const toggleOptions = (qId: string) => {
    setExpandedQs(prev => ({ ...prev, [qId]: !prev[qId] }))
  }

  const totalMarks = (questions || []).reduce((acc: number, q: any) => acc + (q.marks || 0), 0)
  const maxMarks = exam?.total_marks || 100
  const marksPercentage = Math.min(Math.round((totalMarks / maxMarks) * 100), 100)

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Short Header Bar */}
      <div className="p-2 sm:p-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl shadow-xs">
        <div className="flex flex-row items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 rounded-xl bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-all cursor-pointer border border-[rgb(var(--border))] shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h1 className="text-xs sm:text-base font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] truncate">
                  {exam?.title || 'Exam Questions'}
                </h1>
                <Badge variant="primary" className="text-[9px] uppercase font-mono tracking-wider shrink-0 hidden sm:inline-flex">
                  {exam?.type || 'MCQ'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 text-[9px] sm:text-[10px] text-[rgb(var(--text-muted))] font-bold mt-0.5 truncate">
                <span className="flex items-center gap-1 shrink-0"><HelpCircle size={10} className="sm:w-3 sm:h-3"/> {questions?.length || 0} Qs</span>
                <span className="flex items-center gap-1 shrink-0"><Award size={10} className="sm:w-3 sm:h-3"/> {totalMarks}/{maxMarks}</span>
                <span className="text-indigo-400 shrink-0">{marksPercentage}%</span>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => { setAddMode('create'); setIsAdding(true); }}
            className="font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 cursor-pointer shadow-md shadow-indigo-600/20 shrink-0"
          >
            <Plus size={15} /> <span className="hidden sm:inline ml-1">Add Question</span>
          </Button>
        </div>
      </div>

      {/* Questions List Container */}
      <div className="space-y-3">
        <AnimatePresence>
          {(questions || []).map((q: any, idx: number) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="p-3 sm:p-4 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] hover:border-indigo-500/40 transition-all space-y-3 rounded-2xl group relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-black text-xs font-mono shrink-0 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-[rgb(var(--text-primary))] font-[Outfit] leading-relaxed">
                      {q.question}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-extrabold uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 hidden sm:inline-block">
                      {q.type}
                    </span>
                    
                    {/* Editable Marks */}
                    {editingMarksId === q.id ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          min={1} 
                          value={editingMarksValue} 
                          onChange={(e) => setEditingMarksValue(Number(e.target.value))}
                          onBlur={() => handleSaveMarks(q.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveMarks(q.id)}
                          className="w-12 px-1 py-0.5 text-[10px] font-bold text-center bg-[rgb(var(--bg-elevated))] border border-indigo-500 rounded outline-none"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setEditingMarksId(q.id); setEditingMarksValue(q.marks || 1); }}
                        className="text-[9px] font-extrabold uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                        title="Edit Marks"
                      >
                        {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                        <Pencil size={8} />
                      </button>
                    )}

                    <button
                      onClick={() => removeMutation.mutate(q.id)}
                      disabled={removeMutation.isPending}
                      className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer ml-1"
                      title="Delete Question"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Collapsible Options */}
                {q.type === 'mcq' && q.options && (
                  <div className="pt-1">
                    {!expandedQs[q.id] ? (
                      <button 
                        onClick={() => toggleOptions(q.id)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-all bg-indigo-500/5 hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10"
                      >
                        <Eye size={12} /> View {q.options.length} Options
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <button 
                          onClick={() => toggleOptions(q.id)}
                          className="text-[10px] font-bold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <EyeOff size={12} /> Hide Options
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt: string, i: number) => {
                            const isCorrect = q.correct_answer === opt
                            return (
                              <div
                                key={i}
                                className={`p-2 sm:p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                                    : 'bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
                                }`}
                              >
                                <span className="truncate pr-2">
                                  <strong className="mr-1.5 font-mono">{String.fromCharCode(65 + i)}.</strong> {opt}
                                </span>
                                {isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                                    <CheckCircle2 size={10} /> Correct
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {(questions || []).length === 0 && (
          <Card className="p-8 sm:p-12 text-center border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <HelpCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">No Questions Added Yet</h3>
              <p className="text-xs text-[rgb(var(--text-muted))] max-w-sm mx-auto">
                Start building this exam by adding MCQ or Subjective questions with marks allocation.
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => { setAddMode('create'); setIsAdding(true); }}
                className="font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Plus size={15} /> Add First Question
              </Button>
            </div>
          </Card>
        )}

        {/* Add Question CTA Footer */}
        {(questions || []).length > 0 && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setAddMode('create'); setIsAdding(true); }}
              className="w-full border-2 border-dashed border-[rgb(var(--border))] hover:border-indigo-500 text-[rgb(var(--text-muted))] hover:text-indigo-400 font-bold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer bg-[rgb(var(--bg-surface))]"
            >
              <Plus size={15} /> Add Another Question
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Add/Pick Question Modal - Compact for Mobile */}
      <Modal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title={addMode === 'create' ? `Create Question #${(questions?.length || 0) + 1}` : 'Question Bank'}
        size="lg"
        className="!p-3 sm:!p-5"
      >
        <div className="space-y-3 sm:space-y-4">
          
          {/* Mode Switcher */}
          <div className="flex p-1 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-lg">
            <button 
              onClick={() => setAddMode('create')}
              className={`flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${addMode === 'create' ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] shadow-sm border border-[rgb(var(--border))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'}`}
            >
              <Plus size={12} /> Create New
            </button>
            <button 
              onClick={() => setAddMode('bank')}
              className={`flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${addMode === 'bank' ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] shadow-sm border border-[rgb(var(--border))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'}`}
            >
              <Library size={12} /> Bank
            </button>
          </div>

          {addMode === 'create' ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="sm:col-span-3">
                  <Input
                    label="Question Statement"
                    value={qText}
                    onChange={e => setQText(e.target.value)}
                    placeholder="Type question prompt..."
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                  <div>
                    <Input
                      label="Marks"
                      type="number"
                      min={1}
                      value={qMarks}
                      onChange={e => setQMarks(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Type</label>
                    <select
                      value={qType}
                      onChange={e => setQType(e.target.value)}
                      className="w-full px-2 py-1.5 sm:py-2 text-xs font-bold rounded-lg sm:rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none cursor-pointer"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="subjective">Subjective</option>
                    </select>
                  </div>
                </div>
              </div>

              {qType === 'mcq' && (
                <div className="space-y-2.5 p-2 sm:p-3 bg-[rgb(var(--bg-elevated))] rounded-lg sm:rounded-xl border border-[rgb(var(--border))]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-bold text-[rgb(var(--text-primary))]">Options (Select answer)</span>
                  </div>

                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer shrink-0"
                          checked={correctAnswer === opt.text && opt.text !== ''}
                          onChange={() => setCorrectAnswer(opt.text)}
                        />
                        <Input
                          className="flex-1 text-[11px] sm:text-xs !py-1 sm:!py-1.5"
                          placeholder={`Opt ${String.fromCharCode(65 + idx)}`}
                          value={opt.text}
                          onChange={e => {
                            const newOpts = [...options]
                            newOpts[idx].text = e.target.value
                            setOptions(newOpts)
                            if (correctAnswer === opt.text) setCorrectAnswer(e.target.value)
                          }}
                        />
                        {options.length > 2 && (
                          <button
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1 sm:p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="text-[10px] font-bold rounded-lg py-1 px-2"
                    leftIcon={<Plus size={10} />}
                  >
                    Add Option
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgb(var(--border))]">
                <Button variant="outline" size="sm" onClick={() => setIsAdding(false)} className="rounded-lg font-bold text-[10px] sm:text-xs px-3">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveQuestion}
                  loading={addMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold px-3 sm:px-4 text-[10px] sm:text-xs"
                >
                  Save Question
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                <input
                  type="text"
                  placeholder="Search bank..."
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              {isBankLoading ? (
                <div className="flex justify-center p-6"><Spinner size={20} /></div>
              ) : filteredBankQuestions.length === 0 ? (
                <div className="text-center p-6 text-[10px] text-[rgb(var(--text-muted))]">No questions found.</div>
              ) : (
                <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                  {filteredBankQuestions.map((bq: any) => {
                    const isAlreadyAttached = questions?.some((q: any) => q.id === bq.id)
                    const isSelected = selectedBankIds.includes(bq.id)
                    return (
                      <div 
                        key={bq.id} 
                        onClick={() => !isAlreadyAttached && handleToggleBankSelection(bq.id)}
                        className={cn(
                          "p-2 bg-[rgb(var(--bg-elevated))] border rounded-lg transition-all cursor-pointer",
                          isAlreadyAttached ? "opacity-50 border-[rgb(var(--border))] cursor-not-allowed" : 
                          isSelected ? "border-indigo-500 bg-indigo-500/5" : "border-[rgb(var(--border))] hover:border-indigo-500/30"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <button className="mt-0.5 shrink-0 text-[rgb(var(--text-muted))] pointer-events-none">
                            {isAlreadyAttached ? <CheckSquare size={14} className="text-emerald-400" /> :
                             isSelected ? <CheckSquare size={14} className="text-indigo-500" /> : 
                             <Square size={14} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                              <span className="text-[8px] font-bold uppercase font-mono text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">{bq.subject}</span>
                              <span className="text-[8px] font-bold uppercase font-mono text-purple-400 bg-purple-500/10 px-1 py-0.5 rounded">+{bq.marks}</span>
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-[rgb(var(--text-primary))] leading-tight line-clamp-2">
                              {bq.question_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Bulk Attach Footer */}
              {addMode === 'bank' && !isBankLoading && (
                <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))]">
                  <span className="text-[10px] font-bold text-[rgb(var(--text-muted))]">
                    {selectedBankIds.length} selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsAdding(false)} className="rounded-lg font-bold text-[10px] px-2 py-1">
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      disabled={selectedBankIds.length === 0 || attachMutation.isPending}
                      onClick={handleAttachBulk}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] px-3 py-1 shadow-md shadow-indigo-600/20"
                    >
                      Attach {selectedBankIds.length} Questions
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}


