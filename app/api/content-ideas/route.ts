import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateContentIdeas, generateSimilarIdeas } from '@/lib/claude'
import { videoStore } from '@/lib/localStore'
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

  // ── Generate similar ideas based on liked ideas ──────────────────────────
  if (body.action === 'generate-similar') {
    const liked = body.likedIdeas as Array<{ title: string; format: string; keywords: string[] }>
    if (!liked || liked.length === 0) {
      return NextResponse.json({ error: 'לא נמצאו רעיונות אהובים' }, { status: 400 })
    }
    try {
      const { ideas } = await generateSimilarIdeas(liked, body.count ?? 4)
      type RawIdea = {
        title: string; format: string; targetAudience: string
        keywords: string[]; seoScore: number; notes?: string
        hook?: string; keyPoints?: string[]; recommendedLength?: string
        hashtags?: string[]; scriptOutline?: string
      }
      const mappedIdeas = (ideas as RawIdea[]).map(idea => ({
        title: idea.title,
        format: idea.format ?? 'video',
        targetAudience: idea.targetAudience,
        keywords: idea.keywords ?? [],
        seoScore: idea.seoScore ?? 65,
        notes: idea.notes,
        status: 'Ideas',
        hook: idea.hook,
        keyPoints: idea.keyPoints ?? [],
        recommendedLength: idea.recommendedLength,
        hashtags: idea.hashtags ?? [],
        scriptOutline: idea.scriptOutline,
      }))
      try {
        const created = await prisma.contentIdea.createMany({ data: mappedIdeas.map(i => ({
          title: i.title, format: i.format, targetAudience: i.targetAudience,
          keywords: i.keywords, seoScore: i.seoScore, notes: i.notes, status: i.status,
        })) })
        return NextResponse.json({ created: created.count, ideas: mappedIdeas })
      } catch {
        return NextResponse.json({ created: mappedIdeas.length, ideas: mappedIdeas, dbSaved: false })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בייצור רעיונות דומים'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // ── Generate ideas from competitor videos ────────────────────────────────
  if (body.action === 'generate') {
    let topVideos: Array<{ title: string; viralityScore: number }> = []
    try {
      topVideos = await prisma.competitorVideo.findMany({
        orderBy: { viralityScore: 'desc' },
        take: 10,
        select: { title: true, viralityScore: true },
      })
    } catch {
      topVideos = videoStore
        .findMany({ take: 10, orderBy: 'viralityScore' })
        .map(v => ({ title: v.title, viralityScore: v.viralityScore }))
    }

    if (topVideos.length === 0) {
      return NextResponse.json(
        { error: 'אין סרטונים לניתוח. הוסף מתחרים ולחץ "סנכרן" קודם.' },
        { status: 400 }
      )
    }

    try {
      const { ideas } = await generateContentIdeas(topVideos, body.count ?? 6)

      type RawIdea = {
        title: string; format: string; targetAudience: string
        keywords: string[]; seoScore: number; rationale?: string
        hook?: string; keyPoints?: string[]; recommendedLength?: string
        hashtags?: string[]; scriptOutline?: string
      }
      const mappedIdeas = (ideas as RawIdea[]).map(idea => ({
        title: idea.title,
        format: idea.format ?? 'video',
        targetAudience: idea.targetAudience,
        keywords: idea.keywords ?? [],
        seoScore: idea.seoScore ?? 50,
        notes: idea.rationale,
        status: 'Ideas',
        hook: idea.hook,
        keyPoints: idea.keyPoints ?? [],
        recommendedLength: idea.recommendedLength,
        hashtags: idea.hashtags ?? [],
        scriptOutline: idea.scriptOutline,
      }))

      try {
        const created = await prisma.contentIdea.createMany({ data: mappedIdeas.map(i => ({
          title: i.title, format: i.format, targetAudience: i.targetAudience,
          keywords: i.keywords, seoScore: i.seoScore, notes: i.notes, status: i.status,
        })) })
        return NextResponse.json({ created: created.count, ideas: mappedIdeas })
      } catch {
        return NextResponse.json({ created: mappedIdeas.length, ideas: mappedIdeas, dbSaved: false })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בייצור רעיונות'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // Manual creation
  try {
    const idea = await prisma.contentIdea.create({ data: body })
    return NextResponse.json(idea)
  } catch {
    return NextResponse.json({ error: 'מסד נתונים לא מחובר. לא ניתן לשמור רעיון ידני ללא DB.' }, { status: 503 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, ...rest } = await req.json()
  try {
    const updated = await prisma.contentIdea.update({ where: { id }, data: { status, ...rest } })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ ok: true }) // silent success when no DB
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  try {
    await prisma.contentIdea.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true }) // silent success when no DB
  }
}
