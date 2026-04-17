import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { reelStore } from '@/lib/localStore'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orderBy = (searchParams.get('sortBy') ?? 'viralityScore') as 'viralityScore' | 'likeCount' | 'publishedAt'
  const creatorId = searchParams.get('creatorId') ?? undefined
  const search = searchParams.get('search') ?? undefined

  const reels = reelStore.findManyWithCreator({ orderBy, creatorId, search, take: 100 })
  return NextResponse.json(reels)
}
