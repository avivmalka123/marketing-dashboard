'use client'
import { useState } from 'react'
import {
  Wand2, Loader2, Image as ImageIcon, Eye, CheckCircle2,
  Calendar, Copy, ExternalLink, Layers, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Kajabi URLs (user's specific site) ───────────────────────────────────────
const KAJABI_NEW_POST    = 'https://app.kajabi.com/admin/sites/2147533064/blog_posts/new'
const KAJABI_BLOG_ADMIN  = 'https://app.kajabi.com/admin/sites/2147533064/blog_posts'

interface BlogPost {
  id: string
  title: string
  metaDescription: string | null
  slug: string | null
  status: string
  imageUrl: string | null
  content: string
  createdAt: string
  scheduledFor: string | null
  kajabiPostId: string | null
}

interface BulkResult {
  topic: string
  blogPost: BlogPost | null
  keywords: string[]
  imagePrompt: string
  error?: string
  copied: boolean
}

interface Props {
  onGenerated: () => void
  initialTopic?: string
  initialVideoId?: string
}

// ── Wrap content in RTL div for Kajabi ───────────────────────────────────────
function buildRtlHtml(content: string) {
  return `<div dir="rtl" style="direction:rtl;text-align:right;font-family:'Heebo',Arial,sans-serif;line-height:1.7;color:#1a1a1a">\n${content}\n</div>`
}

// ── Single article result card ────────────────────────────────────────────────
function BulkResultCard({ result, onCopyChange }: {
  result: BulkResult
  onCopyChange: (topic: string, val: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  async function handleCopy() {
    if (!result.blogPost) return
    try {
      await navigator.clipboard.writeText(buildRtlHtml(result.blogPost.content))
      window.open(KAJABI_NEW_POST, '_blank')
      onCopyChange(result.topic, true)
      setTimeout(() => onCopyChange(result.topic, false), 6000)
    } catch {
      // noop
    }
  }

  if (result.error) {
    return (
      <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl">
        <p className="text-xs font-semibold text-text line-clamp-1">{result.topic}</p>
        <p className="text-xs text-danger mt-1">{result.error}</p>
      </div>
    )
  }

  if (!result.blogPost) return null

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-2 p-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text line-clamp-1">{result.blogPost.title}</p>
          {result.blogPost.metaDescription && (
            <p className="text-xs text-text2 line-clamp-1 mt-0.5">{result.blogPost.metaDescription}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-text2 hover:text-text transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Keywords */}
      {result.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {result.keywords.slice(0, 5).map(kw => (
            <span key={kw} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">{kw}</span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5 px-3 pb-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 flex-1 justify-center text-xs font-semibold bg-gradient-to-r from-accent to-accent2 text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          {result.copied ? <><CheckCircle2 size={12} /> הועתק!</> : <><Copy size={12} /> העתק ל-Kajabi</>}
        </button>
        <button
          onClick={() => {
            const w = window.open('', '_blank')
            if (w) {
              w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${result.blogPost!.title}</title></head><body style="font-family:sans-serif;max-width:800px;margin:auto;padding:2rem">${result.blogPost!.content}</body></html>`)
              w.document.close()
            }
          }}
          className="flex items-center gap-1 text-xs px-2.5 py-2 bg-bg border border-card-border text-text2 rounded-lg hover:text-text transition-colors"
        >
          <Eye size={12} />
        </button>
      </div>

      {/* Expanded: image prompt */}
      {expanded && result.imagePrompt && (
        <div className="border-t border-card-border px-3 py-2.5 bg-bg/50">
          <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-1.5">
            🖼️ פרומפט לתמונה (Nano Banana / Midjourney):
          </p>
          <p className="text-[11px] text-text2 leading-relaxed">{result.imagePrompt}</p>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BlogGenerator({ onGenerated, initialTopic = '', initialVideoId = '' }: Props) {
  // Single mode
  const [topic, setTopic] = useState(initialTopic)
  const [generateImage, setGenerateImage] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState<BlogPost | null>(null)
  const [keywords, setKeywords] = useState<string[]>([])
  const [imagePrompt, setImagePrompt] = useState('')
  const [error, setError] = useState('')

  // Bulk mode
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkTitles, setBulkTitles] = useState('')
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkTotal, setBulkTotal] = useState(0)
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([])
  const [bulkError, setBulkError] = useState('')

  // ── Single generation ─────────────────────────────────────────────────────
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setError('')
    setPreview(null)
    setKeywords([])
    setImagePrompt('')

    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, videoId: initialVideoId || undefined, generateImageFlag: generateImage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה')
      setPreview(data.blogPost)
      setKeywords(data.keywords ?? [])
      setImagePrompt(data.imagePrompt ?? '')
      onGenerated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת המאמר')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublishToKajabi() {
    if (!preview) return
    setPublishing(true)
    setCopied(false)
    try {
      await navigator.clipboard.writeText(buildRtlHtml(preview.content))
      setCopied(true)
      window.open(KAJABI_NEW_POST, '_blank')
      setPreview(prev => prev ? { ...prev, status: 'published' } : null)
      setTimeout(() => setCopied(false), 6000)
      onGenerated()
    } catch {
      setError('לא ניתן להעתיק. לחץ "תצוגה" והעתק ידנית.')
    } finally {
      setPublishing(false)
    }
  }

  // ── Bulk generation ───────────────────────────────────────────────────────
  async function handleBulkGenerate() {
    const lines = bulkTitles
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 10)

    if (lines.length === 0) {
      setBulkError('הכנס לפחות כותרת אחת')
      return
    }

    setBulkGenerating(true)
    setBulkError('')
    setBulkResults([])
    setBulkProgress(0)
    setBulkTotal(lines.length)

    // Initialise result slots
    const slots: BulkResult[] = lines.map(t => ({ topic: t, blogPost: null, keywords: [], imagePrompt: '', copied: false }))
    setBulkResults([...slots])

    // Fire all requests in parallel
    await Promise.allSettled(
      lines.map(async (t, idx) => {
        try {
          const res = await fetch('/api/blog/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: t, generateImageFlag: generateImage }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'שגיאה')
          slots[idx] = {
            topic: t,
            blogPost: data.blogPost,
            keywords: data.keywords ?? [],
            imagePrompt: data.imagePrompt ?? '',
            copied: false,
          }
        } catch (err) {
          slots[idx] = {
            topic: t,
            blogPost: null,
            keywords: [],
            imagePrompt: '',
            error: err instanceof Error ? err.message : 'שגיאה',
            copied: false,
          }
        } finally {
          setBulkProgress(p => p + 1)
          setBulkResults([...slots])
        }
      })
    )

    setBulkGenerating(false)
    onGenerated()
  }

  function handleBulkCopyChange(topic: string, val: boolean) {
    setBulkResults(prev => prev.map(r => r.topic === topic ? { ...r, copied: val } : r))
  }

  const isPublished = preview?.status === 'published'
  const successCount = bulkResults.filter(r => r.blogPost).length

  return (
    <div className="glass-card p-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center">
            <Wand2 size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-text">יצירת מאמר SEO</h3>
            <p className="text-xs text-text2">Claude כותב + מוכן לפרסום ב-Kajabi</p>
          </div>
        </div>

        {/* Mode toggle */}
        <button
          onClick={() => { setBulkMode(v => !v); setBulkResults([]); setBulkError('') }}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            bulkMode
              ? 'bg-accent/20 border-accent/40 text-accent font-semibold'
              : 'bg-card border-card-border text-text2 hover:text-text'
          }`}
        >
          <Layers size={12} />
          {bulkMode ? 'מצב Bulk' : 'Bulk (עד 10)'}
        </button>
      </div>

      {/* ── Options row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => setGenerateImage(!generateImage)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            generateImage
              ? 'bg-accent/20 border-accent/40 text-accent'
              : 'bg-card border-card-border text-text2 hover:text-text'
          }`}
        >
          <ImageIcon size={14} />
          <span>צור תמונה (Nano Banana)</span>
        </button>
      </div>

      <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-xl px-3 py-2.5 mb-4">
        <Calendar size={14} className="text-accent shrink-0" />
        <p className="text-xs text-text2">
          לאחר יצירה לחץ <strong className="text-accent">&quot;העתק ל-Kajabi&quot;</strong> — HTML יועתק + Kajabi Admin יפתח
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SINGLE MODE */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {!bulkMode && (
        <>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text2 mb-2">נושא המאמר</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="לדוגמה: איך להגדיל עוקבים באינסטגרם 2025"
                className="w-full bg-bg2 border border-card-border rounded-xl px-4 py-3 text-text placeholder-text2 focus:outline-none focus:border-accent/60 text-sm transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={generating || !topic.trim()}
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-accent to-accent2 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {generating ? (
                <><Loader2 size={16} className="animate-spin" /><span>Claude כותב...</span></>
              ) : (
                <><Wand2 size={16} /><span>צור מאמר SEO</span></>
              )}
            </button>
          </form>

          {/* Preview */}
          {preview && (
            <div className="mt-6 pt-6 border-t border-card-border space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-text text-sm">תוצאה</h4>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isPublished ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                  {isPublished ? '✓ פורסם' : 'טיוטה'}
                </span>
              </div>

              <div className="bg-bg2 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-text">{preview.title}</h5>
                {preview.metaDescription && <p className="text-sm text-text2">{preview.metaDescription}</p>}
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map(kw => (
                      <span key={kw} className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">{kw}</span>
                    ))}
                  </div>
                )}
                {!isPublished && (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 space-y-1">
                    <p className="text-[11px] text-accent font-semibold">📋 איך לפרסם:</p>
                    <p className="text-[11px] text-text2">לחץ &quot;העתק ל-Kajabi&quot; ← יפתח Kajabi Admin ← הדבק ב-HTML</p>
                  </div>
                )}
                {preview.imageUrl && <p className="text-xs text-accent2">🖼️ תמונה נוצרה</p>}
              </div>

              {/* Image prompt */}
              {imagePrompt && (
                <div className="bg-bg2 rounded-xl p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                    🖼️ פרומפט לתמונה (Nano Banana / Midjourney):
                  </p>
                  <p className="text-xs text-text2 leading-relaxed">{imagePrompt}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {!isPublished && (
                  <button
                    onClick={handlePublishToKajabi}
                    disabled={publishing}
                    className="flex items-center gap-2 flex-1 justify-center bg-gradient-to-r from-accent to-accent2 text-white font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 text-sm min-w-[160px]"
                  >
                    {publishing ? <><Loader2 size={14} className="animate-spin" /><span>מעתיק...</span></>
                      : copied ? <><CheckCircle2 size={14} /><span>✓ הועתק! הדבק ב-Kajabi</span></>
                        : <><Copy size={14} /><span>העתק ל-Kajabi</span></>}
                  </button>
                )}
                <a
                  href={KAJABI_BLOG_ADMIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-card-border text-text2 hover:text-text hover:border-accent/40 text-sm transition-all"
                >
                  <ExternalLink size={14} /><span>Kajabi Admin</span>
                </a>
                <button
                  onClick={() => {
                    const w = window.open('', '_blank')
                    if (w) {
                      w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${preview.title}</title></head><body style="font-family:sans-serif;max-width:800px;margin:auto;padding:2rem">${preview.content}</body></html>`)
                      w.document.close()
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-card-border text-text2 hover:text-text text-sm"
                >
                  <Eye size={14} /><span>תצוגה</span>
                </button>
              </div>

              {copied && (
                <div className="flex items-start gap-2 bg-success/10 border border-success/30 rounded-xl p-3">
                  <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                  <div className="text-xs text-success space-y-0.5">
                    <p className="font-semibold">ה-HTML הועתק! Kajabi Admin נפתח בטאב חדש.</p>
                    <p className="text-success/80">הוסף כותרת → לחץ HTML → הדבק (Ctrl+V / ⌘V)</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* BULK MODE */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {bulkMode && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text2 mb-1">
              כותרות מאמרים (עד 10, כל כותרת בשורה נפרדת)
            </label>
            <textarea
              value={bulkTitles}
              onChange={e => setBulkTitles(e.target.value)}
              placeholder={"איך להרוויח כסף בדרופשיפינג 2025\nהמדריך המלא לאינסטגרם שופינג\n5 טעויות שכולם עושים בשיווק דיגיטלי\n..."}
              rows={8}
              className="w-full bg-bg2 border border-card-border rounded-xl px-4 py-3 text-text placeholder-text2 focus:outline-none focus:border-accent/60 text-sm font-mono resize-none transition-colors"
            />
            <p className="text-xs text-text2 mt-1">
              {bulkTitles.split('\n').filter(l => l.trim()).length} / 10 כותרות
            </p>
          </div>

          {bulkError && (
            <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{bulkError}</p>
          )}

          <button
            onClick={handleBulkGenerate}
            disabled={bulkGenerating || !bulkTitles.trim()}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-accent to-accent2 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {bulkGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>יוצר {bulkProgress}/{bulkTotal} מאמרים...</span>
              </>
            ) : (
              <>
                <Layers size={16} />
                <span>צור {bulkTitles.split('\n').filter(l => l.trim()).slice(0, 10).length} מאמרים במקביל</span>
              </>
            )}
          </button>

          {/* Progress bar */}
          {bulkGenerating && bulkTotal > 0 && (
            <div className="w-full bg-bg2 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent2 transition-all duration-500 rounded-full"
                style={{ width: `${(bulkProgress / bulkTotal) * 100}%` }}
              />
            </div>
          )}

          {/* Results */}
          {bulkResults.length > 0 && !bulkGenerating && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-text">
                  {successCount}/{bulkResults.length} מאמרים נוצרו
                </p>
                <a
                  href={KAJABI_BLOG_ADMIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <ExternalLink size={12} />
                  פתח Kajabi Admin
                </a>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {bulkResults.map(r => (
                  <BulkResultCard
                    key={r.topic}
                    result={r}
                    onCopyChange={handleBulkCopyChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* In-progress skeleton placeholders */}
          {bulkGenerating && bulkResults.filter(r => !r.blogPost && !r.error).length > 0 && (
            <div className="space-y-2">
              {bulkResults.filter(r => !r.blogPost && !r.error).map(r => (
                <div key={r.topic} className="p-3 bg-card border border-card-border rounded-xl animate-pulse">
                  <p className="text-xs font-semibold text-text2 line-clamp-1">{r.topic}</p>
                  <div className="h-2 bg-text2/10 rounded mt-2 w-2/3" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
