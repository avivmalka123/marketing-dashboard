'use client'
import { useState, useEffect } from 'react'
import { Key, Check, Loader2, ExternalLink } from 'lucide-react'

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
    description: 'UCxxxxxxxxxx - הערוץ שלך בYouTube',
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

export default function SettingsPage() {
  const [configuredKeys, setConfiguredKeys] = useState<string[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((settings: Array<{ key: string }>) => {
        setConfiguredKeys(settings.map(s => s.key))
        setLoading(false)
      })
  }, [])

  async function handleSave(key: string) {
    const value = values[key]?.trim()
    if (!value) return

    setSaving(key)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setConfiguredKeys(prev => [...new Set([...prev, key])])
    setValues(prev => ({ ...prev, [key]: '' }))
    setSaved(key)
    setSaving(null)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">הגדרות</h1>
        <p className="text-text2 text-sm mt-1">חבר API keys לפעולה מלאה של הדשבורד</p>
      </div>

      {/* Status bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text2">
            {configuredKeys.length} / {KEY_DEFINITIONS.filter(k => k.required).length} API keys נחוצים מוגדרים
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-3">
          {KEY_DEFINITIONS.map(def => {
            const isConfigured = configuredKeys.includes(def.key)
            const isSaving = saving === def.key
            const isSaved = saved === def.key

            return (
              <div key={def.key} className="glass-card p-5">
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text">{def.label}</span>
                        {def.required && (
                          <span className="text-[10px] text-danger bg-danger/10 px-1.5 py-0.5 rounded">נחוץ</span>
                        )}
                        {isConfigured && (
                          <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded">✓ מוגדר</span>
                        )}
                      </div>
                      <p className="text-xs text-text2 mt-0.5">{def.description}</p>
                    </div>
                  </div>
                  {def.link && (
                    <a
                      href={def.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text2 hover:text-accent2 transition-colors flex-shrink-0"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder={isConfigured ? '••••••••••• (מוגדר)' : `הזן ${def.label}`}
                    value={values[def.key] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [def.key]: e.target.value }))}
                    className="flex-1 bg-bg2 border border-card-border rounded-xl px-3 py-2 text-sm text-text placeholder-text2 focus:outline-none focus:border-accent/60 transition-colors"
                    dir="ltr"
                  />
                  <button
                    onClick={() => handleSave(def.key)}
                    disabled={isSaving || !values[def.key]?.trim()}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                      isSaved
                        ? 'bg-success/20 text-success border border-success/30'
                        : 'bg-accent text-white hover:opacity-90'
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isSaved ? (
                      '✓'
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

      {/* Environment variables note */}
      <div className="glass-card p-5 border-accent/20">
        <h3 className="font-bold text-text text-sm mb-2">⚡ טיפ: משתני סביבה</h3>
        <p className="text-xs text-text2 leading-relaxed">
          בנוסף לשמירה בדאטהבייס, ניתן להגדיר את ה-API keys ב-<code className="text-accent">.env.local</code> לפיתוח
          מקומי או ב-Vercel Dashboard לפרודקשן. ערכי <code className="text-accent">.env</code> מקבלים עדיפות.
        </p>
      </div>
    </div>
  )
}
