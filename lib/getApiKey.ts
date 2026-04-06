import { prisma } from './prisma'
import fs from 'fs'
import path from 'path'

const ENV_PATH = path.join(process.cwd(), '.env.local')

/** Parse a single .env.local file and return key→value map */
function readEnvFile(): Record<string, string> {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8')
    const result: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) continue
      const k = trimmed.slice(0, eqIdx).trim()
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
      if (k && v) result[k] = v
    }
    return result
  } catch {
    return {}
  }
}

/**
 * Gets an API key/setting by checking in order:
 * 1. process.env (loaded at startup)
 * 2. .env.local file (read fresh each time — no restart needed)
 * 3. Database (Prisma Setting table)
 */
export async function getApiKey(key: string): Promise<string | undefined> {
  // 1. process.env (set at startup or via system env)
  const envVal = process.env[key]
  if (envVal && envVal.trim()) return envVal.trim()

  // 2. Read .env.local directly (picks up changes without restart)
  const fileEnv = readEnvFile()
  if (fileEnv[key]) return fileEnv[key]

  // 3. DB fallback
  try {
    const setting = await prisma.setting.findUnique({ where: { key } })
    if (setting?.value?.trim()) return setting.value.trim()
  } catch {
    // DB not connected — skip
  }

  return undefined
}
