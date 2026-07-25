import React, { useState, useMemo } from 'react'
import { useApiQuery } from '@/api/resources/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Filter, HelpCircle, CheckCircle2, XCircle, Sparkles, 
  BookOpen, Trash2, Pencil, Copy, Tag, Layers, ChevronDown, LayoutGrid, 
  List, Check, AlertCircle, FileText, ArrowUpDown, SlidersHorizontal
} from 'lucide-react'
import { Button, Card, Badge, Spinner, Input } from '@/components/ui'
import { Modal, ConfirmModal } from '@/components/ui/overlays'
import { api } from '@/api/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface QuestionItem {
  id: number
  question_text: string
  type: 'mcq' | 'multi_select' | 'subjective' | 'numerical'
  difficulty: 'easy' | 'medium' | 'hard'
  subject: string
  topic: string
  marks: number
  options?: Array<{ key: string; text: string; is_correct: boolean }>
  explanation?: string
  created_at?: string
}

const SAMPLE_QUESTIONS: QuestionItem[] = [
  {
    id: 101,
    question_text: 'A particle moves in a circle of radius R with constant speed v. What is the magnitude of its average acceleration during a quarter revolution?',
    type: 'mcq',
    difficulty: 'medium',
    subject: 'Physics',
    topic: 'Kinematics & Circular Motion',
    marks: 4,
    options: [
      { key: 'A', text: 'v² / R', is_correct: false },
      { key: 'B', text: '(2√2 v²) / (π R)', is_correct: true },
      { key: 'C', text: '(√2 v²) / R', is_correct: false },
      { key: 'D', text: '(2 v²) / (π R)', is_correct: false }
    ],
    explanation: 'Average acceleration = Δv / Δt. In a quarter circle, Δv = √2 v and Δt = (π R) / (2 v).'
  },
  {
    id: 102,
    question_text: 'Which of the following compounds exhibits optical isomerism and has a chiral center?',
    type: 'mcq',
    difficulty: 'easy',
    subject: 'Chemistry',
    topic: 'Stereochemistry & Organic Chemistry',
    marks: 4,
    options: [
      { key: 'A', text: '2-Chlorobutane', is_correct: true },
      { key: 'B', text: '1-Chlorobutane', is_correct: false },
      { key: 'C', text: 'Propane-1,3-diol', is_correct: false },
      { key: 'D', text: '2-Methylpropane', is_correct: false }
    ],
    explanation: '2-Chlorobutane has a C atom bonded to four different groups (-H, -Cl, -CH3, -CH2CH3).'
  },
  {
    id: 103,
    question_text: 'Evaluate the definite integral: ∫ (from 0 to π/2) [ sin(x) / (sin(x) + cos(x)) ] dx.',
    type: 'numerical',
    difficulty: 'hard',
    subject: 'Mathematics',
    topic: 'Definite Integrals & Calculus',
    marks: 4,
    explanation: 'Using King property ∫f(x)dx = ∫f(a+b-x)dx, 2I = ∫1 dx = π/2 => I = π/4 (~0.785).'
  },
  {
    id: 104,
    question_text: 'Explain the mechanism of ATP synthesis during oxidative phosphorylation in mitochondria.',
    type: 'subjective',
    difficulty: 'medium',
    subject: 'Biology',
    topic: 'Cellular Respiration & Bioenergetics',
    marks: 5,
    explanation: 'Proton gradient created across inner mitochondrial membrane drives ATP Synthase F0F1 complex.'
  },
  {
    id: 105,
    question_text: 'What is the time complexity of building a heap from an unsorted array of n elements?',
    type: 'mcq',
    difficulty: 'easy',
    subject: 'Computer Science',
    topic: 'Data Structures & Algorithms',
    marks: 4,
    options: [
      { key: 'A', text: 'O(n log n)', is_correct: false },
      { key: 'B', text: 'O(n)', is_correct: true },
      { key: 'C', text: 'O(n²)', is_correct: false },
      { key: 'D', text: 'O(log n)', is_correct: false }
    ],
    explanation: 'BuildMaxHeap takes O(n) time using bottom-up heapify.'
  }
]

export default function QuestionBankPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [customQuestions, setCustomQuestions] = useState<QuestionItem[]>([])

  // Question Form State
  const emptyQuestion = {
    question_text: '',
    subject: 'Physics',
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    type: 'mcq' as 'mcq' | 'multi_select' | 'subjective' | 'numerical',
    marks: 4,
    explanation: '',
    optA: '', optB: '', optC: '', optD: '', correctKey: 'A'
  }
  const [form, setForm] = useState(emptyQuestion)

  // Fetch Questions Query from Backend DB
  const { data: remoteQuestions = [], isLoading } = useApiQuery(
    ['admin', 'question-bank'],
    '/questions?per_page=100',
    undefined,
    {
      select: (list: any) => {
        if (Array.isArray(list) && list.length > 0) {
          return list.map((q: any) => {
            let rawOpts = Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : [])
            
            // Normalize options so MCQ options are NEVER blank
            let formattedOptions: Array<{ key: string; text: string; is_correct: boolean }> = []
            if (Array.isArray(rawOpts) && rawOpts.length > 0) {
              formattedOptions = rawOpts.map((opt: any, i: number) => {
                const key = String.fromCharCode(65 + i) // A, B, C, D
                if (typeof opt === 'string') {
                  return { key, text: opt, is_correct: q.correct_answer === opt || q.correct_option === key }
                }
                if (opt && typeof opt === 'object') {
                  return {
                    key: opt.key || key,
                    text: opt.text || opt.label || opt.option || String(opt),
                    is_correct: !!opt.is_correct || q.correct_answer === opt.text || q.correct_option === (opt.key || key)
                  }
                }
                return { key, text: String(opt), is_correct: false }
              })
            } else if (q.option_a || q.option_b) {
              formattedOptions = [
                { key: 'A', text: q.option_a || '', is_correct: q.correct_option === 'A' || q.correct_answer === q.option_a },
                { key: 'B', text: q.option_b || '', is_correct: q.correct_option === 'B' || q.correct_answer === q.option_b },
                { key: 'C', text: q.option_c || '', is_correct: q.correct_option === 'C' || q.correct_answer === q.option_c },
                { key: 'D', text: q.option_d || '', is_correct: q.correct_option === 'D' || q.correct_answer === q.option_d },
              ].filter(o => o.text !== '')
            }

            return {
              id: q.id,
              question_text: q.content || q.question_text || q.question || '',
              type: (q.type || 'mcq') as any,
              difficulty: ((q.difficulty?.name || q.difficulty || 'medium').toLowerCase()) as any,
              subject: q.topic?.subject?.name || q.subject || 'Physics',
              topic: q.topic?.name || q.topic || 'General Science',
              marks: q.default_marks || q.marks || 4,
              options: formattedOptions,
              explanation: q.solution_explanation || q.explanation || ''
            }
          })
        }
        return []
      }
    }
  )

  const initialList = useMemo(() => remoteQuestions.length > 0 ? remoteQuestions : SAMPLE_QUESTIONS, [remoteQuestions])
  
  const questionList = useMemo(() => {
    const combined = [...customQuestions, ...initialList]
    // deduplicate by id
    const map = new Map<number, QuestionItem>()
    combined.forEach(q => map.set(q.id, q))
    return Array.from(map.values())
  }, [customQuestions, initialList])

  const filtered = useMemo(() => {
    return questionList.filter((q) => {
      const matchSearch = q.question_text.toLowerCase().includes(search.toLowerCase()) ||
                          q.topic.toLowerCase().includes(search.toLowerCase())
      const matchSubject = subjectFilter === 'all' || q.subject.toLowerCase() === subjectFilter.toLowerCase()
      const matchDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter
      const matchType = typeFilter === 'all' || q.type === typeFilter
      return matchSearch && matchSubject && matchDiff && matchType
    })
  }, [questionList, search, subjectFilter, difficultyFilter, typeFilter])

  // Counts
  const easyCount = useMemo(() => questionList.filter(q => q.difficulty === 'easy').length, [questionList])
  const mediumCount = useMemo(() => questionList.filter(q => q.difficulty === 'medium').length, [questionList])
  const hardCount = useMemo(() => questionList.filter(q => q.difficulty === 'hard').length, [questionList])

  const handleOpenCreate = () => {
    setEditingQuestion(null)
    setForm(emptyQuestion)
    setCreateModalOpen(true)
  }

  const handleOpenEdit = (item: QuestionItem) => {
    setEditingQuestion(item)
    const opts = item.options || []
    setForm({
      question_text: item.question_text,
      subject: item.subject,
      topic: item.topic,
      difficulty: item.difficulty,
      type: item.type,
      marks: item.marks,
      explanation: item.explanation || '',
      optA: opts.find(o => o.key === 'A')?.text || '',
      optB: opts.find(o => o.key === 'B')?.text || '',
      optC: opts.find(o => o.key === 'C')?.text || '',
      optD: opts.find(o => o.key === 'D')?.text || '',
      correctKey: opts.find(o => o.is_correct)?.key || 'A'
    })
    setCreateModalOpen(true)
  }

  const handleSave = () => {
    if (!form.question_text.trim()) {
      toast.error('Please enter a question statement')
      return
    }

    const compiledOptions = form.type === 'mcq' ? [
      { key: 'A', text: form.optA || 'Option A', is_correct: form.correctKey === 'A' },
      { key: 'B', text: form.optB || 'Option B', is_correct: form.correctKey === 'B' },
      { key: 'C', text: form.optC || 'Option C', is_correct: form.correctKey === 'C' },
      { key: 'D', text: form.optD || 'Option D', is_correct: form.correctKey === 'D' },
    ] : []

    if (editingQuestion) {
      const updatedItem: QuestionItem = {
        ...editingQuestion,
        question_text: form.question_text,
        subject: form.subject,
        topic: form.topic || 'General',
        difficulty: form.difficulty,
        type: form.type,
        marks: Number(form.marks) || 4,
        explanation: form.explanation,
        options: compiledOptions
      }
      setCustomQuestions(prev => [updatedItem, ...prev.filter(q => q.id !== updatedItem.id)])
      toast.success(`Question #${editingQuestion.id} updated successfully!`)
    } else {
      const newItem: QuestionItem = {
        id: Date.now(),
        question_text: form.question_text,
        subject: form.subject,
        topic: form.topic || 'General',
        difficulty: form.difficulty,
        type: form.type,
        marks: Number(form.marks) || 4,
        explanation: form.explanation,
        options: compiledOptions
      }
      setCustomQuestions(prev => [newItem, ...prev])
      toast.success('New question added to Question Bank!')
    }

    setCreateModalOpen(false)
    setEditingQuestion(null)
    setForm(emptyQuestion)
  }

  const getDifficultyBadge = (diff: string) => {
    if (diff === 'easy') return <Badge variant="success" className="bg-emerald-500/10 text-slate-500 dark:text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-mono">EASY</Badge>
    if (diff === 'medium') return <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase font-mono">MEDIUM</Badge>
    return <Badge variant="error" className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] uppercase font-mono">HARD</Badge>
  }

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto pb-12">
      {/* 1. Single-Line Header Bar matching Users & Roles Pages */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0 bg-[rgb(var(--bg-surface))] p-3.5 sm:p-4 rounded-2xl border border-[rgb(var(--border))] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs flex-shrink-0">
            <HelpCircle size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] tracking-tight truncate">
              Question Bank Repository
            </h1>
            <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate hidden sm:block">
              Centralized question item database for exams, quizzes, and practice assignments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => handleOpenCreate()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Add Question</span>
            <span className="inline sm:hidden">+ Question</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Cards Row matching Users & Roles Pages */}
      <div className="admin-stats-row flex overflow-x-auto scrollbar-hide gap-3 pb-1">
        {/* Card 1: Total Questions */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Layers size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Total Questions</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{questionList.length}</h3>
            <p className="text-[10px] text-purple-400 font-semibold mt-1">Across all topics</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-purple-500 h-full w-[85%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 2: Easy */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Easy</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{easyCount}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">Foundational</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full w-[60%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 3: Medium */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Tag size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Medium</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{mediumCount}</h3>
            <p className="text-[10px] text-amber-400 font-semibold mt-1">Competitive</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full w-[75%] rounded-full"></div>
          </div>
        </Card>

        {/* Card 4: Hard */}
        <Card className="p-3 border border-[rgb(var(--border))] relative overflow-hidden flex flex-col justify-between hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle size={15} />
            </div>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium truncate">Hard</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[rgb(var(--text-primary))] font-[Outfit] leading-none">{hardCount}</h3>
            <p className="text-[10px] text-rose-400 font-semibold mt-1">Advanced / JEE</p>
          </div>
          <div className="w-full bg-[rgb(var(--bg-elevated))] h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-rose-500 h-full w-[40%] rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* 3. Search & Workable Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Left Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              placeholder="Search questions or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Workable Filter Toggle Button on Right Side */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0",
              showFilters || subjectFilter !== 'all' || difficultyFilter !== 'all' || typeFilter !== 'all'
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/40"
            )}
            title="Filter Options"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(subjectFilter !== 'all' || difficultyFilter !== 'all' || typeFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer", viewMode === 'grid' && "bg-indigo-600 text-white")}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-lg text-[rgb(var(--text-muted))] transition-all cursor-pointer", viewMode === 'list' && "bg-indigo-600 text-white")}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel - Side by Side */}
        {(showFilters || subjectFilter !== 'all' || difficultyFilter !== 'all' || typeFilter !== 'all') && (
          <div className="p-2.5 sm:p-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-row items-center justify-between gap-2.5 shadow-xs flex-wrap sm:flex-nowrap">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              {/* Subject Selector */}
              <div className="relative min-w-[120px] flex-1">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">All Subjects</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="biology">Biology</option>
                  <option value="computer science">Computer Science</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>

              {/* Difficulty Selector */}
              <div className="relative min-w-[120px] flex-1">
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>

              {/* Type Selector */}
              <div className="relative min-w-[110px] flex-1">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full pl-3 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50 appearance-none cursor-pointer truncate"
                >
                  <option value="all">All Types</option>
                  <option value="mcq">MCQ</option>
                  <option value="numerical">Numerical</option>
                  <option value="subjective">Subjective</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
              </div>
            </div>

            {(subjectFilter !== 'all' || difficultyFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => { setSubjectFilter('all'); setDifficultyFilter('all'); setTypeFilter('all') }}
                className="text-xs font-semibold text-indigo-400 hover:underline shrink-0 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Question Items Grid */}
      {filtered.length === 0 ? (
        <Card className="py-16 text-slate-500 dark:text-slate-400 text-center border border-dashed border-[rgb(var(--border))]">
          <HelpCircle size={40} className="mx-auto text-[rgb(var(--text-muted))] mb-3 opacity-50" />
          <p className="text-sm font-semibold text-[rgb(var(--text-secondary))] font-[Outfit]">No questions found</p>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Try resetting search filters or create a new question.</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item, idx) => (
            <motion.div key={item.id ?? `q-${idx}`} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
              <Card className="p-4 border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-col justify-between space-y-3.5 hover:border-indigo-500/50 hover:shadow-md transition-all rounded-2xl">
                {/* Header Pills */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono uppercase">
                      {item.subject}
                    </span>
                    {getDifficultyBadge(item.difficulty)}
                    <span className="text-[9px] font-mono text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] px-2 py-0.5 rounded-md border border-[rgb(var(--border))]">
                      {item.type.toUpperCase()}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold font-mono text-purple-400">
                    +{item.marks} Marks
                  </span>
                </div>

                {/* Topic & Question Text */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono font-semibold uppercase">
                    Topic: {item.topic}
                  </p>
                  <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Inter] leading-relaxed">
                    {item.question_text}
                  </h3>
                </div>

                {/* Options List (If MCQ) */}
                {item.options && item.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    {item.options.map((opt, optIdx) => (
                      <div
                        key={opt.key || `opt-${item.id}-${optIdx}`}
                        className={cn(
                          "p-2 rounded-xl border flex items-center gap-2 transition-all",
                          opt.is_correct
                            ? "bg-emerald-500/10 border-emerald-500/30 text-slate-500 dark:text-emerald-400 font-bold"
                            : "bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]"
                        )}
                      >
                        <span className="w-5 h-5 rounded-md bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] flex items-center justify-center text-[10px]">
                          {opt.key}
                        </span>
                        <span className="truncate flex-1">{opt.text}</span>
                        {opt.is_correct && <Check size={12} className="text-slate-500 dark:text-emerald-400 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {item.explanation && (
                  <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[10px] text-[rgb(var(--text-muted))] space-y-0.5">
                    <span className="font-bold text-indigo-400 block font-mono">SOLUTION EXPLANATION:</span>
                    <p className="line-clamp-2">{item.explanation}</p>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))] text-xs min-w-0 flex-wrap gap-2">
                  <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">ID: #{item.id}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button size="sm" variant="outline" className="text-[11px] font-semibold py-1 px-2 rounded-xl cursor-pointer" onClick={() => handleOpenEdit(item)}>
                      <Pencil size={12} className="mr-1 text-indigo-400" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-[11px] font-semibold py-1 px-2 rounded-xl cursor-pointer" onClick={() => toast.success(`Copied question #${item.id}`)}>
                      <Copy size={12} className="mr-1" /> Copy
                    </Button>
                    <Button size="sm" variant="secondary" className="text-[11px] font-semibold py-1 px-2.5 rounded-xl cursor-pointer" onClick={() => toast.success('Question added to current exam draft')}>
                      <Plus size={12} className="mr-1" /> Add to Exam
                    </Button>
                    <button onClick={() => setDeleteTargetId(item.id)} className="p-1 rounded-lg text-[rgb(var(--text-muted))] hover:text-rose-400 transition-all cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <Card key={item.id ?? `q-${idx}`} className="p-3.5 sm:p-4 border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] flex flex-col space-y-3 hover:border-indigo-500/40 transition-all rounded-2xl min-w-0 w-full overflow-hidden shadow-xs">
              {/* Header Badges & Actions Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono uppercase truncate">{item.subject}</span>
                  {getDifficultyBadge(item.difficulty)}
                  <span className="text-[9px] font-mono text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-elevated))] px-2 py-0.5 rounded-md border border-[rgb(var(--border))] truncate">{item.type.toUpperCase()}</span>
                  <span className="text-[10px] font-bold font-mono text-purple-400 truncate">+{item.marks} Marks</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" className="text-[11px] font-semibold py-1 px-2 rounded-xl cursor-pointer" onClick={() => handleOpenEdit(item)}>
                    <Pencil size={12} className="mr-1 text-indigo-400" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-[11px] font-semibold py-1 px-2 rounded-xl cursor-pointer hidden sm:inline-flex" onClick={() => toast.success(`Copied question #${item.id}`)}>
                    <Copy size={12} className="mr-1" /> Copy
                  </Button>
                  <Button size="sm" variant="secondary" className="text-[11px] font-semibold py-1 px-2.5 rounded-xl cursor-pointer" onClick={() => toast.success('Question added to exam')}>
                    + Add to Exam
                  </Button>
                  <button onClick={() => setDeleteTargetId(item.id)} className="p-1 rounded-lg text-[rgb(var(--text-muted))] hover:text-rose-400 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Question Statement & Topic */}
              <div className="min-w-0 space-y-1 w-full">
                <p className="text-[10px] text-[rgb(var(--text-muted))] font-mono font-semibold uppercase truncate">Topic: {item.topic}</p>
                <h3 className="text-xs sm:text-sm font-bold text-[rgb(var(--text-primary))] font-[Inter] leading-relaxed break-words w-full">{item.question_text}</h3>
              </div>

              {/* Options Grid (If MCQ) */}
              {item.options && item.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] min-w-0 w-full">
                  {item.options.map((opt, optIdx) => (
                    <div
                      key={opt.key || `opt-${item.id}-${optIdx}`}
                      className={cn(
                        "p-2 rounded-xl border flex items-center gap-2 transition-all min-w-0",
                        opt.is_correct
                          ? "bg-emerald-500/10 border-emerald-500/30 text-slate-500 dark:text-emerald-400 font-bold"
                          : "bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]"
                      )}
                    >
                      <span className="w-5 h-5 rounded-md bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] flex items-center justify-center text-[10px] shrink-0">
                        {opt.key}
                      </span>
                      <span className="truncate flex-1 min-w-0">{opt.text}</span>
                      {opt.is_correct && <Check size={12} className="text-slate-500 dark:text-emerald-400 shrink-0" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation Box */}
              {item.explanation && (
                <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[10px] text-[rgb(var(--text-muted))] space-y-0.5 min-w-0 w-full break-words">
                  <span className="font-bold text-indigo-400 block font-mono">SOLUTION EXPLANATION:</span>
                  <p className="line-clamp-2">{item.explanation}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {/* Centralized & Mobile Responsive Bottom Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[rgb(var(--border))] mt-6 text-xs text-[rgb(var(--text-muted))]">
        <span className="font-medium text-center sm:text-left">
          Showing 1 to {filtered.length} of {questionList.length} questions
        </span>

        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer">
            &lt;
          </button>
          <button className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-xs">
            1
          </button>
          <button className="w-8 h-8 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer">
            &gt;
          </button>
        </div>
      </div>

      {/* Create / Edit Question Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditingQuestion(null) }}
        title={editingQuestion ? `Edit Question #${editingQuestion.id}` : "Add New Question to Bank"}
        size="md"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="outline" onClick={() => { setCreateModalOpen(false); setEditingQuestion(null) }}>Cancel</Button>
            <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={handleSave}>
              {editingQuestion ? 'Update Question' : 'Save Question'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full p-2.5 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none font-semibold"
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm(f => ({ ...f, difficulty: e.target.value as any }))}
                className="w-full p-2.5 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none font-semibold"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Question Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value as any }))}
                className="w-full p-2.5 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none font-semibold"
              >
                <option value="mcq">MCQ (Single Choice)</option>
                <option value="multi_select">Multi-Select MCQ</option>
                <option value="numerical">Numerical Value</option>
                <option value="subjective">Subjective / Descriptive</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Marks</label>
              <Input
                type="number"
                value={form.marks}
                onChange={(e) => setForm(f => ({ ...f, marks: Number(e.target.value) || 4 }))}
                placeholder="4"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Topic / Unit Name</label>
            <Input
              value={form.topic}
              onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. Kinematics, Integration, Organic Reaction Mechanisms"
            />
          </div>

          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Question Statement</label>
            <textarea
              rows={3}
              value={form.question_text}
              onChange={(e) => setForm(f => ({ ...f, question_text: e.target.value }))}
              placeholder="Enter question text..."
              className="w-full p-3 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Options */}
          {form.type === 'mcq' && (
            <div className="space-y-2">
              <label className="font-semibold text-[rgb(var(--text-secondary))] block">Options (Select correct radio)</label>
              {['A', 'B', 'C', 'D'].map((key) => {
                const optValue = key === 'A' ? form.optA : key === 'B' ? form.optB : key === 'C' ? form.optC : form.optD
                return (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctKey"
                      checked={form.correctKey === key}
                      onChange={() => setForm(f => ({ ...f, correctKey: key }))}
                      className="accent-indigo-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-xs text-indigo-400">{key}:</span>
                    <input
                      type="text"
                      value={optValue}
                      onChange={(e) => {
                        const val = e.target.value
                        if (key === 'A') setForm(f => ({ ...f, optA: val }))
                        if (key === 'B') setForm(f => ({ ...f, optB: val }))
                        if (key === 'C') setForm(f => ({ ...f, optC: val }))
                        if (key === 'D') setForm(f => ({ ...f, optD: val }))
                      }}
                      placeholder={`Option ${key} text`}
                      className="flex-1 p-2 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none"
                    />
                  </div>
                )
              })}
            </div>
          )}

          <div>
            <label className="font-semibold text-[rgb(var(--text-secondary))] block mb-1">Solution / Explanation</label>
            <textarea
              rows={2}
              value={form.explanation}
              onChange={(e) => setForm(f => ({ ...f, explanation: e.target.value }))}
              placeholder="Explain step-by-step solution..."
              className="w-full p-2.5 text-xs rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Question"
        message="Are you sure you want to remove this question from the Question Bank?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          setDeleteTargetId(null)
          toast.success('Question removed.')
        }}
      />
    </div>
  )
}

