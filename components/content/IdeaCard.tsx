'use client'
import { Video, FileText, Smartphone } from 'lucide-react'

type IdeaStatus = 'Ideas' | 'In Progress' | 'Published'

interface Idea {
  id: string
  title: string
  format: string
  targetAudience: string | null
  keywords: string[]
  seoScore: number
  notes: string | null
}

const FORMAT_CONFIG = {
  video: { icon: Video, label: 'סרטון', color: 'text-accent2 bg-accent2/10' },
  reel: { icon: Smartphone, label: 'ריל', color: 'text-pink bg-pink/10' },
  article: { icon: FileText, label: 'מאמר', color: 'text-success bg-success/10' },
}

interface Props {
  idea: Idea
  onDragStart: () => void
  onDragEnd: () => void
  onStatusChange: (status: IdeaStatus) => void
}

export default function IdeaCard({ idea, onDragStart, onDragEnd, onStatusChange }: Props) {
  const fmt = FORMAT_CONFIG[idea.format as keyof typeof FORMAT_CONFIG] ?? FORMAT_CONFIG.video
  const Icon = fmt.icon

  const seoColor =
    idea.seoScore >= 80
      ? 'text-success'
      : idea.seoScore >= 60
      ? 'text-warning'
      : 'text-text2'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="bg-bg border border-card-border rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all"
    >
      {/* Format badge + SEO score */}
      <div className="flex items-center justify-between mb-2">
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${fmt.color}`}>
          <Icon size={10} />
          {fmt.label}
        </span>
        <span className={`text-[10px] font-bold ${seoColor}`}>
          SEO {idea.seoScore}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-text leading-snug mb-2">{idea.title}</p>

      {/* Keywords */}
      {idea.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {idea.keywords.slice(0, 3).map(kw => (
            <span key={kw} className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded">
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Target audience */}
      {idea.targetAudience && (
        <p className="text-[10px] text-text2 truncate">👥 {idea.targetAudience}</p>
      )}
    </div>
  )
}
