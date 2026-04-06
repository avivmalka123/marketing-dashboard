import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateDailySuggestion } from '@/lib/claude'

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'

  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = startOfDay(new Date())

  // Already done today?
  const existing = await prisma.dailySuggestion.findFirst({
    where: { date: today },
  })
  if (existing) return NextResponse.json({ cached: true, suggestion: existing })

  // Pick top virality video from last 48h
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000)
  let topVideo = await prisma.competitorVideo.findFirst({
    where: { publishedAt: { gte: cutoff48h } },
    orderBy: { viralityScore: 'desc' },
    include: { competitor: { select: { name: true } } },
  })

  // Fallback: last 7 days
  if (!topVideo) {
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    topVideo = await prisma.competitorVideo.findFirst({
      where: { publishedAt: { gte: cutoff7d } },
      orderBy: { viralityScore: 'desc' },
      include: { competitor: { select: { name: true } } },
    })
  }

  // Fallback: all time best
  if (!topVideo) {
    topVideo = await prisma.competitorVideo.findFirst({
      orderBy: { viralityScore: 'desc' },
      include: { competitor: { select: { name: true } } },
    })
  }

  if (!topVideo) {
    return NextResponse.json({ error: 'No videos found. Add competitors first.' }, { status: 404 })
  }

  try {
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

    return NextResponse.json({ success: true, suggestion })
  } catch (err) {
    console.error('Daily suggestion error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
