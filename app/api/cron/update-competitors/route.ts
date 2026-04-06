import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getChannelVideos, getChannelInfo } from '@/lib/youtube'
import { calculateViralityScore, calculateGrowthRate } from '@/lib/virality'

export async function GET(req: NextRequest) {
  // Allow both cron (Vercel adds auth header) and manual trigger with secret
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'

  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API Key not configured' }, { status: 400 })
  }

  const competitors = await prisma.competitor.findMany()
  const results: Array<{ competitorId: string; videosProcessed?: number; error?: string }> = []

  for (const competitor of competitors) {
    try {
      const channelInfo = await getChannelInfo(competitor.channelId)
      const videos = await getChannelVideos(competitor.channelId, 15)

      if (!videos.length) {
        results.push({ competitorId: competitor.id, videosProcessed: 0 })
        continue
      }

      const channelAvgViews = competitor.avgViews ?? 10_000

      for (const video of videos) {
        const videoId = video.id!
        const stats = video.statistics!
        const snippet = video.snippet!

        const viewCount = parseInt(stats.viewCount ?? '0')
        const likeCount = parseInt(stats.likeCount ?? '0')
        const commentCount = parseInt(stats.commentCount ?? '0')

        // Get latest history entry for growth rate
        const lastHistory = await prisma.videoStatsHistory.findFirst({
          where: { videoId },
          orderBy: { timestamp: 'desc' },
        })

        const growthRate = lastHistory
          ? calculateGrowthRate(viewCount, lastHistory.viewCount)
          : 0

        const { viralityScore, trendScore } = calculateViralityScore({
          viewCount,
          likeCount,
          commentCount,
          avgChannelViews: channelAvgViews,
          publishedAt: new Date(snippet.publishedAt!),
        })

        await prisma.competitorVideo.upsert({
          where: { videoId },
          update: {
            viewCount,
            likeCount,
            commentCount,
            viralityScore,
            trendScore,
            growthRate,
            lastUpdated: new Date(),
          },
          create: {
            competitorId: competitor.id,
            videoId,
            title: snippet.title ?? '',
            description: snippet.description,
            thumbnailUrl:
              snippet.thumbnails?.maxres?.url ??
              snippet.thumbnails?.high?.url,
            tags: snippet.tags ?? [],
            publishedAt: new Date(snippet.publishedAt!),
            viewCount,
            likeCount,
            commentCount,
            viralityScore,
            trendScore,
            growthRate,
          },
        })

        // Store daily snapshot
        await prisma.videoStatsHistory.create({
          data: { videoId, viewCount, likeCount, commentCount },
        })
      }

      // Update channel averages
      const totalViews = videos.reduce(
        (sum, v) => sum + parseInt(v.statistics?.viewCount ?? '0'),
        0
      )
      const newAvgViews = totalViews / videos.length

      await prisma.competitor.update({
        where: { id: competitor.id },
        data: {
          avgViews: newAvgViews,
          subscriberCount: parseInt(
            channelInfo?.statistics?.subscriberCount ?? String(competitor.subscriberCount ?? 0)
          ),
        },
      })

      results.push({ competitorId: competitor.id, videosProcessed: videos.length })
    } catch (err) {
      console.error(`Failed competitor ${competitor.id}:`, err)
      results.push({ competitorId: competitor.id, error: String(err) })
    }
  }

  return NextResponse.json({
    success: true,
    updated: results,
    timestamp: new Date().toISOString(),
  })
}
