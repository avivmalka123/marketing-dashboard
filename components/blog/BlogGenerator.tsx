'use client'
import { useState } from 'react'
import { Wand2, Loader2, Image as ImageIcon, Send, Eye } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  metaDescription: string | null
  slug: string | null
  status: string
  imageUrl: string | null
  content: string
  createdAt: string
  publishedAt: string | null
}

interface Props {
  onGenerated: () => void
  initialTopic?: string
  initialVideoId?: string
}

export default function BlogGenerator({ onGenerated, initialTopic = '', initialVideoId = '' }: Props) {
  const [topic, setTopic] = useState(initialTopic)
  const [generateImage, setGenerateImage] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [preview, setPreview] = useState<BlogPost | null>(null)
  const [error, setError] = useState('')

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setError('')
    setPreview(null)

    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          videoId: initialVideoId || undefined,
          generateImage,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה')
      setPreview(data.blogPost)
      onGenerated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת המאמר')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish(id: string) {
    setPublishing(id)
    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPostId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה')
      setPreview(prev => prev ? { ...prev, status: 'published' } : null)
      onGenerated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בפרסום')
    } finally {
      setPublishing(null)
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center">
          <Wand2 size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-text">יצירת מאמר SEO אוטומטי</h3>
          <p className="text-xs text-text2">Claude יכתוב מאמר מקצועי + תמונה + יפרסם ב-Kajabi</p>
        </div>
      </div>

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

        <div className="flex items-center gap-3">
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

        {error && (
          <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={generating || !topic.trim()}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-accent to-accent2 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Claude כותב מאמר SEO...</span>
            </>
          ) : (
            <>
              <Wand2 size={16} />
              <span>צור מאמר SEO</span>
            </>
          )}
        </button>
      </form>

      {/* Preview */}
      {preview && (
        <div className="mt-6 pt-6 border-t border-card-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-text text-sm">תצוגה מקדימה</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                preview.status === 'published'
                  ? 'bg-success/20 text-success'
                  : 'bg-warning/20 text-warning'
              }`}
            >
              {preview.status === 'published' ? '✓ פורסם' : 'טיוטה'}
            </span>
          </div>

          <div className="bg-bg2 rounded-xl p-4 space-y-2">
            <h5 className="font-bold text-text">{preview.title}</h5>
            {preview.metaDescription && (
              <p className="text-sm text-text2">{preview.metaDescription}</p>
            )}
            {preview.imageUrl && (
              <div className="text-xs text-accent2">🖼️ תמונה נוצרה: {preview.imageUrl.slice(0, 50)}...</div>
            )}
          </div>

          <div className="flex gap-3">
            {preview.status === 'draft' && (
              <button
                onClick={() => handlePublish(preview.id)}
                disabled={!!publishing}
                className="flex items-center gap-2 flex-1 justify-center bg-success text-white font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 text-sm transition-opacity"
              >
                {publishing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>פרסם ב-Kajabi</span>
              </button>
            )}
            <button
              onClick={() => {
                const w = window.open('', '_blank')
                if (w) {
                  w.document.write(preview.content)
                  w.document.close()
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-card-border text-text2 hover:text-text text-sm transition-all"
            >
              <Eye size={14} />
              <span>תצוגה</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
