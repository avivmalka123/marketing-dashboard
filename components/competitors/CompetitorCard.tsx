'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Trash2, Video, ExternalLink, RefreshCw, Loader2, Eye, X } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { CompetitorWithVideos } from '@/types'

interface Props {
  competitor: CompetitorWithVideos
  onDelete: (id: string) => void
  onSync?: () => void
  syncing?: boolean
}

export default function CompetitorCard({ competitor, onDelete, onSync, syncing }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleDeleteClick() {
    if (confirmingDelete) {
      onDelete(competitor.id)
    } else {
      setConfirmingDelete(true)
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmingDelete(false), 3000)
    }
  }

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

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onSync && (
            <button
              onClick={onSync}
              disabled={syncing}
              title="סנכרן סרטונים"
              className="w-7 h-7 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-accent transition-colors disabled:opacity-50"
            >
              {syncing
                ? <Loader2 size={12} className="animate-spin" />
                : <RefreshCw size={12} />
              }
            </button>
          )}
          <a
            href={competitor.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-accent2 transition-colors"
          >
            <ExternalLink size={13} />
          </a>

          {/* Double-confirm delete */}
          {confirmingDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeleteClick}
                className="h-7 px-2 rounded-lg bg-danger/20 border border-danger/40 text-danger text-[10px] font-bold hover:bg-danger/30 transition-colors"
              >
                מחק
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="w-7 h-7 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-text transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleDeleteClick}
              className="w-7 h-7 rounded-lg bg-card border border-card-border flex items-center justify-center text-text2 hover:text-danger transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
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
            <span className="text-sm font-bold text-text">{competitor._count?.videos ?? 0}</span>
          </div>
          <div className="text-[10px] text-text2">סרטונים</div>
        </div>
      </div>

      {/* Top 5 videos by views (last 90 days) */}
      {(competitor.videos?.length ?? 0) > 0 ? (
        <div>
          <p className="text-[10px] text-text2 uppercase tracking-wider mb-2">
            5 הסרטונים המובילים (90 יום)
          </p>
          <div className="space-y-1.5">
            {competitor.videos!.slice(0, 5).map((v, idx) => (
              <a
                key={v.videoId}
                href={`https://www.youtube.com/watch?v=${v.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-text2 hover:text-text transition-colors group"
              >
                <span className="w-5 h-5 rounded bg-accent/20 text-accent flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate flex-1 group-hover:text-accent transition-colors">{v.title}</span>
                {v.viewCount && v.viewCount > 0 && (
                  <span className="flex items-center gap-0.5 flex-shrink-0 text-[10px] text-accent2">
                    <Eye size={9} />
                    {formatNumber(v.viewCount)}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-1">
          <p className="text-[11px] text-text2">
            {syncing ? 'מושך סרטונים...' : 'לחץ 🔄 לסנכרן סרטונים'}
          </p>
        </div>
      )}
    </div>
  )
}
