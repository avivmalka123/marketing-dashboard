import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateDailySuggestion } from '@/lib/claude'
import { videoStore } from '@/lib/localStore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = startOfDay(new Date())

  // ── Try DB flow first ─────────────────────────────────────────────────────
  try {
    // Check if today's suggestion already exists
    const existing = await prisma.dailySuggestion.findFirst({ where: { date: today } })
    if (existing) return NextResponse.json({ suggestion: existing, cached: true })

    // Find the top virality video
    let topVideo = await prisma.competitorVideo.findFirst({
      where: { publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { viralityScore: 'desc' },
      include: { competitor: { select: { name: true } } },
    })
    if (!topVideo) {
      topVideo = await prisma.competitorVideo.findFirst({
        orderBy: { viralityScore: 'desc' },
        include: { competitor: { select: { name: true } } },
      })
    }
    if (!topVideo) return NextResponse.json({ error: 'אין סרטונים. הוסף מתחרים ולחץ סנכרן קודם.' }, { status: 404 })

    const analysis = await generateDailySuggestion({
      title: topVideo.title,
      description: topVideo.description,
      tags: topVideo.tags,
      viewCount: topVideo.viewCount,
      viralityScore: topVideo.viralityScore,
      competitorName: (topVideo as typeof topVideo & { competitor: { name: string } }).competitor.name,
    })

    const suggestion = await prisma.dailySuggestion.create({
      data: {
        videoId: topVideo.videoId,
        reason: analysis.reason,
        hebrewTitles: analysis.hebrewTitles ?? [],
        contentBrief: analysis.contentBrief,
        trendAnalysis: analysis.trendAnalysis,
        date: today,
      },
    })
    return NextResponse.json({ suggestion })
  } catch { /* DB not connected — use local store */ }

  // ── Fallback: local store ─────────────────────────────────────────────────
  const localVideos = videoStore.findManyWithCompetitor({
    take: 1,
    orderBy: 'viralityScore',
  })

  if (localVideos.length === 0) {
    return NextResponse.json({ error: 'אין סרטונים. הוסף מתחרים ולחץ סנכרן קודם.' }, { status: 404 })
  }

  const topVideo = localVideos[0]
  try {
    const analysis = await generateDailySuggestion({
      title: topVideo.title,
      description: topVideo.description ?? null,
      tags: topVideo.tags ?? [],
      viewCount: topVideo.viewCount,
      viralityScore: topVideo.viralityScore,
      competitorName: topVideo.competitor?.name ?? 'מתחרה',
    })

    return NextResponse.json({
      suggestion: {
        id: `local_${Date.now()}`,
        videoId: topVideo.videoId,
        date: today.toISOString(),
        reason: analysis.reason,
        hebrewTitles: analysis.hebrewTitles ?? [],
        contentBrief: analysis.contentBrief,
        trendAnalysis: analysis.trendAnalysis,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
