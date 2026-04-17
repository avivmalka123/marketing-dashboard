import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { blogPostStore } from '@/lib/localStore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  // 1. Try DB first
  try {
    const post = await prisma.blogPost.findUnique({ where: { id } })
    if (post) return NextResponse.json(post)
  } catch { /* DB not connected */ }

  // 2. Fall back to local store
  const local = blogPostStore.findById(id)
  if (local) return NextResponse.json(local)

  return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  // Try DB
  try {
    await prisma.blogPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { /* DB not connected */ }

  // Local store
  const deleted = blogPostStore.delete(id)
  if (!deleted) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ success: true })
}
