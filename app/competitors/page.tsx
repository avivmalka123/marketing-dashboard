'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Loader2 } from 'lucide-react'
import CompetitorCard from '@/components/competitors/CompetitorCard'
import AddCompetitorModal from '@/components/competitors/AddCompetitorModal'
import RelatedChannelsSuggestions from '@/components/competitors/RelatedChannelsSuggestions'
import type { CompetitorWithVideos } from '@/types'

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorWithVideos[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | 'all' | null>(null)  // null | 'all' | competitorId
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchCompetitors = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetch('/api/competitors').then(r => r.json())
      setCompetitors(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCompetitors() }, [fetchCompetitors])

  async function handleDelete(id: string) {
    await fetch('/api/competitors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCompetitors(prev => prev.filter(c => c.id !== id))
  }

  // Sync one competitor or all
  async function handleSync(competitorId?: string) {
    setSyncing(competitorId ?? 'all')
    setSyncResult(null)
    try {
      const res = await fetch('/api/competitors/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competitorId ? { competitorId } : {}),
      })
      const data = await res.json()
      if (data.synced) {
        const total = data.synced.reduce((s: number, r: { videosProcessed: number }) => s + r.videosProcessed, 0)
        setSyncResult(`✅ סונכרנו ${total} סרטונים`)
      }
      // Re-fetch to show updated video counts
      await fetchCompetitors()
    } catch {
      setSyncResult('❌ שגיאה בסנכרון')
    } finally {
      setSyncing(null)
      setTimeout(() => setSyncResult(null), 4000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">מעקב מתחרים</h1>
          <p className="text-text2 text-sm mt-1">
            {competitors.length} ערוצים במעקב •{' '}
            <span className="text-text2">סרטונים מסונכרנים בזמן אמת בעת הוספה</span>
          </p>
          {syncResult && (
            <p className="text-xs mt-1 font-medium text-success">{syncResult}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSync()}
            disabled={!!syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-card-border rounded-xl text-sm font-medium text-text2 hover:text-text transition-all hover:border-accent/40 disabled:opacity-50"
          >
            {syncing === 'all' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            <span>סנכרן הכל</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent to-accent2 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            <span>הוסף מתחרה</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : competitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl">
            🎯
          </div>
          <h3 className="font-bold text-text text-lg">אין מתחרים עדיין</h3>
          <p className="text-text2 text-sm max-w-sm">
            הוסף ערוצי YouTube של מתחרים — 15 הסרטונים האחרונים יסונכרנו אוטומטית
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            הוסף מתחרה ראשון
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {competitors.map(c => (
            <CompetitorCard
              key={c.id}
              competitor={c}
              onDelete={handleDelete}
              onSync={() => handleSync(c.id)}
              syncing={syncing === c.id}
            />
          ))}
        </div>
      )}

      {/* Related channels section */}
      {!loading && (
        <div className="pt-2 border-t border-card-border">
          <RelatedChannelsSuggestions
            competitors={competitors.map(c => ({ name: c.name, channelId: c.channelId }))}
          />
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <AddCompetitorModal
          onClose={() => setShowAdd(false)}
          onAdded={async () => {
            setShowAdd(false)
            await fetchCompetitors()
            // Give background sync 3s then re-fetch to show videos
            setTimeout(() => fetchCompetitors(), 3000)
          }}
        />
      )}
    </div>
  )
}
