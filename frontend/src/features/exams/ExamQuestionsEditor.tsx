import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExam, useExamQuestions, useAddQuestion, useRemoveQuestion } from '@/api/resources/exams'
import { Button, Card, Badge, Spinner, Input, Select, Modal } from '@/components/ui'
import { ArrowLeft, Trash2, Plus, GripVertical, CheckCircle2, HelpCircle, Award, Sparkles, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export const ExamQuestionsEditor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: exam, isLoading: isExamLoading } = useExam(id || '')
  const { data: questions, isLoading: isQuestionsLoading } = useExamQuestions(id || '')
  const addMutation = useAddQuestion(id || '')
  const removeMutation = useRemoveQuestion(id || '')

  const [isAdding, setIsAdding] = useState(false)
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState('mcq')
  const [qMarks, setQMarks] = useState(1)
  const [options, setOptions] = useState([{ text: '' }, { text: '' }])
  const [correctAnswer, setCorrectAnswer] = useState('')

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

  const totalMarks = (questions || []).reduce((acc: number, q: any) => acc + (q.marks || 0), 0)
  const maxMarks = exam?.total_marks || 100
  const marksPercentage = Math.min(Math.round((totalMarks / maxMarks) * 100), 100)

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Header Bar */}
      <div className="p-3 sm:p-5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-[rgb(var(--bg-elevated))] hover:bg-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-all cursor-pointer border border-[rgb(var(--border))]"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] truncate">
                  {exam?.title || 'Exam Questions'}
                </h1>
                <Badge variant="primary" className="text-[9px] uppercase font-mono tracking-wider shrink-0">
                  {exam?.type || 'MCQ'}
                </Badge>
              </div>
              <p className="text-xs text-[rgb(var(--text-muted))] font-medium truncate">
                Questions Manager
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 cursor-pointer shadow-md shadow-indigo-600/20 shrink-0"
          >
            <Plus size={15} /> Add Question
          </Button>
        </div>

        {/* Stats Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[rgb(var(--border))]">
          <div className="p-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <HelpCircle size={15} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-[rgb(var(--text-muted))] uppercase block leading-none">Total Questions</span>
              <span className="text-xs sm:text-sm font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{questions?.length || 0}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award size={15} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-[rgb(var(--text-muted))] uppercase block leading-none">Marks Assigned</span>
              <span className="text-xs sm:text-sm font-extrabold text-[rgb(var(--text-primary))] font-[Outfit]">{totalMarks} / {maxMarks}</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] flex flex-col justify-center gap-1.5">
            <div className="flex justify-between items-center text-[9px] font-bold">
              <span className="text-[rgb(var(--text-muted))] uppercase">Marks Allocated</span>
              <span className="text-indigo-400">{marksPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-[rgb(var(--border))] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300" style={{ width: `${marksPercentage}%` }} />
            </div>
          </div>
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
                    <span className="text-[9px] font-extrabold uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {q.type}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
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

                {/* MCQ Options Display */}
                {q.type === 'mcq' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 cursor-pointer shadow-md shadow-indigo-600/20 mt-2"
            >
              <Plus size={15} /> Add First Question
            </Button>
          </Card>
        )}

        {/* Add Question CTA Footer */}
        {(questions || []).length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full border-2 border-dashed border-[rgb(var(--border))] hover:border-indigo-500 text-[rgb(var(--text-muted))] hover:text-indigo-400 font-bold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer bg-[rgb(var(--bg-surface))] mt-3"
          >
            <Plus size={15} /> Add Another Question
          </button>
        )}
      </div>

      {/* Add Question Modal */}
      <Modal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title={`Add Question #${(questions?.length || 0) + 1}`}
        size="lg"
      >
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <Input
                label="Question Statement"
                value={qText}
                onChange={e => setQText(e.target.value)}
                placeholder="Type question prompt here..."
              />
            </div>
            <div>
              <Input
                label="Marks"
                type="number"
                min={1}
                value={qMarks}
                onChange={e => setQMarks(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase block mb-1">Question Type</label>
            <select
              value={qType}
              onChange={e => setQType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none cursor-pointer"
            >
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="subjective">Subjective (Long Answer)</option>
            </select>
          </div>

          {qType === 'mcq' && (
            <div className="space-y-3 p-3.5 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[rgb(var(--text-primary))]">Options & Correct Answer</span>
                <span className="text-[10px] text-[rgb(var(--text-muted))]">Select radio to set answer</span>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      className="w-4 h-4 accent-indigo-500 cursor-pointer shrink-0"
                      checked={correctAnswer === opt.text && opt.text !== ''}
                      onChange={() => setCorrectAnswer(opt.text)}
                    />
                    <Input
                      className="flex-1"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
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
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        title="Remove Option"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="text-xs font-bold rounded-xl"
                leftIcon={<Plus size={13} />}
              >
                Add Option
              </Button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgb(var(--border))]">
            <Button variant="outline" size="sm" onClick={() => setIsAdding(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveQuestion}
              loading={addMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-4"
            >
              Save Question
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

