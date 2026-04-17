'use client'
import { useState, useEffect } from 'react'
import { Key, Check, Loader2, ExternalLink } from 'lucide-react'

const LS_KEY = 'mkt_dashboard_settings'

const KEY_DEFINITIONS = [
  {
    key: 'YOUTUBE_API_KEY',
    label: 'YouTube Data API Key',
    description: 'Google Cloud Console → APIs → YouTube Data API v3',
    link: 'https://console.cloud.google.com',
    required: true,
  },
  {
    key: 'YOUTUBE_CHANNEL_ID',
    label: 'מזהה ערוץ YouTube שלך',
    description: 'UCxxxxxxxxxx - הערוץ שלך ב-YouTube',
    required: true,
  },
  {
    key: 'ANTHROPIC_API_KEY',
    label: 'Anthropic (Claude) API Key',
    description: 'console.anthropic.com → API Keys',
    link: 'https://console.anthropic.com',
    required: true,
  },
  {
    key: 'INSTAGRAM_ACCESS_TOKEN',
    label: 'Instagram Access Token',
    description: 'Meta for Developers → חשבון Business → long-lived token',
    link: 'https://developers.facebook.com',
  },
  {
    key: 'INSTAGRAM_USER_ID',
    label: 'Instagram User ID',
    description: 'מזהה חשבון Instagram Business שלך',
  },
  {
    key: 'KAJABI_API_KEY',
    label: 'Kajabi API Key',
    description: 'Kajabi → Settings → Integrations → API',
    link: 'https://app.kajabi.com',
  },
  {
    key: 'NANO_BANANA_API_KEY',
    label: 'Nano Banana Pro API Key',
    description: 'מ-dashboard של Nano Banana Pro',
  },
  {
    key: 'NANO_BANANA_API_URL',
    label: 'Nano Banana API URL',
    description: 'כתובת ה-endpoint של Nano Banana (למשל https://api.nanabanana.co.il)',
  },
  {
    key: 'CRON_SECRET',
    label: 'Cron Secret',
    description: 'מחרוזת אקראית לאבטחת ה-cron endpoints',
    required: true,
  },
]

function loadLocalSettings(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveLocalSetting(key: string, value: string) {
  const current = loadLocalSettings()
  current[key] = value
  localStorage.setItem(LS_KEY, JSON.stringify(current))
}

function removeLocalSetting(key: string) {
  const current = loadLocalSettings()
  delete current[key]
  localStorage.setItem(LS_KEY, JSON.stringify(current))
}

export default function SettingsPage() {
  const [configuredKeys, setConfiguredKeys] = useState<string[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [localKeys, setLocalKeys] = useState<string[]>([])

  useEffect(() => {
    // Load from both DB and localStorage
    const local = loadLocalSettings()
    const localKeysList = Object.keys(local)
    setLocalKeys(localKeysList)

    fetch('/api/settings')
      .then(r => r.json())
      .then((res: { settings: Array<{ key: string }>; dbConnected: boolean }) => {
        const dbKeys = (res.settings ?? []).map((s: { key: string }) => s.key)
        // Merge DB keys + local keys
        setConfiguredKeys(Array.from(new Set([...dbKeys, ...localKeysList])))
        setLoading(false)
      })
      .catch(() => {
        // Fallback to localStorage only
        setConfiguredKeys(localKeysList)
        setLoading(false)
      })
  }, [])

  async function handleSave(key: string) {
    const value = values[key]?.trim()
    if (!value) return

    setSaving(key)
    setError(null)

    // 1. Try to save to DB (also writes to .local-data/settings.json as server-side fallback)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      if (data.dbConnected === false) {
        // Saved to server-side local file — this is fine, getApiKey can read it
      }
    } catch { /* network error */ }

    // 2. Try to also write to .env.local (dev only, best-effort)
    try {
      await fetch('/api/settings/env-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
    } catch { /* non-dev or network error — fine, local file is the fallback */ }

    // 3. Always save to localStorage as browser-side indicator
    saveLocalSetting(key, value)
    setLocalKeys(prev => Array.from(new Set([...prev, key])))

    // 4. Update UI
    setConfiguredKeys(prev => Array.from(new Set([...prev, key])))
    setValues(prev => ({ ...prev, [key]: '' }))
    setSaved(key)
    setSaving(null)
    setTimeout(() => setSaved(null), 2500)
  }

  async function handleDelete(key: string) {
    // Remove from localStorage
    removeLocalSetting(key)
    setLocalKeys(prev => prev.filter(k => k !== key))

    // Try to remove from DB too
    try {
      await fetch('/api/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
    } catch { /* ignore */ }

    setConfiguredKeys(prev => prev.filter(k => k !== key))
  }

  const requiredDone = KEY_DEFINITIONS.filter(k => k.required && configuredKeys.includes(k.key)).length
  const requiredTotal = KEY_DEFINITIONS.filter(k => k.required).length

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">הגדרות</h1>
        <p className="text-text2 text-sm mt-1">חבר API keys לפעולה מלאה של הדשבורד</p>
      </div>


      {/* Progress bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text2">
            {requiredDone} / {requiredTotal} API keys נחוצים מוגדרים
          </span>
          <div className="flex gap-1">
            {KEY_DEFINITIONS.filter(k => k.required).map(k => (
              <span
                key={k.key}
                className={`w-2 h-2 rounded-full ${configuredKeys.includes(k.key) ? 'bg-success' : 'bg-text2/30'}`}
                title={k.label}
              />
            ))}
          </div>
        </div>
        <div className="h-1.5 bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent2 rounded-full transition-all duration-500"
            style={{ width: `${(requiredDone / requiredTotal) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-3">
          {KEY_DEFINITIONS.map(def => {
            const isConfigured = configuredKeys.includes(def.key)
            const isLocal = localKeys.includes(def.key)
            const isSaving = saving === def.key
            const isSaved = saved === def.key

            return (
              <div key={def.key} className={`glass-card p-5 transition-all ${isConfigured ? 'border-success/20' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isConfigured ? 'bg-success/20' : 'bg-card'
                      }`}
                    >
                      {isConfigured ? (
                        <Check size={14} className="text-success" />
                      ) : (
                        <Key size={14} className="text-text2" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text">{def.label}</span>
                        {def.required && (
                          <span className="text-[10px] text-danger bg-danger/10 px-1.5 py-0.5 rounded">נחוץ</span>
                        )}
                        {isConfigured && !isLocal && (
                          <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded">✓ DB</span>
                        )}
                        {isConfigured && isLocal && (
                          <span className="text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded">✓ מקומי</span>
                        )}
                      </div>
                      <p className="text-xs text-text2 mt-0.5">{def.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {def.link && (
                      <a
                        href={def.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text2 hover:text-accent2 transition-colors"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    {isConfigured && (
                      <button
                        onClick={() => handleDelete(def.key)}
                        className="text-[10px] text-text2 hover:text-danger transition-colors px-2 py-1 rounded-lg hover:bg-danger/10"
                      >
                        הסר
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder={isConfigured ? '••••••••••• (מוגדר — הזן ערך חדש לעדכון)' : `הזן ${def.label}`}
                    value={values[def.key] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [def.key]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSave(def.key)}
                    className="flex-1 bg-bg2 border border-card-border rounded-xl px-3 py-2 text-sm text-text placeholder-text2 focus:outline-none focus:border-accent/60 transition-colors"
                    dir="ltr"
                  />
                  <button
                    onClick={() => handleSave(def.key)}
                    disabled={isSaving || !values[def.key]?.trim()}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${
                      isSaved
                        ? 'bg-success/20 text-success border border-success/30'
                        : 'bg-accent text-white hover:opacity-90'
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isSaved ? (
                      '✓ נשמר'
                    ) : isConfigured ? (
                      'עדכן'
                    ) : (
                      'שמור'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Env vars tip */}
      <div className="glass-card p-5 border-accent/20">
        <h3 className="font-bold text-text text-sm mb-2">⚡ חלופה: משתני סביבה</h3>
        <p className="text-xs text-text2 leading-relaxed">
          ניתן להגדיר את ה-API keys ישירות ב-<code className="text-accent">.env.local</code> לפיתוח מקומי
          או ב-Vercel Dashboard לפרודקשן. ערכי סביבה מקבלים עדיפות על פני DB.
        </p>
        <div className="mt-3 p-3 bg-bg2 rounded-lg text-[11px] font-mono text-text2 leading-relaxed" dir="ltr">
          YOUTUBE_API_KEY=AIza...<br/>
          YOUTUBE_CHANNEL_ID=UCxxx...<br/>
          ANTHROPIC_API_KEY=sk-ant-...<br/>
          INSTAGRAM_ACCESS_TOKEN=EAAx...<br/>
          DASHBOARD_PASSWORD=yourpassword
        </div>
      </div>
    </div>
  )
}
