import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { instagramCreatorStore } from '@/lib/localStore'

// GET — list all creators
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(instagramCreatorStore.findMany())
}

// POST — add a new creator by handle
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { handle, name } = await req.json()
  if (!handle?.trim()) return NextResponse.json({ error: 'נדרש handle' }, { status: 400 })

  const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase()
  const displayName = name?.trim() || cleanHandle

  try {
    const creator = instagramCreatorStore.upsert(
      cleanHandle,
      {
        handle: cleanHandle,
        name: displayName,
        profilePicUrl: null,
        followersCount: null,
        mediaCount: null,
        bio: null,
        avgLikes: null,
        avgComments: null,
      },
      { name: displayName }
    )
    return NextResponse.json(creator)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'שגיאה בהוספת יוצר'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE — remove a creator and their reels
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'נדרש id' }, { status: 400 })

  instagramCreatorStore.delete(id)
  return NextResponse.json({ ok: true })
}
