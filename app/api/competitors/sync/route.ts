/**
 * POST /api/competitors/sync
 * Body: { competitorId?: string }  — omit to sync ALL competitors
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncCompetitorVideos } from '@/lib/syncCompetitor'
import { competitorStore } from '@/lib/localStore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { competitorId?: string }
  const { competitorId } = body

  // Load competitors from DB or local store
  let competitors: Array<{ id: string; name: string; channelId: string; subscriberCount?: number | null; avgViews?: number | null }> = []
  try {
    const where = competitorId ? { id: competitorId } : {}
    competitors = await prisma.competitor.findMany({ where })
  } catch {
    const all = competitorStore.findMany()
    competitors = competitorId ? all.filter(c => c.id === competitorId) : all
  }

  if (!competitors.length) {
    return NextResponse.json({ error: 'לא נמצאו מתחרים לסנכרון' }, { status: 404 })
  }

  // Sync all in parallel (or one if competitorId was given)
  const results = await Promise.all(competitors.map(c => syncCompetitorVideos(c)))

  return NextResponse.json({
    success: true,
    synced: results,
    timestamp: new Date().toISOString(),
  })
}
