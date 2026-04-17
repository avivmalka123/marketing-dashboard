import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateNextVideoIdeas } from '@/lib/claude'
import { prisma } from '@/lib/prisma'
import { videoStore } from '@/lib/localStore'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch top videos with competitor names
  type VideoInput = { title: string; viewCount: number; viralityScore: number; competitor: string }
  let videos: VideoInput[] = []

  try {
    const dbVideos = await prisma.competitorVideo.findMany({
      orderBy: { viralityScore: 'desc' },
      take: 20,
      select: {
        title: true,
        viewCount: true,
        viralityScore: true,
        competitor: { select: { name: true } },
      },
    })
    videos = dbVideos.map(v => ({
      title: v.title,
      viewCount: v.viewCount,
      viralityScore: v.viralityScore,
      competitor: v.competitor.name,
    }))
  } catch {
    // Fallback to local store
    const localVids = videoStore.findManyWithCompetitor({ take: 20, orderBy: 'viralityScore' })
    videos = localVids.map(v => ({
      title: v.title,
      viewCount: v.viewCount,
      viralityScore: v.viralityScore,
      competitor: v.competitor?.name ?? 'Unknown',
    }))
  }

  if (videos.length === 0) {
    return NextResponse.json(
      { error: 'אין סרטונים לניתוח. הוסף מתחרים ולחץ "סנכרן" קודם.' },
      { status: 400 }
    )
  }

  try {
    const result = await generateNextVideoIdeas({ videos, count: 5 })
    return NextResponse.json({ ideas: result.ideas ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'שגיאה בייצור הרעיונות'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
