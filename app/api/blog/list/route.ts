import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { blogPostStore } from '@/lib/localStore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        metaDescription: true,
        slug: true,
        status: true,
        imageUrl: true,
        kajabiPostId: true,
        publishedAt: true,
        createdAt: true,
      },
    })
    return NextResponse.json(posts)
  } catch {
    // DB not connected — fall back to local file store
    return NextResponse.json(blogPostStore.findMany())
  }
}
