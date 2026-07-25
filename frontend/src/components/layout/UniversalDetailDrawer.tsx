import React, { useState } from 'react'
import { Shield, Clock, FileText, Settings, User } from 'lucide-react'
import { Drawer } from '@/components/ui'

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
}

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  tabs?: Tab[]
  children: (activeTab: string) => React.ReactNode
}

const DEFAULT_TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
  { id: 'related', label: 'Related Records', icon: <Settings className="w-4 h-4" /> },
  { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
  { id: 'activity', label: 'Activity Logs', icon: <FileText className="w-4 h-4" /> },
]

export const UniversalDetailDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  tabs = DEFAULT_TABS,
  children,
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'overview')

  if (!isOpen) return null

  return (
    <Drawer 
      open={isOpen} 
      onClose={onClose} 
      width="42rem" // max-w-2xl
      title={
        <div className="flex flex-col">
          <span>{title}</span>
          {subtitle && <span className="text-xs text-[rgb(var(--text-secondary))] mt-0.5 font-normal">{subtitle}</span>}
        </div>
      }
    >
      <div className="flex flex-col h-full bg-[rgb(var(--bg-surface))]">

        {/* Tabs Bar */}
        <div className="flex border-b border-[rgb(var(--border))] px-6 overflow-x-auto gap-2 bg-[rgb(var(--bg-elevated))/0.5]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === t.id
                  ? 'border-[rgb(var(--primary))] text-[rgb(var(--primary))]'
                  : 'border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[rgb(var(--text-primary))]">
          {children(activeTab)}
        </div>
      </div>
    </Drawer>
  )
}
