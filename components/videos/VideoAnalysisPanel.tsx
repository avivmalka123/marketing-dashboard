'use client'
import { useState, useEffect } from 'react'
import {
  X, Wand2, Loader2, ExternalLink, Copy, Check, BookOpen,
  Rocket, Tag, Type, AlignLeft, Wrench, FileText, Image as ImageIcon,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import type { VideoWithCompetitor, VideoAnalysis } from '@/types'

interface Props {
  video: VideoWithCompetitor | null
  onClose: () => void
  onCreateBlog?: (title: string, videoId: string) => void
}

interface CampaignResult {
  tags: string[]
  viralTitle: string
  description: string
  tools: string[]
  transcript: string | null        // timestamped display
  transcriptRaw: string | null     // plain text for copy-all
  hasTranscript: boolean
  thumbnailUrl: string
  thumbnailPrompt: string
}

type CopiedKey = string | null

export default function VideoAnalysisPanel({ video, onClose, onCreateBlog }: Props) {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  // Campaign state
  const [campaign, setCampaign] = useState<CampaignResult | null>(null)
  const [campaignLoading, setCampaignLoading] = useState(false)
  const [campaignError, setCampaignError] = useState('')
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<CopiedKey>(null)
  const [transcriptExpanded, setTranscriptExpanded] = useState(false)

  useEffect(() => {
    if (!video) {
      setAnalysis(null)
      setCampaign(null)
      setCampaignOpen(false)
      setCampaignError('')
      return
    }
    setAnalysis(null)
    setCampaign(null)
    setCampaignOpen(false)
    setCampaignError('')
    setLoading(true)

    fetch('/api/videos/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video.videoId }),
    })
      .then(r => r.json())
      .then(data => setAnalysis(data.analysis))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [video?.videoId])

  if (!video) return null

  function copyTitle(title: string, idx: number) {
    navigator.clipboard.writeText(title)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  function copyField(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  async function handleCreateCampaign() {
    if (!video || campaignLoading) return
    setCampaignOpen(true)
    setCampaignLoading(true)
    setCampaignError('')

    try {
      const res = await fetch('/api/videos/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.videoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה ביצירת הקמפיין')
      setCampaign(data as CampaignResult)
    } catch (err) {
      setCampaignError(err instanceof Error ? err.message : 'שגיאה ביצירת הקמפיין')
    } finally {
      setCampaignLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed right-64 top-0 bottom-0 w-[520px] bg-bg2 border-l border-card-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center">
                <Wand2 size={14} className="text-white" />
              </div>
              <div>
                <span className="text-xs text-accent font-semibold uppercase tracking-wider block">ניתוח AI</span>
                <span className="text-sm font-bold text-text">Claude מנתח עבורך</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Video info */}
          <div className="flex items-start gap-3 mb-5 p-3 bg-card border border-card-border rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-text line-clamp-2 leading-snug">{video.title}</p>
              <p className="text-xs text-text2 mt-1">{video.competitor.name}</p>
            </div>
            <a
              href={`https://youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text2 hover:text-accent2 transition-colors flex-shrink-0"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Original tags */}
          {video.tags.length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">
                תגיות מקוריות מהסרטון
              </p>
              <div className="flex flex-wrap gap-1.5">
                {video.tags.slice(0, 12).map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── AI Analysis ─────────────────────────────────────────────────── */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-accent/30 animate-spin border-t-accent" />
              </div>
              <p className="text-sm text-text2">Claude מנתח את הסרטון...</p>
              <p className="text-xs text-text2/60">יוצר כותרות עברית ובריף תוכן</p>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-6">
              {/* Hebrew titles */}
              <section>
                <p className="text-[11px] font-semibold text-text2 uppercase tracking-wider mb-3">
                  כותרות עברית מותאמות לישראלים
                </p>
                <div className="space-y-2">
                  {analysis.hebrewTitles.map((title, i) => (
                    <button
                      key={i}
                      onClick={() => copyTitle(title, i)}
                      className="w-full text-right p-3 bg-card border border-card-border rounded-xl text-sm text-text hover:border-accent/40 transition-all flex items-center justify-between gap-2 group"
                    >
                      <span className="flex-1 text-right leading-snug">{title}</span>
                      <span className="flex-shrink-0 text-text2 group-hover:text-accent transition-colors">
                        {copied === i ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Why good */}
              <section>
                <p className="text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">
                  למה זה הצעה מצוינת
                </p>
                <p className="text-sm text-text leading-relaxed bg-success/5 border border-success/20 rounded-xl p-4">
                  {analysis.whyGoodSuggestion}
                </p>
              </section>

              {/* Trend analysis */}
              {analysis.searchTrendAnalysis && (
                <section>
                  <p className="text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">
                    ניתוח מגמות חיפוש ישראלי
                  </p>
                  <p className="text-sm text-text2 leading-relaxed bg-warning/5 border border-warning/20 rounded-xl p-4">
                    {analysis.searchTrendAnalysis}
                  </p>
                </section>
              )}

              {/* Content brief */}
              {analysis.contentBrief && (
                <section>
                  <p className="text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">
                    בריף תוכן מפורט
                  </p>
                  <div className="text-sm text-text leading-relaxed bg-card border border-card-border rounded-xl p-4 whitespace-pre-wrap">
                    {analysis.contentBrief}
                  </div>
                </section>
              )}

              {/* ── CTAs ────────────────────────────────────────────────────── */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleCreateCampaign}
                  disabled={campaignLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-accent to-accent2 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {campaignLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>יוצר קמפיין... (20-30 שניות)</span>
                    </>
                  ) : (
                    <>
                      <Rocket size={16} />
                      <span>🚀 יצירת קמפיין מלא</span>
                    </>
                  )}
                </button>

                {onCreateBlog && (
                  <button
                    onClick={() => onCreateBlog(analysis.hebrewTitles[0], video.videoId)}
                    className="w-full flex items-center justify-center gap-2 bg-card border border-card-border text-text2 hover:text-text hover:border-accent/40 font-medium py-2.5 rounded-xl transition-all text-sm"
                  >
                    <BookOpen size={15} />
                    צור מאמר SEO מהסרטון הזה
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Campaign Results ─────────────────────────────────────────────── */}
          {campaignOpen && (
            <div className="mt-6 pt-6 border-t border-card-border">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-accent flex items-center justify-center flex-shrink-0">
                  <Rocket size={13} className="text-white" />
                </div>
                <h4 className="font-bold text-text text-sm">קמפיין שיווקי מלא</h4>
              </div>

              {campaignLoading && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 animate-spin border-t-purple-500" />
                  <p className="text-sm text-text2">Claude יוצר את הקמפיין...</p>
                  <p className="text-xs text-text2/60">תגיות · כותרת ויראלית · תיאור · תמלול · Thumbnail</p>
                </div>
              )}

              {campaignError && !campaignLoading && (
                <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4">
                  {campaignError}
                </p>
              )}

              {campaign && !campaignLoading && (
                <div className="space-y-4">

                  {/* 1. Hebrew Tags */}
                  <CampaignSection
                    icon={<Tag size={13} />}
                    title="תגיות לסרטון (עברית/אנגלית)"
                    copyText={campaign.tags.join(', ')}
                    copyKey="tags"
                    copiedKey={copiedKey}
                    onCopy={copyField}
                  >
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {campaign.tags.map((tag, i) => (
                        <button
                          key={i}
                          onClick={() => copyField(tag, `tag-${i}`)}
                          className="text-[11px] px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-md hover:bg-accent/20 transition-colors"
                        >
                          {copiedKey === `tag-${i}` ? '✓' : tag}
                        </button>
                      ))}
                    </div>
                  </CampaignSection>

                  {/* 2. Viral Hebrew Title */}
                  <CampaignSection
                    icon={<Type size={13} />}
                    title="כותרת ויראלית בעברית"
                    copyText={campaign.viralTitle}
                    copyKey="viralTitle"
                    copiedKey={copiedKey}
                    onCopy={copyField}
                  >
                    <p className="text-sm text-text font-semibold bg-card border border-card-border rounded-lg px-3 py-2.5 mt-2 leading-relaxed">
                      {campaign.viralTitle}
                    </p>
                  </CampaignSection>

                  {/* 3. YouTube Description */}
                  <CampaignSection
                    icon={<AlignLeft size={13} />}
                    title="תיאור ליוטיוב"
                    copyText={campaign.description}
                    copyKey="description"
                    copiedKey={copiedKey}
                    onCopy={copyField}
                  >
                    <pre className="text-xs text-text2 bg-card border border-card-border rounded-lg px-3 py-2.5 mt-2 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
                      {campaign.description}
                    </pre>
                  </CampaignSection>

                  {/* 4. Full Transcript */}
                  <div className="bg-card/50 border border-card-border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-accent2" />
                        <span className="text-[11px] font-semibold text-text2 uppercase tracking-wider">תמלול מלא</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {campaign.transcriptRaw && (
                          <button
                            onClick={() => copyField(campaign.transcriptRaw!, 'transcript')}
                            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors"
                          >
                            {copiedKey === 'transcript' ? (
                              <><Check size={11} /> הועתק</>
                            ) : (
                              <><Copy size={11} /> העתק הכל</>
                            )}
                          </button>
                        )}
                        {campaign.transcript && (
                          <button
                            onClick={() => setTranscriptExpanded(v => !v)}
                            className="text-text2 hover:text-text transition-colors p-0.5"
                          >
                            {transcriptExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {!campaign.hasTranscript ? (
                      <p className="text-xs text-text2/70 italic mt-1.5">
                        לא נמצא תמלול לסרטון זה — ייתכן שאין כתוביות אוטומטיות.
                      </p>
                    ) : (
                      <>
                        <p className="text-[11px] text-accent/70 mt-1">
                          ✓ תמלול עם timestamps — לחץ ← להצגה מלאה
                        </p>
                        {transcriptExpanded && campaign.transcript && (
                          <pre className="text-xs text-text2 bg-bg border border-card-border rounded-lg px-3 py-2.5 mt-2 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-mono">
                            {campaign.transcript}
                          </pre>
                        )}
                      </>
                    )}
                  </div>

                  {/* 5. Tools & Products */}
                  {campaign.tools.length > 0 && (
                    <CampaignSection
                      icon={<Wrench size={13} />}
                      title="כלים ומוצרים מהסרטון"
                      copyText={campaign.tools.join('\n')}
                      copyKey="tools"
                      copiedKey={copiedKey}
                      onCopy={copyField}
                    >
                      <ul className="mt-2 space-y-1.5">
                        {campaign.tools.map((tool, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-text">
                            <span className="text-accent2 text-xs leading-none">▸</span>
                            {tool}
                          </li>
                        ))}
                      </ul>
                    </CampaignSection>
                  )}

                  {/* 6. Thumbnail */}
                  <div className="bg-card/50 border border-card-border rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={13} className="text-accent2" />
                      <span className="text-[11px] font-semibold text-text2 uppercase tracking-wider">Thumbnail לסרטון</span>
                    </div>

                    {campaign.thumbnailUrl ? (
                      <div className="space-y-2">
                        <img
                          src={campaign.thumbnailUrl}
                          alt="Generated thumbnail"
                          className="w-full rounded-lg border border-card-border object-cover aspect-video"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <a
                            href={campaign.thumbnailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors"
                          >
                            <ExternalLink size={11} />
                            פתח בגודל מלא
                          </a>
                          <button
                            onClick={() => copyField(campaign.thumbnailUrl, 'thumbnailUrl')}
                            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-card border border-card-border text-text2 rounded-lg hover:text-text transition-colors"
                          >
                            {copiedKey === 'thumbnailUrl'
                              ? <><Check size={11} /> הועתק</>
                              : <><Copy size={11} /> העתק URL</>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-bg border border-dashed border-card-border rounded-lg p-4 text-center">
                          <ImageIcon size={22} className="text-text2/40 mx-auto mb-1.5" />
                          <p className="text-xs text-text2">Nano Banana לא מוגדר — לא נוצרה תמונה</p>
                          <p className="text-[11px] text-text2/60 mt-0.5">הגדר NANO_BANANA_API_KEY בהגדרות</p>
                        </div>
                        {campaign.thumbnailPrompt && (
                          <>
                            <p className="text-[11px] text-text2/70">📋 פרומפט מוכן לכלי עיצוב (Canva, Midjourney וכד׳):</p>
                            <button
                              onClick={() => copyField(campaign.thumbnailPrompt, 'thumbnailPrompt')}
                              className="w-full text-right text-[11px] text-text2 bg-bg border border-card-border rounded-lg px-2.5 py-2 hover:border-accent/30 transition-colors flex items-start gap-2"
                            >
                              <span className="flex-1 leading-relaxed">{campaign.thumbnailPrompt}</span>
                              <span className="flex-shrink-0 mt-0.5">
                                {copiedKey === 'thumbnailPrompt'
                                  ? <Check size={11} className="text-success" />
                                  : <Copy size={11} />}
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Reusable section with copy button ───────────────────────────────────────
function CampaignSection({
  icon,
  title,
  copyText,
  copyKey,
  copiedKey,
  onCopy,
  children,
}: {
  icon: React.ReactNode
  title: string
  copyText: string
  copyKey: string
  copiedKey: CopiedKey
  onCopy: (text: string, key: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-card/50 border border-card-border rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-accent2">{icon}</span>
          <span className="text-[11px] font-semibold text-text2 uppercase tracking-wider">{title}</span>
        </div>
        <button
          onClick={() => onCopy(copyText, copyKey)}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors"
        >
          {copiedKey === copyKey
            ? <><Check size={11} /> הועתק</>
            : <><Copy size={11} /> העתק</>}
        </button>
      </div>
      {children}
    </div>
  )
}
