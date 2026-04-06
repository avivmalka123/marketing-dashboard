import { google } from 'googleapis'
import { getApiKey } from './getApiKey'

async function getYouTubeClient() {
  const apiKey = await getApiKey('YOUTUBE_API_KEY')
  if (!apiKey) throw new Error('YouTube API Key לא מוגדר. עבור להגדרות.')
  return google.youtube({ version: 'v3', auth: apiKey })
}

export async function resolveChannelId(input: string): Promise<string> {
  const youtube = await getYouTubeClient()
  const idMatch = input.match(/UC[\w-]{22}/)
  if (idMatch) return idMatch[0]

  const handleMatch = input.match(/@([\w.-]+)/)
  if (handleMatch) {
    const res = await youtube.channels.list({
      part: ['id'],
      forHandle: handleMatch[1],
    })
    const channel = res.data.items?.[0]
    if (!channel?.id) throw new Error('ערוץ לא נמצא')
    return channel.id
  }

  const urlMatch = input.match(/youtube\.com\/(?:c\/|user\/)?([^/\s?]+)/)
  if (urlMatch) {
    const res = await youtube.channels.list({
      part: ['id'],
      forUsername: urlMatch[1],
    })
    const channel = res.data.items?.[0]
    if (channel?.id) return channel.id
  }

  throw new Error('כתובת ערוץ YouTube לא תקינה')
}

export async function getChannelInfo(channelId: string) {
  const youtube = await getYouTubeClient()
  const res = await youtube.channels.list({
    part: ['snippet', 'statistics', 'brandingSettings'],
    id: [channelId],
  })
  return res.data.items?.[0] ?? null
}

export async function getChannelVideos(channelId: string, maxResults = 15) {
  const youtube = await getYouTubeClient()

  const searchRes = await youtube.search.list({
    part: ['id', 'snippet'],
    channelId,
    maxResults,
    order: 'date',
    type: ['video'],
  })

  const videoIds = (searchRes.data.items ?? [])
    .map(item => item.id?.videoId)
    .filter((id): id is string => Boolean(id))

  if (!videoIds.length) return []

  const videoRes = await youtube.videos.list({
    part: ['snippet', 'statistics', 'contentDetails'],
    id: videoIds,
  })

  return videoRes.data.items ?? []
}

export async function getOwnChannelStats(channelId: string) {
  const youtube = await getYouTubeClient()
  const [channelRes, videosRes] = await Promise.all([
    youtube.channels.list({
      part: ['statistics', 'snippet'],
      id: [channelId],
    }),
    youtube.search.list({
      part: ['id', 'snippet'],
      channelId,
      maxResults: 10,
      order: 'viewCount',
      type: ['video'],
    }),
  ])

  const channel = channelRes.data.items?.[0]
  const topVideoIds = (videosRes.data.items ?? [])
    .map(i => i.id?.videoId)
    .filter((id): id is string => Boolean(id))

  let topVideos: typeof videosRes.data.items = []
  if (topVideoIds.length) {
    const vRes = await youtube.videos.list({
      part: ['snippet', 'statistics'],
      id: topVideoIds,
    })
    topVideos = vRes.data.items ?? []
  }

  return { channel, topVideos }
}
