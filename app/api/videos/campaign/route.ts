import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateCampaign } from '@/lib/claude'
import { fetchTranscript, transcriptToText, transcriptToTimestamped } from '@/lib/youtubeTranscript'
import { fetchTranscriptViaGetTranscribe } from '@/lib/getTranscribe'
import { generateImage } from '@/lib/nanabanana'
import { prisma } from '@/lib/prisma'
import { videoStore } from '@/lib/localStore'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId, generateThumbnail = true } = await req.json() as {
    videoId?: string
    generateThumbnail?: boolean
  }

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
  }

  // ── Fetch video info ────────────────────────────────────────────────────────
  let videoTitle = ''
  let videoDescription: string | null = null
  let videoTags: string[] = []

  try {
    const v = await prisma.competitorVideo.findFirst({ where: { videoId } })
    if (v) {
      videoTitle = v.title
      videoDescription = v.description
      videoTags = v.tags as string[]
    }
  } catch {
    const local = videoStore.findMany().find((v) => v.videoId === videoId)
    if (local) {
      videoTitle = local.title
      videoDescription = local.description ?? null
      videoTags = local.tags
    }
  }

  // ── Fetch transcript: try GetTranscribe first, fall back to our own fetcher ─
  let transcriptRaw: string | null = null
  let transcriptDisplay: string | null = null
  let hasTranscript = false

  // 1. Try GetTranscribe.ai (premium quality, handles Hebrew videos)
  const gtTranscript = await fetchTranscriptViaGetTranscribe(videoId)
  if (gtTranscript) {
    transcriptRaw = gtTranscript
    transcriptDisplay = gtTranscript
    hasTranscript = true
  } else {
    // 2. Fall back to YouTube timedtext API (free, no account needed)
    const entries = await fetchTranscript(videoId)
    if (entries && entries.length > 0) {
      transcriptRaw = transcriptToText(entries)
      transcriptDisplay = transcriptToTimestamped(entries)
      hasTranscript = true
    }
  }

  // ── Generate campaign content via Claude ───────────────────────────────────
  let campaign: {
    tags: string[]
    viralTitle: string
    description: string
    tools: string[]
  }

  try {
    campaign = await generateCampaign({
      title: videoTitle,
      description: videoDescription,
      tags: videoTags,
      transcript: transcriptRaw,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'שגיאה ביצירת הקמפיין'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // ── Generate thumbnail via Nano Banana (optional) ──────────────────────────
  let thumbnailUrl = ''
  let thumbnailPrompt = ''

  if (generateThumbnail) {
    thumbnailPrompt = `Professional YouTube thumbnail for Israeli content creator. Topic: "${videoTitle}". Bold vibrant colors, modern flat design, dramatic lighting, high contrast, eye-catching composition. 16:9 aspect ratio, professional quality, no text overlay needed.`
    try {
      thumbnailUrl = await generateImage(thumbnailPrompt, { width: 1280, height: 720 })
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({
    tags: campaign.tags ?? [],
    viralTitle: campaign.viralTitle ?? '',
    description: campaign.description ?? '',
    tools: campaign.tools ?? [],
    transcript: transcriptDisplay,
    transcriptRaw,
    hasTranscript,
    thumbnailUrl,
    thumbnailPrompt,
  })
}
