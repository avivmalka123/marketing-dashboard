/**
 * Fetch YouTube video transcript using YouTube's internal timedtext API.
 * No external dependencies required.
 */

export interface TranscriptEntry {
  text: string
  start: number
  duration: number
}

export async function fetchTranscript(videoId: string): Promise<TranscriptEntry[] | null> {
  try {
    // Fetch the YouTube video page to discover caption tracks
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    })

    if (!pageRes.ok) return null

    const html = await pageRes.text()

    // Extract ytInitialPlayerResponse JSON from the page
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;(?:\s*var\s|\s*<\/script>)/)
    if (!match) {
      // Try alternative pattern
      const match2 = html.match(/"captions":(\{"playerCaptionsTracklistRenderer".*?\}),"videoDetails"/)
      if (!match2) return null
      // Minimal parse — won't have full player response but may have tracks
    }

    let playerResponse: Record<string, unknown>
    try {
      playerResponse = JSON.parse(match![1]) as Record<string, unknown>
    } catch {
      return null
    }

    type CaptionTrack = { languageCode: string; kind?: string; baseUrl?: string }
    type CaptionsData = {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: CaptionTrack[]
      }
    }

    const captions = playerResponse?.captions as CaptionsData | undefined
    const captionTracks = captions?.playerCaptionsTracklistRenderer?.captionTracks

    if (!captionTracks || captionTracks.length === 0) return null

    // Priority: Hebrew > English > any auto-generated > first available
    const track =
      captionTracks.find((t) => t.languageCode === 'iw') ||
      captionTracks.find((t) => t.languageCode === 'he') ||
      captionTracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr') ||
      captionTracks.find((t) => t.languageCode === 'en') ||
      captionTracks.find((t) => t.kind === 'asr') ||
      captionTracks[0]

    if (!track?.baseUrl) return null

    // Fetch the transcript in JSON3 format (preferred)
    const transcriptRes = await fetch(`${track.baseUrl}&fmt=json3`)
    if (transcriptRes.ok) {
      const data = await transcriptRes.json() as {
        events?: Array<{
          tStartMs?: number
          dDurationMs?: number
          segs?: Array<{ utf8: string }>
        }>
      }
      if (data?.events) {
        return data.events
          .filter((e) => e.segs && e.segs.length > 0)
          .map((e) => ({
            text: (e.segs ?? []).map((s) => s.utf8).join('').replace(/\n/g, ' ').trim(),
            start: (e.tStartMs ?? 0) / 1000,
            duration: (e.dDurationMs ?? 0) / 1000,
          }))
          .filter((e) => e.text.trim().length > 0)
      }
    }

    // Fallback: XML format
    const xmlRes = await fetch(track.baseUrl)
    if (xmlRes.ok) {
      const xml = await xmlRes.text()
      return parseTranscriptXml(xml)
    }

    return null
  } catch (err) {
    console.error('[youtubeTranscript] Error:', err)
    return null
  }
}

function parseTranscriptXml(xml: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = []
  const regex = /<text[^>]+start="([\d.]+)"[^>]+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(xml)) !== null) {
    const raw = match[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/<[^>]+>/g, '')
      .replace(/\n/g, ' ')
      .trim()

    if (raw.length > 0) {
      entries.push({
        text: raw,
        start: parseFloat(match[1]),
        duration: parseFloat(match[2]),
      })
    }
  }

  return entries
}

/** Flatten transcript entries into a single readable string */
export function transcriptToText(entries: TranscriptEntry[]): string {
  return entries.map((e) => e.text).join(' ')
}

/** Format transcript as timestamped text (for display) */
export function transcriptToTimestamped(entries: TranscriptEntry[]): string {
  return entries
    .map((e) => {
      const mins = Math.floor(e.start / 60)
      const secs = Math.floor(e.start % 60)
      const ts = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      return `[${ts}] ${e.text}`
    })
    .join('\n')
}
