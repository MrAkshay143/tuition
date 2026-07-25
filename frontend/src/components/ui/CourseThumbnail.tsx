import { Atom, Beaker, Binary, HeartPulse, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export default function CourseThumbnail({ 
  title, 
  videoUrl,
  className,
  iconSize = 40,
  hideOverlay = false
}: { 
  title: string
  videoUrl?: string | null
  className?: string
  iconSize?: number
  hideOverlay?: boolean
}) {
  const videoId = extractYoutubeId(videoUrl)

  const isBio = title.toLowerCase().includes('biology') || title.toLowerCase().includes('physiology')
  const isChem = title.toLowerCase().includes('chemistry') || title.toLowerCase().includes('synthesis')
  const isMath = title.toLowerCase().includes('mathematics') || title.toLowerCase().includes('calculus') || title.toLowerCase().includes('matrices')
  const isPhys = title.toLowerCase().includes('physics') || title.toLowerCase().includes('optics') || title.toLowerCase().includes('electromagnetism')

  let gradient = 'from-[#3b2d54] via-[#1a1429] to-[#0d0914]' // Default dark violet
  let subject = 'GENERAL'
  let Icon = GraduationCap
  let colorClass = 'text-purple-400'

  if (isPhys) {
    gradient = 'from-[#1a1c4b] via-[#090b24] to-[#03040c]'
    subject = 'PHYSICS'
    Icon = Atom
    colorClass = 'text-[rgb(var(--primary-light))]'
  } else if (isChem) {
    gradient = 'from-[#122e2b] via-[#061413] to-[#020505]'
    subject = 'CHEMISTRY'
    Icon = Beaker
    colorClass = 'text-slate-500 dark:text-emerald-400'
  } else if (isMath) {
    gradient = 'from-[#2e1d4b] via-[#110921] to-[#05020a]'
    subject = 'MATHEMATICS'
    Icon = Binary
    colorClass = 'text-pink-400'
  } else if (isBio) {
    gradient = 'from-[#3c1e2b] via-[#16090f] to-[#080205]'
    subject = 'BIOLOGY'
    Icon = HeartPulse
    colorClass = 'text-rose-400'
  }

  return (
    <div className={cn(
      'w-full h-full relative overflow-hidden select-none group',
      className
    )}>
      {videoId ? (
        // Render real YouTube thumbnail image
        <div className="w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          <img 
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
            alt={title}
            className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-500" 
            onError={(e) => {
              // Fallback to dynamic placeholder on image load failure
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
        </div>
      ) : (
        // Render dynamic gradient placeholder
        <div className={`w-full h-full bg-gradient-to-tr ${gradient} flex flex-col items-center justify-center`}>
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className={cn(
            'absolute rounded-full blur-2xl opacity-20 bg-current',
            iconSize > 20 ? 'w-20 h-20' : 'w-6 h-6',
            colorClass
          )} />
          <Icon 
            size={iconSize}
            className={cn(
              colorClass,
              'relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6'
            )} 
          />
        </div>
      )}

      {/* Glass overlay with metadata */}
      {!hideOverlay && (
        <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-[4px] border border-white/5 flex items-center justify-between z-10">
          <span className="text-[7.5px] tracking-widest font-extrabold text-white/75 uppercase">{subject} division</span>
          <span className="text-[7px] font-bold text-white/55">EDUFLOW</span>
        </div>
      )}
    </div>
  )
}
