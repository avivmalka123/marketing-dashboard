import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const ENV_PATH = path.join(process.cwd(), '.env.local')

// Allowed keys — prevent writing arbitrary env vars
const ALLOWED_KEYS = [
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

function updateEnvFile(key: string, value: string): void {
  let content = ''
  try {
    content = fs.readFileSync(ENV_PATH, 'utf-8')
  } catch {
    content = ''
  }

  const lines = content.split('\n')
  const keyPattern = new RegExp(`^${key}=`)
  const existingIndex = lines.findIndex(l => keyPattern.test(l))
  const newLine = `${key}="${value.replace(/"/g, '\\"')}"`

  if (existingIndex >= 0) {
    lines[existingIndex] = newLine
  } else {
    lines.push(newLine)
  }

  fs.writeFileSync(ENV_PATH, lines.join('\n'), 'utf-8')
}

export async function POST(req: NextRequest) {
  // Only available in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, value } = await req.json()

  if (!key || !value) {
    return NextResponse.json({ error: 'Key and value required' }, { status: 400 })
  }

  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Key not allowed' }, { status: 400 })
  }

  try {
    updateEnvFile(key, value)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to write env file'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
