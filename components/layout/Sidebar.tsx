'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
  PlayCircle,
  Camera,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const nav = [
  { href: '/',          label: 'דשבורד',        icon: LayoutDashboard, exact: true  },
  { href: '/youtube',   label: 'YouTube',         icon: PlayCircle,      exact: false },
  { href: '/instagram', label: 'Instagram',        icon: Camera,          exact: false },
  { href: '/content',   label: 'רעיונות תוכן',   icon: Lightbulb,       exact: false },
  { href: '/blog',      label: 'בלוג SEO',        icon: FileText,        exact: false },
  { href: '/settings',  label: 'הגדרות',          icon: Settings,        exact: false },
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
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)

          // YouTube: red accent, Instagram: pink gradient
          const accentClass =
            href === '/youtube'   ? 'bg-red-600/20 text-text border border-red-600/30 shadow-[0_2px_12px_rgba(220,38,38,0.15)]' :
            href === '/instagram' ? 'bg-pink-600/20 text-text border border-pink-600/30 shadow-[0_2px_12px_rgba(236,72,153,0.15)]' :
            'bg-accent/20 text-text border border-accent/30 shadow-[0_2px_12px_rgba(124,58,237,0.15)]'

          const iconAccent =
            href === '/youtube'   ? 'text-red-500' :
            href === '/instagram' ? 'text-pink-500' :
            'text-accent'

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active ? accentClass : 'text-text2 hover:text-text hover:bg-card'
              }`}
            >
              <Icon size={17} className={active ? iconAccent : ''} />
              <span>{label}</span>

              {/* Platform badges */}
              {href === '/youtube' && (
                <span className="mr-auto text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">YT</span>
              )}
              {href === '/instagram' && (
                <span className="mr-auto text-[10px] font-bold text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded">IG</span>
              )}
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
