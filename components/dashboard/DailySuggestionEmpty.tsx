'use client'
import { useState } from 'react'
import { TrendingUp, Loader2, Wand2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  hasCompetitors: boolean
}

export default function DailySuggestionEmpty({ hasCompetitors }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/daily-suggestion', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'שגיאה בייצור הצעה')
      } else {
        setDone(true)
        // Refresh the page to show the new suggestion
        setTimeout(() => window.location.reload(), 800)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
        <div className="text-3xl">✅</div>
        <p className="font-semibold text-success">ההצעה נוצרה! מרענן...</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
      <TrendingUp size={32} className="text-text2/30" />
      <p className="font-semibold text-text">אין הצעה יומית עדיין</p>
      <p className="text-xs text-text2">הסנכרון האוטומטי מתרחש בחצות</p>
      {error && <p className="text-xs text-danger">{error}</p>}
      {!hasCompetitors ? (
        <Link href="/competitors" className="text-accent text-xs hover:underline">
          הוסף מתחרים קודם →
        </Link>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          צור הצעה עכשיו
        </button>
      )}
    </div>
  )
}
