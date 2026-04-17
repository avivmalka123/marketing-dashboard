import { getApiKey } from './getApiKey'

/**
 * Kajabi API — correct base: app.kajabi.com/api/v1
 * Auth: use the API token directly as Bearer (no OAuth exchange needed).
 * Get your token from Kajabi Admin → Settings → API → Generate Token.
 * Tokens expire — if you get 401, regenerate the token in Kajabi settings.
 */
const KAJABI_BASE = 'https://app.kajabi.com/api/v1'

export interface KajabiPost {
  title: string
  body: string
  excerpt?: string
  slug?: string
  published?: boolean
  publishAt?: Date
}

// ── Authenticated Kajabi request ──────────────────────────────────────────────
async function kajabiRequest(path: string, method = 'GET', body?: unknown) {
  const token = await getApiKey('KAJABI_API_KEY')
  if (!token) throw new Error('KAJABI_API_KEY לא מוגדר. הגדר אותו בעמוד ההגדרות.')

  const res = await fetch(`${KAJABI_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }

  return { ok: res.ok, status: res.status, data }
}

// ── Wrap HTML in RTL container for proper Hebrew display ──────────────────────
function wrapRtl(html: string): string {
  return `<div dir="rtl" style="direction:rtl;text-align:right;font-family:'Heebo',Arial,sans-serif;line-height:1.7;color:#1a1a1a">\n${html}\n</div>`
}

// ── Fetch scheduled blog post dates ──────────────────────────────────────────
export async function getScheduledBlogDates(): Promise<Set<string>> {
  const taken = new Set<string>()
  try {
    const { ok, data } = await kajabiRequest('/blog_posts?page[size]=100')
    if (ok) {
      type Post = { publish_at?: string; published_at?: string }
      const posts = (data as { blog_posts?: Post[] })?.blog_posts
        ?? (data as { data?: Post[] })?.data
        ?? (Array.isArray(data) ? (data as Post[]) : [])
      for (const p of posts) {
        const dateStr = p.publish_at ?? p.published_at
        if (dateStr) taken.add(new Date(dateStr).toDateString())
      }
    }
  } catch { /* not fatal */ }
  return taken
}

// ── Find next calendar day with no scheduled post ────────────────────────────
export async function findNextAvailableDate(): Promise<Date> {
  const taken = await getScheduledBlogDates()
  const candidate = new Date()
  candidate.setDate(candidate.getDate() + 1)
  candidate.setHours(9, 0, 0, 0)
  for (let i = 0; i < 60; i++) {
    if (!taken.has(candidate.toDateString())) break
    candidate.setDate(candidate.getDate() + 1)
  }
  return candidate
}

// ── Create a blog post ────────────────────────────────────────────────────────
async function createPost(postBody: Record<string, unknown>): Promise<{
  ok: boolean; status: number; data: unknown; endpoint: string
}> {
  const rtlBody = wrapRtl(String(postBody.body ?? ''))
  const payload = { ...postBody, body: rtlBody }

  // Primary: POST /blog_posts with blog_post wrapper (standard Kajabi format)
  const r1 = await kajabiRequest('/blog_posts', 'POST', { blog_post: payload })
  if (r1.ok) return { ...r1, endpoint: '/blog_posts' }

  // Fallback: POST /blog_posts with flat body (some Kajabi versions)
  const r2 = await kajabiRequest('/blog_posts', 'POST', payload)
  if (r2.ok) return { ...r2, endpoint: '/blog_posts (flat)' }

  // Try /site/blog_posts (older Kajabi API pattern)
  const r3 = await kajabiRequest('/site/blog_posts', 'POST', { blog_post: payload })
  if (r3.ok) return { ...r3, endpoint: '/site/blog_posts' }

  // Return the most informative error (prefer r1's response)
  const errData = (r1.data as Record<string, unknown>)?.errors
    ?? (r1.data as Record<string, unknown>)?.error
    ?? r1.data
  return { ok: false, status: r1.status, data: errData, endpoint: '/blog_posts' }
}

// ── Schedule a blog post for a future date ────────────────────────────────────
export async function scheduleBlogPost(post: KajabiPost, publishAt: Date) {
  const { ok, status, data, endpoint } = await createPost({
    title: post.title,
    body: post.body,
    excerpt: post.excerpt,
    slug: post.slug,
    published: false,
    publish_at: publishAt.toISOString(),
  })

  if (!ok) {
    const msg = typeof data === 'object' ? JSON.stringify(data) : String(data)
    // Give actionable error message for expired tokens
    if (status === 401) {
      throw new Error('Kajabi: הטוקן פג תוקף. עבור להגדרות → KAJABI_API_KEY ← ולחץ "הפק טוקן חדש" ב-Kajabi Admin → Settings → API.')
    }
    throw new Error(`Kajabi API error ${status} (${endpoint}): ${msg}`)
  }
  return data
}

// ── Publish a blog post immediately ──────────────────────────────────────────
export async function publishBlogPost(post: KajabiPost) {
  const { ok, status, data, endpoint } = await createPost({
    title: post.title,
    body: post.body,
    excerpt: post.excerpt,
    slug: post.slug,
    published: true,
  })

  if (!ok) {
    const msg = typeof data === 'object' ? JSON.stringify(data) : String(data)
    if (status === 401) {
      throw new Error('Kajabi: הטוקן פג תוקף. עבור להגדרות → KAJABI_API_KEY ← ולחץ "הפק טוקן חדש" ב-Kajabi Admin → Settings → API.')
    }
    throw new Error(`Kajabi API error ${status} (${endpoint}): ${msg}`)
  }
  return data
}

// ── Test connection ───────────────────────────────────────────────────────────
export async function testKajabiConnection() {
  const token = await getApiKey('KAJABI_API_KEY')
  if (!token) return { ok: false, error: 'KAJABI_API_KEY לא מוגדר', status: 0, data: null }

  try {
    const { ok, status, data } = await kajabiRequest('/blog_posts?page[size]=1')
    if (status === 401) {
      return {
        ok: false,
        status,
        data,
        error: 'הטוקן פג תוקף — הפק טוקן חדש ב-Kajabi Admin → Settings → API',
      }
    }
    return { ok, status, data, tokenSet: true }
  } catch (err) {
    return { ok: false, error: String(err), status: 0, data: null }
  }
}
