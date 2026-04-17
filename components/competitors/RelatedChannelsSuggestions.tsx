'use client'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Loader2, ExternalLink, PlayCircle, Sparkles } from 'lucide-react'

interface Channel {
  name: string
  handle: string
  description: string
  language: 'Hebrew' | 'English'
  niche: string
}

interface Props {
  competitors: Array<{ name: string; channelId: string }>
}

const NICHE_LABELS: Record<string, string> = {
  ecommerce:      'איקומרס',
  dropshipping:   'דרופשיפינג',
  marketing:      'שיווק',
  entrepreneurship: 'יזמות',
  youtube:        'יוטיוב',
  general:        'כללי',
}

const NICHE_COLORS: Record<string, string> = {
  ecommerce:      'bg-purple-500/20 text-purple-300 border-purple-500/20',
  dropshipping:   'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  marketing:      'bg-orange-500/20 text-orange-300 border-orange-500/20',
  entrepreneurship: 'bg-green-500/20 text-green-300 border-green-500/20',
  youtube:        'bg-red-500/20 text-red-300 border-red-500/20',
  general:        'bg-gray-500/20 text-gray-400 border-gray-500/20',
}

function getCacheKey(competitors: Props['competitors']) {
  return `related-channels-v2-${competitors.map(c => c.channelId).sort().join(',')}`
}

export default function RelatedChannelsSuggestions({ competitors }: Props) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage cache on mount / when competitors change
  useEffect(() => {
    if (competitors.length === 0) { setChannels([]); setLoaded(false); return }
    try {
      const key = getCacheKey(competitors)
      const cached = localStorage.getItem(key)
      if (cached) {
        setChannels(JSON.parse(cached))
        setLoaded(true)
      } else {
        setLoaded(false)
      }
    } catch {
      setLoaded(false)
    }
  }, [competitors])

  const fetchSuggestions = useCallback(async () => {
    if (competitors.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/competitors/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitors }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const list: Channel[] = data.channels ?? []
      setChannels(list)
      setLoaded(true)
      try {
        localStorage.setItem(getCacheKey(competitors), JSON.stringify(list))
      } catch {}
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הצעות')
    } finally {
      setLoading(false)
    }
  }, [competitors])

  // Auto-fetch if no cache yet
  useEffect(() => {
    if (competitors.length > 0 && !loaded && !loading) {
      fetchSuggestions()
    }
  }, [competitors, loaded, loading, fetchSuggestions])

  if (competitors.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">ערוצים קשורים להשראה</h2>
            <p className="text-text2 text-sm">
              ערוצים נוספים שמומלץ לעקוב — מעודכן בהתאם למתחרים שלך
            </p>
          </div>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border border-card-border rounded-xl text-sm font-medium text-text2 hover:text-text transition-all hover:border-accent/40 disabled:opacity-50"
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : <RefreshCw size={14} />
          }
          <span>רענן הצעות</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && channels.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-card-border p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 bg-white/5 rounded" />
                <div className="h-2.5 bg-white/5 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Channel cards */}
      {channels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {channels.map((ch, i) => (
            <a
              key={i}
              href={`https://www.youtube.com/${ch.handle.startsWith('@') ? ch.handle : `@${ch.handle}`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl bg-card border border-card-border p-4 hover:border-accent/40 hover:bg-white/[0.03] transition-all duration-200"
            >
              {/* Channel avatar + name */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                    <PlayCircle size={15} className="text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-text group-hover:text-accent transition-colors leading-tight line-clamp-1">
                      {ch.name}
                    </div>
                    <div className="text-xs text-text2 mt-0.5">
                      {ch.handle.startsWith('@') ? ch.handle : `@${ch.handle}`}
                    </div>
                  </div>
                </div>
                <ExternalLink
                  size={12}
                  className="text-text2/40 group-hover:text-accent transition-colors flex-shrink-0 mt-1"
                />
              </div>

              {/* Description */}
              <p className="text-xs text-text2 leading-relaxed line-clamp-2 mb-3">
                {ch.description}
              </p>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {ch.niche && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${NICHE_COLORS[ch.niche] ?? NICHE_COLORS.general}`}>
                    {NICHE_LABELS[ch.niche] ?? ch.niche}
                  </span>
                )}
                {ch.language === 'Hebrew' && (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-300 border-blue-500/20">
                    🇮🇱 עברית
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
