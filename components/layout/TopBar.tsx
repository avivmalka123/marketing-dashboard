'use client'
import { usePathname } from 'next/navigation'
import { Bell, RefreshCw } from 'lucide-react'
import { useState } from 'react'

const pageTitles: Record<string, string> = {
  '/': 'דשבורד',
  '/competitors': 'מעקב מתחרים',
  '/videos': 'סרטוני מתחרים',
  '/content': 'רעיונות תוכן',
  '/blog': 'בלוג SEO',
  '/analytics/youtube': 'YouTube Analytics',
  '/analytics/instagram': 'Instagram Analytics',
  '/settings': 'הגדרות',
}

export default function TopBar() {
  const pathname = usePathname()
  const [syncing, setSyncing] = useState(false)

  const title = pageTitles[pathname] ?? 'Marketing Dashboard'

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/cron/update-competitors', {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` },
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="h-16 border-b border-card-border bg-bg2/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      <h2 className="font-bold text-lg text-text">{title}</h2>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-card-border text-text2 hover:text-text text-xs font-medium transition-all hover:border-accent/40"
          title="סנכרן מתחרים עכשיו"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          <span>סנכרן</span>
        </button>

        <button className="w-8 h-8 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-text transition-all relative">
          <Bell size={15} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full text-[8px] flex items-center justify-center text-white">1</span>
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-xs font-bold text-white">
          A
        </div>
      </div>
    </header>
  )
}
