import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSEOBlogPost } from '@/lib/claude'
import { generateImage } from '@/lib/nanabanana'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topic, videoId, generateImageFlag } = await req.json()

  if (!topic?.trim()) {
    return NextResponse.json({ error: 'נדרש נושא' }, { status: 400 })
  }

  // Optional: get video context
  let videoContext: string | undefined
  if (videoId) {
    const video = await prisma.competitorVideo.findUnique({ where: { videoId } })
    if (video) {
      videoContext = `בהשראת סרטון: "${video.title}". תגיות: ${video.tags.slice(0, 8).join(', ')}`
    }
  }

  try {
    const blogData = await generateSEOBlogPost(topic, videoContext)

    // Generate image if requested and Nano Banana is configured
    let imageUrl: string | undefined
    if (generateImageFlag !== false) {
      const imgPrompt = `Professional blog header image for article: "${blogData.title}". Modern Israeli business/digital marketing context, clean professional style.`
      const url = await generateImage(imgPrompt, { width: 1200, height: 630 })
      if (url) imageUrl = url
    }

    const blogPost = await prisma.blogPost.create({
      data: {
        title: blogData.title,
        content: blogData.content,
        metaDescription: blogData.metaDescription,
        slug: blogData.slug,
        imageUrl,
        status: 'draft',
      },
    })

    return NextResponse.json({ blogPost, keywords: blogData.keywords })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'שגיאה ביצירה'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
