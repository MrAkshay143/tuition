import { Card } from '@/components/ui'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-[rgb(var(--text-primary))]">Privacy Policy</h1>
      <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-8 text-sm text-[rgb(var(--text-secondary))] leading-relaxed space-y-4">
        <p>
          We are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information across our platforms and services.
        </p>
        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] pt-2">1. Data Collection</h3>
        <p>
          We collect essential account details (such as name, email address, and phone number) solely to provide secure authentication, manage course enrollments, and coordinate schedule updates.
        </p>
        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base text-[rgb(var(--text-primary))] pt-2">2. Data Security & Storage</h3>
        <p>
          We retain personal data only for as long as required to deliver active services. Stored information is protected using industry-standard security measures to prevent unauthorized access, disclosure, or modification.
        </p>
      </Card>
    </div>
  )
}
