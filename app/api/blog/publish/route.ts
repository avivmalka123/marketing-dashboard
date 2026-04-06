import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishBlogPost } from '@/lib/kajabi'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { blogPostId } = await req.json()

  const post = await prisma.blogPost.findUnique({ where: { id: blogPostId } })
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  try {
    const kajabiResponse = await publishBlogPost({
      title: post.title,
      body: post.content,
      excerpt: post.metaDescription ?? undefined,
      slug: post.slug ?? undefined,
      published: true,
    })

    const updated = await prisma.blogPost.update({
      where: { id: blogPostId },
      data: {
        status: 'published',
        kajabiPostId: String(kajabiResponse?.id ?? ''),
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, blogPost: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kajabi error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
