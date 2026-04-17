/**
 * Local file-based fallback store for when the Postgres DB is not connected.
 * Data is persisted in .local-data/ at the project root (dev only).
 * Each "table" is a JSON file.
 */
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.local-data')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readFile<T>(name: string): T[] {
  try {
    ensureDir()
    const file = path.join(DATA_DIR, `${name}.json`)
    if (!fs.existsSync(file)) return []
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T[]
  } catch {
    return []
  }
}

function writeFile<T>(name: string, data: T[]) {
  try {
    ensureDir()
    fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2))
  } catch { /* ignore */ }
}

function makeId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ── Competitor store ──────────────────────────────────────────────────────────
export interface LocalCompetitor {
  id: string
  name: string
  channelId: string
  channelUrl: string
  handle?: string | null
  thumbnailUrl?: string | null
  subscriberCount?: number | null
  avgViews?: number | null
  createdAt: string
  updatedAt: string
  _count?: { videos: number }
  videos?: Array<{ videoId: string; title: string; viralityScore: number; thumbnailUrl?: string | null }>
}

export const competitorStore = {
  findMany(): LocalCompetitor[] {
    const competitors = readFile<LocalCompetitor>('competitors')
    const videos = readFile<LocalVideo>('videos')
    return competitors.map(c => {
      const cv = videos
        .filter(v => v.competitorId === c.id)
        .sort((a, b) => b.viralityScore - a.viralityScore)
        .slice(0, 3)
        .map(v => ({ videoId: v.videoId, title: v.title, viralityScore: v.viralityScore, thumbnailUrl: v.thumbnailUrl ?? null }))
      return {
        ...c,
        _count: { videos: videos.filter(v => v.competitorId === c.id).length },
        videos: cv,
      }
    })
  },

  findById(id: string): LocalCompetitor | null {
    return readFile<LocalCompetitor>('competitors').find(c => c.id === id) ?? null
  },

  upsert(
    channelId: string,
    create: Omit<LocalCompetitor, 'id' | 'createdAt' | 'updatedAt' | '_count' | 'videos'>,
    update: Partial<Omit<LocalCompetitor, 'id' | 'channelId' | 'createdAt' | '_count' | 'videos'>>
  ): LocalCompetitor {
    const all = readFile<LocalCompetitor>('competitors')
    const now = new Date().toISOString()
    const idx = all.findIndex(c => c.channelId === channelId)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...update, updatedAt: now }
      writeFile('competitors', all)
      return all[idx]
    } else {
      const record: LocalCompetitor = { ...create, id: makeId(), createdAt: now, updatedAt: now }
      all.push(record)
      writeFile('competitors', all)
      return record
    }
  },

  updateAvgViews(id: string, avgViews: number) {
    const all = readFile<LocalCompetitor>('competitors')
    const idx = all.findIndex(c => c.id === id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], avgViews, updatedAt: new Date().toISOString() }
      writeFile('competitors', all)
    }
  },

  delete(id: string) {
    writeFile('competitors', readFile<LocalCompetitor>('competitors').filter(c => c.id !== id))
    // Also delete their videos
    writeFile('videos', readFile<LocalVideo>('videos').filter(v => v.competitorId !== id))
  },

  count(): number {
    return readFile<LocalCompetitor>('competitors').length
  },
}

// ── Video store ───────────────────────────────────────────────────────────────
export interface LocalVideo {
  id: string
  competitorId: string
  videoId: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  tags: string[]
  publishedAt: string
  viralityScore: number
  trendScore: number
  growthRate: number
  lastUpdated: string
  competitor?: { name: string; thumbnailUrl: string | null; channelId: string }
}

type VideoOrderBy = 'viralityScore' | 'viewCount' | 'trendScore' | 'growthRate' | 'publishedAt'

export const videoStore = {
  findMany(params?: { take?: number; orderBy?: VideoOrderBy }): LocalVideo[] {
    let videos = readFile<LocalVideo>('videos')
    const ob = params?.orderBy ?? 'viralityScore'
    if (ob === 'viralityScore') {
      videos = videos.sort((a, b) => b.viralityScore - a.viralityScore)
    } else if (ob === 'viewCount') {
      videos = videos.sort((a, b) => b.viewCount - a.viewCount)
    } else if (ob === 'trendScore') {
      videos = videos.sort((a, b) => b.trendScore - a.trendScore)
    } else if (ob === 'growthRate') {
      videos = videos.sort((a, b) => b.growthRate - a.growthRate)
    } else if (ob === 'publishedAt') {
      videos = videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    }
    if (params?.take) videos = videos.slice(0, params.take)
    return videos
  },

  findManyWithCompetitor(params?: { take?: number; orderBy?: VideoOrderBy; competitorId?: string; search?: string }): LocalVideo[] {
    const videos = this.findMany({ take: params?.take, orderBy: params?.orderBy ?? 'viralityScore' })
    const competitors = readFile<LocalCompetitor>('competitors')
    let result = videos.map(v => ({
      ...v,
      competitor: (() => {
        const c = competitors.find(c => c.id === v.competitorId)
        return c ? { name: c.name, thumbnailUrl: c.thumbnailUrl ?? null, channelId: c.channelId } : { name: 'Unknown', thumbnailUrl: null, channelId: '' }
      })(),
    }))
    if (params?.competitorId) {
      result = result.filter(v => v.competitorId === params.competitorId)
    }
    if (params?.search) {
      const q = params.search.toLowerCase()
      result = result.filter(v => v.title.toLowerCase().includes(q))
    }
    return result
  },

  upsert(competitorId: string, video: Omit<LocalVideo, 'id' | 'competitorId' | 'lastUpdated' | 'competitor'>) {
    const all = readFile<LocalVideo>('videos')
    const now = new Date().toISOString()
    const idx = all.findIndex(v => v.videoId === video.videoId)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...video, competitorId, lastUpdated: now }
      writeFile('videos', all)
      return all[idx]
    } else {
      const record: LocalVideo = { ...video, id: makeId(), competitorId, lastUpdated: now }
      all.push(record)
      writeFile('videos', all)
      return record
    }
  },

  countByCompetitor(competitorId: string): number {
    return readFile<LocalVideo>('videos').filter(v => v.competitorId === competitorId).length
  },

  count(): number {
    return readFile<LocalVideo>('videos').length
  },
}

// ── Instagram Creator store ───────────────────────────────────────────────────
export interface LocalInstagramCreator {
  id: string
  handle: string
  name: string
  profilePicUrl?: string | null
  followersCount?: number | null
  mediaCount?: number | null
  bio?: string | null
  avgLikes?: number | null
  avgComments?: number | null
  createdAt: string
  updatedAt: string
  _count?: { reels: number }
  reels?: Array<{ reelId: string; caption?: string | null; thumbnailUrl?: string | null; likeCount: number; viralityScore: number }>
}

export const instagramCreatorStore = {
  findMany(): LocalInstagramCreator[] {
    const creators = readFile<LocalInstagramCreator>('ig-creators')
    const reels = readFile<LocalReel>('ig-reels')
    return creators.map(c => {
      const cr = reels
        .filter(r => r.creatorId === c.id)
        .sort((a, b) => b.viralityScore - a.viralityScore)
        .slice(0, 3)
        .map(r => ({ reelId: r.reelId, caption: r.caption ?? null, thumbnailUrl: r.thumbnailUrl ?? null, likeCount: r.likeCount, viralityScore: r.viralityScore }))
      return {
        ...c,
        _count: { reels: reels.filter(r => r.creatorId === c.id).length },
        reels: cr,
      }
    })
  },

  findById(id: string): LocalInstagramCreator | null {
    return readFile<LocalInstagramCreator>('ig-creators').find(c => c.id === id) ?? null
  },

  upsert(
    handle: string,
    create: Omit<LocalInstagramCreator, 'id' | 'createdAt' | 'updatedAt' | '_count' | 'reels'>,
    update: Partial<Omit<LocalInstagramCreator, 'id' | 'handle' | 'createdAt' | '_count' | 'reels'>>
  ): LocalInstagramCreator {
    const all = readFile<LocalInstagramCreator>('ig-creators')
    const now = new Date().toISOString()
    const idx = all.findIndex(c => c.handle.toLowerCase() === handle.toLowerCase())
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...update, updatedAt: now }
      writeFile('ig-creators', all)
      return all[idx]
    } else {
      const record: LocalInstagramCreator = { ...create, id: makeId(), createdAt: now, updatedAt: now }
      all.push(record)
      writeFile('ig-creators', all)
      return record
    }
  },

  delete(id: string) {
    writeFile('ig-creators', readFile<LocalInstagramCreator>('ig-creators').filter(c => c.id !== id))
    writeFile('ig-reels', readFile<LocalReel>('ig-reels').filter(r => r.creatorId !== id))
  },

  count(): number {
    return readFile<LocalInstagramCreator>('ig-creators').length
  },
}

// ── Instagram Reel store ──────────────────────────────────────────────────────
export interface LocalReel {
  id: string
  creatorId: string
  reelId: string
  caption?: string | null
  thumbnailUrl?: string | null
  permalink: string
  likeCount: number
  commentCount: number
  playCount?: number | null
  viralityScore: number
  publishedAt: string
  lastUpdated: string
  creator?: { handle: string; name: string; profilePicUrl: string | null }
}

type ReelOrderBy = 'viralityScore' | 'likeCount' | 'publishedAt'

export const reelStore = {
  findMany(params?: { take?: number; orderBy?: ReelOrderBy; creatorId?: string; search?: string }): LocalReel[] {
    let reels = readFile<LocalReel>('ig-reels')
    const ob = params?.orderBy ?? 'viralityScore'
    reels = reels.sort((a, b) =>
      ob === 'likeCount' ? b.likeCount - a.likeCount :
      ob === 'publishedAt' ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() :
      b.viralityScore - a.viralityScore
    )
    if (params?.creatorId) reels = reels.filter(r => r.creatorId === params.creatorId)
    if (params?.search) {
      const q = params.search.toLowerCase()
      reels = reels.filter(r => (r.caption ?? '').toLowerCase().includes(q))
    }
    if (params?.take) reels = reels.slice(0, params.take)
    return reels
  },

  findManyWithCreator(params?: { take?: number; orderBy?: ReelOrderBy; creatorId?: string; search?: string }): LocalReel[] {
    const reels = this.findMany(params)
    const creators = readFile<LocalInstagramCreator>('ig-creators')
    return reels.map(r => ({
      ...r,
      creator: (() => {
        const c = creators.find(c => c.id === r.creatorId)
        return c ? { handle: c.handle, name: c.name, profilePicUrl: c.profilePicUrl ?? null } : { handle: 'Unknown', name: 'Unknown', profilePicUrl: null }
      })(),
    }))
  },

  upsert(creatorId: string, reel: Omit<LocalReel, 'id' | 'creatorId' | 'lastUpdated' | 'creator'>) {
    const all = readFile<LocalReel>('ig-reels')
    const now = new Date().toISOString()
    const idx = all.findIndex(r => r.reelId === reel.reelId)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...reel, creatorId, lastUpdated: now }
      writeFile('ig-reels', all)
      return all[idx]
    } else {
      const record: LocalReel = { ...reel, id: makeId(), creatorId, lastUpdated: now }
      all.push(record)
      writeFile('ig-reels', all)
      return record
    }
  },

  count(): number {
    return readFile<LocalReel>('ig-reels').length
  },
}

// ── Blog Post store ───────────────────────────────────────────────────────────
export interface LocalBlogPost {
  id: string
  title: string
  content: string
  metaDescription?: string | null
  slug?: string | null
  imageUrl?: string | null
  status: string
  kajabiPostId?: string | null
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export const blogPostStore = {
  findMany(): LocalBlogPost[] {
    return readFile<LocalBlogPost>('blog-posts').sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  findById(id: string): LocalBlogPost | null {
    return readFile<LocalBlogPost>('blog-posts').find(p => p.id === id) ?? null
  },

  create(post: Omit<LocalBlogPost, 'id' | 'createdAt' | 'updatedAt'>): LocalBlogPost {
    const all = readFile<LocalBlogPost>('blog-posts')
    const now = new Date().toISOString()
    const record: LocalBlogPost = { ...post, id: makeId(), createdAt: now, updatedAt: now }
    all.push(record)
    writeFile('blog-posts', all)
    return record
  },

  update(id: string, update: Partial<Omit<LocalBlogPost, 'id' | 'createdAt'>>): LocalBlogPost | null {
    const all = readFile<LocalBlogPost>('blog-posts')
    const idx = all.findIndex(p => p.id === id)
    if (idx < 0) return null
    all[idx] = { ...all[idx], ...update, updatedAt: new Date().toISOString() }
    writeFile('blog-posts', all)
    return all[idx]
  },

  delete(id: string): boolean {
    const all = readFile<LocalBlogPost>('blog-posts')
    const filtered = all.filter(p => p.id !== id)
    if (filtered.length === all.length) return false
    writeFile('blog-posts', filtered)
    return true
  },

  count(): number {
    return readFile<LocalBlogPost>('blog-posts').length
  },
}
