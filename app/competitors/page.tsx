'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Loader2 } from 'lucide-react'
import CompetitorCard from '@/components/competitors/CompetitorCard'
import AddCompetitorModal from '@/components/competitors/AddCompetitorModal'
import type { CompetitorWithVideos } from '@/types'

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorWithVideos[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const fetchCompetitors = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/competitors').then(r => r.json())
    setCompetitors(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCompetitors()
  }, [fetchCompetitors])

  async function handleDelete(id: string) {
    if (!confirm('למחוק את המתחרה?')) return
    await fetch('/api/competitors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCompetitors(prev => prev.filter(c => c.id !== id))
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/cron/update-competitors', {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` },
      })
      await fetchCompetitors()
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">מעקב מתחרים</h1>
          <p className="text-text2 text-sm mt-1">
            {competitors.length} ערוצים במעקב • מתעדכן בחצות כל לילה
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-card-border rounded-xl text-sm font-medium text-text2 hover:text-text transition-all hover:border-accent/40"
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span>סנכרן עכשיו</span>
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
            הוסף ערוצי YouTube של מתחרים כדי לעקוב אחרי הסרטונים שלהם ולקבל הצעות תוכן
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
            <CompetitorCard key={c.id} competitor={c} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <AddCompetitorModal
          onClose={() => setShowAdd(false)}
          onAdded={fetchCompetitors}
        />
      )}
    </div>
  )
}
