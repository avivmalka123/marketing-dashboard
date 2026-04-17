'use client'
import { Search, SlidersHorizontal, X } from 'lucide-react'

interface Filters {
  sortBy: string
  competitorId: string
  search: string
}

interface Competitor {
  id: string
  name: string
  thumbnailUrl?: string | null
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  competitors: Competitor[]
}

const SORT_OPTIONS = [
  { value: 'viralityScore', label: 'ויראליות' },
  { value: 'viewCount', label: 'כמות צפיות' },
  { value: 'trendScore', label: 'טרנד' },
  { value: 'publishedAt', label: 'תאריך' },
  { value: 'growthRate', label: 'קצב צמיחה' },
]

export default function VideoFilters({ filters, onChange, competitors }: Props) {
  const activeCompetitor = competitors.find(c => c.id === filters.competitorId)

  return (
    <div className="space-y-3">
      {/* Search + Sort row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text2 pointer-events-none" />
          <input
            type="text"
            placeholder="חפש סרטון..."
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            className="w-full bg-bg2 border border-card-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-text placeholder-text2 focus:outline-none focus:border-accent/60 transition-colors"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 bg-bg2 border border-card-border rounded-xl px-3 py-2 text-sm">
          <SlidersHorizontal size={14} className="text-text2" />
          <span className="text-text2 text-xs">מיין לפי:</span>
          <select
            value={filters.sortBy}
            onChange={e => onChange({ ...filters, sortBy: e.target.value })}
            className="bg-transparent text-text focus:outline-none cursor-pointer text-sm"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active filter badge */}
        {activeCompetitor && (
          <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/30 rounded-xl px-3 py-2 text-sm">
            {activeCompetitor.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeCompetitor.thumbnailUrl} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-red-500/40" />
            )}
            <span className="text-text text-xs font-medium">{activeCompetitor.name}</span>
            <button
              onClick={() => onChange({ ...filters, competitorId: '' })}
              className="text-text2 hover:text-danger transition-colors ml-0.5"
              title="הסר פילטר"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Competitor filter pills — shown when there are competitors to filter by */}
      {competitors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-text2 uppercase tracking-wide self-center ml-1">פלטר לפי מתחרה:</span>
          <button
            onClick={() => onChange({ ...filters, competitorId: '' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !filters.competitorId
                ? 'bg-accent text-white shadow-sm'
                : 'bg-bg2 border border-card-border text-text2 hover:text-text hover:border-accent/40'
            }`}
          >
            הכל
          </button>
          {competitors.map(c => (
            <button
              key={c.id}
              onClick={() => onChange({ ...filters, competitorId: c.id === filters.competitorId ? '' : c.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.competitorId === c.id
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'bg-bg2 border border-card-border text-text2 hover:text-text hover:border-red-500/40'
              }`}
            >
              {c.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.thumbnailUrl} alt="" className="w-4 h-4 rounded-full" />
              ) : (
                <div className={`w-4 h-4 rounded-full ${filters.competitorId === c.id ? 'bg-white/30' : 'bg-red-500/20'}`} />
              )}
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
