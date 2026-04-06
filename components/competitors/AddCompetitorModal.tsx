'use client'
import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdded: () => void
}

export default function AddCompetitorModal({ onClose, onAdded }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl: url }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'שגיאה')

      onAdded()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בהוספת מתחרה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-bg2 border border-card-border rounded-2xl w-full max-w-md shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-text text-lg">הוסף מתחרה חדש</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text2 mb-2">
                  קישור ערוץ YouTube
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://youtube.com/@channelname"
                  className="w-full bg-bg border border-card-border rounded-xl px-4 py-3 text-text placeholder-text2 focus:outline-none focus:border-accent/60 transition-colors text-sm"
                  required
                  dir="ltr"
                />
                <p className="text-xs text-text2 mt-1.5">
                  ניתן להזין: URL מלא, @handle, או מזהה ערוץ (UCxxxxxx)
                </p>
              </div>

              {error && (
                <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent2 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>מוסיף...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>הוסף מתחרה</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-card border border-card-border text-text2 hover:text-text transition-colors font-medium"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
