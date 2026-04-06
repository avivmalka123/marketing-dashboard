'use client'
import { useState, useEffect } from 'react'
import { Loader2, Settings, Clock, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'

interface InstagramData {
  profile?: {
    name?: string
    followers_count?: number
    follows_count?: number
    media_count?: number
    profile_picture_url?: string
  }
  insights?: {
    bestPostingTimes?: string[]
    contentRecommendations?: string[]
    growthTips?: string[]
    engagementRate?: number
    summary?: string
  }
  stats?: { avgLikes: number; avgComments: number }
  error?: string
}

export default function InstagramAnalyticsPage() {
  const [data, setData] = useState<InstagramData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/instagram')
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
        <h1 className="text-2xl font-extrabold text-text">Instagram Analytics</h1>
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="font-bold text-text text-lg mb-2">Instagram לא מוגדר</h3>
          <p className="text-text2 text-sm mb-2">{data.error}</p>
          <p className="text-xs text-text2 max-w-md mx-auto mb-6">
            נדרש: חשבון Instagram Business + Meta Developer App + Access Token (60 ימים)
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink to-accent text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Settings size={14} />
            הגדרות
          </Link>
        </div>
      </div>
    )
  }

  const profile = data?.profile
  const insights = data?.insights
  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-text">Instagram Analytics</h1>
        <span className="text-xs text-text2">מנותח ע"י Claude AI</span>
      </div>

      {/* Profile */}
      {profile && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-4">
            {profile.profile_picture_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_picture_url} alt="" className="w-14 h-14 rounded-full" />
            )}
            <div>
              <h2 className="font-bold text-text">{profile.name}</h2>
              <p className="text-text2 text-sm">Instagram Business</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'עוקבים', value: profile?.followers_count ? formatNumber(profile.followers_count) : '—' },
          { label: 'ממוצע לייקים', value: stats?.avgLikes ? formatNumber(stats.avgLikes) : '—' },
          { label: 'ממוצע תגובות', value: stats?.avgComments ? formatNumber(stats.avgComments) : '—' },
          {
            label: 'engagement rate',
            value: insights?.engagementRate ? `${insights.engagementRate.toFixed(1)}%` : '—',
          },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-4 text-center">
            <div className="text-xl font-extrabold text-text mb-1">{kpi.value}</div>
            <div className="text-xs text-text2">{kpi.label}</div>
          </div>
        ))}
      </div>

      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best posting times */}
          {insights.bestPostingTimes?.length ? (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-accent2" />
                <h3 className="font-bold text-text text-sm">זמני פרסום מומלצים</h3>
              </div>
              <div className="space-y-2">
                {insights.bestPostingTimes.map((time, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-bg2 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-accent2/20 text-accent2 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-text">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Growth tips */}
          {insights.growthTips?.length ? (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-success" />
                <h3 className="font-bold text-text text-sm">טיפים לצמיחה</h3>
              </div>
              <div className="space-y-2">
                {insights.growthTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-bg2 rounded-xl">
                    <span className="text-success mt-0.5">✓</span>
                    <span className="text-sm text-text">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Content recommendations */}
          {insights.contentRecommendations?.length ? (
            <div className="glass-card p-5 lg:col-span-2">
              <h3 className="font-bold text-text text-sm mb-4">המלצות תוכן מ-Claude</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.contentRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-bg2 rounded-xl">
                    <span className="text-accent mt-0.5 text-sm">💡</span>
                    <span className="text-sm text-text">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {insights?.summary && (
        <div className="glass-card p-5">
          <h3 className="font-bold text-text text-sm mb-3">סיכום AI</h3>
          <p className="text-sm text-text2 leading-relaxed">{insights.summary}</p>
        </div>
      )}
    </div>
  )
}
