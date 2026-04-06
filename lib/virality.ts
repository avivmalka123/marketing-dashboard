export function calculateViralityScore(params: {
  viewCount: number
  likeCount: number
  commentCount: number
  avgChannelViews: number
  publishedAt: Date
}): { viralityScore: number; trendScore: number } {
  const { viewCount, likeCount, commentCount, avgChannelViews, publishedAt } = params

  const avgViews = avgChannelViews > 0 ? avgChannelViews : 1
  const totalViews = viewCount > 0 ? viewCount : 1
  const likeRatio = (likeCount + commentCount * 2) / totalViews

  const ageInDays = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
  const recencyMultiplier =
    ageInDays < 1 ? 3 : ageInDays < 3 ? 2 : ageInDays < 7 ? 1.5 : 1

  const viralityScore = (viewCount / avgViews) * (likeRatio * 2) * recencyMultiplier
  const trendScore =
    ageInDays < 7 ? (viewCount / totalViews) * 100 * recencyMultiplier : 0

  return {
    viralityScore: Math.round(viralityScore * 100) / 100,
    trendScore: Math.round(trendScore * 100) / 100,
  }
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 10000) / 100
}

export function getViralityLabel(score: number): 'viral' | 'trend' | 'normal' {
  if (score >= 5) return 'viral'
  if (score >= 2) return 'trend'
  return 'normal'
}
