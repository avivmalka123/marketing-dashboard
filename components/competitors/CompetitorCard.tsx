import Image from 'next/image'
import { Trash2, Video, ExternalLink } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { CompetitorWithVideos } from '@/types'

interface Props {
  competitor: CompetitorWithVideos
  onDelete: (id: string) => void
}

export default function CompetitorCard({ competitor, onDelete }: Props) {
  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {competitor.thumbnailUrl ? (
            <Image
              src={competitor.thumbnailUrl}
              alt={competitor.name}
              width={44}
              height={44}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent to-accent2 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-text text-sm truncate">{competitor.name}</h3>
            {competitor.handle && (
              <p className="text-xs text-text2">@{competitor.handle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={competitor.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-accent2 transition-colors"
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={() => onDelete(competitor.id)}
            className="w-7 h-7 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-danger transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg2 rounded-xl p-3 text-center">
          <div className="text-sm font-bold text-text">
            {competitor.subscriberCount ? formatNumber(competitor.subscriberCount) : '—'}
          </div>
          <div className="text-[10px] text-text2">עוקבים</div>
        </div>
        <div className="bg-bg2 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Video size={12} className="text-accent2" />
            <span className="text-sm font-bold text-text">{competitor._count.videos}</span>
          </div>
          <div className="text-[10px] text-text2">סרטונים</div>
        </div>
      </div>

      {/* Top videos preview */}
      {competitor.videos.length > 0 && (
        <div>
          <p className="text-[10px] text-text2 uppercase tracking-wider mb-2">סרטונים ויראליים</p>
          <div className="space-y-1.5">
            {competitor.videos.slice(0, 2).map(v => (
              <div key={v.videoId} className="flex items-center gap-2 text-xs text-text2">
                <span className="w-5 h-5 rounded bg-accent/20 text-accent flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  {v.viralityScore.toFixed(0)}
                </span>
                <span className="truncate">{v.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
