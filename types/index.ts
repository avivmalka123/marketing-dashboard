export type VideoSortField = 'viralityScore' | 'viewCount' | 'publishedAt' | 'trendScore'
export type IdeaStatus = 'Ideas' | 'In Progress' | 'Published'
export type ContentFormat = 'video' | 'reel' | 'article'
export type BlogStatus = 'draft' | 'published'

export interface VideoAnalysis {
  hebrewTitles: string[]
  whyGoodSuggestion: string
  contentBrief: string
  searchTrendAnalysis: string
}

export interface GeneratedBlogPost {
  title: string
  metaDescription: string
  slug: string
  content: string
  keywords: string[]
  internalLinkSuggestions: string[]
}

export interface CompetitorWithVideos {
  id: string
  name: string
  channelId: string
  channelUrl: string
  handle?: string | null
  thumbnailUrl: string | null
  subscriberCount: number | null
  avgViews: number | null
  _count?: { videos: number }
  videos: Array<{
    videoId: string
    title: string
    viralityScore: number
    thumbnailUrl: string | null
    viewCount?: number
    publishedAt?: string | Date
  }>
}

export interface VideoWithCompetitor {
  id: string
  videoId: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  tags: string[]
  publishedAt: string
  viralityScore: number
  trendScore: number
  growthRate: number
  competitor: {
    name: string
    thumbnailUrl: string | null
    channelId: string
  }
}
