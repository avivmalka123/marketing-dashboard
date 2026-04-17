import Link from 'next/link'
import { Users, Video, FileText, Lightbulb } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface Props {
  totalVideos: number
  totalIdeas: number
  totalCompetitors: number
  publishedPosts: number
}

export default function KpiGrid({ totalVideos, totalIdeas, totalCompetitors, publishedPosts }: Props) {
  const kpis = [
    {
      label: 'מתחרים במעקב',
      value: totalCompetitors,
      icon: Users,
      color: 'from-accent to-purple-500',
      glow: 'rgba(124,58,237,0.3)',
      href: '/youtube',
    },
    {
      label: 'סרטונים מנוטרים',
      value: totalVideos,
      icon: Video,
      color: 'from-accent2 to-blue-500',
      glow: 'rgba(6,182,212,0.3)',
      href: '/youtube',
    },
    {
      label: 'רעיונות תוכן',
      value: totalIdeas,
      icon: Lightbulb,
      color: 'from-warning to-orange-500',
      glow: 'rgba(245,158,11,0.3)',
      href: '/content',
    },
    {
      label: 'מאמרים פורסמו',
      value: publishedPosts,
      icon: FileText,
      color: 'from-success to-emerald-600',
      glow: 'rgba(16,185,129,0.3)',
      href: '/blog',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(({ label, value, icon: Icon, color, glow, href }) => (
        <Link
          key={label}
          href={href}
          className="glass-card p-5 relative overflow-hidden hover:border-white/20 transition-all group cursor-pointer"
        >
          <div
            className={`absolute top-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br ${color} opacity-10 -translate-x-8 -translate-y-8 blur-2xl group-hover:opacity-20 transition-opacity`}
          />
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}
              style={{ boxShadow: `0 4px 16px ${glow}` }}
            >
              <Icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-extrabold text-text">{formatNumber(value)}</div>
            <div className="text-xs text-text2 mt-0.5 group-hover:text-text transition-colors">{label}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
