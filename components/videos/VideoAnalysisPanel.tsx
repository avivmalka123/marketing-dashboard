'use client'
import { useState, useEffect } from 'react'
import { X, Wand2, Loader2, ExternalLink, Copy, Check, BookOpen } from 'lucide-react'
import type { VideoWithCompetitor, VideoAnalysis } from '@/types'

interface Props {
  video: VideoWithCompetitor | null
  onClose: () => void
  onCreateBlog?: (title: string, videoId: string) => void
}

export default function VideoAnalysisPanel({ video, onClose, onCreateBlog }: Props) {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    if (!video) {
      setAnalysis(null)
      return
    }
    setAnalysis(null)
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

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed right-64 top-0 bottom-0 w-[480px] bg-bg2 border-l border-card-border z-50 overflow-y-auto shadow-2xl">
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

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-accent/30 animate-spin border-t-accent" />
              </div>
              <p className="text-sm text-text2">Claude מנתח את הסרטון...</p>
              <p className="text-xs text-text2/60">יוצר כותרות עברית ובריף תוכן</p>
            </div>
          )}

          {/* Analysis results */}
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

              {/* CTA */}
              {onCreateBlog && (
                <button
                  onClick={() => onCreateBlog(analysis.hebrewTitles[0], video.videoId)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent2 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <BookOpen size={16} />
                  צור מאמר SEO מהסרטון הזה
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
