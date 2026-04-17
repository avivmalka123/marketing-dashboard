import { NextRequest, NextResponse } from 'next/server'
import { generateRelatedChannels } from '@/lib/claude'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { competitors } = body as { competitors: Array<{ name: string; channelId: string }> }

    if (!competitors || competitors.length === 0) {
      return NextResponse.json({ error: 'אין מתחרים — הוסף מתחרים תחילה' }, { status: 400 })
    }

    const result = await generateRelatedChannels(competitors)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'שגיאה בייצור הצעות ערוצים'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
