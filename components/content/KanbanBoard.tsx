'use client'
import { useState, useCallback, useEffect } from 'react'
import { Wand2, Loader2, Plus, Sparkles } from 'lucide-react'
import IdeaCard, { type Idea } from './IdeaCard'

type IdeaStatus = 'Ideas' | 'In Progress' | 'Published'

const COLUMNS: Array<{ key: IdeaStatus; label: string; color: string }> = [
  { key: 'Ideas', label: 'רעיונות', color: 'text-accent' },
  { key: 'In Progress', label: 'בעבודה', color: 'text-warning' },
  { key: 'Published', label: 'פורסם', color: 'text-success' },
]

const STORAGE_KEY    = 'marketing-dashboard-ideas-v2'
const LIKED_KEY      = 'marketing-dashboard-liked-ids'
const REFRESH_TS_KEY = 'marketing-dashboard-ideas-refresh-ts'
const TWO_DAYS_MS    = 2 * 24 * 60 * 60 * 1000

interface Props {
  initialIdeas: Idea[]
}

function loadFromStorage(): Idea[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Idea[]
  } catch { return null }
}

function saveToStorage(ideas: Idea[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas)) } catch {}
}


function saveLikedIds(ids: Set<string>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(ids))) } catch {}
}

export default function KanbanBoard({ initialIdeas }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) return stored
    return initialIdeas
  })
  const [generating, setGenerating] = useState(false)
  const [generatingSimilar, setGeneratingSimilar] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  // Persist to localStorage whenever ideas change
  useEffect(() => {
    saveToStorage(ideas)
  }, [ideas])

  // Merge initialIdeas from server into localStorage on first load
  useEffect(() => {
    if (initialIdeas.length > 0) {
      setIdeas(prev => {
        const existingIds = new Set(prev.map(i => i.id))
        const newOnes = initialIdeas.filter(i => !existingIds.has(i.id))
        if (newOnes.length === 0) return prev
        const merged = [...prev, ...newOnes]
        saveToStorage(merged)
        return merged
      })
    }
  }, [initialIdeas])

  // Auto-generate 3 ideas on mount if empty or > 2 days since last refresh
  useEffect(() => {
    if (typeof window === 'undefined') return
    const currentIdeas = loadFromStorage() ?? []
    const ideasCount = currentIdeas.filter(i => i.status === 'Ideas').length
    const lastRefreshRaw = localStorage.getItem(REFRESH_TS_KEY)
    const lastRefresh = lastRefreshRaw ? parseInt(lastRefreshRaw, 10) : 0
    const isStale = Date.now() - lastRefresh > TWO_DAYS_MS

    if (ideasCount < 3 || isStale) {
      // small delay so page renders first
      const timer = setTimeout(() => {
        generateIdeas(3)
        localStorage.setItem(REFRESH_TS_KEY, String(Date.now()))
      }, 800)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = ideas.filter(i => i.status === col.key)
      return acc
    },
    {} as Record<IdeaStatus, Idea[]>
  )

  const likedIdeas = ideas.filter(i => i.liked)

  async function handleStatusChange(id: string, status: IdeaStatus) {
    setIdeas(prev => prev.map(i => (i.id === id ? { ...i, status } : i)))
    // Try to update in DB (non-fatal)
    await fetch('/api/content-ideas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch(() => {})
  }

  function handleLike(id: string) {
    setIdeas(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, liked: !i.liked } : i)
      const likedIds = new Set(updated.filter(i => i.liked).map(i => i.id))
      saveLikedIds(likedIds)
      return updated
    })
  }

  async function handleDelete(id: string) {
    setIdeas(prev => prev.filter(i => i.id !== id))
    // Try DB delete (non-fatal)
    await fetch('/api/content-ideas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  async function generateIdeas(count = 6) {
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch('/api/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', count }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setGenError(data.error ?? 'שגיאה בייצור רעיונות')
        return
      }

      if (data.created > 0) {
        type RawIdea = {
          title: string; format: string; targetAudience?: string
          keywords?: string[]; seoScore?: number; notes?: string
          hook?: string; keyPoints?: string[]; recommendedLength?: string
          hashtags?: string[]; scriptOutline?: string
        }
        const rawIdeas: RawIdea[] = Array.isArray(data.ideas)
          ? data.ideas
          : []

        const mapped: Idea[] = rawIdeas.map((idea, i) => ({
          id: `gen_${Date.now()}_${i}`,
          title: idea.title,
          format: idea.format ?? 'video',
          targetAudience: idea.targetAudience ?? null,
          keywords: idea.keywords ?? [],
          seoScore: idea.seoScore ?? 50,
          status: 'Ideas' as IdeaStatus,
          notes: idea.notes ?? null,
          hook: idea.hook ?? null,
          keyPoints: idea.keyPoints ?? [],
          recommendedLength: idea.recommendedLength ?? null,
          hashtags: idea.hashtags ?? [],
          scriptOutline: idea.scriptOutline ?? null,
        }))

        setIdeas(prev => {
          const updated = [...mapped, ...prev]
          saveToStorage(updated)
          return updated
        })
      }
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'שגיאה בלתי צפויה')
    } finally {
      setGenerating(false)
    }
  }

  async function generateSimilarToLiked() {
    if (likedIdeas.length === 0) {
      setGenError('לחץ לייק על רעיונות שאהבת קודם')
      return
    }
    setGeneratingSimilar(true)
    setGenError(null)
    try {
      const res = await fetch('/api/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-similar',
          likedIdeas: likedIdeas.map(i => ({
            title: i.title,
            format: i.format,
            keywords: i.keywords,
          })),
          count: 4,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setGenError(data.error ?? 'שגיאה בייצור רעיונות דומים')
        return
      }
      if (data.created > 0 && Array.isArray(data.ideas)) {
        type RawIdea = {
          title: string; format: string; targetAudience?: string
          keywords?: string[]; seoScore?: number; notes?: string
          hook?: string; keyPoints?: string[]; recommendedLength?: string
          hashtags?: string[]; scriptOutline?: string
        }
        const mapped: Idea[] = (data.ideas as RawIdea[]).map((idea, i) => ({
          id: `sim_${Date.now()}_${i}`,
          title: idea.title,
          format: idea.format ?? 'video',
          targetAudience: idea.targetAudience ?? null,
          keywords: idea.keywords ?? [],
          seoScore: idea.seoScore ?? 65,
          status: 'Ideas' as IdeaStatus,
          notes: idea.notes ?? null,
          hook: idea.hook ?? null,
          keyPoints: idea.keyPoints ?? [],
          recommendedLength: idea.recommendedLength ?? null,
          hashtags: idea.hashtags ?? [],
          scriptOutline: idea.scriptOutline ?? null,
        }))
        setIdeas(prev => {
          const updated = [...mapped, ...prev]
          saveToStorage(updated)
          return updated
        })
      }
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'שגיאה בלתי צפויה')
    } finally {
      setGeneratingSimilar(false)
    }
  }

  const onDragStart = useCallback((id: string) => setDragId(id), [])
  const onDragEnd   = useCallback(() => setDragId(null), [])

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <p className="text-sm text-text2">{ideas.length} רעיונות סה&quot;כ</p>
          {likedIdeas.length > 0 && (
            <p className="text-xs text-red-400">❤️ {likedIdeas.length} אהובים</p>
          )}
        </div>
        <div className="flex gap-2">
          {likedIdeas.length > 0 && (
            <button
              onClick={generateSimilarToLiked}
              disabled={generatingSimilar}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold px-3 py-2 rounded-xl hover:bg-red-500/20 disabled:opacity-50 transition-all"
            >
              {generatingSimilar ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>צור דומים לאהובים</span>
            </button>
          )}
          <button
            onClick={() => generateIdeas()}
            disabled={generating}
            className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent2 text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            <span>צור רעיונות עם AI</span>
          </button>
        </div>
      </div>

      {genError && (
        <div className="mb-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5">
          {genError}
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map(col => (
          <div
            key={col.key}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              if (dragId) handleStatusChange(dragId, col.key)
            }}
            className="bg-bg2 border border-card-border rounded-2xl p-4 min-h-[400px]"
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-sm ${col.color}`}>{col.label}</h3>
              <span className="text-[11px] text-text2 bg-bg px-2 py-0.5 rounded-full">
                {grouped[col.key].length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {grouped[col.key].map(idea => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onDragStart={() => onDragStart(idea.id)}
                  onDragEnd={onDragEnd}
                  onStatusChange={status => handleStatusChange(idea.id, status)}
                  onLike={() => handleLike(idea.id)}
                  onDelete={() => handleDelete(idea.id)}
                />
              ))}

              {grouped[col.key].length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Plus size={20} className="text-text2/30 mb-2" />
                  <p className="text-xs text-text2/50">
                    {col.key === 'Ideas' ? 'צור רעיונות עם AI' : 'גרור כרטיסים לכאן'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
