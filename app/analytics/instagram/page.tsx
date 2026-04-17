'use client'
import { useState, useEffect } from 'react'
import { Loader2, Settings, Clock, TrendingUp, RefreshCw, ChevronDown, ExternalLink } from 'lucide-react'
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

interface LocalCreator {
  id: string
  handle: string
  name: string
  profilePicUrl?: string | null
  followersCount?: number | null
  avgLikes?: number | null
  avgComments?: number | null
  _count?: { reels: number }
  reels?: Array<{ reelId: string; likeCount: number; viralityScore: number; caption?: string | null }>
}

export default function InstagramAnalyticsPage() {
  const [data, setData] = useState<InstagramData | null>(null)
  const [loading, setLoading] = useState(true)
  const [localCreators, setLocalCreators] = useState<LocalCreator[]>([])
  const [quickSetup, setQuickSetup] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [userIdInput, setUserIdInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  function loadData() {
    setLoading(true)
    // Try real API + local creators in parallel
    Promise.all([
      fetch('/api/analytics/instagram').then(r => r.json()).catch(() => ({ error: 'network' })),
      fetch('/api/instagram-creators').then(r => r.json()).catch(() => []),
    ]).then(([apiData, creators]) => {
      setData(apiData)
      setLocalCreators(Array.isArray(creators) ? creators : [])
      setLoading(false)
    })
  }

  useEffect(() => { loadData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleQuickSave() {
    if (!tokenInput.trim() && !userIdInput.trim()) return
    setSaving(true)
    const saves = []
    if (tokenInput.trim()) {
      saves.push(
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'INSTAGRAM_ACCESS_TOKEN', value: tokenInput.trim() }),
        })
      )
    }
    if (userIdInput.trim()) {
      saves.push(
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'INSTAGRAM_USER_ID', value: userIdInput.trim() }),
        })
      )
    }
    await Promise.allSettled(saves)
    setSaving(false)
    setSaveMsg('✓ נשמר — טוען נתונים...')
    setQuickSetup(false)
    setTimeout(() => {
      setSaveMsg('')
      loadData()
    }, 800)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-pink-500" />
      </div>
    )
  }

  const hasRealData = data?.profile && !data?.error
  const hasLocalData = localCreators.length > 0

  // No real API data — show error / setup / local fallback
  if (!hasRealData) {
    const isMissingCreds = !data?.error || data.error.includes('לא מוגדר') || data.error.includes('network')

    return (
      <div className="space-y-4">
        {saveMsg && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-sm text-success text-center">
            {saveMsg}
          </div>
        )}

        {/* Quick setup card */}
        <div className="glass-card p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📸</div>
            <div className="flex-1">
              <h3 className="font-bold text-text text-base mb-1">Instagram Personal Analytics</h3>
              <p className="text-text2 text-sm mb-3">
                {isMissingCreds
                  ? 'חבר את חשבון Instagram Business שלך לקבלת נתוני ה-analytics האישיים שלך.'
                  : data?.error ?? 'שגיאה בטעינת נתונים'}
              </p>
              {data?.error && !isMissingCreds && (
                <p className="text-xs text-text2/70 font-mono bg-bg2 rounded px-2 py-1 mb-3 inline-block max-w-full">
                  {data.error}
                </p>
              )}

              <button
                onClick={() => setQuickSetup(v => !v)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
              >
                חבר Instagram
                <ChevronDown size={13} className={`transition-transform ${quickSetup ? 'rotate-180' : ''}`} />
              </button>

              {quickSetup && (
                <div className="mt-4 p-5 bg-bg2 rounded-xl border border-card-border space-y-3 max-w-md">
                  <p className="text-xs text-text2">
                    נדרש חשבון Instagram Business + Meta Developer App
                  </p>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text">
                      Access Token{' '}
                      <a href="https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions" target="_blank" rel="noopener noreferrer" className="text-accent2 hover:underline">
                        (קבל כאן)
                      </a>
                    </label>
                    <input
                      type="password"
                      placeholder="EAAx..."
                      value={tokenInput}
                      onChange={e => setTokenInput(e.target.value)}
                      dir="ltr"
                      className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-pink-500/60 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text">Instagram User ID (מספרי)</label>
                    <input
                      type="text"
                      placeholder="17841400456"
                      value={userIdInput}
                      onChange={e => setUserIdInput(e.target.value)}
                      dir="ltr"
                      className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-pink-500/60 transition-colors"
                    />
                    <p className="text-[10px] text-text2">
                      מצא ב-Meta Business Suite → Settings → Instagram Account ID
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleQuickSave}
                      disabled={saving || (!tokenInput.trim() && !userIdInput.trim())}
                      className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'שמור וטען'}
                    </button>
                    <button onClick={() => setQuickSetup(false)} className="px-4 py-2 rounded-lg text-sm text-text2 bg-card border border-card-border hover:text-text transition-colors">
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {!quickSetup && (
                <div className="flex gap-2 mt-3">
                  <Link href="/settings" className="inline-flex items-center gap-1.5 text-xs text-text2 hover:text-text transition-colors">
                    <Settings size={12} />
                    הגדרות מלאות
                  </Link>
                  <button onClick={loadData} className="inline-flex items-center gap-1.5 text-xs text-text2 hover:text-text transition-colors">
                    <RefreshCw size={12} />
                    נסה שוב
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Local fallback: show stats from synced creators */}
        {hasLocalData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-card-border" />
              <span className="text-xs text-text2 bg-bg px-2">נתונים מקומיים — יוצרים שסונכרנו</span>
              <div className="flex-1 h-px bg-card-border" />
            </div>

            {/* Summary stats across all local creators */}
            <LocalCreatorsAnalytics creators={localCreators} />
          </div>
        )}
      </div>
    )
  }

  // Real API data available
  const profile = data?.profile
  const insights = data?.insights
  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-text">Instagram Analytics</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text2">מנותח ע&quot;י Claude AI</span>
          <button onClick={loadData} title="רענן" className="w-8 h-8 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-pink-500 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Profile */}
      {profile && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-4">
            {profile.profile_picture_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_picture_url} alt="" className="w-14 h-14 rounded-full border-2 border-pink-500/30" />
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
          {insights.bestPostingTimes?.length ? (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-accent2" />
                <h3 className="font-bold text-text text-sm">זמני פרסום מומלצים</h3>
              </div>
              <div className="space-y-2">
                {insights.bestPostingTimes.map((time, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-bg2 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-accent2/20 text-accent2 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm text-text">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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

// ── Local fallback analytics component ────────────────────────────────────────
function LocalCreatorsAnalytics({ creators }: { creators: LocalCreator[] }) {
  const allReelCounts = creators.map(c => c._count?.reels ?? 0)
  const totalReels = allReelCounts.reduce((s, n) => s + n, 0)
  const avgLikesAll = creators.filter(c => c.avgLikes).map(c => c.avgLikes!)
  const globalAvgLikes = avgLikesAll.length ? Math.round(avgLikesAll.reduce((s, n) => s + n, 0) / avgLikesAll.length) : 0
  const topCreator = [...creators].sort((a, b) => (b.avgLikes ?? 0) - (a.avgLikes ?? 0))[0]

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'יוצרים שנוספו', value: String(creators.length) },
          { label: 'סך רילסים', value: String(totalReels) },
          { label: 'ממוצע לייקים', value: globalAvgLikes ? formatNumber(globalAvgLikes) : '—' },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-4 text-center">
            <div className="text-xl font-extrabold text-pink-400 mb-1">{kpi.value}</div>
            <div className="text-xs text-text2">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Per-creator mini cards */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-text text-sm mb-3">יוצרים מסונכרנים</h3>
        <div className="space-y-3">
          {creators.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-bg2 rounded-xl">
              {c.profilePicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.profilePicUrl} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{c.name}</p>
                <p className="text-[10px] text-text2">@{c.handle}</p>
              </div>
              <div className="text-left flex-shrink-0 space-y-0.5">
                <div className="text-xs font-bold text-pink-400">{c.avgLikes ? formatNumber(c.avgLikes) : '—'} ❤️</div>
                <div className="text-[10px] text-text2">{c._count?.reels ?? 0} רילסים</div>
              </div>
              {c.reels?.[0] && (
                <a
                  href={`https://www.instagram.com/p/${c.reels[0].reelId}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text2 hover:text-pink-400 transition-colors flex-shrink-0"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {topCreator && (
        <div className="glass-card p-5 border-pink-500/20">
          <h3 className="font-bold text-text text-sm mb-1">
            🏆 יוצר מוביל — {topCreator.name}
          </h3>
          <p className="text-text2 text-xs">
            @{topCreator.handle} · ממוצע {topCreator.avgLikes ? formatNumber(topCreator.avgLikes) : '—'} לייקים · {topCreator._count?.reels ?? 0} רילסים מסונכרנים
          </p>
        </div>
      )}

      <div className="p-3 bg-pink-500/5 border border-pink-500/20 rounded-xl text-xs text-text2 text-center">
        💡 לקבל analytics של <strong className="text-text">הערוץ שלך</strong> — חבר את חשבון Instagram Business בלחיצה על &quot;חבר Instagram&quot; למעלה
      </div>
    </div>
  )
}
