import { Card } from '@/components/ui'

export default function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-[rgb(var(--text-primary))]">Refund Policy</h1>
      <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-8 text-sm text-[rgb(var(--text-secondary))] leading-relaxed space-y-4">
        <p>
          We aim to provide exceptional educational content and batch experiences.
        </p>
        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] pt-2">1. Refund Requests</h3>
        <p>
          Refund requests must be submitted to support within 7 days of course enrollment or batch assignment.
        </p>
        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] pt-2">2. Processing Timeline</h3>
        <p>
          Approved refunds will be processed to the original payment method within 5-10 business days.
        </p>
      </Card>
    </div>
  )
}
