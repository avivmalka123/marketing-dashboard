'use client'
import { Sparkles, ExternalLink, ChevronDown, ChevronUp, PenLine } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DailySuggestion {
  id: string
  videoId: string
  reason: string
  hebrewTitles: string[]
  contentBrief: string | null
  trendAnalysis: string | null
  date: string
}

export default function DailySuggestionCard({ suggestion }: { suggestion: DailySuggestion }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  function copyTitle(title: string, idx: number) {
    navigator.clipboard.writeText(title)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  // Use the first Hebrew title as the blog topic
  const blogTopic = suggestion.hebrewTitles[0] ?? ''

  return (
    <div className="glass-card p-6 border-accent/30 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-[0_4px_18px_rgba(124,58,237,0.4)]">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-accent uppercase tracking-wider">הצעה יומית</div>
              <h3 className="font-bold text-text text-base">התוכן המומלץ להיום</h3>
            </div>
          </div>
          <a
            href={`https://youtube.com/watch?v=${suggestion.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text2 hover:text-accent2 transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Reason */}
        <p className="text-sm text-text2 leading-relaxed mb-5">{suggestion.reason}</p>

        {/* Hebrew titles */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-text2 uppercase tracking-wider mb-3">
            כותרות מומלצות בעברית
          </p>
          <div className="space-y-2">
            {suggestion.hebrewTitles.map((title, i) => (
              <button
                key={i}
                onClick={() => copyTitle(title, i)}
                className="w-full text-right p-3 bg-bg2 border border-card-border rounded-xl text-sm text-text hover:border-accent/40 transition-all flex items-center justify-between gap-2 group"
              >
                <span className="flex-1 text-right">{title}</span>
                <span className="text-xs text-text2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {copied === i ? '✓ הועתק' : 'העתק'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Create blog post shortcut */}
        {blogTopic && (
          <button
            onClick={() => router.push(`/blog?topic=${encodeURIComponent(blogTopic)}`)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 text-accent text-sm font-bold rounded-xl transition-all mb-4"
          >
            <PenLine size={14} />
            צור מאמר SEO מהצעה זו
          </button>
        )}

        {/* Expandable details */}
        {(suggestion.contentBrief || suggestion.trendAnalysis) && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-xs text-text2 hover:text-text transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'הסתר פרטים' : 'הצג בריף + ניתוח מגמות'}
            </button>

            {expanded && (
              <div className="mt-4 space-y-4">
                {suggestion.trendAnalysis && (
                  <div>
                    <p className="text-xs font-semibold text-warning uppercase tracking-wider mb-2">ניתוח מגמות</p>
                    <p className="text-sm text-text2 leading-relaxed bg-warning/5 border border-warning/20 rounded-xl p-4">
                      {suggestion.trendAnalysis}
                    </p>
                  </div>
                )}
                {suggestion.contentBrief && (
                  <div>
                    <p className="text-xs font-semibold text-accent2 uppercase tracking-wider mb-2">בריף תוכן</p>
                    <div className="text-sm text-text leading-relaxed bg-accent2/5 border border-accent2/20 rounded-xl p-4 whitespace-pre-wrap">
                      {suggestion.contentBrief}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
