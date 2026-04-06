import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeVideoForIsraeliAudience } from '@/lib/claude'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId } = await req.json()

  const video = await prisma.competitorVideo.findUnique({ where: { videoId } })
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

  try {
    const analysis = await analyzeVideoForIsraeliAudience({
      videoId: video.videoId,
      title: video.title,
      description: video.description,
      tags: video.tags,
      viewCount: video.viewCount,
      viralityScore: video.viralityScore,
    })

    return NextResponse.json({ analysis })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Claude error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
