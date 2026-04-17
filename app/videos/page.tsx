'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import VideoCard from '@/components/videos/VideoCard'
import VideoFilters from '@/components/videos/VideoFilters'
import VideoAnalysisPanel from '@/components/videos/VideoAnalysisPanel'
import { Loader2 } from 'lucide-react'
import type { VideoWithCompetitor } from '@/types'

interface Competitor {
  id: string
  name: string
  thumbnailUrl?: string | null
}

interface Filters {
  sortBy: string
  competitorId: string
  search: string
}

export default function VideosPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<VideoWithCompetitor[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoWithCompetitor | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    sortBy: 'viralityScore',
    competitorId: '',
    search: '',
  })

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.competitorId) params.set('competitorId', filters.competitorId)
    if (filters.search) params.set('search', filters.search)

    const data = await fetch(`/api/videos?${params}`).then(r => r.json())
    setVideos(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  useEffect(() => {
    fetch('/api/competitors')
      .then(r => r.json())
      .then(data =>
        setCompetitors(
          data.map((c: { id: string; name: string; thumbnailUrl?: string | null }) => ({
            id: c.id,
            name: c.name,
            thumbnailUrl: c.thumbnailUrl ?? null,
          }))
        )
      )
  }, [])

  function handleCreateBlog(title: string, videoId: string) {
    setSelectedVideo(null)
    router.push(`/blog?topic=${encodeURIComponent(title)}&videoId=${videoId}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">סרטוני מתחרים</h1>
          <p className="text-text2 text-sm mt-1">{videos.length} סרטונים</p>
        </div>
      </div>

      <VideoFilters
        filters={filters}
        onChange={setFilters}
        competitors={competitors}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="text-4xl">🎬</div>
          <h3 className="font-bold text-text">אין סרטונים</h3>
          <p className="text-text2 text-sm">
            {filters.competitorId
              ? `אין סרטונים למתחרה זה — נסה לסנכרן שוב`
              : filters.search
              ? `אין תוצאות לחיפוש "${filters.search}"`
              : competitors.length === 0
              ? 'הוסף מתחרים קודם כדי לראות סרטונים'
              : 'לחץ "סנכרן עכשיו" בעמוד המתחרים'}
          </p>
          {(filters.competitorId || filters.search) && (
            <button
              onClick={() => setFilters({ sortBy: filters.sortBy, competitorId: '', search: '' })}
              className="text-xs text-accent hover:underline"
            >
              נקה פילטרים
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </div>
      )}

      <VideoAnalysisPanel
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onCreateBlog={handleCreateBlog}
      />
    </div>
  )
}
