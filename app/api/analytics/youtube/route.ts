import { NextResponse } from 'next/server'
import { getOwnChannelStats } from '@/lib/youtube'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channelId = process.env.YOUTUBE_CHANNEL_ID

  if (!channelId) {
    return NextResponse.json(
      { error: 'YOUTUBE_CHANNEL_ID לא מוגדר בהגדרות' },
      { status: 400 }
    )
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: 'YOUTUBE_API_KEY לא מוגדר' },
      { status: 400 }
    )
  }

  try {
    const data = await getOwnChannelStats(channelId)
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'YouTube API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
