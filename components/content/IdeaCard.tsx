'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Video, FileText, Smartphone, Heart, Trash2, ChevronDown, ChevronUp, Copy, Check, Clock, Hash, PenLine } from 'lucide-react'

type IdeaStatus = 'Ideas' | 'In Progress' | 'Published'

export interface Idea {
  id: string
  title: string
  format: string
  targetAudience: string | null
  keywords: string[]
  seoScore: number
  status: IdeaStatus
  notes: string | null
  liked?: boolean
  // Rich fields for script generation
  hook?: string | null
  keyPoints?: string[]
  recommendedLength?: string | null
  hashtags?: string[]
  scriptOutline?: string | null
}

const FORMAT_CONFIG = {
  video: { icon: Video, label: 'סרטון', color: 'text-accent2 bg-accent2/10' },
  reel: { icon: Smartphone, label: 'ריל', color: 'text-pink-400 bg-pink-400/10' },
  article: { icon: FileText, label: 'מאמר', color: 'text-success bg-success/10' },
}

interface Props {
  idea: Idea
  onDragStart: () => void
  onDragEnd: () => void
  onStatusChange: (status: IdeaStatus) => void
  onLike: () => void
  onDelete: () => void
}

export default function IdeaCard({ idea, onDragStart, onDragEnd, onLike, onDelete }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const fmt = FORMAT_CONFIG[idea.format as keyof typeof FORMAT_CONFIG] ?? FORMAT_CONFIG.video
  const Icon = fmt.icon

  const seoColor =
    idea.seoScore >= 80 ? 'text-success' :
    idea.seoScore >= 60 ? 'text-warning' :
    'text-text2'

  function copyScript() {
    const text = [
      `📌 כותרת: ${idea.title}`,
      idea.hook ? `\n🎬 פתיח:\n${idea.hook}` : '',
      idea.keyPoints?.length ? `\n📋 נקודות עיקריות:\n${idea.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : '',
      idea.recommendedLength ? `\n⏱ אורך מומלץ: ${idea.recommendedLength}` : '',
      idea.scriptOutline ? `\n📝 מבנה סקריפט:\n${idea.scriptOutline}` : '',
      idea.hashtags?.length ? `\n🏷 האשטגים: ${idea.hashtags.join(' ')}` : '',
      idea.keywords?.length ? `\n🔑 מילות מפתח: ${idea.keywords.join(', ')}` : '',
    ].filter(Boolean).join('')

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-bg border rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all ${
        idea.liked
          ? 'border-accent/40 shadow-sm shadow-accent/10'
          : 'border-card-border hover:border-white/20'
      }`}
    >
      {/* Row 1: Format badge + SEO + Like + Delete */}
      <div className="flex items-center justify-between mb-2">
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${fmt.color}`}>
          <Icon size={10} />
          {fmt.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold ${seoColor}`}>SEO {idea.seoScore}</span>
          <button
            onClick={e => { e.stopPropagation(); onLike() }}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              idea.liked ? 'text-red-400' : 'text-text2/40 hover:text-red-400'
            }`}
          >
            <Heart size={11} fill={idea.liked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="w-5 h-5 rounded flex items-center justify-center text-text2/40 hover:text-danger transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
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
        <p className="text-[10px] text-text2 truncate mb-2">👥 {idea.targetAudience}</p>
      )}

      {/* Create blog post shortcut */}
      {idea.format === 'article' || idea.format === 'video' ? (
        <button
          onClick={e => {
            e.stopPropagation()
            router.push(`/blog?topic=${encodeURIComponent(idea.title)}`)
          }}
          className="w-full flex items-center justify-center gap-1.5 text-[10px] font-semibold text-text2 hover:text-accent border border-card-border hover:border-accent/40 rounded-lg py-1.5 transition-all mb-2"
        >
          <PenLine size={10} />
          צור מאמר SEO מרעיון זה
        </button>
      ) : null}

      {/* Expand/collapse toggle */}
      {(idea.hook || idea.keyPoints?.length || idea.scriptOutline) && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
            className="w-full flex items-center justify-between text-[10px] text-text2/60 hover:text-text2 transition-colors pt-1 border-t border-card-border mt-1"
          >
            <span>פרטי סקריפט</span>
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2.5 text-[11px]" onClick={e => e.stopPropagation()}>
              {/* Hook */}
              {idea.hook && (
                <div>
                  <p className="text-text2 font-semibold mb-0.5">🎬 פתיח:</p>
                  <p className="text-text leading-relaxed bg-bg2 rounded-lg p-2">{idea.hook}</p>
                </div>
              )}

              {/* Key Points */}
              {idea.keyPoints && idea.keyPoints.length > 0 && (
                <div>
                  <p className="text-text2 font-semibold mb-1">📋 נקודות עיקריות:</p>
                  <ul className="space-y-0.5">
                    {idea.keyPoints.map((point, i) => (
                      <li key={i} className="text-text flex gap-1.5">
                        <span className="text-accent font-bold flex-shrink-0">{i + 1}.</span>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended length */}
              {idea.recommendedLength && (
                <div className="flex items-center gap-1 text-text2">
                  <Clock size={10} />
                  <span>אורך מומלץ: </span>
                  <span className="text-text font-medium">{idea.recommendedLength}</span>
                </div>
              )}

              {/* Script outline */}
              {idea.scriptOutline && (
                <div>
                  <p className="text-text2 font-semibold mb-0.5">📝 מבנה סקריפט:</p>
                  <p className="text-text bg-bg2 rounded-lg p-2 leading-relaxed">{idea.scriptOutline}</p>
                </div>
              )}

              {/* Hashtags */}
              {idea.hashtags && idea.hashtags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Hash size={10} className="text-text2" />
                  {idea.hashtags.map(tag => (
                    <span key={tag} className="text-[10px] text-accent2">{tag}</span>
                  ))}
                </div>
              )}

              {/* Copy full script button */}
              <button
                onClick={copyScript}
                className="w-full flex items-center justify-center gap-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-[11px] font-bold py-1.5 rounded-lg transition-colors"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'הועתק!' : 'העתק לסקריפט'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
