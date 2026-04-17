import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiKey, writeLocalSetting, deleteLocalSetting } from '@/lib/getApiKey'

// All keys the dashboard supports
const ALL_KEYS = [
  'YOUTUBE_API_KEY',
  'YOUTUBE_CHANNEL_ID',
  'ANTHROPIC_API_KEY',
  'INSTAGRAM_ACCESS_TOKEN',
  'INSTAGRAM_USER_ID',
  'KAJABI_API_KEY',
  'NANO_BANANA_API_KEY',
  'NANO_BANANA_API_URL',
  'CRON_SECRET',
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dbConnected = false

  // Try getting keys from DB first
  let dbKeys: string[] = []
  try {
    const settings = await prisma.setting.findMany({ select: { key: true } })
    dbKeys = settings.map(s => s.key)
    dbConnected = true
  } catch { /* DB not connected */ }

  // Also check which keys are set via process.env or .env.local file — run in parallel
  const keyChecks = await Promise.allSettled(
    ALL_KEYS.map(async key => ({ key, has: !!(await getApiKey(key)) }))
  )
  const envConfigured = keyChecks
    .filter(r => r.status === 'fulfilled' && r.value.has)
    .map(r => (r as PromiseFulfilledResult<{ key: string; has: boolean }>).value.key)

  // Merge: a key is "configured" if found in DB or env/file
  const allConfigured = Array.from(new Set([...dbKeys, ...envConfigured]))
  const settings = allConfigured.map(key => ({ key }))

  return NextResponse.json({ settings, dbConnected })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, value } = await req.json()

  if (!key || !value) {
    return NextResponse.json({ error: 'Key and value required' }, { status: 400 })
  }

  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value },
    })
    return NextResponse.json({ success: true, key: setting.key, dbConnected: true })
  } catch {
    // DB not connected — write to server-side local file so getApiKey can find it
    writeLocalSetting(key, value)
    return NextResponse.json({ success: true, dbConnected: false, localFile: true })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await req.json()
  // Always remove from local file
  deleteLocalSetting(key)
  try {
    await prisma.setting.delete({ where: { key } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true, dbConnected: false })
  }
}
