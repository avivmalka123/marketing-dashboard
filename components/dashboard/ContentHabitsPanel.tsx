'use client'
import { useState } from 'react'
import { Loader2, Copy, Check, ChevronDown, ChevronUp, Zap, PlayCircle, Camera, Calendar } from 'lucide-react'

interface ContentPlan {
  weeklyTopic: string
  topicReason: string
  youtube: {
    title: string
    script: string
    thumbnailPrompt: string
    description: string
    hashtags: string[]
  }
  reel1: {
    concept: string
    hook: string
    caption: string
    script: string
  }
  reel2: {
    concept: string
    hook: string
    caption: string
    script: string
  }
  postingSchedule: string
  quickTip: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      title="העתק"
      className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-text2 hover:text-accent transition-colors"
    >
      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
    </button>
  )
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-card-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg2 hover:bg-card transition-colors text-sm font-semibold text-text"
      >
        <span>{title}</span>
        {open ? <ChevronUp size={14} className="text-text2" /> : <ChevronDown size={14} className="text-text2" />}
      </button>
      {open && <div className="p-4 bg-card/40">{children}</div>}
    </div>
  )
}

function TextBlock({ label, value }: { label?: string; value: string }) {
  return (
    <div className="space-y-1.5">
      {label && <p className="text-[10px] text-text2 uppercase tracking-wide font-medium">{label}</p>}
      <div className="relative group">
        <div className="bg-bg2 rounded-lg p-3 text-sm text-text leading-relaxed whitespace-pre-wrap">
          {value}
        </div>
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={value} />
        </div>
      </div>
    </div>
  )
}

export default function ContentHabitsPanel() {
  const [plan, setPlan] = useState<ContentPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)

  async function generatePlan() {
    setLoading(true)
    setError(null)
    setPlan(null)
    try {
      const res = await fetch('/api/content/weekly-plan', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setPlan(data.plan)
        setHasData(data.hasData ?? false)
      }
    } catch (err) {
      setError(`שגיאת רשת: ${err instanceof Error ? err.message : err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-text text-base flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            תוכנית תוכן שבועית
          </h2>
          <p className="text-text2 text-xs mt-0.5">
            יועץ ה-AI יבנה לך תוכן מוכן לביצוע
          </p>
        </div>

        {/* Weekly goals */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-red-600/15 border border-red-600/25 rounded-lg px-2.5 py-1.5">
            <PlayCircle size={12} className="text-red-500" />
            <span className="text-[11px] font-bold text-red-400">1/שבוע</span>
          </div>
          <div className="flex items-center gap-1 bg-pink-600/15 border border-pink-600/25 rounded-lg px-2.5 py-1.5">
            <Camera size={12} className="text-pink-500" />
            <span className="text-[11px] font-bold text-pink-400">2 Reels/שבוע</span>
          </div>
        </div>
      </div>

      {/* Generate button */}
      {!plan && !loading && (
        <button
          onClick={generatePlan}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent2 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(124,58,237,0.25)]"
        >
          <Zap size={15} />
          ייצר תוכנית תוכן לשבוע הזה
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 size={28} className="animate-spin text-accent" />
          <p className="text-sm text-text2">Claude מנתח תוכן ויראלי ובונה תוכנית...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
          {error}
          <button onClick={generatePlan} className="mr-3 text-text2 hover:text-text underline text-xs">נסה שוב</button>
        </div>
      )}

      {/* Plan content */}
      {plan && (
        <div className="space-y-3">
          {/* Topic header */}
          <div className="p-4 bg-gradient-to-r from-accent/10 to-accent2/10 border border-accent/20 rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text2 uppercase tracking-wide mb-1">נושא השבוע</p>
                <h3 className="font-extrabold text-text text-base leading-tight">{plan.weeklyTopic}</h3>
                <p className="text-xs text-text2 mt-1 leading-relaxed">{plan.topicReason}</p>
              </div>
              <CopyButton text={plan.weeklyTopic} />
            </div>
            {!hasData && (
              <p className="text-[10px] text-text2/60 mt-2 border-t border-card-border pt-2">
                💡 הוסף מתחרים ב-YouTube/Instagram כדי לקבל המלצות מבוססות נתונים ויראליים
              </p>
            )}
          </div>

          {/* YouTube section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PlayCircle size={14} className="text-red-500" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wide">YouTube — סרטון שבועי</span>
            </div>

            <Section title={`📌 כותרת: ${plan.youtube.title}`} defaultOpen={true}>
              <TextBlock label="כותרת" value={plan.youtube.title} />
            </Section>

            <Section title="🎙️ סקריפט לטלפרומפטר">
              <TextBlock value={plan.youtube.script} />
            </Section>

            <Section title="🖼️ פרומפט ל-Thumbnail">
              <TextBlock value={plan.youtube.thumbnailPrompt} />
            </Section>

            <Section title="📝 תיאור ו-Hashtags">
              <div className="space-y-3">
                <TextBlock label="תיאור" value={plan.youtube.description} />
                {plan.youtube.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {plan.youtube.hashtags.map((h, i) => (
                      <span key={i} className="bg-red-600/15 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded">
                        #{h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* Instagram Reels */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Camera size={14} className="text-pink-500" />
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wide">Instagram — 2 Reels</span>
            </div>

            {[
              { reel: plan.reel1, num: 1 },
              { reel: plan.reel2, num: 2 },
            ].map(({ reel, num }) => (
              <Section key={num} title={`📱 רייל ${num}: ${reel.concept}`}>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-text2 uppercase tracking-wide mb-1">פותחן — 3 שניות ראשונות</p>
                    <div className="bg-pink-600/10 border border-pink-500/20 rounded-lg p-3 text-sm text-text flex items-start justify-between gap-2">
                      <span>&quot;{reel.hook}&quot;</span>
                      <CopyButton text={reel.hook} />
                    </div>
                  </div>
                  <TextBlock label="סקריפט" value={reel.script} />
                  <TextBlock label="קפשן + hashtags" value={reel.caption} />
                </div>
              </Section>
            ))}
          </div>

          {/* Schedule + tip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-bg2 rounded-xl border border-card-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={13} className="text-accent2" />
                <span className="text-xs font-bold text-text">לוח זמנים מומלץ</span>
              </div>
              <p className="text-xs text-text2 leading-relaxed">{plan.postingSchedule}</p>
            </div>
            <div className="p-4 bg-bg2 rounded-xl border border-card-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={13} className="text-yellow-400" />
                <span className="text-xs font-bold text-text">טיפ השבוע</span>
              </div>
              <p className="text-xs text-text2 leading-relaxed">{plan.quickTip}</p>
            </div>
          </div>

          {/* Regenerate */}
          <button
            onClick={generatePlan}
            className="w-full flex items-center justify-center gap-2 border border-card-border text-text2 py-2.5 rounded-xl text-sm font-medium hover:text-text hover:border-accent/40 transition-all"
          >
            <Zap size={13} />
            ייצר תוכנית חדשה
          </button>
        </div>
      )}
    </div>
  )
}
