'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Loader2, ExternalLink, Settings } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'

interface YoutubeData {
  channel?: {
    snippet?: { title?: string; thumbnails?: { high?: { url?: string } } }
    statistics?: {
      viewCount?: string
      subscriberCount?: string
      videoCount?: string
    }
  }
  topVideos?: Array<{
    id?: string
    snippet?: { title?: string; thumbnails?: { high?: { url?: string } } }
    statistics?: { viewCount?: string; likeCount?: string }
  }>
  error?: string
}

export default function YouTubeAnalyticsPage() {
  const [data, setData] = useState<YoutubeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/youtube')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    )
  }

  if (data?.error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-text">YouTube Analytics</h1>
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="font-bold text-text text-lg mb-2">YouTube לא מוגדר</h3>
          <p className="text-text2 text-sm mb-4">{data.error}</p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Settings size={14} />
            הגדרות
          </Link>
        </div>
      </div>
    )
  }

  const stats = data?.channel?.statistics
  const snippet = data?.channel?.snippet

  const chartData = (data?.topVideos ?? []).slice(0, 8).map(v => ({
    name: (v.snippet?.title ?? '').slice(0, 30) + '...',
    views: parseInt(v.statistics?.viewCount ?? '0'),
    likes: parseInt(v.statistics?.likeCount ?? '0'),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-text">YouTube Analytics</h1>
        <span className="text-xs text-text2">הערוץ שלך</span>
      </div>

      {/* Channel overview */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          {snippet?.thumbnails?.high?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snippet.thumbnails.high.url}
              alt=""
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h2 className="font-bold text-text text-lg">{snippet?.title}</h2>
            <p className="text-text2 text-sm">הערוץ שלך</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'סך צפיות', value: stats?.viewCount ? formatNumber(parseInt(stats.viewCount)) : '—' },
          { label: 'עוקבים', value: stats?.subscriberCount ? formatNumber(parseInt(stats.subscriberCount)) : '—' },
          { label: 'סרטונים', value: stats?.videoCount ?? '—' },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-5 text-center">
            <div className="text-2xl font-extrabold text-text mb-1">{kpi.value}</div>
            <div className="text-xs text-text2">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Top videos chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-bold text-text text-sm mb-4">סרטונים מובילים - צפיות</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#7777aa', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#7777aa', fontSize: 10 }} width={120} />
                <Tooltip
                  contentStyle={{
                    background: '#12121e',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#eeeeff',
                    fontSize: '12px',
                  }}
                  formatter={(v: number) => [formatNumber(v), 'צפיות']}
                />
                <Bar dataKey="views" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top videos list */}
      {data?.topVideos && data.topVideos.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-bold text-text text-sm mb-4">סרטונים הכי נצפים</h3>
          <div className="space-y-3">
            {data.topVideos.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3">
                <span className="w-6 text-text2 text-xs font-bold text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{v.snippet?.title}</p>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[10px] text-text2">{formatNumber(parseInt(v.statistics?.viewCount ?? '0'))} צפיות</span>
                    <span className="text-[10px] text-text2">{formatNumber(parseInt(v.statistics?.likeCount ?? '0'))} לייקים</span>
                  </div>
                </div>
                <a
                  href={`https://youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text2 hover:text-accent2 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
