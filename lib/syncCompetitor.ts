/**
 * Core video sync logic — shared between:
 *  - /api/competitors/sync  (manual / cron triggered)
 *  - /api/competitors POST  (auto-triggered after adding a competitor)
 */
import { prisma } from './prisma'
import { getChannelVideos, getChannelInfo } from './youtube'
import { calculateViralityScore } from './virality'
import { competitorStore, videoStore } from './localStore'

export interface SyncResult {
  competitorId: string
  name: string
  videosProcessed: number
  error?: string
}

interface CompetitorLike {
  id: string
  name: string
  channelId: string
  subscriberCount?: number | null
  avgViews?: number | null
}

export async function syncCompetitorVideos(competitor: CompetitorLike): Promise<SyncResult> {
  try {
    const [channelInfo, videos] = await Promise.all([
      getChannelInfo(competitor.channelId),
      getChannelVideos(competitor.channelId, 15),
    ])

    if (!videos.length) {
      return { competitorId: competitor.id, name: competitor.name, videosProcessed: 0 }
    }

    const totalViews = videos.reduce(
      (sum, v) => sum + parseInt(v.statistics?.viewCount ?? '0'),
      0
    )
    const avgViews = totalViews / videos.length

    for (const video of videos) {
      const videoId = video.id!
      const stats = video.statistics!
      const snippet = video.snippet!

      const viewCount = parseInt(stats.viewCount ?? '0')
      const likeCount = parseInt(stats.likeCount ?? '0')
      const commentCount = parseInt(stats.commentCount ?? '0')

      const { viralityScore, trendScore } = calculateViralityScore({
        viewCount,
        likeCount,
        commentCount,
        avgChannelViews: avgViews,
        publishedAt: new Date(snippet.publishedAt!),
      })

      let savedToDB = false
      try {
        await prisma.competitorVideo.upsert({
          where: { videoId },
          update: { viewCount, likeCount, commentCount, viralityScore, trendScore, lastUpdated: new Date() },
          create: {
            competitorId: competitor.id,
            videoId,
            title: snippet.title ?? '',
            description: snippet.description,
            thumbnailUrl: snippet.thumbnails?.maxres?.url ?? snippet.thumbnails?.high?.url,
            tags: snippet.tags ?? [],
            publishedAt: new Date(snippet.publishedAt!),
            viewCount,
            likeCount,
            commentCount,
            viralityScore,
            trendScore,
            growthRate: 0,
          },
        })
        savedToDB = true
      } catch { /* DB not connected */ }

      if (!savedToDB) {
        videoStore.upsert(competitor.id, {
          videoId,
          title: snippet.title ?? '',
          description: snippet.description,
          thumbnailUrl: snippet.thumbnails?.maxres?.url ?? snippet.thumbnails?.high?.url ?? null,
          tags: snippet.tags ?? [],
          publishedAt: snippet.publishedAt ?? new Date().toISOString(),
          viewCount,
          likeCount,
          commentCount,
          viralityScore,
          trendScore,
          growthRate: 0,
        })
      }
    }

    // Update channel averages
    const newSubs = parseInt(
      channelInfo?.statistics?.subscriberCount ?? String(competitor.subscriberCount ?? 0)
    )
    try {
      await prisma.competitor.update({
        where: { id: competitor.id },
        data: { avgViews, subscriberCount: newSubs },
      })
    } catch {
      competitorStore.updateAvgViews(competitor.id, avgViews)
    }

    return { competitorId: competitor.id, name: competitor.name, videosProcessed: videos.length }
  } catch (err) {
    return {
      competitorId: competitor.id,
      name: competitor.name,
      videosProcessed: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// Sync all competitors from DB (or local store as fallback)
export async function syncAllCompetitors(): Promise<SyncResult[]> {
  let competitors: CompetitorLike[] = []
  try {
    competitors = await prisma.competitor.findMany()
  } catch {
    competitors = competitorStore.findMany()
  }
  return Promise.all(competitors.map(c => syncCompetitorVideos(c)))
}
