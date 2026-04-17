/**
 * GetTranscribe.ai API integration for YouTube video transcription.
 * API Key must be stored as GET_TRANSCRIBE_API_KEY in Settings.
 * Docs: https://www.gettranscribe.ai/api-documentation/transcriptions/create
 */
import { getApiKey } from './getApiKey'

export async function fetchTranscriptViaGetTranscribe(videoId: string): Promise<string | null> {
  let apiKey: string | undefined
  try {
    apiKey = await getApiKey('GET_TRANSCRIBE_API_KEY')
  } catch {
    return null
  }
  if (!apiKey) return null

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

  try {
    const res = await fetch('https://api.gettranscribe.ai/transcriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        url: videoUrl,
        model: 'quality',
      }),
    })

    if (!res.ok) {
      console.warn(`[GetTranscribe] API error: ${res.status}`)
      return null
    }

    const data = await res.json() as {
      text?: string
      transcription?: string
      segments?: Array<{ text?: string; start?: number; end?: number }>
    }

    // GetTranscribe returns the full transcript in `text` field
    if (data.text) return data.text

    // Fallback: reconstruct from segments
    if (Array.isArray(data.segments) && data.segments.length > 0) {
      return data.segments.map(s => s.text ?? '').filter(Boolean).join(' ')
    }

    return null
  } catch (err) {
    console.error('[GetTranscribe] Fetch error:', err)
    return null
  }
}
