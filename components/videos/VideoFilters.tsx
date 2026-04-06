'use client'
import { Search, SlidersHorizontal } from 'lucide-react'

interface Filters {
  sortBy: string
  competitorId: string
  search: string
}

interface Competitor {
  id: string
  name: string
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
  return (
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

      {/* Competitor filter */}
      <div className="relative">
        <select
          value={filters.competitorId}
          onChange={e => onChange({ ...filters, competitorId: e.target.value })}
          className="bg-bg2 border border-card-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/60 transition-colors appearance-none pr-8 cursor-pointer"
        >
          <option value="">כל המתחרים</option>
          {competitors.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
    </div>
  )
}
