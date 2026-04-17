import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { videoStore } from '@/lib/localStore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const competitorId = url.searchParams.get('competitorId') ?? undefined
  const sortBy = url.searchParams.get('sortBy') ?? 'viralityScore'
  const search = url.searchParams.get('search') ?? ''
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '200'), 500)

  type OrderByField = 'viralityScore' | 'viewCount' | 'publishedAt' | 'trendScore' | 'growthRate'
  const validSort: OrderByField[] = ['viralityScore', 'viewCount', 'publishedAt', 'trendScore', 'growthRate']
  const sort: OrderByField = validSort.includes(sortBy as OrderByField)
    ? (sortBy as OrderByField)
    : 'viralityScore'

  try {
    const videos = await prisma.competitorVideo.findMany({
      where: {
        ...(competitorId ? { competitorId } : {}),
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { [sort]: 'desc' },
      take: limit,
      include: {
        competitor: { select: { id: true, name: true, thumbnailUrl: true, channelId: true } },
      },
    })
    return NextResponse.json(videos)
  } catch {
    // Fallback: local store — pass all params directly (sorting + filtering handled inside)
    const results = videoStore.findManyWithCompetitor({
      take: limit,
      orderBy: sort,
      competitorId,
      search: search || undefined,
    })
    return NextResponse.json(results)
  }
}
