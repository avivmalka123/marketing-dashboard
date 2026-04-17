'use client'
import { useState } from 'react'
import { Users, Video, BarChart2 } from 'lucide-react'
import CompetitorsPage from '@/app/competitors/page'
import VideosPage from '@/app/videos/page'
import YouTubeAnalyticsPage from '@/app/analytics/youtube/page'

type Tab = 'competitors' | 'videos' | 'analytics'

const TABS: Array<{ key: Tab; label: string; icon: React.ElementType }> = [
  { key: 'competitors', label: 'מתחרים', icon: Users },
  { key: 'videos',      label: 'סרטונים', icon: Video },
  { key: 'analytics',   label: 'אנליטיקס', icon: BarChart2 },
]

export default function YouTubePage() {
  const [active, setActive] = useState<Tab>('competitors')

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-[0_4px_18px_rgba(220,38,38,0.35)]">
          <Video size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-text">YouTube</h1>
          <p className="text-text2 text-xs">מתחרים • סרטונים • אנליטיקס</p>
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
                ? 'bg-red-600 text-white shadow-sm'
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
        {active === 'competitors' && <CompetitorsPage />}
        {active === 'videos'      && <VideosPage />}
        {active === 'analytics'   && <YouTubeAnalyticsPage />}
      </div>
    </div>
  )
}
