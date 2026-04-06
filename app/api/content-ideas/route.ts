import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateContentIdeas } from '@/lib/claude'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ideas = await prisma.contentIdea.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sourceVideo: { select: { title: true, viralityScore: true } },
      },
    })
    return NextResponse.json(ideas)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'generate') {
    const topVideos = await prisma.competitorVideo.findMany({
      orderBy: { viralityScore: 'desc' },
      take: 10,
      select: { title: true, viralityScore: true },
    })

    if (topVideos.length === 0) {
      return NextResponse.json(
        { error: 'אין סרטונים. הוסף מתחרים ובצע סנכרון קודם.' },
        { status: 400 }
      )
    }

    const { ideas } = await generateContentIdeas(topVideos, body.count ?? 8)

    const created = await prisma.contentIdea.createMany({
      data: ideas.map((idea: {
        title: string
        format: string
        targetAudience: string
        keywords: string[]
        seoScore: number
        rationale?: string
      }) => ({
        title: idea.title,
        format: idea.format ?? 'video',
        targetAudience: idea.targetAudience,
        keywords: idea.keywords ?? [],
        seoScore: idea.seoScore ?? 50,
        notes: idea.rationale,
        status: 'Ideas',
      })),
    })

    return NextResponse.json({ created: created.count })
  }

  // Manual creation
  const idea = await prisma.contentIdea.create({ data: body })
  return NextResponse.json(idea)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, ...rest } = await req.json()
  const updated = await prisma.contentIdea.update({
    where: { id },
    data: { status, ...rest },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await prisma.contentIdea.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
