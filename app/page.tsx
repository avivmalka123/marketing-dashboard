import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { competitorStore, videoStore, instagramCreatorStore, reelStore, blogPostStore } from '@/lib/localStore'
import KpiGrid from '@/components/dashboard/KpiGrid'
import DailySuggestionCard from '@/components/dashboard/DailySuggestionCard'
import DailySuggestionEmpty from '@/components/dashboard/DailySuggestionEmpty'
import NextVideoIdeasPanel from '@/components/dashboard/NextVideoIdeasPanel'
import ContentHabitsPanel from '@/components/dashboard/ContentHabitsPanel'
import Link from 'next/link'
import { ArrowLeft, Video, FileText, Lightbulb, TrendingUp, Camera, Heart, PlayCircle } from 'lucide-react'
import { formatNumber, timeAgo } from '@/lib/utils'

export const revalidate = 0

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

type TopVideo = { id: string; title: string; viewCount: number; viralityScore: number; competitor: { name: string } }
type TopReel  = { id: string; caption?: string | null; likeCount: number; viralityScore: number; creator: { handle: string } }
type RecentPost = { id: string; title: string; status: string; createdAt: Date }

async function getDashboardData() {
  // Instagram always comes from local store (no Prisma table)
  const totalIgCreators = instagramCreatorStore.count()
  const totalReels = reelStore.count()
  const topReels: TopReel[] = reelStore.findManyWithCreator({ take: 5 }).map(r => ({
    id: r.id,
    caption: r.caption,
    likeCount: r.likeCount,
    viralityScore: r.viralityScore,
    creator: { handle: r.creator?.handle ?? 'unknown' },
  }))

  try {
    const [
      totalCompetitors, totalVideos, totalIdeas, publishedPosts,
      todaySuggestion, topVideos, recentPosts,
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
    return { totalCompetitors, totalVideos, totalIdeas, publishedPosts, todaySuggestion, topVideos, recentPosts, totalIgCreators, totalReels, topReels }
  } catch { /* DB not connected */ }

  // Local store fallback
  const totalCompetitors = competitorStore.count()
  const totalVideos = videoStore.count()
  const topVideos: TopVideo[] = videoStore.findManyWithCompetitor({ take: 5 }).map(v => ({
    id: v.id, title: v.title, viewCount: v.viewCount, viralityScore: v.viralityScore,
    competitor: { name: v.competitor?.name ?? 'Unknown' },
  }))
  const localPosts = blogPostStore.findMany().slice(0, 3)
  const recentPosts: RecentPost[] = localPosts.map(p => ({
    id: p.id, title: p.title, status: p.status, createdAt: new Date(p.createdAt),
  }))
  const publishedPosts = blogPostStore.findMany().filter(p => p.status === 'published').length
  return {
    totalCompetitors, totalVideos, totalIdeas: 0, publishedPosts,
    todaySuggestion: null, topVideos, recentPosts,
    totalIgCreators, totalReels, topReels,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const {
    totalCompetitors, totalVideos, totalIdeas, publishedPosts,
    todaySuggestion, topVideos, recentPosts,
    totalIgCreators, totalReels, topReels,
  } = await getDashboardData()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'

  return (
    <div className="space-y-7">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">{greeting} 👋</h1>
          <p className="text-text2 text-sm mt-1">
            {now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {totalCompetitors === 0 && totalIgCreators === 0 && (
          <Link href="/youtube" className="flex items-center gap-2 bg-accent text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            <span>התחל לעקוב</span>
            <ArrowLeft size={14} />
          </Link>
        )}
      </div>

      {/* KPIs */}
      <KpiGrid totalCompetitors={totalCompetitors} totalVideos={totalVideos} totalIdeas={totalIdeas} publishedPosts={publishedPosts} />

      {/* ── Content Habits Panel ── */}
      <ContentHabitsPanel />

      {/* 5 Next Video Ideas */}
      <NextVideoIdeasPanel />

      {/* ── SPLIT: YouTube (left) | Instagram (right) ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── YouTube ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600/20 flex items-center justify-center">
                <PlayCircle size={14} className="text-red-500" />
              </div>
              <span className="font-bold text-text text-sm">YouTube</span>
              <span className="text-[10px] text-text2 bg-card border border-card-border px-2 py-0.5 rounded-full">
                {totalCompetitors} מתחרים • {totalVideos} סרטונים
              </span>
            </div>
            <Link href="/youtube" className="text-xs text-text2 hover:text-red-400 flex items-center gap-1 transition-colors">
              ניהול <ArrowLeft size={12} />
            </Link>
          </div>

          {todaySuggestion ? (
            <DailySuggestionCard suggestion={{ ...todaySuggestion, date: todaySuggestion.date.toISOString() }} />
          ) : (
            <DailySuggestionEmpty hasCompetitors={totalCompetitors > 0} />
          )}

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text text-sm">סרטונים ויראליים</h3>
              <Link href="/youtube" className="text-xs text-text2 hover:text-red-400 flex items-center gap-1 transition-colors">
                הכל <ArrowLeft size={12} />
              </Link>
            </div>
            {topVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <Video size={24} className="text-text2/30" />
                <p className="text-xs text-text2">הוסף מתחרים ב-YouTube וסנכרן</p>
                <Link href="/youtube" className="text-xs text-red-500 hover:underline">עבור ל-YouTube →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topVideos.map((video, i) => (
                  <div key={video.id} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text font-medium line-clamp-1">{video.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-text2">{video.competitor.name}</span>
                        <span className="text-[10px] text-red-400">{formatNumber(video.viewCount)} צפיות</span>
                        <span className="text-[10px] text-warning">✨ {video.viralityScore.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Instagram ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-600/20 flex items-center justify-center">
                <Camera size={14} className="text-pink-500" />
              </div>
              <span className="font-bold text-text text-sm">Instagram</span>
              <span className="text-[10px] text-text2 bg-card border border-card-border px-2 py-0.5 rounded-full">
                {totalIgCreators} יוצרים • {totalReels} רילסים
              </span>
            </div>
            <Link href="/instagram" className="text-xs text-text2 hover:text-pink-400 flex items-center gap-1 transition-colors">
              ניהול <ArrowLeft size={12} />
            </Link>
          </div>

          {totalIgCreators === 0 ? (
            <div className="glass-card p-8 text-center border-pink-500/10">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="font-bold text-text text-sm mb-1.5">Instagram לא מוגדר</h3>
              <p className="text-text2 text-xs mb-4 leading-relaxed max-w-xs mx-auto">
                עקוב אחר יוצרי Instagram ומשוך 30 רילסים אחרונים לניתוח תוכן
              </p>
              <Link href="/instagram" className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                <Camera size={14} /> הגדר Instagram
              </Link>
            </div>
          ) : (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text text-sm">רילסים ויראליים</h3>
                <Link href="/instagram" className="text-xs text-text2 hover:text-pink-400 flex items-center gap-1 transition-colors">
                  הכל <ArrowLeft size={12} />
                </Link>
              </div>
              {topReels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <Camera size={24} className="text-text2/30" />
                  <p className="text-xs text-text2">לחץ &quot;סנכרן&quot; ב-Instagram למשיכת רילסים</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topReels.map((reel, i) => (
                    <div key={reel.id} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-pink-600/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text font-medium line-clamp-1">
                          {reel.caption ? reel.caption.slice(0, 60) : 'ריל ללא כיתוב'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-text2">@{reel.creator.handle}</span>
                          <span className="flex items-center gap-0.5 text-[10px] text-pink-400">
                            <Heart size={8} /> {formatNumber(reel.likeCount)}
                          </span>
                          <span className="text-[10px] text-warning">✨ {reel.viralityScore.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="glass-card p-4 border-pink-500/10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text text-sm">אנליטיקס שלי</h3>
              <Link href="/instagram" className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors">
                הרחב <ArrowLeft size={12} />
              </Link>
            </div>
            <p className="text-xs text-text2 mt-2">
              חבר את חשבון ה-Business שלך — <Link href="/settings" className="text-pink-400 hover:underline">הגדרות →</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Blog posts + Quick actions ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text text-sm">מאמרים אחרונים</h3>
            <Link href="/blog" className="text-xs text-text2 hover:text-accent flex items-center gap-1">
              ניהול בלוג <ArrowLeft size={12} />
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
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      post.status === 'published' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                    }`}>
                      {post.status === 'published' ? 'פורסם' : 'טיוטה'}
                    </span>
                    <span className="text-[10px] text-text2">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="font-bold text-text text-sm mb-4">פעולות מהירות</h3>
          <div className="space-y-2.5">
            <Link href="/youtube" className="flex items-center gap-3 p-3 bg-bg2 rounded-xl hover:border-red-500/30 border border-transparent transition-all text-sm font-medium text-text">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                <TrendingUp size={14} className="text-red-500" />
              </div>
              YouTube — מתחרים
            </Link>
            <Link href="/instagram" className="flex items-center gap-3 p-3 bg-bg2 rounded-xl hover:border-pink-500/30 border border-transparent transition-all text-sm font-medium text-text">
              <div className="w-8 h-8 rounded-lg bg-pink-600/20 flex items-center justify-center">
                <Camera size={14} className="text-pink-500" />
              </div>
              Instagram — יוצרים
            </Link>
            <Link href="/blog" className="flex items-center gap-3 p-3 bg-bg2 rounded-xl hover:border-accent2/30 border border-transparent transition-all text-sm font-medium text-text">
              <div className="w-8 h-8 rounded-lg bg-accent2/20 flex items-center justify-center">
                <FileText size={14} className="text-accent2" />
              </div>
              צור מאמר SEO
            </Link>
            <Link href="/content" className="flex items-center gap-3 p-3 bg-bg2 rounded-xl hover:border-warning/30 border border-transparent transition-all text-sm font-medium text-text">
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
