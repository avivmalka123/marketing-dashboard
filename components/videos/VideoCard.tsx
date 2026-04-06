import Image from 'next/image'
import { formatNumber, timeAgo } from '@/lib/utils'
import { TrendingUp, Eye, ThumbsUp } from 'lucide-react'
import type { VideoWithCompetitor } from '@/types'

interface Props {
  video: VideoWithCompetitor
  onClick: () => void
}

function ViralityBadge({ score }: { score: number }) {
  if (score >= 5)
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success font-bold border border-success/30">
        🔥 ויראלי
      </span>
    )
  if (score >= 2)
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning font-bold border border-warning/30">
        📈 טרנד
      </span>
    )
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-text2/10 text-text2 font-bold">
      רגיל
    </span>
  )
}

export default function VideoCard({ video, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="glass-card cursor-pointer overflow-hidden transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-bg2 overflow-hidden">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">▶️</div>
        )}
        <div className="absolute top-2 right-2">
          <ViralityBadge score={video.viralityScore} />
        </div>
        {video.growthRate > 20 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-success/20 border border-success/30 rounded-full px-2 py-0.5">
            <TrendingUp size={10} className="text-success" />
            <span className="text-[10px] text-success font-bold">+{video.growthRate.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="font-semibold text-sm text-text line-clamp-2 mb-3 leading-snug">
          {video.title}
        </p>

        {/* Channel + date */}
        <div className="flex items-center justify-between text-xs text-text2 mb-3">
          <div className="flex items-center gap-1.5">
            {video.competitor.thumbnailUrl ? (
              <Image
                src={video.competitor.thumbnailUrl}
                alt=""
                width={16}
                height={16}
                className="rounded-full"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-accent/30" />
            )}
            <span className="truncate max-w-[100px]">{video.competitor.name}</span>
          </div>
          <span>{timeAgo(video.publishedAt)}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-bg2 rounded-lg py-1.5 px-1">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <Eye size={10} className="text-text2" />
              <span className="text-xs font-bold text-text">{formatNumber(video.viewCount)}</span>
            </div>
            <div className="text-[9px] text-text2">צפיות</div>
          </div>
          <div className="bg-bg2 rounded-lg py-1.5 px-1">
            <div className="text-xs font-bold text-accent2">{video.viralityScore.toFixed(1)}</div>
            <div className="text-[9px] text-text2">ויראליות</div>
          </div>
          <div className="bg-bg2 rounded-lg py-1.5 px-1">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <ThumbsUp size={10} className="text-text2" />
              <span className="text-xs font-bold text-success">{formatNumber(video.likeCount)}</span>
            </div>
            <div className="text-[9px] text-text2">לייקים</div>
          </div>
        </div>
      </div>
    </div>
  )
}
