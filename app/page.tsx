import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import KpiGrid from '@/components/dashboard/KpiGrid'
import DailySuggestionCard from '@/components/dashboard/DailySuggestionCard'
import Link from 'next/link'
import { ArrowLeft, Video, FileText, Lightbulb, TrendingUp } from 'lucide-react'
import { formatNumber, timeAgo } from '@/lib/utils'

export const revalidate = 1800

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

async function getDashboardData() {
  const [
    totalCompetitors,
    totalVideos,
    totalIdeas,
    publishedPosts,
    todaySuggestion,
    topVideos,
    recentPosts,
  ] = await Promise.all([
    prisma.competitor.count(),
    prisma.competitorVideo.count(),
    prisma.contentIdea.count(),
    prisma.blogPost.count({ where: { status: 'published' } }),
    prisma.dailySuggestion.findFirst({ where: { date: startOfDay(new Date()) } }),
    prisma.competitorVideo.findMany({
      orderBy: { viralityScore: 'desc' },
      take: 5,
      include: { competitor: { select: { name: true } } },
    }),
    prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, status: true, createdAt: true },
    }),
  ])

  return {
    totalCompetitors,
    totalVideos,
    totalIdeas,
    publishedPosts,
    todaySuggestion,
    topVideos,
    recentPosts,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const {
    totalCompetitors,
    totalVideos,
    totalIdeas,
    publishedPosts,
    todaySuggestion,
    topVideos,
    recentPosts,
  } = await getDashboardData()

  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'

  return (
    <div className="space-y-7">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">
            {greeting} 👋
          </h1>
          <p className="text-text2 text-sm mt-1">
            {now.toLocaleDateString('he-IL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {totalCompetitors === 0 && (
          <Link
            href="/competitors"
            className="flex items-center gap-2 bg-accent text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <span>הוסף מתחרה ראשון</span>
            <ArrowLeft size={14} />
          </Link>
        )}
      </div>

      {/* KPIs */}
      <KpiGrid
        totalCompetitors={totalCompetitors}
        totalVideos={totalVideos}
        totalIdeas={totalIdeas}
        publishedPosts={publishedPosts}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily suggestion */}
        {todaySuggestion ? (
          <DailySuggestionCard suggestion={{
            ...todaySuggestion,
            date: todaySuggestion.date.toISOString(),
          }} />
        ) : (
          <div className="glass-card p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
            <TrendingUp size={32} className="text-text2/30" />
            <p className="font-semibold text-text">אין הצעה יומית עדיין</p>
            <p className="text-xs text-text2">הסנכרון הבא יתרחש בחצות</p>
            {totalCompetitors === 0 ? (
              <Link href="/competitors" className="text-accent text-xs hover:underline">
                הוסף מתחרים קודם →
              </Link>
            ) : (
              <Link href="/api/cron/daily-suggestion" className="text-accent text-xs hover:underline">
                צור הצעה עכשיו →
              </Link>
            )}
          </div>
        )}

        {/* Top viral videos */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text text-sm">סרטונים ויראליים</h3>
            <Link href="/videos" className="text-xs text-text2 hover:text-accent flex items-center gap-1">
              <span>הכל</span>
              <ArrowLeft size={12} />
            </Link>
          </div>
          {topVideos.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center">
              <div>
                <Video size={24} className="text-text2/30 mx-auto mb-2" />
                <p className="text-xs text-text2">הוסף מתחרים וסנכרן לראות סרטונים</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {topVideos.map((video, i) => (
                <div key={video.id} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text font-medium line-clamp-1">{video.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-text2">{video.competitor.name}</span>
                      <span className="text-[10px] text-accent2">
                        {formatNumber(video.viewCount)} צפיות
                      </span>
                      <span className="text-[10px] text-warning">
                        ✨ {video.viralityScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent blog posts + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text text-sm">מאמרים אחרונים</h3>
            <Link href="/blog" className="text-xs text-text2 hover:text-accent flex items-center gap-1">
              <span>ניהול בלוג</span>
              <ArrowLeft size={12} />
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <FileText size={24} className="text-text2/30 mx-auto mb-2" />
                <p className="text-xs text-text2">אין מאמרים עדיין</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map(post => (
                <div key={post.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-text truncate flex-1">{post.title}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        post.status === 'published'
                          ? 'bg-success/20 text-success'
                          : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {post.status === 'published' ? 'פורסם' : 'טיוטה'}
                    </span>
                    <span className="text-[10px] text-text2">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-text text-sm mb-4">פעולות מהירות</h3>
          <div className="space-y-2.5">
            <Link
              href="/competitors"
              className="flex items-center gap-3 p-3 bg-bg2 rounded-xl hover:border-accent/30 border border-transparent transition-all text-sm font-medium text-text"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <TrendingUp size={14} className="text-accent" />
              </div>
              הוסף מתחרה
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-3 p-3 bg-bg2 rounded-xl hover:border-accent2/30 border border-transparent transition-all text-sm font-medium text-text"
            >
              <div className="w-8 h-8 rounded-lg bg-accent2/20 flex items-center justify-center">
                <FileText size={14} className="text-accent2" />
              </div>
              צור מאמר SEO
            </Link>
            <Link
              href="/content"
              className="flex items-center gap-3 p-3 bg-bg2 rounded-xl hover:border-warning/30 border border-transparent transition-all text-sm font-medium text-text"
            >
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <Lightbulb size={14} className="text-warning" />
              </div>
              ייצר רעיונות תוכן
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
