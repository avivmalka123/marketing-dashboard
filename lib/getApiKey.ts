import { prisma } from './prisma'

/**
 * Gets an API key/setting by checking in order:
 * 1. Environment variable (process.env) — highest priority
 * 2. Database (prisma Setting table)
 * Returns undefined if not found anywhere.
 */
export async function getApiKey(key: string): Promise<string | undefined> {
  // 1. Check env vars first
  const envVal = process.env[key]
  if (envVal && envVal.trim()) return envVal.trim()

  // 2. Fall back to DB
  try {
    const setting = await prisma.setting.findUnique({ where: { key } })
    if (setting?.value?.trim()) return setting.value.trim()
  } catch {
    // DB not connected — skip
  }

  return undefined
}
