'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Video, ChevronDown, ChevronUp, RefreshCw, Copy, Check,
  Target, Lightbulb, Clapperboard, Image as ImageIcon, TrendingUp, PenLine,
} from 'lucide-react'

interface VideoIdea {
  title: string
  hook: string
  targetAudience: string
  whyNow: string
  keyPoints: string[]
  scriptStructure: string
  thumbnailConcept: string
  estimatedViews: string
}

const CACHE_KEY      = 'next-video-ideas-v2'
const CACHE_TS_KEY   = 'next-video-ideas-ts-v2'
const TWO_DAYS_MS    = 2 * 24 * 60 * 60 * 1000

export default function NextVideoIdeasPanel() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<VideoIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyField = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 2500)
  }

  const fetchIdeas = useCallback(async (force = false) => {
    // Check cache first
    if (!force && typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY)
      const ts = localStorage.getItem(CACHE_TS_KEY)
      if (cached && ts && Date.now() - parseInt(ts, 10) < TWO_DAYS_MS) {
        try {
          const parsed = JSON.parse(cached) as VideoIdea[]
          if (parsed.length > 0) {
            setIdeas(parsed)
            return
          }
        } catch { /* invalid cache */ }
      }
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/next-video-ideas', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה בייצור הרעיונות')
      setIdeas(data.ideas ?? [])
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.ideas ?? []))
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בלתי צפויה')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Small delay so page renders first
    const t = setTimeout(() => fetchIdeas(), 300)
    return () => clearTimeout(t)
  }, [fetchIdeas])

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-accent2/10 rounded-full -translate-y-32 -translate-x-32 blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent2 to-accent flex items-center justify-center shadow-[0_4px_18px_rgba(236,72,153,0.3)]">
              <Video size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-accent2 uppercase tracking-wider">מנוע תוכן</p>
              <h3 className="font-bold text-text text-sm">5 רעיונות לסרטון הבא שלך</h3>
            </div>
          </div>
          <button
            onClick={() => fetchIdeas(true)}
            disabled={loading}
            className="w-8 h-8 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-text transition-colors disabled:opacity-40"
            title="רענן רעיונות"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-10 h-10 rounded-full border-2 border-accent2/30 animate-spin border-t-accent2" />
            <p className="text-sm text-text2">Claude מנתח את המתחרים שלך...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Ideas list */}
        {!loading && ideas.length > 0 && (
          <div className="space-y-2">
            {ideas.map((idea, idx) => (
              <div
                key={idx}
                className="bg-bg2 border border-card-border rounded-xl overflow-hidden transition-all"
              >
                {/* Idea header (always visible) */}
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="w-full flex items-start gap-3 p-3 text-right hover:bg-white/5 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-accent2/20 text-accent2 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text text-right leading-snug line-clamp-2">
                      {idea.title}
                    </p>
                    {expandedIdx !== idx && idea.hook && (
                      <p className="text-xs text-text2 mt-1 line-clamp-1 text-right">{idea.hook}</p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-text2 mt-0.5">
                    {expandedIdx === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>

                {/* Expanded script prep */}
                {expandedIdx === idx && (
                  <div className="border-t border-card-border p-4 space-y-4">
                    {/* Copy title */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-text leading-snug">{idea.title}</p>
                      <button
                        onClick={() => copyField(idea.title, `title-${idx}`)}
                        className="flex-shrink-0 flex items-center gap-1 text-[11px] px-2 py-1 bg-accent2/10 text-accent2 border border-accent2/20 rounded-lg hover:bg-accent2/20 transition-colors"
                      >
                        {copiedField === `title-${idx}` ? <><Check size={10} /> הועתק</> : <><Copy size={10} /> העתק</>}
                      </button>
                    </div>

                    {/* Hook */}
                    <ScriptSection
                      icon={<Lightbulb size={12} />}
                      label="Hook — פתיח"
                      text={idea.hook}
                      copyKey={`hook-${idx}`}
                      copiedField={copiedField}
                      onCopy={copyField}
                    />

                    {/* Why now */}
                    {idea.whyNow && (
                      <ScriptSection
                        icon={<TrendingUp size={12} />}
                        label="למה עכשיו"
                        text={idea.whyNow}
                        copyKey={`whynow-${idx}`}
                        copiedField={copiedField}
                        onCopy={copyField}
                      />
                    )}

                    {/* Key points */}
                    {idea.keyPoints?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Target size={12} className="text-accent2" />
                          <span className="text-[11px] font-semibold text-text2 uppercase tracking-wider">נקודות לכסות</span>
                        </div>
                        <ul className="space-y-1">
                          {idea.keyPoints.map((pt, pi) => (
                            <li key={pi} className="flex items-start gap-2 text-sm text-text">
                              <span className="text-accent2 text-xs mt-0.5">▸</span>
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Script structure */}
                    {idea.scriptStructure && (
                      <ScriptSection
                        icon={<Clapperboard size={12} />}
                        label="מבנה הסקריפט"
                        text={idea.scriptStructure}
                        copyKey={`script-${idx}`}
                        copiedField={copiedField}
                        onCopy={copyField}
                      />
                    )}

                    {/* Thumbnail concept */}
                    {idea.thumbnailConcept && (
                      <ScriptSection
                        icon={<ImageIcon size={12} />}
                        label="רעיון לתמונה ממוזערת"
                        text={idea.thumbnailConcept}
                        copyKey={`thumb-${idx}`}
                        copiedField={copiedField}
                        onCopy={copyField}
                      />
                    )}

                    {/* Estimated views */}
                    {idea.estimatedViews && (
                      <div className="bg-success/5 border border-success/20 rounded-lg px-3 py-2">
                        <p className="text-xs text-success font-medium">📈 {idea.estimatedViews}</p>
                      </div>
                    )}

                    {/* Action row */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const full = [
                            `כותרת: ${idea.title}`,
                            `\nהook: ${idea.hook}`,
                            idea.whyNow ? `\nלמה עכשיו: ${idea.whyNow}` : '',
                            `\nנקודות:\n${idea.keyPoints.map(p => `• ${p}`).join('\n')}`,
                            `\nסקריפט:\n${idea.scriptStructure}`,
                            idea.thumbnailConcept ? `\nתמונה ממוזערת: ${idea.thumbnailConcept}` : '',
                          ].filter(Boolean).join('')
                          copyField(full, `all-${idx}`)
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-card border border-card-border text-text2 rounded-lg hover:text-text transition-colors"
                      >
                        {copiedField === `all-${idx}` ? <><Check size={12} className="text-success" /> הועתק!</> : <><Copy size={12} /> העתק הכל</>}
                      </button>
                      <button
                        onClick={() => router.push(`/blog?topic=${encodeURIComponent(idea.title)}`)}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 transition-colors font-medium"
                        title="צור מאמר SEO מרעיון זה"
                      >
                        <PenLine size={12} />
                        מאמר SEO
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────
function ScriptSection({
  icon, label, text, copyKey, copiedField, onCopy,
}: {
  icon: React.ReactNode
  label: string
  text: string
  copyKey: string
  copiedField: string | null
  onCopy: (text: string, key: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-accent2">{icon}</span>
          <span className="text-[11px] font-semibold text-text2 uppercase tracking-wider">{label}</span>
        </div>
        <button
          onClick={() => onCopy(text, copyKey)}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-accent2/10 text-accent2 border border-accent2/20 rounded-md hover:bg-accent2/20 transition-colors"
        >
          {copiedField === copyKey ? <><Check size={10} /> הועתק</> : <><Copy size={10} /> העתק</>}
        </button>
      </div>
      <p className="text-sm text-text leading-relaxed bg-card border border-card-border rounded-lg px-3 py-2">
        {text}
      </p>
    </div>
  )
}
