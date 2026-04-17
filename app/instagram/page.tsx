'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera, Plus, RefreshCw, Loader2, Trash2, ExternalLink,
  Heart, MessageCircle, Sparkles, X, BarChart2, Copy, Check, PenLine,
} from 'lucide-react'
import InstagramAnalyticsPage from '@/app/analytics/instagram/page'
import { formatNumber } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Creator {
  id: string
  handle: string
  name: string
  profilePicUrl?: string | null
  followersCount?: number | null
  mediaCount?: number | null
  bio?: string | null
  avgLikes?: number | null
  _count?: { reels: number }
  reels?: Array<{ reelId: string; caption?: string | null; thumbnailUrl?: string | null; likeCount: number; viralityScore: number }>
}

interface Reel {
  id: string
  creatorId: string
  reelId: string
  caption?: string | null
  thumbnailUrl?: string | null
  permalink: string
  likeCount: number
  commentCount: number
  viralityScore: number
  publishedAt: string
  creator?: { handle: string; name: string; profilePicUrl: string | null }
}

type Tab = 'creators' | 'reels' | 'analytics'

const TABS: Array<{ key: Tab; label: string; icon: React.ElementType }> = [
  { key: 'creators',  label: 'יוצרים',  icon: Camera },
  { key: 'reels',     label: 'רילסים',  icon: Sparkles },
  { key: 'analytics', label: 'אנליטיקס', icon: BarChart2 },
]

// ── Creator Card ──────────────────────────────────────────────────────────────
function CreatorCard({
  creator,
  onDelete,
  onSync,
  syncing,
}: {
  creator: Creator
  onDelete: (id: string) => void
  onSync: (id: string) => void
  syncing: boolean
}) {
  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {creator.profilePicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.profilePicUrl}
              alt={creator.name}
              className="w-11 h-11 rounded-full flex-shrink-0 object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {creator.handle.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-text text-sm truncate">{creator.name}</h3>
            <p className="text-xs text-text2">@{creator.handle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onSync(creator.id)}
            disabled={syncing}
            title="סנכרן רילסים"
            className="w-7 h-7 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-pink-400 transition-colors disabled:opacity-50"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
          <a
            href={`https://www.instagram.com/${creator.handle}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-pink-400 transition-colors"
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={() => onDelete(creator.id)}
            className="w-7 h-7 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-danger transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg2 rounded-xl p-3 text-center">
          <div className="text-sm font-bold text-text">
            {creator.followersCount ? formatNumber(creator.followersCount) : '—'}
          </div>
          <div className="text-[10px] text-text2">עוקבים</div>
        </div>
        <div className="bg-bg2 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Camera size={12} className="text-pink-400" />
            <span className="text-sm font-bold text-text">{creator._count?.reels ?? 0}</span>
          </div>
          <div className="text-[10px] text-text2">רילסים</div>
        </div>
      </div>

      {/* Top reels preview */}
      {(creator.reels?.length ?? 0) > 0 ? (
        <div>
          <p className="text-[10px] text-text2 uppercase tracking-wider mb-2">רילסים מובילים</p>
          <div className="space-y-1.5">
            {creator.reels!.slice(0, 3).map((r, i) => (
              <a
                key={r.reelId}
                href={`https://www.instagram.com/reel/${r.reelId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-text2 hover:text-text transition-colors group"
              >
                <span className="w-5 h-5 rounded bg-pink-500/20 text-pink-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="truncate flex-1 group-hover:text-pink-400 transition-colors">
                  {r.caption ? r.caption.slice(0, 50) : 'ריל ללא כיתוב'}
                </span>
                <span className="flex items-center gap-0.5 flex-shrink-0 text-[10px] text-pink-400">
                  <Heart size={9} />
                  {formatNumber(r.likeCount)}
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-1">
          <p className="text-[11px] text-text2">לחץ 🔄 לסנכרן רילסים</p>
        </div>
      )}
    </div>
  )
}

// ── Reel Card ────────────────────────────────────────────────────────────────
function ReelCard({ reel }: { reel: Reel }) {
  const router = useRouter()
  const score = reel.viralityScore.toFixed(1)
  const [copied, setCopied] = useState(false)

  function copyCaption() {
    if (!reel.caption) return
    navigator.clipboard.writeText(reel.caption).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-card overflow-hidden flex flex-col group">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] max-h-48 bg-bg2 overflow-hidden">
        {reel.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reel.thumbnailUrl}
            alt={reel.caption ?? 'Reel'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={32} className="text-text2/30" />
          </div>
        )}
        {/* Score badge */}
        <div className="absolute top-2 right-2 bg-black/70 rounded-lg px-2 py-0.5">
          <span className="text-[10px] font-bold text-pink-400">✨ {score}</span>
        </div>
        {/* Creator */}
        {reel.creator && (
          <div className="absolute bottom-2 right-2 bg-black/70 rounded-lg px-2 py-0.5">
            <span className="text-[10px] text-white">@{reel.creator.handle}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-xs text-text line-clamp-2 leading-relaxed">
          {reel.caption ? reel.caption.slice(0, 100) : 'ריל ללא כיתוב'}
        </p>

        <div className="flex items-center gap-3 text-[11px] text-text2">
          <span className="flex items-center gap-1">
            <Heart size={10} className="text-pink-400" />
            {formatNumber(reel.likeCount)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={10} className="text-purple-400" />
            {formatNumber(reel.commentCount)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <a
            href={reel.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 transition-colors flex-1"
          >
            <ExternalLink size={10} />
            פתח
          </a>
          {reel.caption && (
            <button
              onClick={copyCaption}
              title="העתק קפשן"
              className="w-6 h-6 rounded flex items-center justify-center text-text2/60 hover:text-pink-400 transition-colors"
            >
              {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
            </button>
          )}
          <button
            onClick={() => router.push(`/blog?topic=${encodeURIComponent(reel.caption?.slice(0, 80) ?? 'ריל ויראלי')}`)}
            title="צור מאמר SEO מקפשן זה"
            className="w-6 h-6 rounded flex items-center justify-center text-text2/60 hover:text-accent transition-colors"
          >
            <PenLine size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Creator Modal ─────────────────────────────────────────────────────────
function AddCreatorModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [handle, setHandle] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!handle.trim()) { setError('נדרש handle'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/instagram-creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim().replace(/^@/, ''), name: name.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה')
      onAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהוספת יוצר')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg2 border border-card-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-text text-lg">הוסף יוצר Instagram</h2>
          <button onClick={onClose} className="text-text2 hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text2 mb-1.5">Instagram Handle *</label>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="@username"
              dir="ltr"
              className="w-full bg-card border border-card-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text2 focus:outline-none focus:border-pink-500/60 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text2 mb-1.5">שם (אופציונלי)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="שם מלא"
              className="w-full bg-card border border-card-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text2 focus:outline-none focus:border-pink-500/60 transition-colors"
            />
          </div>
          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5">{error}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-card-border rounded-xl text-sm font-medium text-text2 hover:text-text transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading || !handle.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              הוסף
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Creators Tab ──────────────────────────────────────────────────────────────
function CreatorsTab() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | 'all' | null>(null)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchCreators = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetch('/api/instagram-creators').then(r => r.json())
      setCreators(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCreators() }, [fetchCreators])

  async function handleDelete(id: string) {
    if (!confirm('למחוק את היוצר?')) return
    await fetch('/api/instagram-creators', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCreators(prev => prev.filter(c => c.id !== id))
  }

  async function handleSync(creatorId?: string) {
    setSyncing(creatorId ?? 'all')
    setSyncResult(null)
    try {
      const res = await fetch('/api/instagram-creators/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creatorId ? { creatorId } : {}),
      })
      const data = await res.json()
      if (!res.ok) {
        setSyncResult(`❌ ${data.error ?? 'שגיאה בסנכרון'}`)
      } else {
        const total = data.synced?.reduce((s: number, r: { reelsProcessed: number }) => s + r.reelsProcessed, 0) ?? 0
        setSyncResult(`✅ סונכרנו ${total} רילסים`)
        await fetchCreators()
      }
    } catch {
      setSyncResult('❌ שגיאת רשת')
    } finally {
      setSyncing(null)
      setTimeout(() => setSyncResult(null), 5000)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text2 text-sm">
            {creators.length} יוצרים במעקב
          </p>
          {syncResult && <p className="text-xs mt-1 font-medium text-success">{syncResult}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSync()}
            disabled={!!syncing || creators.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-card-border rounded-xl text-sm font-medium text-text2 hover:text-text transition-all hover:border-pink-500/40 disabled:opacity-50"
          >
            {syncing === 'all' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            סנכרן הכל
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            הוסף יוצר
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-pink-400" />
        </div>
      ) : creators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-3xl">📸</div>
          <h3 className="font-bold text-text text-lg">אין יוצרים עדיין</h3>
          <p className="text-text2 text-sm max-w-sm">
            הוסף יוצרי Instagram — לאחר הסנכרון תמשוך 30 הרילסים האחרונים שלהם
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            הוסף יוצר ראשון
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {creators.map(c => (
            <CreatorCard
              key={c.id}
              creator={c}
              onDelete={handleDelete}
              onSync={id => handleSync(id)}
              syncing={syncing === c.id}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddCreatorModal
          onClose={() => setShowAdd(false)}
          onAdded={async () => {
            setShowAdd(false)
            await fetchCreators()
            setTimeout(() => handleSync(undefined), 2000)
          }}
        />
      )}
    </div>
  )
}

// ── Reels Tab ─────────────────────────────────────────────────────────────────
function ReelsTab() {
  const [reels, setReels] = useState<Reel[]>([])
  const [creators, setCreators] = useState<Array<{ id: string; name: string; handle: string; profilePicUrl: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('viralityScore')
  const [creatorId, setCreatorId] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (sortBy) params.set('sortBy', sortBy)
    if (creatorId) params.set('creatorId', creatorId)
    if (search) params.set('search', search)

    setLoading(true)
    fetch(`/api/instagram-creators/reels?${params}`)
      .then(r => r.json())
      .then(data => { setReels(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sortBy, creatorId, search])

  useEffect(() => {
    fetch('/api/instagram-creators')
      .then(r => r.json())
      .then(data => setCreators(
        Array.isArray(data)
          ? data.map((c: Creator) => ({
              id: c.id,
              name: c.name,
              handle: c.handle,
              profilePicUrl: c.profilePicUrl ?? null,
            }))
          : []
      ))
  }, [])

  return (
    <div className="space-y-5">
      {/* Filters row */}
      <div className="space-y-3">
        {/* Search + Sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="חיפוש בכיתוב..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-card border border-card-border rounded-xl px-3 py-2 text-sm text-text placeholder-text2 focus:outline-none focus:border-pink-500/60 transition-colors w-48"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-card border border-card-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-pink-500/60 transition-colors"
          >
            <option value="viralityScore">ויראליות</option>
            <option value="likeCount">לייקים</option>
            <option value="publishedAt">תאריך</option>
          </select>
          {(creatorId || search) && (
            <button
              onClick={() => { setCreatorId(''); setSearch('') }}
              className="text-xs text-text2 hover:text-danger flex items-center gap-1 transition-colors"
            >
              <X size={12} />
              נקה פילטרים
            </button>
          )}
        </div>

        {/* Creator pill filter */}
        {creators.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] text-text2 font-medium">פלטר:</span>
            <button
              onClick={() => setCreatorId('')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                !creatorId
                  ? 'bg-pink-600 text-white border-pink-600'
                  : 'bg-card border-card-border text-text2 hover:text-text hover:border-pink-500/40'
              }`}
            >
              הכל
            </button>
            {creators.map(c => (
              <button
                key={c.id}
                onClick={() => setCreatorId(creatorId === c.id ? '' : c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  creatorId === c.id
                    ? 'bg-pink-600 text-white border-pink-600'
                    : 'bg-card border-card-border text-text2 hover:text-text hover:border-pink-500/40'
                }`}
              >
                {c.profilePicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.profilePicUrl} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[8px] text-white font-bold">
                    {c.handle.slice(0, 1).toUpperCase()}
                  </span>
                )}
                @{c.handle}
                {creatorId === c.id && (
                  <X size={10} className="opacity-70" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-pink-400" />
        </div>
      ) : reels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="text-4xl">🎬</div>
          <h3 className="font-bold text-text">
            {creatorId ? 'אין רילסים ליוצר זה' : search ? `אין תוצאות ל"${search}"` : 'אין רילסים עדיין'}
          </h3>
          <p className="text-text2 text-sm">
            {creatorId
              ? 'לחץ על כפתור הסנכרון ביוצר כדי למשוך רילסים'
              : search
              ? 'נסה חיפוש אחר'
              : 'הוסף יוצרים ולחץ "סנכרן" כדי למשוך רילסים'}
          </p>
          {(creatorId || search) && (
            <button
              onClick={() => { setCreatorId(''); setSearch('') }}
              className="text-xs text-pink-400 hover:underline"
            >
              נקה פילטרים
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-text2 text-sm">
            {reels.length} רילסים
            {creatorId && creators.find(c => c.id === creatorId)
              ? ` — @${creators.find(c => c.id === creatorId)?.handle}`
              : ''}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {reels.map(reel => <ReelCard key={reel.id} reel={reel} />)}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Instagram Page ───────────────────────────────────────────────────────
export default function InstagramPage() {
  const [active, setActive] = useState<Tab>('creators')

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center shadow-[0_4px_18px_rgba(236,72,153,0.35)]">
          <Camera size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-text">Instagram</h1>
          <p className="text-text2 text-xs">יוצרים • רילסים • אנליטיקס</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg2 border border-card-border rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === key
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
                : 'text-text2 hover:text-text hover:bg-card'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {active === 'creators'  && <CreatorsTab />}
        {active === 'reels'     && <ReelsTab />}
        {active === 'analytics' && <InstagramAnalyticsPage />}
      </div>
    </div>
  )
}
