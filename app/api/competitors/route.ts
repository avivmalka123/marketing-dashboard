import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveChannelId, getChannelInfo } from '@/lib/youtube'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const competitors = await prisma.competitor.findMany({
    include: {
      _count: { select: { videos: true } },
      videos: {
        orderBy: { viralityScore: 'desc' },
        take: 3,
        select: { videoId: true, title: true, viralityScore: true, thumbnailUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(competitors)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channelUrl } = await req.json()

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: 'YouTube API Key לא מוגדר. עבור להגדרות.' },
      { status: 400 }
    )
  }

  try {
    const channelId = await resolveChannelId(channelUrl)
    const channelInfo = await getChannelInfo(channelId)

    if (!channelInfo) {
      return NextResponse.json({ error: 'ערוץ לא נמצא' }, { status: 404 })
    }

    const competitor = await prisma.competitor.upsert({
      where: { channelId },
      update: {
        name: channelInfo.snippet?.title ?? 'Unknown',
        thumbnailUrl: channelInfo.snippet?.thumbnails?.high?.url,
        subscriberCount: parseInt(channelInfo.statistics?.subscriberCount ?? '0'),
        channelUrl,
      },
      create: {
        channelId,
        name: channelInfo.snippet?.title ?? 'Unknown',
        channelUrl,
        handle: channelInfo.snippet?.customUrl?.replace('@', ''),
        thumbnailUrl: channelInfo.snippet?.thumbnails?.high?.url,
        subscriberCount: parseInt(channelInfo.statistics?.subscriberCount ?? '0'),
      },
    })

    return NextResponse.json(competitor)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'שגיאה לא ידועה'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await prisma.competitor.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
