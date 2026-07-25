import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExam, useExamQuestions, useAddQuestion, useRemoveQuestion } from '@/api/resources/exams'
import { Button, Card, Badge, Spinner, Input, Select, Modal } from '@/components/ui'
import { ArrowLeft, Trash2, Plus, GripVertical, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

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

  if (isExamLoading || isQuestionsLoading) return <div className="flex justify-center p-12"><Spinner /></div>

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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/exams')}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold font-[Outfit] text-[rgb(var(--text-primary))]">Manage Questions</h2>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            {exam?.title} · {questions?.length || 0} questions · {totalMarks} / {exam?.total_marks} marks assigned
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={15} />} onClick={() => setIsAdding(true)}>
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      <div className="flex flex-col gap-3">
        {(questions || []).map((q: any, idx: number) => (
          <Card key={q.id} className="p-4 flex gap-4 hover:shadow-sm transition-all group">
            <div className="pt-1 cursor-grab text-[rgb(var(--text-muted))] opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical size={18} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start gap-3">
                <div className="font-semibold text-[rgb(var(--text-primary))] flex-1">
                  <span className="text-[rgb(var(--primary))] font-bold mr-2">Q{idx + 1}.</span>
                  {q.question}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="muted" className="text-[10px] uppercase">{q.type}</Badge>
                  <Badge variant="warning" className="text-[10px]">{q.marks} mk</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[rgb(var(--error))] hover:bg-[rgb(var(--error)/0.08)]"
                    onClick={() => removeMutation.mutate(q.id)}
                    loading={removeMutation.isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {q.type === 'mcq' && q.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {q.options.map((opt: string, i: number) => {
                    const isCorrect = q.correct_answer === opt
                    return (
                      <div key={i} className={`p-2.5 rounded-lg text-sm border flex items-center gap-2 ${
                        isCorrect
                          ? 'bg-[rgb(var(--success)/0.08)] border-[rgb(var(--success)/0.3)] text-[rgb(var(--success))] font-semibold'
                          : 'bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]'
                      }`}>
                        {isCorrect && <CheckCircle2 size={13} className="flex-shrink-0" />}
                        <span>{String.fromCharCode(65 + i)}. {opt}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        ))}

        {/* Empty State */}
        {(questions || []).length === 0 && (
          <div className="py-16 flex flex-col items-center gap-4 border-2 border-dashed border-[rgb(var(--border))] rounded-xl text-[rgb(var(--text-muted))]">
            <p className="text-sm font-medium">No questions yet. Click "Add Question" to add your first question.</p>
            <Button variant="primary" size="sm" leftIcon={<Plus size={15} />} onClick={() => setIsAdding(true)}>
              Add Question
            </Button>
          </div>
        )}

        {/* Add Question Button */}
        {(questions || []).length > 0 && (
          <Button
            variant="outline"
            className="w-full border-dashed border-2 py-5 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--primary))] hover:border-[rgb(var(--primary))] transition-all"
            onClick={() => setIsAdding(true)}
            leftIcon={<Plus size={18} />}
          >
            Add Another Question
          </Button>
        )}

        {/* Add Question Popup Modal */}
        <Modal
          open={isAdding}
          onClose={() => setIsAdding(false)}
          title={`Add Question #${(questions?.length || 0) + 1}`}
          size="lg"
        >
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-3">
                <Input
                  label="Question Text"
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  placeholder="Enter the question..."
                />
              </div>
              <Input
                label="Marks"
                type="number"
                min={1}
                value={qMarks}
                onChange={e => setQMarks(Number(e.target.value))}
              />
            </div>

            <Select label="Question Type" value={qType} onChange={e => setQType(e.target.value)}>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="subjective">Subjective (Long Answer)</option>
            </Select>

            {qType === 'mcq' && (
              <div className="space-y-3 bg-[rgb(var(--bg-elevated))] p-4 rounded-xl border border-[rgb(var(--border))]">
                <label className="text-sm font-bold text-[rgb(var(--text-primary))]">Options & Correct Answer</label>
                <p className="text-xs text-[rgb(var(--text-muted))]">Select the radio button next to the correct answer.</p>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input
                      type="radio"
                      name="correctAnswer"
                      className="accent-[rgb(var(--primary))] w-4 h-4 flex-shrink-0"
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[rgb(var(--error))] hover:bg-[rgb(var(--error)/0.08)] h-8 w-8"
                        onClick={() => handleRemoveOption(idx)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddOption} className="mt-1 text-xs" leftIcon={<Plus size={13} />}>
                  Add Option
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[rgb(var(--border))]">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveQuestion} loading={addMutation.isPending}>
                Save Question
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
