import React, { useState, useRef } from 'react'
import { Modal } from '@/components/ui/overlays'
import { Button, Badge } from '@/components/ui'
import { Upload, Download, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react'
import { useApiMutation } from '@/api/resources/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
}

interface ParsedBatch {
  name: string
  description?: string
  color?: string
  is_active: boolean
  status: 'valid' | 'invalid'
  error?: string
}

const DEFAULT_COLORS = ['#6C63FF', '#00D4AA', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981']

export default function ImportBatchModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const importMutation = useApiMutation<any, any>('/batches', 'post', { invalidateKeys: [['batches']] })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [parsedBatches, setParsedBatches] = useState<ParsedBatch[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const resetState = () => {
    setFile(null)
    setParsedBatches([])
    setImporting(false)
    setProgress({ current: 0, total: 0 })
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleDownloadSample = () => {
    const csvContent = `name,description,color,is_active\n"Batch 2026 Alpha","Intensive Physics & Math Batch","#6C63FF",true\n"Batch 2026 Beta","Organic Chemistry Focused","#00D4AA",true\n"Batch 2026 Gamma","Biology & Medical Prep","#10b981",false`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'sample_batches_import.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Downloaded sample_batches_import.csv!')
  }

  const parseFileContent = (content: string, fileName: string) => {
    try {
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== '')
      if (lines.length < 2) {
        toast.error('CSV file is empty or missing data rows.')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
      const nameIdx = headers.indexOf('name')
      const descIdx = headers.indexOf('description')
      const colorIdx = headers.indexOf('color')
      const activeIdx = headers.indexOf('is_active')

      if (nameIdx === -1) {
        toast.error('CSV header must contain a "name" column.')
        return
      }

      const batches: ParsedBatch[] = []
      for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i].trim()
        if (!rawLine) continue

        const values = rawLine.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || rawLine.split(',')
        const cleanValues = values.map(v => v.trim().replace(/^["']|["']$/g, ''))

        const name = cleanValues[nameIdx] || ''
        const description = descIdx !== -1 ? cleanValues[descIdx] : ''
        const color = (colorIdx !== -1 && cleanValues[colorIdx]) ? cleanValues[colorIdx] : DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        const rawActive = activeIdx !== -1 ? cleanValues[activeIdx].toLowerCase() : 'true'
        const is_active = rawActive === 'true' || rawActive === '1' || rawActive === 'yes'

        if (!name || name.length < 2) {
          batches.push({ name, description, color, is_active, status: 'invalid', error: 'Name required (min 2 chars)' })
        } else {
          batches.push({ name, description, color, is_active, status: 'valid' })
        }
      }

      setParsedBatches(batches)
      toast.success(`Parsed ${batches.length} batch records from ${fileName}!`)
    } catch (err) {
      toast.error('Failed to parse CSV file format.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) parseFileContent(text, selected.name)
    }
    reader.readAsText(selected)
  }

  const validBatches = parsedBatches.filter(b => b.status === 'valid')

  const handleStartImport = async () => {
    if (parsedBatches.length === 0) return
    setImporting(true)
    
    const validBatches = parsedBatches.filter(b => b.status === 'valid')
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < validBatches.length; i++) {
      const batch = validBatches[i]
      try {
        await importMutation.mutateAsync({
          name: batch.name,
          description: batch.description,
          color: batch.color,
          is_active: batch.is_active,
        })
        successCount++
      } catch (err) {
        failCount++
      }
      setProgress({ current: i + 1, total: validBatches.length })
    }

    qc.invalidateQueries({ queryKey: ['batches'] })
    setImporting(false)

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} batch(es)!`)
      handleClose()
    } else {
      toast.error(`Failed to import batches (${failCount} failed).`)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Batches"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStartImport}
            disabled={validBatches.length === 0 || importing}
            loading={importing}
            leftIcon={<Upload size={14} />}
          >
            {importing ? `Importing (${progress.current}/${progress.total})...` : `Import (${validBatches.length})`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Helper Banner */}
        <div className="p-3 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[rgb(var(--text-secondary))]">
            <FileText size={15} className="text-[rgb(var(--primary))] flex-shrink-0" />
            <span>Upload CSV with: <code className="text-[rgb(var(--primary))] font-mono">name</code>, <code className="font-mono">description</code>, <code className="font-mono">color</code>, <code className="font-mono">is_active</code></span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSample}
            leftIcon={<Download size={13} />}
            className="flex-shrink-0 text-xs px-2.5 py-1"
          >
            Sample CSV
          </Button>
        </div>

        {/* Upload Zone */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.txt"
          className="hidden"
        />

        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] bg-[rgb(var(--bg-surface))] p-7 rounded-2xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center gap-1.5 cursor-pointer transition-all hover:bg-[rgb(var(--bg-elevated))]"
          >
            <div className="w-11 h-11 rounded-xl bg-[rgb(var(--primary))/0.1] text-[rgb(var(--primary))] flex items-center justify-center">
              <Upload size={20} />
            </div>
            <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] font-[Outfit]">Upload CSV File</h4>
            <p className="text-[11px] text-[rgb(var(--text-muted))]">CSV files up to 5MB</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* File Info Bar */}
            <div className="flex items-center justify-between p-2.5 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText size={16} className="text-[rgb(var(--primary))] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[rgb(var(--text-primary))] truncate">{file.name}</p>
                  <p className="text-[10px] text-[rgb(var(--text-muted))]">{(file.size / 1024).toFixed(1)} KB &bull; {parsedBatches.length} rows</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 size={14} />
              </Button>
            </div>

            {/* Parsing Stats */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[rgb(var(--text-muted))] text-[11px] font-medium">Preview:</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="success" className="text-[10px] py-0.5">
                  <CheckCircle2 size={10} className="mr-1 inline" /> {validBatches.length} Valid
                </Badge>
                {parsedBatches.length - validBatches.length > 0 && (
                  <Badge variant="error" className="text-[10px] py-0.5">
                    <AlertCircle size={10} className="mr-1 inline" /> {parsedBatches.length - validBatches.length} Invalid
                  </Badge>
                )}
              </div>
            </div>

            {/* Parsed Data Preview Table */}
            <div className="max-h-52 overflow-y-auto border border-[rgb(var(--border))] rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[rgb(var(--bg-elevated))] border-b border-[rgb(var(--border))] text-[10px] uppercase font-mono text-[rgb(var(--text-muted))] sticky top-0">
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Color</th>
                    <th className="py-2 px-3">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border))] font-medium">
                  {parsedBatches.map((b, idx) => (
                    <tr key={idx} className={b.status === 'invalid' ? 'bg-rose-500/5' : 'hover:bg-[rgb(var(--bg-elevated))]'}>
                      <td className="py-2 px-3">
                        {b.status === 'valid' ? (
                          <span className="text-slate-500 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Valid
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold flex items-center gap-1" title={b.error}>
                            <AlertCircle size={12} /> Invalid
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-semibold text-[rgb(var(--text-primary))]">{b.name || '<empty>'}</td>
                      <td className="py-2 px-3 text-[rgb(var(--text-muted))] truncate max-w-[140px]">{b.description || '-'}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: b.color }} />
                          <span className="font-mono text-[10px] text-[rgb(var(--text-muted))]">{b.color}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={b.is_active ? 'primary' : 'muted'} className="text-[9px]">
                          {b.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

