import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiKey } from '@/lib/getApiKey'
import { instagramCreatorStore, reelStore } from '@/lib/localStore'

const IG_BASE = 'https://graph.facebook.com/v19.0'

/** Compute a simple virality score for a reel */
function calcViralityScore(likes: number, comments: number, plays: number, daysSince: number): number {
  const engagement = likes + comments * 3 + plays * 0.01
  return Math.min(100, (engagement / Math.max(daysSince + 1, 1)) * 0.5)
}

/** Try Instagram Business Discovery API to get creator's media */
async function fetchCreatorReels(handle: string, token: string, igUserId: string) {
  const mediaFields = 'id,caption,media_type,thumbnail_url,permalink,timestamp,like_count,comments_count'
  const fields = `business_discovery.fields(id,username,name,biography,followers_count,media_count,profile_picture_url,media.limit(30){${mediaFields}})`

  const url = new URL(`${IG_BASE}/${igUserId}`)
  url.searchParams.set('fields', fields)
  url.searchParams.set('username', handle)
  url.searchParams.set('access_token', token)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Instagram API ${res.status}: ${errText}`)
  }
  const data = await res.json()
  if (data.error) throw new Error(data.error.message ?? 'Instagram API error')
  return data.business_discovery as {
    id: string
    username: string
    name: string
    biography?: string
    followers_count: number
    media_count: number
    profile_picture_url?: string
    media?: { data: Array<{
      id: string
      caption?: string
      media_type: string
      thumbnail_url?: string
      permalink: string
      timestamp: string
      like_count: number
      comments_count: number
    }> }
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { creatorId } = await req.json()

  // Gather creators to sync
  const allCreators = instagramCreatorStore.findMany()
  const toSync = creatorId
    ? allCreators.filter(c => c.id === creatorId)
    : allCreators

  if (toSync.length === 0) {
    return NextResponse.json({ error: 'לא נמצאו יוצרים לסנכרון' }, { status: 400 })
  }

  const [token, igUserId] = await Promise.all([
    getApiKey('INSTAGRAM_ACCESS_TOKEN'),
    getApiKey('INSTAGRAM_USER_ID'),
  ])

  if (!token || !igUserId) {
    return NextResponse.json({
      error: 'Instagram לא מחובר — הגדר INSTAGRAM_ACCESS_TOKEN ו-INSTAGRAM_USER_ID בהגדרות',
    }, { status: 400 })
  }

  const results: Array<{ handle: string; reelsProcessed: number; error?: string }> = []

  for (const creator of toSync) {
    try {
      const bd = await fetchCreatorReels(creator.handle, token, igUserId)

      // Update creator profile
      instagramCreatorStore.upsert(
        creator.handle,
        { ...creator },
        {
          name: bd.name ?? creator.name,
          profilePicUrl: bd.profile_picture_url ?? creator.profilePicUrl,
          followersCount: bd.followers_count,
          mediaCount: bd.media_count,
          bio: bd.biography ?? creator.bio,
        }
      )

      // Upsert reels
      const reels = bd.media?.data ?? []
      const now = Date.now()
      for (const reel of reels) {
        if (reel.media_type === 'IMAGE') continue // skip static images
        const publishedAt = reel.timestamp
        const daysSince = (now - new Date(publishedAt).getTime()) / 86_400_000
        const viralityScore = calcViralityScore(reel.like_count, reel.comments_count, 0, daysSince)
        reelStore.upsert(creator.id, {
          reelId: reel.id,
          caption: reel.caption ?? null,
          thumbnailUrl: reel.thumbnail_url ?? null,
          permalink: reel.permalink,
          likeCount: reel.like_count,
          commentCount: reel.comments_count,
          playCount: null,
          viralityScore,
          publishedAt,
        })
      }

      results.push({ handle: creator.handle, reelsProcessed: reels.length })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה'
      results.push({ handle: creator.handle, reelsProcessed: 0, error: msg })
    }
  }

  return NextResponse.json({ synced: results })
}
