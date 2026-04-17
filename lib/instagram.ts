import { getApiKey } from './getApiKey'

const IG_BASE = 'https://graph.facebook.com/v19.0'

async function igFetch(path: string, params: Record<string, string> = {}) {
  const token = await getApiKey('INSTAGRAM_ACCESS_TOKEN')
  if (!token) throw new Error('Instagram Access Token לא מוגדר. עבור להגדרות.')

  const url = new URL(`${IG_BASE}/${path}`)
  url.searchParams.set('access_token', token)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Instagram API ${res.status}: ${err}`)
  }
  return res.json()
}

export async function getInstagramProfile() {
  const userId = await getApiKey('INSTAGRAM_USER_ID')
  if (!userId) throw new Error('INSTAGRAM_USER_ID לא מוגדר. עבור להגדרות.')

  return igFetch(userId, {
    fields: 'id,name,biography,followers_count,follows_count,media_count,profile_picture_url,website',
  })
}

export async function getInstagramMedia(limit = 20) {
  const userId = await getApiKey('INSTAGRAM_USER_ID')
  if (!userId) throw new Error('INSTAGRAM_USER_ID לא מוגדר. עבור להגדרות.')

  return igFetch(`${userId}/media`, {
    fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
    limit: String(limit),
  })
}

export async function getInstagramInsights(period: 'day' | 'week' | 'month' = 'week') {
  const userId = await getApiKey('INSTAGRAM_USER_ID')
  if (!userId) throw new Error('INSTAGRAM_USER_ID לא מוגדר. עבור להגדרות.')

  return igFetch(`${userId}/insights`, {
    metric: 'impressions,reach,profile_views,follower_count',
    period,
  })
}

export async function refreshInstagramToken(): Promise<string> {
  const token = await getApiKey('INSTAGRAM_ACCESS_TOKEN')
  if (!token) throw new Error('INSTAGRAM_ACCESS_TOKEN לא מוגדר. עבור להגדרות.')

  const url = new URL(`${IG_BASE}/oauth/access_token`)
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', process.env.META_APP_ID ?? '')
  url.searchParams.set('client_secret', process.env.META_APP_SECRET ?? '')
  url.searchParams.set('fb_exchange_token', token)

  const res = await fetch(url.toString())
  const data = await res.json()
  return data.access_token
}
