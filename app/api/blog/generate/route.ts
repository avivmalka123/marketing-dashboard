import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSEOBlogPost } from '@/lib/claude'
import { generateImage } from '@/lib/nanabanana'
import { findNextAvailableDate, scheduleBlogPost } from '@/lib/kajabi'
import { blogPostStore } from '@/lib/localStore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/** Strip AI-tell characters and patterns from HTML content */
function humanizeContent(html: string): string {
  return html
    .replace(/\u2014/g, ',')   // em dash → comma
    .replace(/\u2013/g, ',')   // en dash → comma
    .replace(/—/g, ',')
    .replace(/–/g, ',')
    .replace(/,\s*,/g, ',')
    // Common AI phrases (Hebrew)
    .replace(/בואו נצלול/gi, 'נסקור')
    .replace(/ללא ספק/gi, '')
    .replace(/חשוב לציין/gi, '')
    .replace(/כפי שנראה/gi, '')
    .replace(/מעניין לציין/gi, '')
    .replace(/מן הראוי להדגיש/gi, '')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topic, videoId, generateImageFlag } = await req.json()

  if (!topic?.trim()) {
    return NextResponse.json({ error: 'נדרש נושא' }, { status: 400 })
  }

  let videoContext: string | undefined
  if (videoId) {
    try {
      const video = await prisma.competitorVideo.findUnique({ where: { videoId } })
      if (video) {
        videoContext = `בהשראת סרטון: "${video.title}". תגיות: ${video.tags.slice(0, 8).join(', ')}`
      }
    } catch { /* DB not connected */ }
  }

  try {
    // ── 0. Fetch existing articles for diverse internal links ─────────────────
    let existingArticles: Array<{ title: string; slug: string }> = []
    try {
      const raw = await prisma.blogPost.findMany({
        select: { title: true, slug: true },
        where: { slug: { not: '' } },
        orderBy: { createdAt: 'desc' },
        take: 40,
      })
      existingArticles = raw
        .filter((p): p is { title: string; slug: string } => Boolean(p.slug))
        .map(p => ({ title: p.title, slug: p.slug }))
    } catch {
      // DB not connected — fall back to local file store for existing articles
      existingArticles = blogPostStore
        .findMany()
        .filter(p => p.slug)
        .map(p => ({ title: p.title, slug: p.slug! }))
    }

    // ── 1. Generate blog content ──────────────────────────────────────────────
    const blogData = await generateSEOBlogPost(topic, videoContext, existingArticles)
    blogData.content = humanizeContent(blogData.content)

    // ── 2. Image prompt for Nano Banana ──────────────────────────────────────
    const imagePrompt = `Professional blog header image for Hebrew article: "${blogData.title}". Israeli digital business context, clean modern design, vibrant colors, no text, 16:9 aspect ratio, high quality photography style.`

    // ── 3. Optional image generation ─────────────────────────────────────────
    let imageUrl: string | undefined
    if (generateImageFlag !== false) {
      try {
        const url = await generateImage(imagePrompt, { width: 1200, height: 630 })
        if (url) imageUrl = url
      } catch { /* Nano Banana not configured */ }
    }

    // ── 4. Auto-schedule to Kajabi (non-fatal) ────────────────────────────────
    let scheduledFor: string | null = null
    let kajabiPostId: string | null = null
    try {
      const publishAt = await findNextAvailableDate()
      const kajabiResponse = await scheduleBlogPost(
        { title: blogData.title, body: blogData.content, excerpt: blogData.metaDescription, slug: blogData.slug },
        publishAt
      )
      scheduledFor = publishAt.toISOString()
      kajabiPostId = String((kajabiResponse as { id?: string | number } | null)?.id ?? '')
    } catch (kajabiErr) {
      console.warn('Kajabi schedule failed:', kajabiErr instanceof Error ? kajabiErr.message : kajabiErr)
    }

    const postStatus = scheduledFor ? 'scheduled' : 'draft'

    // ── 5. Persist to DB, with local file store fallback ─────────────────────
    let savedId: string | null = null
    try {
      const saved = await prisma.blogPost.create({
        data: {
          title: blogData.title,
          content: blogData.content,
          metaDescription: blogData.metaDescription,
          slug: blogData.slug,
          imageUrl,
          status: postStatus,
          kajabiPostId: kajabiPostId ?? undefined,
          publishedAt: scheduledFor ? new Date(scheduledFor) : undefined,
        },
      })
      savedId = saved.id
    } catch {
      // DB not connected — save to local file store so history persists
      const localPost = blogPostStore.create({
        title: blogData.title,
        content: blogData.content,
        metaDescription: blogData.metaDescription ?? null,
        slug: blogData.slug ?? null,
        imageUrl: imageUrl ?? null,
        status: postStatus,
        kajabiPostId: kajabiPostId ?? null,
        publishedAt: scheduledFor ?? null,
      })
      savedId = localPost.id
    }

    return NextResponse.json({
      blogPost: {
        id: savedId,
        title: blogData.title,
        content: blogData.content,
        metaDescription: blogData.metaDescription ?? null,
        slug: blogData.slug ?? null,
        imageUrl: imageUrl ?? null,
        status: postStatus,
        scheduledFor,
        kajabiPostId,
        createdAt: new Date().toISOString(),
      },
      keywords: blogData.keywords ?? [],
      imagePrompt,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'שגיאה ביצירה'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
