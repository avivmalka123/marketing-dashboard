import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testKajabiConnection } from '@/lib/kajabi'
import { getApiKey } from '@/lib/getApiKey'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = await getApiKey('KAJABI_API_KEY')

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      message: 'KAJABI_API_KEY לא מוגדר בהגדרות',
      hint: 'עבור להגדרות והזן את ה-API Key שלך מ-Kajabi',
    })
  }

  const result = await testKajabiConnection()

  return NextResponse.json({
    apiKeySet: true,
    apiKeyPreview: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
    connectionTest: result,
    hint: result.ok
      ? '✅ חיבור תקין ל-Kajabi'
      : `❌ שגיאה ${result.status} — בדוק שה-API Key נכון ושה-API מופעל בחשבון Kajabi`,
  })
}
