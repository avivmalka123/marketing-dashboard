import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishBlogPost } from '@/lib/kajabi'
import { blogPostStore } from '@/lib/localStore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface InlinePost {
  title: string
  content: string
  metaDescription?: string | null
  slug?: string | null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { blogPostId, blogPost: inlinePost } = await req.json() as {
    blogPostId?: string
    blogPost?: InlinePost
  }

  // 1. Try loading from DB (only when we have a real DB-persisted ID)
  let post: InlinePost | null = null

  if (blogPostId) {
    // Try DB first
    try {
      const dbPost = await prisma.blogPost.findUnique({ where: { id: blogPostId } })
      if (dbPost) {
        post = {
          title: dbPost.title,
          content: dbPost.content,
          metaDescription: dbPost.metaDescription,
          slug: dbPost.slug,
        }
      }
    } catch { /* DB not connected */ }

    // Try local store fallback
    if (!post) {
      const localPost = blogPostStore.findById(blogPostId)
      if (localPost) {
        post = {
          title: localPost.title,
          content: localPost.content,
          metaDescription: localPost.metaDescription,
          slug: localPost.slug,
        }
      }
    }
  }

  // 2. Fall back to inline content (no-DB flow or DB unavailable)
  if (!post && inlinePost?.title && inlinePost?.content) {
    post = inlinePost
  }

  if (!post) {
    return NextResponse.json({ error: 'לא נמצא תוכן לפרסום' }, { status: 404 })
  }

  try {
    const kajabiResponse = await publishBlogPost({
      title: post.title,
      body: post.content,
      excerpt: post.metaDescription ?? undefined,
      slug: post.slug ?? undefined,
      published: true,
    })

    // Try to update DB status — non-fatal if DB is unavailable
    if (blogPostId) {
      const kajabiId = String((kajabiResponse as { id?: string | number } | undefined)?.id ?? '')
      try {
        await prisma.blogPost.update({
          where: { id: blogPostId },
          data: { status: 'published', kajabiPostId: kajabiId, publishedAt: new Date() },
        })
      } catch {
        // Update local store
        blogPostStore.update(blogPostId, {
          status: 'published',
          kajabiPostId: kajabiId || null,
          publishedAt: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      kajabiPostId: (kajabiResponse as { id?: string | number } | undefined)?.id ?? null,
      blogPost: {
        ...post,
        status: 'published',
        publishedAt: new Date().toISOString(),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kajabi error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
