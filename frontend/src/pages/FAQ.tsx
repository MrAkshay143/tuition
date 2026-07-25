import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Search, ChevronRight, HelpCircle } from 'lucide-react'
import { Card, Input } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'

interface ExploreResponse {
  settings: {
    landing_faqs: Array<{ question: string; answer: string }>
  }
}

export default function FAQ() {
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Fetch FAQ config
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'explore'],
    queryFn: async () => {
      const res = await api.get<{ data: ExploreResponse }>('/public/explore')
      return res.data
    },
  })

  const faqs = data?.settings?.landing_faqs ?? []

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      
      {/* Intro */}
      <div className="text-slate-500 dark:text-slate-400 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[rgb(var(--text-primary))]">Frequently Asked Questions</h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mx-auto">
          Find answers to common questions about courses, schedules, and batch enrollments.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <Input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftElement={<Search size={16} />}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="text-slate-500 dark:text-slate-400 text-center py-10 text-xs text-[rgb(var(--text-muted))]">
          No matching questions found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = activeIndex === idx
            return (
              <div key={idx} className="border border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--bg-surface))] overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--border))]/10 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle size={16} className="text-[rgb(var(--primary))] flex-shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronRight size={16} className={`text-[rgb(var(--text-muted))] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs text-[rgb(var(--text-secondary))] leading-relaxed border-t border-[rgb(var(--border))]/60">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
