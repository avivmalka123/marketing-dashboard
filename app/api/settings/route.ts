import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const settings = await prisma.setting.findMany({
      select: { key: true, updatedAt: true },
    })
    return NextResponse.json({ settings, dbConnected: true })
  } catch {
    return NextResponse.json({ settings: [], dbConnected: false })
  }
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
    // DB not connected — client will fall back to localStorage
    return NextResponse.json({ success: false, dbConnected: false, error: 'DB not connected' }, { status: 503 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await req.json()
  try {
    await prisma.setting.delete({ where: { key } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'DB not connected' }, { status: 503 })
  }
}
