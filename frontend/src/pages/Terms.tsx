import { Card } from '@/components/ui'

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-[rgb(var(--text-primary))]">Terms of Service</h1>
      <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-8 text-sm text-[rgb(var(--text-secondary))] leading-relaxed space-y-4">
        <p>
          By accessing the learning portal, you agree to be bound by these terms of service and all applicable regulations.
        </p>
        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] pt-2">1. Access License</h3>
        <p>
          Permission is granted to access course materials, lectures, and assignments strictly for personal, non-commercial educational use.
        </p>
        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] pt-2">2. Account Responsibility</h3>
        <p>
          You are responsible for maintaining account credential confidentiality. Unauthorized sharing of accounts or redistribution of proprietary study content is strictly prohibited.
        </p>
      </Card>
    </div>
  )
}
