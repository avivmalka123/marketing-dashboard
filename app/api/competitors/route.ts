import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveChannelId, getChannelInfo } from '@/lib/youtube'
import { competitorStore } from '@/lib/localStore'
import { syncCompetitorVideos } from '@/lib/syncCompetitor'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const competitors = await prisma.competitor.findMany({
      include: {
        _count: { select: { videos: true } },
        videos: {
          where: { publishedAt: { gte: ninetyDaysAgo } },
          orderBy: { viewCount: 'desc' },
          take: 5,
          select: {
            videoId: true, title: true, viralityScore: true,
            thumbnailUrl: true, viewCount: true, publishedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(competitors)
  } catch { /* DB not connected — fall through */ }

  return NextResponse.json(competitorStore.findMany())
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channelUrl } = await req.json()

  if (!channelUrl?.trim()) {
    return NextResponse.json({ error: 'כתובת ערוץ נדרשת' }, { status: 400 })
  }

  try {
    const channelId = await resolveChannelId(channelUrl)
    const channelInfo = await getChannelInfo(channelId)

    if (!channelInfo) {
      return NextResponse.json({ error: 'ערוץ לא נמצא' }, { status: 404 })
    }

    const name = channelInfo.snippet?.title ?? 'Unknown'
    const thumbnailUrl = channelInfo.snippet?.thumbnails?.high?.url ?? null
    const subscriberCount = parseInt(channelInfo.statistics?.subscriberCount ?? '0')
    const handle = channelInfo.snippet?.customUrl?.replace('@', '') ?? null

    let competitor: { id: string; name: string; channelId: string; subscriberCount?: number | null; avgViews?: number | null }

    // Try DB first
    try {
      competitor = await prisma.competitor.upsert({
        where: { channelId },
        update: { name, thumbnailUrl, subscriberCount, channelUrl },
        create: { channelId, name, channelUrl, handle, thumbnailUrl, subscriberCount },
      })
    } catch {
      // DB not connected — use local file store
      competitor = competitorStore.upsert(
        channelId,
        { channelId, name, channelUrl, handle, thumbnailUrl, subscriberCount },
        { name, thumbnailUrl, subscriberCount, channelUrl }
      )
    }

    // Auto-sync the 15 latest videos in background (non-blocking — don't await)
    syncCompetitorVideos(competitor).catch(err =>
      console.warn('Background video sync failed:', err instanceof Error ? err.message : err)
    )

    return NextResponse.json({ ...competitor, _count: { videos: 0 }, videos: [], syncing: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'שגיאה לא ידועה'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()

  try {
    await prisma.competitor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { /* DB not connected */ }

  competitorStore.delete(id)
  return NextResponse.json({ success: true })
}
