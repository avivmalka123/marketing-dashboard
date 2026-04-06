'use client'
import { useState, useCallback } from 'react'
import { Wand2, Loader2, Plus } from 'lucide-react'
import IdeaCard from './IdeaCard'

type IdeaStatus = 'Ideas' | 'In Progress' | 'Published'

interface Idea {
  id: string
  title: string
  format: string
  targetAudience: string | null
  keywords: string[]
  seoScore: number
  status: IdeaStatus
  notes: string | null
}

const COLUMNS: Array<{ key: IdeaStatus; label: string; color: string }> = [
  { key: 'Ideas', label: 'רעיונות', color: 'text-accent' },
  { key: 'In Progress', label: 'בעבודה', color: 'text-warning' },
  { key: 'Published', label: 'פורסם', color: 'text-success' },
]

interface Props {
  initialIdeas: Idea[]
}

export default function KanbanBoard({ initialIdeas }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas)
  const [generating, setGenerating] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = ideas.filter(i => i.status === col.key)
      return acc
    },
    {} as Record<IdeaStatus, Idea[]>
  )

  async function handleStatusChange(id: string, status: IdeaStatus) {
    setIdeas(prev => prev.map(i => (i.id === id ? { ...i, status } : i)))
    await fetch('/api/content-ideas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  async function generateIdeas() {
    setGenerating(true)
    try {
      const res = await fetch('/api/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', count: 6 }),
      })
      const data = await res.json()
      if (data.created > 0) {
        // Refresh
        const fresh = await fetch('/api/content-ideas').then(r => r.json())
        setIdeas(fresh)
      }
    } finally {
      setGenerating(false)
    }
  }

  const onDragStart = useCallback((id: string) => setDragId(id), [])
  const onDragEnd = useCallback(() => setDragId(null), [])

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text2">{ideas.length} רעיונות סה"כ</p>
        <button
          onClick={generateIdeas}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {generating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Wand2 size={14} />
          )}
          <span>צור רעיונות עם AI</span>
        </button>
      </div>

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
