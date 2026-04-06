'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Video,
  Lightbulb,
  FileText,
  BarChart2,
  Camera,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const nav = [
  { href: '/', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/competitors', label: 'מתחרים', icon: Users },
  { href: '/videos', label: 'סרטונים', icon: Video },
  { href: '/content', label: 'רעיונות תוכן', icon: Lightbulb },
  { href: '/blog', label: 'בלוג SEO', icon: FileText },
  { href: '/analytics/youtube', label: 'YouTube Analytics', icon: BarChart2 },
  { href: '/analytics/instagram', label: 'Instagram Analytics', icon: Camera },
  { href: '/settings', label: 'הגדרות', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-64 bg-bg2 border-l border-card-border flex flex-col z-30">
      {/* Logo */}
      <div className="p-5 border-b border-card-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-xl shadow-[0_4px_18px_rgba(124,58,237,0.4)] flex-shrink-0">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-text leading-tight">Marketing Hub</h1>
            <p className="text-[11px] text-text2">ניהול שיווק אורגני</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-accent/20 text-text border border-accent/30 shadow-[0_2px_12px_rgba(124,58,237,0.15)]'
                  : 'text-text2 hover:text-text hover:bg-card'
              }`}
            >
              <Icon size={17} className={active ? 'text-accent' : ''} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-card-border">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-text2 hover:text-danger hover:bg-danger/10 transition-all"
        >
          <LogOut size={17} />
          <span>יציאה</span>
        </button>
      </div>
    </aside>
  )
}
