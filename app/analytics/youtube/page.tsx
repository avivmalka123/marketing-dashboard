'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Loader2, ExternalLink, Settings, RefreshCw, ChevronDown } from 'lucide-react'
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
  errorType?: 'missing_channel_id' | 'missing_api_key' | 'api_error' | 'quota'
}

export default function YouTubeAnalyticsPage() {
  const [data, setData] = useState<YoutubeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickSetup, setQuickSetup] = useState(false)
  const [channelInput, setChannelInput] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  function loadData() {
    setLoading(true)
    fetch('/api/analytics/youtube')
      .then(async r => {
        const d = await r.json()
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        setData({ error: `שגיאת רשת: ${err instanceof Error ? err.message : err}` })
        setLoading(false)
      })
  }

  useEffect(() => { loadData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleQuickSave() {
    if (!channelInput.trim() && !apiKeyInput.trim()) return
    setSaving(true)
    setSaveMsg('')

    const saves = []
    if (channelInput.trim()) {
      saves.push(
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'YOUTUBE_CHANNEL_ID', value: channelInput.trim() }),
        })
      )
    }
    if (apiKeyInput.trim()) {
      saves.push(
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'YOUTUBE_API_KEY', value: apiKeyInput.trim() }),
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
        <Loader2 size={24} className="animate-spin text-red-500" />
      </div>
    )
  }

  const isMissingChannelId = data?.error?.includes('YOUTUBE_CHANNEL_ID')
  const isMissingApiKey = data?.error?.includes('YOUTUBE_API_KEY') || data?.error?.includes('API Key')

  if (!data?.channel) {
    return (
      <div className="space-y-4">
        {saveMsg && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-sm text-success text-center">
            {saveMsg}
          </div>
        )}

        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="font-bold text-text text-lg mb-2">
            {data?.error ? 'שגיאה בטעינת נתונים' : 'YouTube Analytics לא מחובר'}
          </h3>

          {data?.error && (
            <p className="text-xs text-text2/70 mb-4 font-mono bg-bg2 rounded-lg px-3 py-2 inline-block max-w-lg">
              {data.error}
            </p>
          )}

          {/* Quick setup for missing keys */}
          {(isMissingChannelId || isMissingApiKey || !data?.error) && (
            <div className="mt-4">
              <button
                onClick={() => setQuickSetup(v => !v)}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors mb-3"
              >
                חבר YouTube עכשיו
                <ChevronDown size={14} className={`transition-transform ${quickSetup ? 'rotate-180' : ''}`} />
              </button>

              {quickSetup && (
                <div className="mt-3 p-5 bg-bg2 rounded-xl border border-card-border text-right max-w-md mx-auto space-y-3">
                  <p className="text-xs text-text2 leading-relaxed">
                    נדרשים שני ערכים להצגת הנתונים שלך:
                  </p>

                  {(isMissingApiKey || !data?.error) && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text">
                        YouTube Data API Key{' '}
                        <a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent2 hover:underline"
                        >
                          (קבל כאן)
                        </a>
                      </label>
                      <input
                        type="password"
                        placeholder="AIza..."
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        dir="ltr"
                        className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-red-500/60 transition-colors"
                      />
                    </div>
                  )}

                  {(isMissingChannelId || !data?.error) && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text">
                        מזהה ערוץ YouTube שלך
                      </label>
                      <input
                        type="text"
                        placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={channelInput}
                        onChange={e => setChannelInput(e.target.value)}
                        dir="ltr"
                        className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-red-500/60 transition-colors"
                      />
                      <p className="text-[10px] text-text2">
                        מצא ב-YouTube Studio → הגדרות → ערוץ → מידע מתקדם
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleQuickSave}
                      disabled={saving || (!channelInput.trim() && !apiKeyInput.trim())}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-40 transition-all"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'שמור וטען נתונים'}
                    </button>
                    <button
                      onClick={() => setQuickSetup(false)}
                      className="px-4 py-2 rounded-lg text-sm text-text2 bg-card border border-card-border hover:text-text transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {!quickSetup && (
                <div className="flex items-center justify-center gap-3 mt-2">
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-2 border border-card-border text-text2 px-4 py-2 rounded-xl text-sm font-medium hover:text-text transition-all"
                  >
                    <Settings size={14} />
                    הגדרות מלאות
                  </Link>
                  <button
                    onClick={loadData}
                    className="inline-flex items-center gap-2 border border-card-border text-text2 px-4 py-2 rounded-xl text-sm font-medium hover:text-text transition-all"
                  >
                    <RefreshCw size={14} />
                    נסה שוב
                  </button>
                </div>
              )}
            </div>
          )}

          {/* API error (keys exist but call failed) */}
          {data?.error && !isMissingChannelId && !isMissingApiKey && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
              >
                <RefreshCw size={14} />
                נסה שוב
              </button>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 border border-card-border text-text2 px-4 py-2.5 rounded-xl text-sm font-medium hover:text-text transition-all"
              >
                <Settings size={14} />
                הגדרות
              </Link>
            </div>
          )}
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
        <h1 className="text-xl font-extrabold text-text">YouTube Analytics</h1>
        <button
          onClick={loadData}
          title="רענן נתונים"
          className="w-8 h-8 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-red-500 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Channel overview */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          {snippet?.thumbnails?.high?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snippet.thumbnails.high.url}
              alt=""
              className="w-16 h-16 rounded-full border-2 border-red-500/30"
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
          { label: 'סך צפיות', value: stats?.viewCount ? formatNumber(parseInt(stats.viewCount)) : '—', color: 'text-red-400' },
          { label: 'עוקבים', value: stats?.subscriberCount ? formatNumber(parseInt(stats.subscriberCount)) : '—', color: 'text-red-400' },
          { label: 'סרטונים', value: stats?.videoCount ?? '—', color: 'text-text' },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-5 text-center">
            <div className={`text-2xl font-extrabold mb-1 ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-text2">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Top videos chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-bold text-text text-sm mb-4">סרטונים מובילים — צפיות</h3>
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
                  formatter={(v) => [formatNumber(v as number), 'צפיות']}
                />
                <Bar dataKey="views" fill="#dc2626" radius={[0, 4, 4, 0]} />
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
                  className="text-text2 hover:text-red-400 transition-colors"
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
