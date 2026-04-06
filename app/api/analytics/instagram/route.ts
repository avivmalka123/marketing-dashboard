import { NextResponse } from 'next/server'
import { getInstagramProfile, getInstagramMedia } from '@/lib/instagram'
import { generateInstagramInsights } from '@/lib/claude'
import { getApiKey } from '@/lib/getApiKey'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [token, userId] = await Promise.all([
    getApiKey('INSTAGRAM_ACCESS_TOKEN'),
    getApiKey('INSTAGRAM_USER_ID'),
  ])
  if (!token || !userId) {
    return NextResponse.json(
      { error: 'Instagram API לא מוגדר. הגדר INSTAGRAM_ACCESS_TOKEN ו-INSTAGRAM_USER_ID.' },
      { status: 400 }
    )
  }

  try {
    const [profile, mediaData] = await Promise.all([
      getInstagramProfile(),
      getInstagramMedia(20),
    ])

    const media = mediaData.data ?? []

    const avgLikes = media.length
      ? Math.round(media.reduce((s: number, m: { like_count?: number }) => s + (m.like_count ?? 0), 0) / media.length)
      : 0
    const avgComments = media.length
      ? Math.round(media.reduce((s: number, m: { comments_count?: number }) => s + (m.comments_count ?? 0), 0) / media.length)
      : 0

    // AI insights
    const insights = await generateInstagramInsights({
      followers: profile.followers_count ?? 0,
      avgLikes,
      avgComments,
      topPosts: media.slice(0, 5).map((m: { caption?: string; like_count?: number }) => ({
        caption: m.caption ?? '',
        likes: m.like_count ?? 0,
      })),
    })

    return NextResponse.json({
      profile,
      media,
      insights,
      stats: { avgLikes, avgComments },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Instagram error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
